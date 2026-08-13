# Auditoria das últimas 5 solicitações

## Resultado resumido

| # | Solicitação | Status |
|---|---|---|
| 1 | Contraste/estados, logo+favicon+theme-color, Playfair/Inter, tokens da marca em todas as páginas | Implementado (com 1 ponto a validar) |
| 2 | Cadastrar os produtos do vídeo no estoque | Parcial |
| 3 | Remover "MD Modas" de estoque/produto + estoque por variante + conferir catálogo | Parcial |
| 4 | Domínios/sitemap, remover produtos antigos, seções só Masculino/Feminino | Parcial |
| 5 | Colocar a logo no site | Implementado |

## O que está confirmado no site (verificado no preview)

- Título da aba: "J&S Store — Loja de Moda no Aventureiro, Joinville/SC"; `theme-color` `#0A0A0A`; favicon `/favicon.png` novo.
- Logo em imagem no cabeçalho, rodapé e login (asset de CDN).
- Tipografia ativa: títulos em Playfair Display, corpo em Inter.
- Tokens de marca em `src/styles.css` (preto ônix, dourado, prata, off-white), `:focus-visible` global e utilitário de alvo de toque.
- Nenhuma ocorrência visível de "MD Modas" na página inicial; Instagram já é @jes.storejoinville.
- Estoque por variante: `effectiveStock` somando variantes, usado no painel de estoque e na lista de produtos, com chips por tamanho.

## Pendências encontradas

1. **Domínio antigo ainda no código** (item 4 incompleto):
   - `public/robots.txt` aponta o sitemap para `mdmodas.lovable.app`.
   - `src/components/Breadcrumbs.tsx` usa `https://mdmoda.com.br` como site base (afeta o JSON-LD de todas as páginas).
   - `src/routes/sobre.tsx` (og:url e canonical) e `src/routes/produto.$handle.tsx` (`@id` da organização) usam `mdmoda.com.br`.
2. **Categorias fora do escopo Masculino/Feminino ainda presentes** (item 4 incompleto):
   - Home mostra os blocos Vestidos, Conjuntos e Plus Size.
   - `src/routes/colecao.tsx` (título/descrição/SEO) cita "Infantil" e "calçados".
   - `src/routes/produtos.rapido.tsx` ainda oferece Infantil e Calçados no seletor de categoria; `RelatedProducts.tsx`, `variantSizes.ts` e `analyzeProduct.functions.ts` mantêm essas categorias.
3. **Catálogo antigo ainda na vitrine** (itens 2, 3 e 4 incompletos): a home lista Bolsa Baú Monogram, Bolsa de Ombro, Vestido Boho e Macaquinho — itens do acervo anterior, incluindo acessórios, que deveriam ter saído. Os itens masculinos do vídeo (polos, bermudas, camisetas, calças jeans/sarja) não estão publicados; só há 2 produtos masculinos.
4. **Banco externo não configurado nesta remixagem**: os segredos `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` (além de `CRON_SECRET` e os do Mercado Pago) seguem sem valor. Sem eles não é possível gravar/limpar catálogo com segurança nem processar pagamentos.
5. **A validar visualmente**: contraste de botões desabilitados e links em dourado sobre fundo claro nas páginas de carrinho e checkout — os tokens estão certos, mas não houve medição de contraste nessas telas.

## Correções propostas (se aprovar)

1. Definir o domínio oficial e substituir `mdmoda.com.br` / `mdmodas.lovable.app` em robots.txt, Breadcrumbs, `sobre.tsx` e `produto.$handle.tsx`.
2. Reduzir a taxonomia a Masculino e Feminino: remover Vestidos/Conjuntos/Plus Size dos blocos da home (ou tratá-los como subfiltros do Feminino), tirar Infantil e Calçados do seletor rápido, dos relacionados, da grade de tamanhos e do prompt de análise, e limpar o SEO de `colecao.tsx`.
3. Arquivar os produtos remanescentes da marca antiga (bolsas/acessórios e itens não pertencentes à J&S Store) e cadastrar os masculinos faltantes do vídeo com preço, categoria, grade de tamanhos e imagens.
4. Preencher os segredos pendentes antes do passo 3, pois a escrita no catálogo e o checkout dependem deles.
5. Medir e ajustar contraste em carrinho, checkout, wishlist e login nos estados hover/focus/disabled.

## Detalhes técnicos

- Arquivos com domínio antigo: `public/robots.txt`, `src/components/Breadcrumbs.tsx:14`, `src/routes/sobre.tsx:15,17`, `src/routes/produto.$handle.tsx:237`.
- Categorias legadas: `src/routes/produtos.rapido.tsx:216-217`, `src/components/RelatedProducts.tsx:9-15`, `src/lib/products/variantSizes.ts:7-33`, `src/lib/api/analyzeProduct.functions.ts:11,20,48,50`, `src/routes/colecao.tsx:13-19`.
- O catálogo é lido via `src/lib/api/supaProducts.ts`; o banco gerenciado deste remix está vazio (sem tabela `products`), confirmando que os dados vêm do Supabase externo configurado por segredo.
