# Plano: filtros da home direcionando para produtos existentes

## Objetivo
Garantir que os cliques em **Feminino**, **Masculino**, **Promoções**, **PROMOÇÃO** e **Recebidos da Semana** na home levem o cliente para coleções que realmente exibem produtos ativos. O link **Sobre** continua para a página institucional.

## Diagnóstico confirmado
- Hoje existem **15 produtos ativos** no banco, divididos entre `feminino` e `masculino`.
- Os links para **Promoções** (`/colecao?c=promocoes`) e **Recebidos da Semana** (`/colecao?c=recebidos-da-semana`) não retornam produtos porque essas categorias não existem na tabela `categories` e nenhum produto está marcado com esses `category_id`.
- Nenhum produto ativo possui `sale_price`, portanto não há promoções reais no momento.
- O link **Sobre** no rodapé já aponta corretamente para `/sobre` e será mantido.

## O que será feito

### 1. Criar categorias no banco
- Inserir na tabela `categories`:
  - **Promoções** (`slug: promocoes`, `name: Promoções`)
  - **Recebidos da Semana** (`slug: recebidos-da-semana`, `name: Recebidos da Semana`)
- Ambas ficam visíveis no menu e na home, mas só aparecerão na vitrine quando tiverem produtos ativos vinculados.

### 2. Atualizar constantes e SEO
- Atualizar a constante `CATEGORIES` em `src/stores/productsStore.ts` para incluir `promocoes` e `recebidos-da-semana`.
- Adicionar entradas em `src/lib/categorySeo.ts` com títulos, descrições e H1 específicos para as novas categorias.

### 3. Ajustar filtros e navegação
- Garantir que os links/banners da home para **Promoções** e **Recebidos da Semana** usem os slugs corretos (`promocoes`, `recebidos-da-semana`).
- Verificar `Header.tsx`, `HomeSections.tsx`, `PromoSections.tsx` e `colecao.tsx` para alinhar todos os pontos de entrada.
- Confirmar que a página `/colecao` exibe os chips das novas categorias.

### 4. Permitir marcação no painel admin
- Atualizar `ProductForm.tsx` e a listagem de produtos para que o seletor de categoria ofereça **Promoções** e **Recebidos da Semana**.
- Garantir que filtros e buscas no admin reconheçam os novos `category_id`.

### 5. Popular as novas categorias
- Marcar alguns produtos ativos como `category_id = 'promocoes'`.
- Marcar alguns produtos ativos como `category_id = 'recebidos-da-semana'`.
- Como cada produto tem apenas um `category_id`, a distribuição será feita de forma que nenhuma coleção fique vazia e os produtos em promoção/recebidos ainda sejam visíveis em suas respectivas coleções (as páginas de categoria filtram por `category_id` exato).

### 6. Verificação
- Testar cada filtro da home em preview: Feminino, Masculino, Promoções, Recebidos da Semana.
- Confirmar que a página `/colecao` exibe produtos para cada categoria selecionada.
- Validar que o link Sobre continua funcionando normalmente.

## Decisões assumidas
- Cada produto possui um único `category_id`. Produtos marcados como promoção ou recebidos não aparecerão simultaneamente nos filtros Feminino/Masculino.
- Quando houver campanhas reais de desconto, o ideal será marcar os produtos em promoção como `category_id = 'promocoes'` no painel.
- "Recebidos da Semana" será mantido manualmente: o administrador marca/desmarca produtos nessa categoria conforme novidades chegam.
