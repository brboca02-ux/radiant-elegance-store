# Identidade J&S Store: tipografia, logo, cores e acessibilidade

## 1. Nome da loja: "MD Modas" → "J&S Store"
Trocar em todos os textos visíveis ao cliente: cabeçalho, rodapé, home, páginas de produto, coleção, carrinho, checkout, login, wishlist, páginas de pedido, páginas legais (termos, privacidade, trocas), popups, newsletter, CTAs de WhatsApp, títulos/descrições SEO e textos padrão do painel.
Também nas mensagens automáticas (WhatsApp, e-mails, descrições de pagamento) e nos textos SEO de categorias.

## 2. Tipografia: Playfair Display (títulos) + Inter (textos)
- Substituir Poppins por Playfair Display no carregamento das fontes (Google Fonts, via link no head).
- Ajustar o token de fonte de título para Playfair Display; Inter permanece no corpo.
- Aplicar aos títulos de todas as páginas e componentes, incluindo carrinho, checkout, login e wishlist (usar o token de título em vez de fontes soltas).
- Como Playfair é serifada, remover o espaçamento negativo entre letras usado hoje e ajustar peso (600/700) para leitura correta.

## 3. Logo, favicon e theme-color
- Criar uma marca "J&S" em moldura dourada sobre preto: logo para cabeçalho/rodapé e ícone quadrado para favicon.
- Substituir o texto do cabeçalho pela logo (com texto alternativo acessível) e usar a versão clara/dourada no rodapé escuro.
- Gerar `public/favicon.png` a partir do mesmo ícone, apontar o head para ele e remover o favicon padrão antigo.
- Manter `theme-color` preto ônix (#0A0A0A) e adicionar cor de tema para modo claro/escuro do mobile.

## 4. Cores das páginas restantes com os tokens da marca
Revisar e converter para tokens (preto ônix, dourado, prata, off-white) as páginas: produto, coleção, carrinho/drawer, checkout, wishlist, login, acompanhamento/sucesso de pedido e áreas do cliente. Remover cores fixas remanescentes (rosa, cinzas soltos, branco/preto literais).

## 5. Contraste e estados (acessibilidade AA)
- Corrigir combinações de baixo contraste: dourado (#C9A24C) sobre branco não atinge AA para texto — usar dourado apenas como fundo com texto preto, ou detalhe/borda; texto dourado somente sobre preto.
- Definir estados consistentes em botões e links: hover (escurecer/dourar), focus visível com anel dourado sobre offset escuro em todo botão, link, input e item de menu, disabled com opacidade + contraste mínimo legível.
- Garantir alvos de toque de 44px no mobile em ícones do cabeçalho, botões do carrinho e passos do checkout.
- Ajustar `--muted-foreground` para atingir AA em texto secundário.
- Verificar o resultado no navegador (desktop e mobile) com capturas das telas principais.

## Notas técnicas
- Tokens em `src/styles.css` (`@theme inline` + `:root`), fontes via `links` no `head` de `src/routes/__root.tsx`.
- Logo como asset importado em `src/assets`; favicon em `public/`.
- Nome da loja: atualizar `DEFAULT_SITE_CONFIG` em `src/lib/siteConfig.ts` e os textos fixos nos componentes/rotas; usuários com config salva no navegador continuam vendo o valor antigo até limpar/atualizar no /admin.
