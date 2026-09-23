# Variáveis de Ambiente — J&S Store

Todas as variáveis abaixo devem ser configuradas no painel da **Lovable Cloud**
(Settings → Environment Variables) ou no teu servidor de produção.

> ⚠️ **Nunca commitar valores reais.** O ficheiro `.env` está no `.gitignore`.
> Usa `.env.example` como referência.

---

## Supabase (obrigatório)

| Variável | Onde encontrar |
|---|---|
| `SUPABASE_URL` | Painel Supabase → Project Settings → API → Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Painel Supabase → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → Project Settings → API → `service_role` key ⚠️ secreta |
| `VITE_SUPABASE_URL` | Mesmo valor que `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Mesmo valor que `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | O ID do projecto (ex: `xsahoig...`) |

---

## Mercado Pago (obrigatório para PIX, Cartão, Boleto)

| Variável | Onde encontrar |
|---|---|
| `MP_ACCESS_TOKEN` | [Painel MP](https://www.mercadopago.com.br/developers/panel) → Credenciais → Access Token |
| `MP_PUBLIC_KEY` | Painel MP → Credenciais → Public Key |
| `MP_WEBHOOK_SECRET` | Painel MP → Webhooks → Chave secreta de assinatura |

---

## InfinitPay (obrigatório para o método InfinitPay)

| Variável | Onde encontrar |
|---|---|
| `INFINITPAY_INFINITETAG` | App InfinitPay → canto superior esquerdo (InfiniteTag, **sem o `$`**) |

**Antes de usar:** no App InfinitPay vai a:
`Vendas → Checkout → Configurações → Habilitar Checkout Integrado`

---

## Shopify Storefront (fallback de produtos)

| Variável | Onde encontrar |
|---|---|
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Painel Shopify → Apps → Storefront API → Token |
| `VITE_SHOPIFY_DOMAIN` | Ex: `aura-boutique-u79e9.myshopify.com` |

---

## Outros

| Variável | Para quê |
|---|---|
| `VITE_META_PIXEL_ID` | Meta Ads → Pixel ID |
| `CRON_SECRET` | Chave para proteger a rota `/api/public/reconcile-payments` |
| `LOVABLE_API_KEY` | Análise de produtos por IA (painel Lovable) |

---

## Resumo rápido para activar InfinitPay

1. Abre o App InfinitPay
2. Vai a **Vendas → Checkout → Configurações → Habilitar Checkout Integrado**
3. Copia a tua **InfiniteTag** (ex: `jsestore`) — aparece no topo esquerdo do app
4. Na Lovable Cloud: **Settings → Environment Variables → Add**
   - Nome: `INFINITPAY_INFINITETAG`
   - Valor: `jsestore` *(o teu handle, sem o `$`)*
5. Redeploy — pronto ✅

---

## Melhor Envio (frete nacional — fora de Joinville)

| Variável | Onde encontrar |
|---|---|
| `MELHORENVIO_TOKEN` | melhorenvio.com.br → Configurações → Tokens/Integrações → gerar token (escopo `shipping-calculate`) |
| `MELHORENVIO_ENV` | `production` ou `sandbox` |
| `MELHORENVIO_FROM_CEP` | CEP de origem da loja (só dígitos) |

## Uber Direct (entrega expressa em Joinville)

| Variável | Onde encontrar |
|---|---|
| `UBER_CLIENT_ID` | developer.uber.com → Direct → sua aplicação |
| `UBER_CLIENT_SECRET` | Mesma tela ⚠️ secreta |
| `UBER_CUSTOMER_ID` | Painel Uber Direct → Customer ID |
| `UBER_PICKUP_ADDRESS` | Endereço completo da loja: rua, nº, bairro, Joinville/SC, CEP |
| `UBER_PICKUP_NAME` | Nome do responsável pela retirada |
| `UBER_PICKUP_PHONE` | Telefone do remetente com DDD |
| `UBER_PICKUP_INSTRUCTIONS` | Instruções para o motorista na coleta |
| `UBER_WEBHOOK_SECRET` | Segredo de assinatura configurado no webhook da Uber |

Webhook de produção: `https://www.jesstorejoinville.com.br/api/public/uber-direct-webhook`.

Sem estas variáveis o checkout continua funcionando com retirada na loja e a tabela local de Joinville. Fora da cidade, as opções continuam vindo do Melhor Envio.
