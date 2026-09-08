# Plano — InfinitPay como única forma de pagamento

## Diagnóstico
- O erro "INFINITPAY_HANDLE não configurado" vem da versão **publicada** do site, que ainda roda código antigo (nome de variável antigo). O código atual já lê `INFINITPAY_INFINITETAG`, e esse segredo já está salvo no projeto. Republicar resolve o erro.
- O checkout hoje oferece 4 opções (Pix, Cartão, Boleto via Mercado Pago + InfinitPay). O pedido é deixar **somente InfinitPay**.

## Mudanças

### 1. Checkout com apenas InfinitPay
- `src/routes/checkout.tsx`:
  - Lista de métodos vira apenas `["infinitpay"]`; estado inicial `paymentMethod` passa a ser `"infinitpay"`.
  - Remove os blocos de fluxo de Pix e Cartão (Mercado Pago) do envio do pedido, mantendo só o fluxo InfinitPay (cria pedido → redireciona para pagamento).
  - Texto explicativo fixo: "Pagamento processado com segurança pela InfinitPay. Aceita Pix e cartão de crédito em até 12x."
- Telas de acompanhamento de pedido (`src/routes/pedidos.index.tsx`) e `ordersStore`: manter funcionamento; métodos antigos em pedidos antigos continuam legíveis no histórico.
- Arquivos Mercado Pago (`mercadopago*.functions.ts`, webhooks) ficam no código, inativos — sem remoção destrutiva; o adapter `payment.ts` passa a expor só o provider InfinitPay se necessário para não quebrar imports.

### 2. Documentação e nomes
- Atualizar `.env.example` e `docs/VARIAVEIS_AMBIENTE.md`: trocar `INFINITPAY_HANDLE` por `INFINITPAY_INFINITETAG` para nunca mais gerar confusão.

### 3. Publicação
- Rodar build (validação) e **publicar** o site — é isso que elimina o erro em produção, pois a versão no ar ainda usa o nome antigo.

## Validação
- Build OK.
- Teste no checkout: única opção InfinitPay visível; pedido de teste redireciona para a tela de pagamento InfinitPay.
- Conferir em produção (`jesstorejoinville.com.br`) que o erro "não configurado" não aparece mais.
