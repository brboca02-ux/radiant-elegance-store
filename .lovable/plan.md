# Teste de botões, redução de espaços vazios e otimização de carregamento

## O que foi verificado agora
- Home, Coleção, Sobre, Checkout, Login e Acompanhar pedido carregam sem erros de console.
- Alguns alvos de toque ficam abaixo dos 44px recomendados (itens do menu, ícone da sacola, botão do WhatsApp, links do rodapé).
- As seções da home usam `py-20 md:py-28`, gerando blocos muito altos e vazios entre conteúdos.
- Só o hero tem preload; as demais imagens carregam sem prioridade definida e as rotas não são divididas por página.

## 1. Teste completo dos botões
- Percorrer automaticamente todas as páginas públicas (home, coleção, produto, carrinho, checkout, wishlist, login, pedido/acompanhar, sobre, termos, privacidade, trocas) clicando em cada botão e link.
- Registrar: destino inválido, ação sem efeito, erro de console, estado travado em "carregando" e botões desabilitados sem motivo.
- Corrigir o que estiver quebrado e garantir estados visíveis de hover, foco, ativo, carregando e desabilitado em todos eles.
- Padronizar altura mínima de 44px nos alvos de toque (menu, sacola, conta, botões do rodapé, WhatsApp, setas da vitrine, filtros e paginação).

## 2. Redução dos espaços vazios
- Home: reduzir o respiro das seções de `py-20 md:py-28` para algo em torno de `py-10 md:py-14`, e das faixas menores proporcionalmente.
- Reduzir a altura do hero em telas grandes para que categorias e vitrine apareçam antes da primeira rolagem.
- Diminuir a distância entre título de seção e conteúdo, e o vão entre categorias, vitrine e "Recebidos da Semana".
- Aplicar o mesmo enxugamento em coleção, produto, carrinho e checkout (cabeçalhos de página, blocos de filtros e áreas de resumo).
- Revisar em 375, 768, 1280 e 1920px para não deixar seções colando umas nas outras.

## 3. Otimização de carregamento
- Definir prioridade correta das imagens: a primeira imagem visível com carregamento imediato e alta prioridade; todas as demais em `lazy` com `width`/`height` declarados para evitar salto de layout.
- Servir as imagens de produto pelo proxy já com largura adequada ao card, evitando baixar arquivos maiores que o necessário.
- Carregar sob demanda os blocos pesados que ficam abaixo da dobra (vitrine, lookbook, Instagram, newsletter) e o painel administrativo, para reduzir o peso inicial da home.
- Pré-conectar aos domínios de fontes e do backend e manter o cache longo dos arquivos de imagem.
- Medir antes e depois (peso inicial, tempo até o conteúdo principal e estabilidade visual) e relatar os números.

## Detalhes técnicos
- Arquivos principais: `src/components/HomeSections.tsx`, `src/components/ShowcaseCarousel.tsx`, `src/components/ProductGrid.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/routes/index.tsx`, `src/routes/colecao.tsx`, `src/routes/produto.$handle.tsx`, `src/routes/checkout.tsx`, `src/styles.css` (utilitário `tap-target`).
- Divisão de código com `React.lazy` + `Suspense` para seções abaixo da dobra; `link rel=preconnect` no `__root.tsx`; `fetchpriority`/`loading`/`sizes` nos `img`.
- Auditoria de botões via Playwright sobre o servidor local, com relatório final por página.
