# Plano para corrigir cards responsivos e troca de cor

## Diagnóstico confirmado
- O código compila normalmente, mas a prévia registra a ausência das credenciais públicas de conexão com o banco da loja.
- A falha acontece no carregamento global de produtos, categorias, estoque e autenticação; como a assinatura de autenticação não está isolada, o erro sobe até a tela “Algo deu errado”.
- A troca de cor na página do produto muda o estado selecionado, mas a foto não muda de forma confiável porque hoje a tela tenta descobrir a cor pela URL da imagem ou pelo texto alternativo.
- As imagens cadastradas desse produto usam nomes de arquivo aleatórios, e o texto alternativo vindo da loja é apenas o nome do produto. Assim, a tela não tem como saber qual foto pertence a Branco, Preto ou Azul Claro.
- Os cards da vitrine/listagem precisam de travas mais fortes de layout para nomes longos, botão de compra e largura em telas menores.

## O que vou corrigir
1. **Restabelecer a loja e evitar nova tela de erro total**
   - Revalidar a ligação da prévia com o banco da loja e restaurar as credenciais gerenciadas pelo Lovable Cloud.
   - Confirmar que produtos, categorias, autenticação e atualização ao vivo voltaram a responder.
   - Isolar a inicialização dessas áreas para que uma indisponibilidade temporária mostre conteúdo seguro ou estado de carregamento, sem derrubar cabeçalho, página e rodapé.
   - Manter o erro técnico registrado para diagnóstico, sem expô-lo aos clientes.

2. **Vincular cor à foto do produto**
   - Criar uma regra de leitura que associe imagens às cores pela ordem cadastrada quando não houver nome de cor no arquivo.
   - Para produtos com múltiplas cores e múltiplas fotos, cada cor passa a usar sua foto correspondente.
   - Manter fallback seguro: se não houver foto suficiente, mostra todas as fotos sem quebrar a página.

3. **Fazer a imagem mudar ao selecionar a cor**
   - Ao clicar em uma cor, a galeria será recalculada para aquela cor.
   - O carrossel voltará para a primeira foto da cor selecionada.
   - Miniaturas, foto principal e lightbox ficarão sincronizados.

4. **Corrigir responsividade dentro dos cards**
   - Ajustar os cards de produto para impedir estouro de texto.
   - Travar altura/área do nome e preço para não empurrar os cards de forma irregular.
   - Melhorar grid e espaçamentos para mobile, tablet e desktop.
   - Garantir que o botão “Comprar” não cubra nome/preço nem force quebra visual.

5. **Verificar a home e as coleções**
   - Conferir “Recebidos da Semana”, vitrine, Masculino/Feminino e página de produto.
   - Testar pelo menos uma peça com variações de cor no navegador.

## Resultado esperado
- A loja abre normalmente mesmo após uma falha temporária de conexão, sem cair na tela genérica de erro.
- Os produtos com variações aparecem em um único card.
- Dentro do card, nome, preço e imagem ficam proporcionais em celular e desktop.
- Ao selecionar Branco, Preto, Azul Claro etc., a foto exibida muda para a cor escolhida.
- A página continua funcionando mesmo quando algum produto ainda não tiver foto por cor cadastrada.

## Detalhes técnicos
- Reassociar as variáveis gerenciadas de conexão da prévia e validar a inicialização do cliente antes de assinar autenticação e atualizações ao vivo.
- Tratar falhas dos carregamentos globais de forma independente para preservar a interface pública.
- Ajustar a conversão de produto para carregar metadados mínimos de cor por imagem quando possível.
- Criar função utilitária para mapear `cor -> imagens` usando, nesta ordem:
  1. correspondência por texto/URL quando existir;
  2. correspondência pela ordem das cores e imagens;
  3. fallback para todas as imagens.
- Atualizar a página de produto para resetar o índice do carrossel quando a cor mudar.
- Revisar `ProductCard` e `ProductGrid` com `min-w-0`, alturas estáveis, truncamento/line-clamp e grid seguro para mobile.
- Validar com navegador em desktop e mobile antes de concluir.
