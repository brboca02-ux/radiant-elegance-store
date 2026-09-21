# Gerador automático de medidas com IA

## Objetivo
Adicionar ao cadastro de produto uma sugestão de peso e dimensões de embalagem baseada no nome, categoria e descrição do item.

## Implementação
- Criar uma função segura no servidor para solicitar à IA uma estimativa de peso, altura, largura e comprimento.
- Enviar somente nome, categoria e descrição do produto; a chave da IA continuará exclusiva do servidor.
- Adicionar um botão próximo aos campos de embalagem para gerar a sugestão.
- Mostrar a estimativa em uma janela de confirmação, identificada claramente como estimativa.
- Aplicar apenas os valores confirmados pelo usuário e somente nos campos vazios; valores reais já preenchidos não serão substituídos.
- Manter o salvamento normal do produto separado da confirmação da sugestão.

## Validação
- Verificar estados de carregamento, erro, cancelamento e confirmação.
- Confirmar que medidas existentes permanecem intactas.
- Testar a chamada real da IA e validar o cadastro em telas desktop e mobile.

## Detalhes técnicos
- Usar uma função de servidor TanStack Start e Lovable AI com saída JSON validada.
- Validar valores positivos e devolver mensagens reais de configuração, créditos ou indisponibilidade.
- Alterar somente o cadastro de produto e a função de análise relacionada.
