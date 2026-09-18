# Frete real: Uber Direct (Joinville) + Melhor Envio (fora da cidade)

## O que você vai ver no site

1. Cliente digita o CEP no checkout.
2. **Joinville:** aparecem "Retirada na loja" (grátis) e "Entrega expressa hoje via Uber" com o valor real cotado na Uber Direct.
3. **Fora de Joinville:** aparecem as opções reais do Melhor Envio (PAC, SEDEX, Jadlog...) com preço e prazo.
4. Enquanto calcula, aparece "Calculando frete..."; se alguma transportadora estiver fora do ar, mostra a tabela de segurança e nunca travа o checkout.
5. Frete grátis acima de R$ 299 continua valendo para envio nacional (não se aplica a Uber expressa).

## Estado atual (verificado)

- A cotação do Melhor Envio já existe, mas a chamada feita pelo frete envia campos diferentes dos esperados — hoje ela falharia sempre.
- A cotação da Uber aponta para uma função que não existe no projeto. Precisa ser reescrita como função de servidor.
- O checkout já tem a lista de opções e o estado de "calculando"; só precisa receber os dados certos.

## Credenciais que vou pedir (uma tela só, no fim)

| Nome | Onde pegar |
|---|---|
| `MELHORENVIO_TOKEN` | Melhor Envio → Configurações → Tokens/Integrações → gerar token (escopo shipment-calculate) |
| `MELHORENVIO_ENV` | `production` ou `sandbox` |
| `MELHORENVIO_FROM_CEP` | CEP da loja (confirme o exato) |
| `UBER_CUSTOMER_ID` | Uber Direct → Developers → Customer ID |
| `UBER_CLIENT_ID` | Uber Direct → Developers → Application |
| `UBER_CLIENT_SECRET` | Mesma tela (secreto) |
| `UBER_PICKUP_ADDRESS` | Endereço completo da loja (rua, nº, bairro, Joinville/SC, CEP) |

Nada disso passa pelo chat: eu abro o formulário seguro e você cola os valores.

## Arquivos e mudanças técnicas

- `src/lib/integrations/uberdirect.functions.ts` — reescrito como `createServerFn` (`quoteUberDirect`): lê as variáveis dentro do handler, pega token OAuth em `https://auth.uber.com/oauth/v2/token` (scope `eats.deliveries`), chama `POST https://api.uber.com/v1/customers/{id}/delivery_quotes` com endereços de origem/destino em JSON, converte `fee` de centavos para reais e devolve `{ fee, estimatedMinutes, quoteId, error? }`. Falha → `error` e lista vazia, sem exceção.
- `src/lib/integrations/melhorenvio.functions.ts` — mantém o handler; alinho a interface de saída (`{ quotes, error }`) e os nomes de entrada com quem chama.
- `src/lib/integrations/shipping.ts` — corrige as duas chamadas: Melhor Envio recebe `{ toCep, itemsCount, insuranceValue: subtotal }` e leio `.quotes`; Uber recebe `{ data: { cep, city, district, subtotal } }` e uso `fee`, mantendo `JOINVILLE_ZONES` como fallback. Frete grátis acima de R$ 299 aplicado só às cotações nacionais.
- `src/routes/checkout.tsx` — apenas estados de carregando/erro e mensagem "não foi possível cotar, escolha retirada ou fale no WhatsApp". Sem mudança em `place_order`.
- `.env.example` e `docs/VARIAVEIS_AMBIENTE.md` — documentam as 7 variáveis acima.
- Sem alteração de banco. Sem edge functions.

## Ordem de execução

1. Ajustar Melhor Envio + reescrever Uber Direct como função de servidor.
2. Corrigir o orquestrador de frete e o checkout.
3. Atualizar a documentação de variáveis.
4. Abrir a tela segura para você colar as credenciais.
5. Testar um CEP de Joinville e um de fora, no celular e no computador.
