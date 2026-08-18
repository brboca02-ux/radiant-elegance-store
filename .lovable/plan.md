# Auditoria de integração — Painel admin x Loja

## O que já foi verificado no banco

| Dado | Situação |
| --- | --- |
| Produtos | 75 no total: 52 ativos (29 masculino, 23 feminino) e 23 arquivados |
| Vitrine | 11 produtos marcados para a vitrine |
| Imagens / variações | 83 imagens e 188 variações cadastradas |
| Categorias | 2 (masculino, feminino) |
| Textos da home (`site_config`) | 1 registro salvo — integração funcionando |
| Imagens editáveis da home (`site_media`) | **0 registros** |
| Pedidos, leads, carrinhos abandonados | **0 registros** |
| Cupons | 2 cadastrados |

Confirmado por leitura de código: painel e loja leem as mesmas fontes (produtos, categorias, cupons, textos da home). Não há divergência de tabela entre as duas pontas.

## Pontos de atenção encontrados

1. **Imagens da home não estão persistidas.** A tela de mídia do painel grava em `site_media`, mas a tabela está vazia. Hoje a home e a lista de categorias exibem as imagens embutidas no código como fallback — ou seja, qualquer troca de banner feita no painel não sobreviveu. Precisa ser reproduzido para descobrir se o upload falha (bucket privado + rota de imagem) ou se nunca foi salvo.
2. **23 produtos arquivados.** Eles não aparecem na loja. É preciso confirmar se isso é intencional ou se são peças que deveriam estar à venda.
3. **Nenhum pedido no sistema.** Dashboard, Pedidos e a recuperação de carrinho nunca rodaram com dado real neste banco, então esses painéis não estão validados ponta a ponta.
4. **Cache no navegador.** Textos da home, pedidos e leads mantêm cópia local no navegador. Se o banco falhar, a tela mostra dado antigo sem avisar — o painel pode parecer "salvo" quando não salvou.

## Plano de auditoria e correção

### Fase 1 — Provar o fluxo de imagens da home
- Entrar no painel autenticado e fazer upload real de imagem de categoria e de vitrine.
- Confirmar que a linha aparece em `site_media`, que a URL abre pela rota pública de imagem e que a home e a lista de categorias passam a usá-la.
- Corrigir o que estiver quebrado (upload, permissão do bucket, leitura na home) e remover o silêncio em caso de erro: o painel deve mostrar mensagem clara quando o salvamento falhar.

### Fase 2 — Catálogo
- Listar os 23 arquivados e confirmar com você quais devem voltar para a loja.
- Validar contadores por categoria, marcação de vitrine e ligação imagem–cor no formulário de produto.

### Fase 3 — Pedido de ponta a ponta
- Fazer um pedido de teste na loja (com cupom e variação) e acompanhar: criação do pedido, baixa de estoque, aparecimento em Pedidos, atualização de etapas de entrega, KPIs do Dashboard e página de acompanhamento do cliente.
- Registrar um carrinho abandonado no checkout e confirmar que ele aparece na aba de Marketing com o link de recuperação.

### Fase 4 — Marketing e configurações
- Capturar um lead pelo site e conferir que ele chega na lista do painel.
- Criar/expirar um cupom no painel e validar o comportamento no checkout.
- Editar textos da home no painel e confirmar a mudança na loja em uma aba nova (sem cache).

### Fase 5 — Endurecer o que estiver frágil
- Onde o cache local puder mascarar falha de salvamento, trocar por erro visível.
- Limpar dados de teste criados durante a auditoria.

## Notas técnicas
- Auditoria feita com Playwright em desktop e mobile, com sessão de administrador.
- Fontes por área: `products`/`product_images`/`product_variants`, `categories`, `orders`/`order_items`, `leads`, `coupons`, `abandoned_carts`, `site_config`, `site_media`.
- Imagens servidas por `/api/public/img/*` sobre o bucket privado `product-images`.
- Pedidos criados pela função `place_order` (preço, desconto e estoque calculados no servidor) — nenhum valor vindo do navegador é confiado.
