# Integração total com Supabase (e-commerce sincronizado)

Hoje os produtos vivem apenas em `localStorage` (zustand persist), por isso somem entre dispositivos e a home aparece vazia quando o Shopify não responde. Vamos mover tudo para o Supabase que já está configurado em `src/lib/supabaseClient.ts` (projeto `snqvhexeruvlyrtzsdnm`).

## 1. Schema no Supabase (migração SQL)

Tabelas em `public`:

- **categories** — `id, slug, name, position, created_at`
- **products** — `id, store_id, name, slug (único), description, category_id, brand, sku, price, sale_price, stock, reserved_stock, minimum_stock, track_stock, weight, status ('ativo'|'inativo'|'arquivado'), meta_title, meta_description, created_at, updated_at`
- **product_images** — `id, product_id (fk cascade), url, position, is_primary`
- **product_variants** — `id, product_id (fk cascade), size, color, stock`
- **stock_movements** — `id, product_id, type ('entrada'|'saida'|'ajuste'), quantity, reason, notes, user_id, user_name, created_at`
- **user_roles** + enum `app_role ('admin'|'user')` + função `has_role(uuid, app_role)` (security definer), seguindo o padrão obrigatório.

### Storage
- Bucket público `product-images` para fotos enviadas pelo painel.

### RLS + Grants (regras)
- `products`, `product_images`, `product_variants`, `categories`:
  - `SELECT` público (`anon` + `authenticated`) **apenas** quando `status = 'ativo'` (em products) — vitrine pública.
  - `INSERT/UPDATE/DELETE` apenas para `has_role(auth.uid(), 'admin')`.
- `stock_movements` e `user_roles`: apenas admin.
- `GRANT`s explícitos para `anon`, `authenticated`, `service_role` em cada tabela (Supabase exige GRANT explícito).

## 2. Camada de dados no app

- `src/lib/api/products.ts` — funções client-side usando o `supabase` browser client (chave publishable, RLS aplica):
  - `listPublicProducts({ query, limit, category })` — lê produtos ativos + imagens.
  - `listAdminProducts()` — todos os status (precisa admin pela RLS).
  - `getProductBySlug(slug)`
  - `upsertProduct(payload)` / `archiveProduct(id)` / `duplicateProduct(id)`
  - `uploadProductImage(file)` → retorna URL pública
  - `recordStockMovement(...)`
- React Query (`@tanstack/react-query`, já instalado) como cache. Sem `localStorage` como fonte de verdade.

## 3. Refatorar stores e telas

- `productsStore.ts`, `stockStore.ts`, `categoriesStore.ts` viram **hooks finos** sobre React Query (mantendo a mesma API pública para minimizar mudanças nos componentes):
  - `useProducts()`, `useProduct(id)`, `useCreateProduct()`, `useUpdateProduct()`, etc.
- Telas que mudam:
  - `produtos.index.tsx`, `produtos.novo.tsx`, `produtos.$id.editar.tsx` → usam mutations Supabase + upload de imagens para o bucket.
  - `estoque.index.tsx`, `estoque.historico.tsx` → leitura/escrita em `stock_movements`.
  - `categorias.*` → CRUD em `categories`.
  - `ProductGrid.tsx` (vitrine) e `produto.$handle.tsx` → fonte primária = Supabase; Shopify só como fallback opcional (desabilitado por padrão, já que a loja está sem plano ativo).
  - `HomeSections.tsx` → lê do Supabase.

## 4. Promover seu usuário a admin

- Inserir manualmente uma linha em `user_roles` para o e-mail `adm@adm` (vou pedir confirmação do `user_id` após criar a migração, ou faço lookup pelo email no `auth.users` dentro do seed).

## 5. Migração das imagens que você enviou

Os arquivos de imagem que você forneceu estão em `src/assets/*.jpg.asset.json`. Vou:
1. Criar um seed SQL que insere as categorias e ~40 produtos referenciando essas imagens (URLs públicas via storage **ou** mantendo as URLs já hospedadas no assets do Lovable).
2. Cada produto entra com `status='ativo'`, estoque inicial (sugerido: 10 unidades), preço placeholder que você ajusta no painel.

Assim a home volta a mostrar peças **imediatamente** após a migração, e qualquer produto novo cadastrado pelo painel aparece em todo o site em tempo real (React Query revalida).

## 6. Detalhes técnicos

- Cliente Supabase atual já é browser-only com persistSession — perfeito para painel admin autenticado.
- RLS garante que `anon` só veja produtos ativos; admin (via JWT com claim de role) faz tudo.
- Sem necessidade de server functions nesta fase — todas as operações usam o client Supabase + RLS.
- O badge de Shopify continua disponível como fallback opcional via flag.

## Perguntas antes de executar

1. **Preço/estoque iniciais dos 40 produtos seed**: posso usar valores placeholder (ex: R$ 149,90 e 10 unidades) para você ajustar depois? Ou prefere deixar tudo zerado e cadastrar manualmente?
2. **Shopify**: posso desativar completamente como fonte da vitrine (Supabase passa a ser único)? Ou manter como fallback?
3. Confirme o e-mail do usuário admin (`adm@adm`?) para eu já inserir o role.