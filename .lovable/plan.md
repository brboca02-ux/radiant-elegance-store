# Corrigir as fotos dos produtos que não aparecem no site

## O que foi encontrado

Auditei todas as imagens do site:

- **Fotos institucionais** (hero do casal, cards Feminino/Masculino, foto da página Sobre): funcionando, carregam normalmente.
- **Fotos dos produtos**: todas quebradas. Testei os endereços das fotos de vários produtos e todos respondem "não encontrado".

As fotos **não foram perdidas** — os arquivos continuam guardados no armazenamento do projeto (conferi: as imagens enviadas em agosto e setembro estão lá). O problema é na entrega: o site pede a imagem, o armazenamento recusa o pedido por falta de credencial válida e a página mostra o espaço vazio.

Causa confirmada em teste direto: a chave de acesso atual do projeto não é aceita pelo serviço de arquivos (retorna erro de autorização em toda tentativa de leitura, listagem e link assinado). Por isso nenhuma foto de produto passa.

## O que será feito

1. Liberar a leitura pública das fotos de produto no armazenamento (as fotos de catálogo são públicas por natureza — quem entra na loja precisa vê-las).
2. Ajustar a rota que entrega as imagens (`/api/public/img/...`) para buscar o arquivo pelo caminho público, sem depender da credencial que hoje falha, mantendo o cache longo já existente.
3. Manter os endereços das imagens exatamente como estão no banco — nenhum produto precisa ser reeditado.
4. Ajustar o envio de novas fotos no painel para continuar gerando o mesmo formato de endereço.
5. Corrigir um detalhe menor encontrado na home: o "pré-carregamento" da foto principal aponta para o arquivo de referência em vez da imagem, o que desperdiça uma requisição.

Se a liberação pública for bloqueada pela política do ambiente, o caminho alternativo é entregar as fotos por uma rota própria com credencial válida; nesse caso eu aviso antes de seguir.

## Verificação

- Testar diretamente vários endereços de foto de produto (deve responder imagem, não erro).
- Abrir a home, a coleção Feminino/Masculino e uma página de produto no navegador e conferir as fotos aparecendo, com captura de tela.
- Enviar/checar o painel para confirmar que fotos novas continuam aparecendo.

## Detalhes técnicos

- Arquivos: `src/routes/api/public/img.$.tsx` (proxy), `src/lib/api/supaProducts.ts` e `src/lib/api/siteMedia.ts` (geração de URL no upload), `src/routes/index.tsx` (preload do hero).
- Bucket `product-images` passa a `public: true` via ferramenta de storage; o proxy passa a usar `/storage/v1/object/public/product-images/<path>` (sem header de auth) em vez de `supabaseAdmin.storage.download`.
- Motivo raiz: o Storage do projeto responde `403 Invalid Compact JWS` para a chave `sb_secret_*` usada pelo cliente admin no servidor; `download()` falha e o handler devolve 404.
- Sanitização de caminho e cache `max-age=31536000, immutable` são preservados.
