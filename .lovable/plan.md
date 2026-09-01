# Atualizar horários, endereço, WhatsApp, parcelamento e regra de descontos

## Objetivo

Aplicar as 5 solicitações do lojista no site J&S Store:

1. Horário de funcionamento: Seg a Sex 08h–22h · Sáb e Dom 08h–20h
2. Trocar número da casa de 369 para 335
3. Centralizar contatos no WhatsApp +55 41 8407-5860
4. Parcelamento: até 3x sem juros · até 12x com juros
5. Descontos apenas via cupom (primeira compra) ou em ações promocionais — remover descontos automáticos

## Mudanças no código

### 1. Endereço + WhatsApp (fonte única: `src/lib/shopify.ts`)

- `STORE_INFO.street`: "Rua Carlos Emílio Alexandre Schwartz, 369" → **335**
- `STORE_INFO.mapsEmbed`: atualizar a URL do Google Maps (369 → 335)
- `STORE_INFO.phone`: `+55 47 98446-8103` → **+55 41 8407-5860**
- `STORE_INFO.whatsapp`: `5547984468103` → **554184075860**

Tudo que usa `STORE_INFO` (Footer, sobre, Home, WhatsAppCTA, WhatsAppFloat, recuperação de carrinho, mensagens de pedido) herda a atualização automaticamente.

### 2. JSON-LD (`src/routes/__root.tsx`)

- `telephone` (2 ocorrências, Organization e ClothingStore): → **+55 41 8407-5860**
- `streetAddress` (2 ocorrências) e `hasMap`: 369 → **335**
- `openingHoursSpecification`:
  - Seg a Sex: `opens 08:00` / `closes 22:00`
  - Sáb e Dom: `opens 08:00` / `closes 20:00`

### 3. Textos de horário visíveis

- `src/routes/sobre.tsx` (linha ~60): "Seg a Sáb · 9h às 18h" → **"Seg a Sex · 8h às 22h · Sáb e Dom · 8h às 20h"**
- `src/components/HomeSections.tsx` (linha ~291): "Seg a Sex: 9h–18h · Sáb: 9h–13h" → **"Seg a Sex: 8h–22h · Sáb e Dom: 8h–20h"**
- `src/routes/pedido.retirada.$numero.tsx` (array `HOURS`): "Segunda a Sexta 09h às 18h30 / Sábado 09h às 13h / Domingo e feriados Fechado" → **"Segunda a Sexta 08h às 22h / Sábado e Domingo 08h às 20h"**

### 4. Parcelamento (3x sem juros / 12x com juros)

- `src/routes/produto.$handle.tsx` (linha ~431): "ou 4x de ... sem juros · 10% off no Pix" → **"ou 3x de ... sem juros · até 12x com juros"** (remover o "10% off no Pix", ver item 5)
- `src/components/Header.tsx` (marquee, linha ~137): "Parcelamento em até 10x" → **"Parcelamento em até 3x sem juros"**
- Máximo de parcelas no Mercado Pago já está em 12 (`installments: 12` na preference e `maxInstallments: 12` no Brick) — manter.
- **Passo externo (lojista):** o limite "3x sem juros" é configurado na conta Mercado Pago (área do vendedor → Custos e financiamento → parcelas sem juros). O código não controla isso; será orientado ao usuário para configurar lá.

### 5. Descontos apenas via cupom ou ação promocional

- **Banco de dados**: remover os preços promocionais de teste (`sale_price`) dos 2 produtos que ainda têm desconto (Blusa Tricô Feminina Gola Alta e Short Alfaiataria Feminino), deixando `NULL`. Com isso a coleção "Promoções" fica vazia até o lojista ativar uma ação no painel (quando ele definir um `sale_price`, ela volta a aparecer).
- **Remover o desconto automático "10% off no Pix"** do `produto.$handle.tsx` (o desconto nunca foi aplicado de fato no checkout — era só texto).
- Manter o sistema de cupons existente (CRUD no painel + `BEMVINDA5` de primeira compra no checkout).

## Arquivos alterados

- `src/lib/shopify.ts`
- `src/routes/__root.tsx`
- `src/routes/sobre.tsx`
- `src/components/HomeSections.tsx`
- `src/routes/pedido.retirada.$numero.tsx`
- `src/components/Header.tsx`
- `src/routes/produto.$handle.tsx`
- Banco de dados: `UPDATE public.products SET sale_price = NULL WHERE sale_price IS NOT NULL;`

## Verificação

- Build sem erros.
- Conferir no preview: horários novos no Sobre, na Home e na página de retirada; endereço 335 no rodapé e no mapa; links de WhatsApp abrindo para +55 41 8407-5860; texto de parcelamento 3x sem juros na página de produto e no topo.