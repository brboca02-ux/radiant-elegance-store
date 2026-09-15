# Padronizar os cards de produto em 1:1

## Objetivo
Deixar a área da foto de todos os cards de produto perfeitamente quadrada (proporção 1:1), mantendo nome, preço e estados do produto estáveis abaixo da imagem.

## Alterações
- Trocar a proporção atual 3:4 do `ProductCard` por 1:1.
- Aplicar a mesma proporção aos espaços de carregamento para evitar saltos visuais.
- Preservar a foto inteira centralizada, sem deformação, usando o comportamento atual de ajuste da imagem.
- Garantir o mesmo padrão na coleção, vitrine rotativa e produtos relacionados, pois todos reutilizam o mesmo card.
- Conferir em celular e computador para validar alinhamento, textos e preços sem sobreposição.

## Detalhes técnicos
- Alterar somente a apresentação dos cards e skeletons; catálogo, estoque, variantes e seleção de cores não serão modificados.
- Usar dimensões responsivas estáveis com `aspect-square`.
- Validar a compilação e a aparência no preview após a implementação.
