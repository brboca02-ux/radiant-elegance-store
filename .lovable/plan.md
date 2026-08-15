# Plano: Corrigir cortes de imagem e auditar funcionalidades

## Problema principal (hero da home no desktop)
O hero usa altura fixa em vh (`h-[42vh] … lg:h-[58vh]`) com `object-cover object-center`. Como a imagem enviada é landscape com o casal à esquerda e o logo à direita, em telas largas o `object-cover` amplia e corta topo/base — em desktop os modelos aparecem cortados.

### Correção proposta
- Trocar a altura fixa por proporção real da imagem no desktop (`aspect-[16/9]` com `max-h`), mantendo altura controlada no mobile.
- Usar `object-contain` (ou `object-cover` com `object-position` ajustado por breakpoint) para desktop, garantindo que casal + logo apareçam inteiros.
- Manter fundo preto atrás da imagem, então qualquer letterbox fica invisível na identidade da marca.
- Manter os botões "Comprar Feminino"/"Comprar Masculino" no rodapé central com gradiente de legibilidade.

## Auditoria de cortes nas outras imagens
Verificar e ajustar onde houver corte indevido:
- Cards de categorias na home (`h-[150px] md:h-[210px]` + `object-position` manual) — validar em 375/768/1440 px.
- Cards de produto (`aspect-[3/4] object-cover`) — as imagens do catálogo já são normalizadas com fundo (contain) no pipeline; confirmar que nenhuma peça é cortada e ajustar as que ainda estiverem em corte.
- Carrossel da vitrine, galeria da página de produto, miniaturas de busca, carrinho e checkout.
- Painel admin (produtos, estoque, categorias, mídias da home).
Método: capturar screenshots reais em mobile/tablet/desktop e comparar antes/depois.

## Auditoria de funcionalidades
Checar e corrigir o que estiver quebrado:
- Seção Instagram: a grade de posts (`cells`) está montada mas nunca é renderizada, e aponta para slugs de catálogo antigos que provavelmente retornam 404. Decisão: remover a grade morta ou renderizar com imagens válidas do catálogo atual.
- Links/imagens via proxy `/api/public/img/...`: identificar 404s de slugs legados.
- Navegação e filtros (Feminino/Masculino, promoções, recebidos), busca, carrinho, checkout (PIX/cartão), acompanhamento de pedido e login admin.
- Registrar erros de console/rede encontrados e corrigir os que forem do app.

## Arquivos que devem ser tocados
- `src/components/HomeSections.tsx` (hero, categorias, Instagram)
- `src/components/ProductCard.tsx` / `ShowcaseCarousel.tsx` (se houver corte)
- `src/routes/index.tsx` (preload do hero, se a proporção mudar)
- Ajustes pontuais em páginas de produto/admin conforme a auditoria apontar

## Fora do escopo
- Reseed de produtos, mudanças de preço ou de dados.
- Alterar paleta, tipografia ou estrutura de rotas.

## Validação
- Screenshots em 375, 768, 1280 e 1440 px do hero e das seções.
- Console/rede sem erros novos; build limpo.
