# Plano: Checkout completo no site (pronto para plugar gateway e frete)

Objetivo: cliente conclui a compra dentro do site (sem WhatsApp), o pedido é gravado no Supabase, e existe um webhook genérico esperando a confirmação do gateway. Quando você tiver as chaves do gateway/frete, é só plugar — toda a estrutura já estará pronta.

## 1. Banco de dados (Supabase)

Criar 4 tabelas via migration:

- **`customers`** — `id, user_id (nullable), name, email, phone, cpf, created_at`
- **`addresses`** — `id, customer_id, cep, street, number, complement, district, city, state, created_at`
- **`orders`** — `id, order_number (humano: MD-2026-0001), customer_id, address_id, status (pendente|aguardando_pagamento|pago|enviado|entregue|cancelado), subtotal, shipping_cost, discount, total, payment_method (pix|cartao|boleto), payment_provider (mercadopago|asaas|...), payment_id (id externo), shipping_method, tracking_code, notes, created_at, updated_at, paid_at`
- **`order_items`** — `id, order_id, product_id, product_name, variant_size, variant_color, unit_price, quantity, subtotal`

RLS + GRANTs:
- `customers` / `addresses` / `orders` / `order_items`: usuário autenticado lê/escreve só os próprios; admin (via `has_role`) lê/escreve tudo.
- Trigger no `INSERT` de `orders` que decrementa `products.stock` na hora.
- Função `generate_order_number()` para o `order_number` sequencial.

## 2. Fluxo de checkout (frontend)

Novas rotas:

- **`/checkout`** — formulário em 3 etapas (uma página, sem reload):
  1. **Identificação**: nome, e-mail, telefone, CPF (auto-preenche se logado)
  2. **Entrega**: CEP (busca ViaCEP automática), rua, número, complemento, bairro, cidade, estado + escolha do método de frete (stub mostra opções fixas por enquanto: PAC, SEDEX, Retirada na loja)
  3. **Pagamento**: escolha entre Pix / Cartão / Boleto (todos com selo "em integração") + resumo final
  - Botão "Finalizar pedido" cria a `order` no Supabase com `status = aguardando_pagamento` e redireciona para `/pedido/sucesso/:numero`

- **`/pedido/sucesso/$numero`** — mostra número do pedido, resumo, instruções ("Em breve o link de pagamento será gerado quando o gateway estiver ativo"), botão "Acompanhar meus pedidos".

- **`/meus-pedidos`** (para o cliente, dentro de `_authenticated`) — lista pedidos do usuário logado.

Mudanças no que já existe:
- `CartDrawer`: botão "Comprar pelo WhatsApp" continua existindo, mas o principal vira **"Finalizar Compra"** → `/checkout`.
- Página do produto: idem.
- Painel admin `/pedidos`: já existe a tela, vou plugar nos dados reais da nova tabela `orders`.

## 3. Camada de adapters (pronta pra plugar gateway/frete)

Arquivos em `src/lib/integrations/`:

- **`payment.ts`** — interface `PaymentProvider` com `createPayment(order)` retornando `{ paymentId, paymentUrl, qrCode? }`. Implementação `MockPaymentProvider` por enquanto (apenas gera id fake e marca a ordem como aguardando). Quando você escolher Mercado Pago / Asaas / etc., só troco a implementação ativa.
- **`shipping.ts`** — interface `ShippingProvider` com `quote({ cep, items })` retornando `[{ name, price, days }]`. Implementação `MockShippingProvider` com tabela fixa: Retirada Joinville (grátis), PAC (R$ 19,90 / 5 dias), SEDEX (R$ 34,90 / 2 dias) + frete grátis acima de R$ 299.

Quando você fornecer as APIs, é só trocar `MockPaymentProvider` por `MercadoPagoProvider` (ou outro) — nenhum componente UI precisa mudar.

## 4. Webhook genérico de pagamento

Rota `src/routes/api/public/payment-webhook.ts` (server route):
- Aceita `POST` com `{ orderId, status, providerId, signature }`
- Valida assinatura HMAC (segredo `PAYMENT_WEBHOOK_SECRET` — vou gerar via `generate_secret`)
- Usa `supabaseAdmin` pra atualizar `orders.status = 'pago'` + `paid_at = now()`
- Retorna 200/401 padrão

Pronto pra apontar o painel do gateway pra essa URL quando chegar a hora.

## 5. O que você precisa decidir depois (não bloqueia agora)

- Gateway (Mercado Pago / Asaas / outro) → eu plugo no `payment.ts`
- Frete (Melhor Envio / Frenet / tabela fixa) → eu plugo no `shipping.ts`
- Token do gateway e do frete → me passa quando tiver, eu armazeno via secret

## Detalhes técnicos

- Stack: TanStack Start + Supabase existente (não Lovable Cloud — confirmando seu setup atual).
- Validação de formulários: `react-hook-form` + `zod`.
- Busca de CEP: ViaCEP (público, sem chave).
- Estados pendentes do pedido têm reserva de estoque (movem `stock` → `reserved_stock`); cancelamento devolve.
- Toda navegação pós-checkout limpa o carrinho do Zustand.

## Entrega em uma única passada

Faço migration + adapters + checkout + páginas de sucesso/meus-pedidos + plug no admin + webhook stub, tudo de uma vez. Depois é só você confirmar os fluxos clicando.

Posso seguir?
