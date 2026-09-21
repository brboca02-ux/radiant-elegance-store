# Corrigir o cálculo do Melhor Envio

## Diagnóstico confirmado

- O projeto está compilando normalmente; não há mais erro de tela branca.
- A cotação chama o Melhor Envio quando o cliente informa um CEP válido.
- O segredo `MELHORENVIO_TOKEN` não está cadastrado atualmente, então a função devolve a cotação vazia.
- Os 33 produtos ativos têm peso, mas nenhum possui altura, largura e comprimento. A integração bloqueia corretamente a cotação sem essas medidas reais.
- O checkout descarta a mensagem de erro devolvida pela cotação e mostra apenas uma mensagem genérica, dificultando identificar o dado pendente.

## Correção

1. Abrir o campo seguro para cadastrar `MELHORENVIO_TOKEN`, sem expor o valor no site ou no código.
2. Manter `production` e o CEP de origem `89235188` somente no servidor.
3. Fazer o serviço de frete devolver ao checkout o motivo real da falha, sem travar o carregamento.
4. Exibir uma mensagem clara quando o token estiver ausente, inválido ou quando algum produto do carrinho estiver sem medidas.
5. Garantir que o indicador “Calculando frete...” sempre seja encerrado, inclusive quando a chamada falhar.
6. Manter a exigência de peso e dimensões reais — nenhum valor será inventado ou estimado.
7. Validar com um CEP fora de Joinville e confirmar a chamada, a resposta e a exibição das transportadoras.

## Resultado esperado

- Com token válido e produtos medidos, PAC, SEDEX e demais serviços disponíveis aparecem com preço e prazo reais.
- Sem algum dado obrigatório, o checkout explica exatamente o que falta em vez de parecer carregando indefinidamente.
- A retirada na loja e a entrega local continuam funcionando independentemente do Melhor Envio.

## Dependência para liberar cotações reais

Após cadastrar o token, ainda será necessário preencher altura, largura e comprimento reais dos produtos vendidos. Os campos já existem no cadastro de produto; a correção não preencherá medidas fictícias.
