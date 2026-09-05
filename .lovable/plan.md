# Agrupar camisas de manga longa em um único card

## Objetivo
Reunir os quatro cadastros masculinos de manga longa em um único produto na vitrine, seguindo o padrão das demais peças com variações.

## Alterações
1. Manter um produto principal com o nome **Camisa Social Masculina Manga Longa Tommy Hilfiger**, categoria Masculino, preço de **R$ 159,90** e status ativo.
2. Transferir para esse produto as quatro fotos atuais, sem excluir nenhum arquivo.
3. Consolidar as variações por cor e tamanho:
   - Branco: P, M, G e GG;
   - Preto: P, M, G e GG;
   - Azul Claro: P, M, G e GG.
4. Somar o estoque das duas peças Azul Claro em cada tamanho, evitando duplicidade de combinações; preservar integralmente os estoques de Branco e Preto.
5. Atualizar o estoque total do produto principal para refletir a soma das variações.
6. Remover os três cadastros duplicados depois da transferência. A consulta confirmou que nenhum dos quatro produtos está vinculado a pedidos.
7. Conferir na vitrine e no painel que existe somente um card, com todas as fotos, cores, tamanhos, preço e disponibilidade corretos.

## Detalhes técnicos
- A alteração será feita nos dados existentes de `products`, `product_images` e `product_variants`; não é necessário criar novas tabelas.
- As combinações de cor e tamanho continuarão usando o controle de estoque por variante já existente.
- A verificação final cobrirá desktop e mobile, abertura do produto e seleção das três cores e quatro tamanhos.
