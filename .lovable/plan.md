# Vitrine rotativa + ajuste de cards da home

## O que muda para o cliente

1. **Categorias maiores** — os cards "Feminino" e "Masculino" na home passam a ser destaques grandes (2 colunas, altura ~260px mobile / ~420px desktop), com nome em dourado e imagem em zoom suave no hover.
2. **Cards de produto menores** — a grade fica fixa em **2 colunas no mobile e 4 no desktop**, com imagens e tipografia reduzidas para um visual mais leve e compacto.
3. **Nova seção "Vitrine"** — carrossel horizontal com rotação automática (avança sozinho a cada ~3s, pausa ao passar o mouse/tocar, laços infinitos e setas discretas). Os cards da vitrine ficam **cerca de 2x menores** que os cards normais de produto.
4. **Controle no painel admin** — em Produtos, cada peça ganha o marcador "Mostrar na vitrine": um toggle no formulário do produto, uma coluna/etiqueta na listagem e um botão rápido de ligar/desligar. Só os produtos marcados (e ativos) aparecem na vitrine da home.

## Detalhes técnicos

**Banco**
- Migração: `ALTER TABLE public.products ADD COLUMN showcase boolean NOT NULL DEFAULT false;` (+ índice parcial em `showcase` quando true). Sem novas policies — herda as existentes de products.

**Dados/estado**
- `src/lib/api/supaProducts.ts`: incluir `showcase` no select, no create e no update.
- `src/stores/productsStore.ts`: campo `showcase: boolean` no tipo `Product`, mapeamento e ação `toggleShowcase(id)` usando o update existente.

**UI storefront**
- `src/components/ProductGrid.tsx`: grade `grid-cols-2 lg:grid-cols-4` (remover `md:grid-cols-3`), gaps menores; nova prop `size?: "default" | "compact"` repassada ao card.
- `src/components/ProductCard.tsx`: variante `compact` (imagem menor, título/preço em fonte reduzida, sem elementos secundários) para uso na vitrine.
- Novo `src/components/ShowcaseCarousel.tsx`: trilha horizontal com scroll-snap, autoplay por `setInterval` + `requestAnimationFrame`-safe cleanup, pausa em hover/focus/`prefers-reduced-motion`, setas prev/next acessíveis com `aria-label`. Lista os produtos `status === "ativo" && showcase`.
- `src/components/HomeSections.tsx`: `CategoriesSection` com cards grandes; nova `VitrineSection` (esconde-se sozinha se não houver produtos marcados).
- `src/routes/index.tsx`: renderizar `VitrineSection` logo abaixo de `CategoriesSection`.

**UI admin**
- `src/components/ProductForm.tsx`: switch "Mostrar na vitrine".
- `src/routes/produtos.index.tsx`: etiqueta "Vitrine" na linha e botão de ação rápida chamando `toggleShowcase` com toast.

Sem alterações em checkout, pedidos ou estoque.
