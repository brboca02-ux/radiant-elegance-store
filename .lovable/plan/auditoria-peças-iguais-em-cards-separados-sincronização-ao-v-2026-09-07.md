# Auditoria: peças iguais em cards separados + sincronização ao vivo

## O que a auditoria mostrou

A consolidação das camisas de manga longa **foi aplicada** no banco: hoje existe um único produto "Camisa Social Masculina Manga Longa Tommy Hilfiger", com Branco, Preto e Azul Claro, tamanhos P–GG, 4 fotos e estoque 160. A vitrine masculina exibe esse card único.

O que continua errado — e é o que aparece na sua tela — são **outras** peças iguais ainda em cards separados:

1. Camisa Manga Curta Ralph Lauren: três cadastros distintos (Branco, Azul Claro, Cinza Claro), R$ 149,90 cada, P–GG, 1 foto cada.
2. "POLO PIQUET COM ELASTANO" com uma única cor (Azul Royal), ao lado de "POLO PIQUET IMPORTADA" com cinco cores.

Também não existe atualização ao vivo: a loja e o painel carregam os produtos uma vez ao abrir a página, então mudanças feitas em outro lugar só aparecem depois de recarregar.

## Correções

1. Unificar as três camisas Ralph Lauren em um único produto "Camisa Manga Curta Masculina Ralph Lauren": as três fotos passam para ele, as variações ficam Branco / Azul Claro / Cinza Claro em P, M, G e GG, preço R$ 149,90 e estoque somado. Os dois cadastros extras são removidos depois da transferência (confirmando antes que não estão em pedidos).
2. Manter separadas as peças que são realmente modelos diferentes (Camisa Social Manga Curta Azul Marinho, polos de marcas distintas).
3. Confirmar com você se a "POLO PIQUET COM ELASTANO" deve entrar como cor extra da "POLO PIQUET IMPORTADA" ou continuar sozinha — só mexo nela com o seu OK.
4. Ligar a sincronização ao vivo: a loja e o painel passam a ouvir mudanças de produtos, fotos e variações em tempo real, e a lista se atualiza sozinha assim que algo muda no banco — sem recarregar a página, mesmo quando a alteração vem de fora.
5. Conferir no fim, em desktop e celular: um único card por peça, todas as fotos, cores e tamanhos selecionáveis, e uma alteração de estoque refletindo na hora na vitrine aberta.

## Detalhes técnicos

- Consolidação por SQL nos dados existentes de `products`, `product_images` e `product_variants` (mesmo padrão já usado na manga longa): repontuar `position`/`is_primary` das fotos, recriar variantes cor × tamanho com estoques somados, atualizar `stock` do produto e apagar os duplicados.
- Sincronização ao vivo com Supabase Realtime: publicação nas três tabelas e uma subscription única (por exemplo em `useHydrateStores`) chamando `useProductsStore.refresh()` com debounce ao receber INSERT/UPDATE/DELETE; canal removido no unmount para não acumular listeners.
- Nenhuma tabela nova; RLS e grants atuais permanecem.
