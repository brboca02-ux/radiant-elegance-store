# Plano: Hero mais compacto + espaçamentos menores

## 1. Reduzir a div do Hero (sem perder qualidade)
- Reduzir a altura da seção do Hero em `src/components/HomeSections.tsx`:
  - Mobile: de `h-[65vh] min-h-[480px]` para algo como `h-[42vh] min-h-[320px]`
  - Tablet: `md:h-[50vh] md:min-h-[400px]`
  - Desktop: `lg:h-[58vh] lg:min-h-[480px]`
- Manter a mesma imagem em resolução original (nada de downscale), apenas ajustando `object-cover` e `object-position` para que os modelos e o logo continuem visíveis no recorte menor.

## 2. Botões centralizados e mais abaixo
- Trocar o alinhamento do container do Hero: de centralizado/esquerda para centralizado horizontalmente e ancorado na parte inferior (`items-end justify-center` com `pb-8 md:pb-12`).
- Botões "Comprar Feminino" e "Comprar Masculino" lado a lado no centro, com gradiente escuro na base reforçado para garantir contraste.

## 3. Reduzir espaçamentos do site
- Ajustar o utilitário `section-compact` em `src/styles.css` de `py-10 md:py-16` para `py-6 md:py-10`.
- Uniformizar as seções que ainda usam valores próprios em `src/components/HomeSections.tsx` (TrustStrip `py-6 md:py-8` → `py-4 md:py-6`, Categorias `py-8 md:py-12` → `py-6 md:py-8`, Lookbook `py-12 md:py-16` → `section-compact`, Diferenciais `py-10 md:py-12` → `section-compact`).
- Reduzir margens internas de títulos de seção (`mb-8` → `mb-5 md:mb-6`) para o site ficar mais denso e sem áreas vazias.

## 4. Dados do print (Instagram)
O print traz dados diferentes dos cadastrados hoje no site:
- Endereço atual no site: Rua Santa Luzia, 550 - Aventureiro, Joinville/SC
- Endereço no print: Rua Carlos Emílio Alexandre Schwartz 369, Joinville/SC — 89235-188
- WhatsApp atual: 47 98446-8103 / no print: 41 8407-5860

Proposta: atualizar endereço e CEP para os do print (loja física, mapa e rodapé) e **manter** o WhatsApp atual, salvo indicação em contrário. Se preferir trocar o WhatsApp também, é só avisar antes de eu aplicar.

## Arquivos afetados
- `src/components/HomeSections.tsx`
- `src/styles.css`
- `src/lib/shopify.ts` (apenas endereço/CEP/mapa, se aprovado)

## Validação
- Preview em mobile (390px) e desktop para confirmar que a imagem não corta os modelos e os botões ficam legíveis na base.
- Build sem erros.
