# Cadastrar o catálogo J&S Store no estoque

Vou cadastrar os 17 produtos do catálogo do vídeo (WhatsApp — J e S Store Joinville) no estoque da loja, com nome, descrição, preço, grade de tamanhos e imagem.

## Produtos e preços

| Produto | Preço | Categoria |
|---|---|---|
| Calça Jeans Masculina Importada (azul escuro, azul médio, preta) | R$ 129,90 | Masculino |
| Calça de Sarja Premium Masculina | R$ 129,90 | Masculino |
| Calça Jeans Importada Feminina | R$ 129,90 | Feminino |
| Camisa Gola Polo Importada (Tommy, Lacoste, Boss, Polo) | R$ 99,90 | Masculino |
| Camisa Gola Polo com Elastano | R$ 89,90 | Masculino |
| Camiseta Tommy Malha Suprema | R$ 89,90 | Masculino |
| Short Sarja Mauricinho | R$ 69,90 | Masculino |
| Short Sarja Mauricinho Rústico | R$ 69,90 | Masculino |
| Bermuda de Sarja Polo Ralph Lauren | R$ 69,90 | Masculino |
| Bermuda Sarja Lacoste | R$ 69,90 | Masculino |
| Bermuda Sarja Reserva | R$ 69,90 | Masculino |
| Bermuda Sarja Plus Size | R$ 69,90 | Plus Size |
| Bermuda Jeans Masculina | R$ 69,90 | Masculino |
| Calça Jeans Masculina Básica | R$ 69,90 | Masculino |
| Camiseta Peruana 40.1 (M, G, GG) | R$ 59,90 | Masculino |
| T-Shirt Feminina malha 100% algodão | R$ 39,90 | Feminino |
| Camiseta Masculina Fio 30.1 | R$ 29,90 | Masculino |

## Estoque e tamanhos

- Camisetas/polos/T-shirts: P, M, G, GG — 10 unidades por tamanho.
- Bermudas, shorts e calças: 38, 40, 42, 44, 46, 48 — 10 unidades por tamanho.
- Bermuda Plus Size: 50, 52, 54, 56 — 10 unidades por tamanho.
- Estoque mínimo 2, controle de estoque ativado, status "ativo", marca J&S Store.

## Imagens

Extraio as miniaturas correspondentes do vídeo, faço upscale leve e publico cada uma como imagem principal do produto. São miniaturas de baixa resolução (~90px), então a qualidade vai ficar limitada — depois basta substituir pelas fotos originais no admin.

## Detalhes técnicos

1. Confirmar permissão de escrita: o catálogo fica no banco externo da loja acessado com a chave publishable. Primeiro passo é validar se a inserção é permitida por RLS com a sessão de administrador; se não for, faço o cadastro autenticado como admin (ou peço o acesso necessário) antes de seguir.
2. Recortar os frames do vídeo (ffmpeg), salvar cada foto como asset em CDN e usar a URL no registro de imagem do produto.
3. Inserir em `products` (slug único, name, description, category_id, brand, sku, price, stock, minimum_stock, track_stock, status, meta_title, meta_description), mais `product_images` (primária) e `product_variants` (tamanho/cor/estoque), usando as funções já existentes de cadastro de produto.
4. Verificar no fim: listagem de produtos/estoque no admin e a vitrine por categoria mostrando os novos itens com preço e imagem.
