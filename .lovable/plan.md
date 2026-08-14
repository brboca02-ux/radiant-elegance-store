# Migração para Lovable Supabase

## Objetivo
Trocar o backend do J&S Store do Supabase externo/hardcoded para o Supabase gerenciado pelo Lovable Cloud, com migração completa dos dados e reescrita do código cliente para usar o client gerado.

## Por que
- Atualmente `src/lib/supabaseClient.ts` contém URL e anon key hardcoded de um banco externo (`snqvhexeruvlyrtzsdnm.supabase.co`), que não é atualizável pelo remix e foge do controle do Lovable Cloud.
- O banco do Lovable Cloud (`xsahoigznvbsiargjvdu`) está saudável, mas sem tabelas públicas ainda.
- Usar o Lovable Supabase permite usar `requireSupabaseAuth`, `@/integrations/supabase/client`, políticas de RLS e auth gerenciado sem hardcoded secrets.

## Escopo
1. Substituir importes do `src/lib/supabaseClient.ts` por `@/integrations/supabase/client` em todo o app.
2. Criar/ajustar as tabelas no Lovable Supabase (produtos, variantes, categorias, estoque, pedidos, perfis, etc.) com RLS e GRANTs.
3. Migrar dados do Supabase externo para o Lovable Supabase (produtos, variantes, estoque, categorias, etc.).
4. Configurar auth (Google OAuth via broker) e ajustar `src/start.ts` para anexar o bearer token.
5. Validar vitrine, carrinho, checkout, painel de admin, estoque e login.

## Passos

### 1. Coletar credenciais do Supabase externo
- Atualizar secrets: `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`.
- (Opcional) também atualizar `CRON_SECRET`, `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` se o usuário quiser, pois estes estão pendentes do remix anterior.

### 2. Inspeção do banco externo
- Listar tabelas e colunas no banco de origem.
- Listar produtos, variantes, categorias, estoque, pedidos e imagens.
- Verificar se há RLS ou políticas existentes, e se há uma `app_role` / `user_roles`.

### 3. Design do schema no Lovable Supabase
- Manter a taxonomia apenas Masculino/Feminino (remover Infantil/Calçados, conforme solicitado anteriormente).
- Criar tabelas principais:
  - `categories` (id, name, slug, gender, created_at, updated_at)
  - `products` (id, title, slug, description, price, promotional_price, category_id, gender, images, status, created_at, updated_at)
  - `product_variants` (id, product_id, size, color, sku, stock, created_at, updated_at)
  - `orders` / `order_items` (se existirem pedidos no banco externo)
  - `profiles` (id, name, phone, role, created_at, updated_at) — referencia `auth.users`
  - `user_roles` (id, user_id, role) — conforme regra de segurança de roles separadas
- Adicionar GRANTs e RLS para cada tabela pública.
- Criar função `public.has_role` para verificar papéis sem recursão RLS.

### 4. Migração de dados
- Criar uma rota temporária de admin (`/_authenticated/admin/migrate`) ou script server-side que:
  1. Conecta no Supabase externo usando service role.
  2. Lê categorias, produtos, variantes e estoque.
  3. Insere no Lovable Supabase usando `supabaseAdmin`.
  4. Mapeia IDs externos para IDs internos preservando relações.
- Após validação, remove a rota temporária.
- Fazer backup do banco externo (export CSV) antes da migração.

### 5. Atualização do código do app
- Substituir `import { supabase } from "@/lib/supabaseClient"` por `import { supabase } from "@/integrations/supabase/client"`.
- Ajustar funções serverless para usar `@/integrations/supabase/auth-middleware` e `requireSupabaseAuth`.
- Ajustar o painel de admin/estoque para usar o service role via `client.server` dentro de handlers.
- Garantir que nenhum `client.server` seja importado em componentes/rotas client-side.

### 6. Auth e configuração social
- Configurar Google OAuth via `supabase--configure_social_auth` usando o broker Lovable.
- Ajustar `src/routes/login.tsx` para usar `lovable.auth.signInWithOAuth("google")`.
- Atualizar `src/start.ts` para incluir `attachSupabaseAuth` em `functionMiddleware` (ou reutilizar middleware existente equivalente).

### 7. SEO e domínios
- Confirmar que canônicos e OG continuam apontando para `jsstore.lovable.app`.
- Atualizar qualquer referência remanescente ao banco externo.

### 8. Validação
- Verificar que a vitrine carrega produtos do Lovable Supabase.
- Verificar que painel de admin lista e edita estoque por variante.
- Verificar que login funciona com Google.
- Verificar que checkout e carrinho usam os novos IDs.
- Rodar build e testes.

## Riscos e decisões pendentes
- O banco externo pode ter dados de produtos que não estão mais desejados (por exemplo, infantil/calçados). Antes da migração, precisamos filtrar e limpar.
- Se o banco externo tiver muitas imagens no storage, precisaremos re-hospedar as imagens no Lovable Storage (ou usar URLs públicas existentes).
- O pedido de pagamento (Mercado Pago) ainda depende dos secrets de MP. Se não forem fornecidos, o checkout pode ficar incompleto.

## Resultado esperado
App totalmente conectado ao Lovable Supabase, com dados migrados, auth funcional e sem referências hardcoded ao banco externo.
