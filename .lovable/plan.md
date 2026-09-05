# Corrigir as fotos dos produtos e blindar contra o problema voltar

## O que foi encontrado

Auditei todas as imagens do site:

- **Fotos institucionais** (foto do casal na home, cards Feminino/Masculino, foto da página Sobre): funcionando.
- **Fotos dos produtos**: todas quebradas. Testei os endereços de várias fotos e todos respondem "não encontrado".

As fotos **não foram perdidas** — os arquivos continuam guardados no armazenamento do projeto (as imagens enviadas em agosto e setembro estão lá). O problema é na entrega: o site pede a foto, o armazenamento recusa por credencial inválida, e a página mostra o espaço vazio.

Causa confirmada em teste direto: a credencial que o site usa no servidor não é aceita pelo serviço de arquivos — toda tentativa de leitura, listagem e link assinado é recusada.

## O que será feito

### Parte 1 — Voltar a exibir as fotos

1. Recriar a ligação de credenciais do projeto e testar de novo a leitura dos arquivos.
2. Se a credencial voltar a funcionar, as fotos voltam sem mais nenhuma mudança.
3. Se não voltar, liberar a leitura pública das fotos de catálogo (fotos de loja são públicas por natureza) e passar a entregar a imagem pelo caminho público, que não depende de credencial.
4. Os endereços das fotos no banco continuam iguais — nenhum produto precisa ser reeditado.

### Parte 2 — Para nunca acontecer de novo

5. **Entrega com duas rotas**: a rota de imagens passa a tentar o caminho público e, se falhar, o caminho autenticado (e vice-versa). Uma falha de credencial deixa de derrubar as fotos.
6. **Aviso automático**: quando a entrega de uma foto falhar, o erro real fica registrado nos logs do servidor em vez de sumir como "não encontrado" — hoje o problema ficou invisível por semanas.
7. **Verificador no painel**: um bloco em Configurações que testa uma foto real e mostra "Fotos OK" ou "Problema na entrega de imagens", com o motivo. Assim você percebe no mesmo dia.
8. **Aparência sem quebra**: onde a foto não carregar, o card mostra um espaço elegante com a marca em vez de um vazio/ícone quebrado.
9. **Teste automático** que confere o endereço de uma foto de produto, para que uma futura alteração não derrube as imagens sem aviso.

## Verificação

- Testar diretamente vários endereços de foto de produto (deve responder imagem, não erro).
- Abrir home, coleções Feminino/Masculino e uma página de produto no navegador, com captura de tela.
- Forçar uma falha de propósito e confirmar que o verificador do painel acusa o problema.

## Detalhes técnicos

- Causa raiz: o Storage responde `403 Invalid Compact JWS` para a chave `sb_secret_*` usada por `supabaseAdmin`; `storage.download()` falha e `src/routes/api/public/img.$.tsx` devolve 404 genérico.
- Passo 1: `supabase--rebind_secrets` + reteste; fallback é `supabase--storage_update_bucket(product-images, public=true)` e leitura via `/storage/v1/object/public/...`.
- Arquivos: `src/routes/api/public/img.$.tsx` (fallback público→assinado, log do erro, 404 só quando o objeto realmente não existe), `src/lib/api/supaProducts.ts` e `src/lib/api/siteMedia.ts` (formato de URL no upload), `src/components/ProductCard.tsx` (placeholder de marca), novo bloco de diagnóstico em Configurações do painel, teste em `src/lib/**/*.test.ts`.
- Sanitização de caminho e `cache-control: max-age=31536000, immutable` preservados.
- Corrigir também `src/routes/index.tsx`, onde o `preload` do hero aponta para o `.asset.json?url` em vez da imagem.
