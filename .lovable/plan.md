# Hardening de segurança — checkout, RLS e estoque

## O que muda no fluxo
Hoje o navegador insere `customers`, `addresses`, `orders` e `order_items` direto no banco, com preços vindos do cliente. Passa a existir uma única RPC `place_order` no Postgres que:
- Recebe apenas: dados do cliente, endereço, lista de `{product_id, variant_size, variant_color, quantity}`, `shipping_method`, `shipping_cost`, `payment_method`, `notes`.
- Busca preços em `public.products` (usando `sale_price` quando ativo).
- Recalcula `subtotal`, `total`, `unit_price` de cada item.
- Valida estoque disponível (`stock - reserved_stock >= quantity`).
- Cria/atualiza customer e address dentro da mesma transação.
- Incrementa `reserved_stock`.
- Retorna `{ id, order_number, total }`.

Nada de preço, total ou order_number vindo do cliente é gravado.

## Migrações (SQL)

1. **RPC `place_order(payload jsonb)` `SECURITY DEFINER`** com o comportamento acima. `GRANT EXECUTE TO anon, authenticated`. `SET search_path = public`.
2. **RPC `get_order_public(p_order_number text, p_email text)`** `SECURITY DEFINER` — retorna o pedido apenas quando `order_number + email` batem. Substitui leitura direta anônima na tela de sucesso.
3. **Revoke inserts diretos**:
   ```
   REVOKE INSERT ON public.customers, public.addresses,
                    public.orders,    public.order_items
     FROM anon, authenticated;
   ```
   Mantém SELECT/UPDATE conforme policies atuais.
4. **Drop policies `*_insert_any`** (customers/addresses/orders/order_items) — não são mais necessárias; RPC roda como definer.
5. **Trigger de reserva de estoque** em `orders`:
   - `AFTER INSERT` já foi coberto pela RPC (incrementa `reserved_stock`).
   - `AFTER UPDATE OF status`: quando vai para `pago`/`separando`/`enviado`/`entregue` → move de `reserved_stock` para consumo (`stock -= qty`, `reserved_stock -= qty`); quando vai para `cancelado` → devolve (`reserved_stock -= qty`).
6. **Índices**:
   - `CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status, created_at DESC);`
   - `CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items(product_id);`
   - `CREATE INDEX IF NOT EXISTS stock_movements_created_idx ON stock_movements(created_at DESC);`

## Alterações de código

- `src/lib/api/supaOrders.ts` — reescrever `createOrder` para chamar `supabase.rpc('place_order', { payload })`. Remover toda a lógica de insert manual. `getOrderByNumber` passa a chamar `get_order_public` quando não há sessão.
- `src/routes/pedido.sucesso.$numero.tsx` e `pedido.acompanhar.tsx` — passar email no `get_order_public`. Se a UI ainda não coleta email nessa tela, ler do carrinho/localStorage que já foi salvo no checkout.
- `src/routes/api/public/payment-webhook.ts` — antes de marcar `pago`, comparar `pay.transaction_amount` com `orders.total` (tolerância R$ 0,01). Se divergir: log + resposta 200 + status permanece `aguardando_pagamento` (para investigação manual, não retry infinito do MP).
- `src/routes/api/public/reconcile-payments.ts` — mesma checagem de valor.
- `src/lib/supabaseClient.ts` — trocar constantes hardcoded por `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` com fallback para os valores atuais (para não quebrar dev sem `.env`).

## O que fica fora deste lote (débito técnico anotado)
- Trocar `products.category_id text` por `uuid REFERENCES categories(id)` — migração pesada, feita em ciclo separado.
- Rate limiting real em `/api/public/*` — depende de KV/Durable Objects; anotar.
- Rotacionar `MP_WEBHOOK_SECRET` quando você tiver o valor real do painel MP.

## Como valido
- `bun run build` deve passar.
- Rodar checkout end-to-end no preview: PIX de teste → success page reflete `pago` após reconcile/webhook.
- Tentativa de POST direto em `orders` via curl com anon key deve retornar `permission denied`.
- Simular `place_order` com quantidade maior que estoque → erro `insufficient_stock`.
- Verificar `reserved_stock` no admin após criar pedido e após cancelar.

## Confirmação necessária antes de aplicar
- Os pedidos existentes ficarão intactos (só schema/policies/índices novos, nada é dropado além das policies `*_insert_any`).
- Se você tiver front-end em outro lugar (app admin externo, script) inserindo diretamente em `orders`, ele quebra — só a RPC passa a funcionar.
