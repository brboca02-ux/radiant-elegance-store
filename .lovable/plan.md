# Plano completo — Uber Direct na J&S Store

## Objetivo

Integrar a Uber Direct de ponta a ponta para entregas locais em Joinville: cotação real no checkout, criação da entrega após pagamento confirmado, acompanhamento no painel, atualização automática por eventos da Uber e cancelamento seguro.

## Situação atual confirmada

- O checkout já identifica endereços de Joinville e solicita uma cotação ao serviço existente.
- A função atual já autentica com `client_credentials`, usando o escopo `eats.deliveries`, e chama o endpoint de cotações da Uber Direct.
- Quando a API não está configurada ou falha, o checkout mantém retirada na loja e usa a tabela local de bairros.
- A implementação atual termina na cotação: ainda não cria a entrega, não salva identificadores da Uber no pedido, não acompanha o motorista e não recebe eventos da Uber.
- Nenhuma credencial da Uber está configurada no projeto. Não existe conector pronto da Uber disponível neste espaço; portanto, a integração usará as credenciais oficiais fornecidas pela Uber e armazenadas com segurança no servidor.

## Informações e acessos necessários

Antes do teste real, será necessário ter uma conta Uber Direct aprovada para produção e obter no portal da Uber:

- `UBER_CLIENT_ID`
- `UBER_CLIENT_SECRET`
- `UBER_CUSTOMER_ID`
- segredo/chave de validação de webhook, conforme disponibilizado pela conta Uber

Os seguintes dados operacionais também serão configurados somente no servidor:

- Endereço completo de retirada: Rua Carlos Emílio Alexandre Schwartz, 335, Casa, Itinga, Joinville/SC, CEP 89235-188
- Nome do remetente: John Carlos Sousa da Rocha
- Telefone do remetente
- Instruções de retirada e identificação da loja

Nenhuma dessas credenciais será enviada ao navegador ou salva no código público.

## Fluxo final

```text
Cliente informa endereço em Joinville
              |
              v
Checkout solicita cotação real à Uber Direct
              |
              v
Cliente escolhe entrega expressa e conclui o pagamento
              |
              v
Pagamento confirmado pela InfinitPay
              |
              v
Pedido fica disponível para criação da entrega no painel
              |
              v
Administrador confirma e cria a entrega Uber Direct
              |
              v
Uber envia atualizações por webhook
              |
              v
Painel e acompanhamento do pedido mostram o status atualizado
```

## Etapas de implementação

### 1. Credenciais e configuração segura

- Abrir campos seguros para as credenciais emitidas pela Uber.
- Manter `UBER_CLIENT_SECRET` e qualquer segredo de webhook exclusivamente no servidor.
- Configurar os dados fixos de retirada já fornecidos.
- Validar a configuração no servidor antes de cada operação e devolver mensagens específicas quando faltar algum dado.
- Não expor tokens OAuth, respostas sensíveis ou credenciais em logs e respostas ao checkout.

### 2. Cliente oficial de comunicação com a Uber

- Centralizar no servidor a autenticação OAuth `client_credentials` e as chamadas da Uber Direct.
- Reutilizar o token somente durante sua validade, evitando autenticação desnecessária a cada ação.
- Implementar tratamento explícito de erros de autenticação, endereço inválido, área sem cobertura, cotação expirada, indisponibilidade e limites da API.
- Registrar apenas informações operacionais seguras: operação, pedido, status HTTP, identificador da Uber e mensagem sanitizada.
- Validar todas as entradas antes de chamar a Uber.

### 3. Cotação real no checkout

- Preservar retirada na loja e a regra local existente.
- Para endereço completo em Joinville, enviar à Uber:
  - endereço completo de retirada;
  - endereço completo de entrega;
  - valor total dos produtos;
  - referência externa da loja/pedido provisório, quando aplicável.
- Exibir preço e prazo retornados pela Uber sem estimar ou alterar o valor real.
- Guardar no estado do checkout o identificador da cotação e sua validade para uso posterior.
- Se a Uber não estiver configurada ou não atender ao endereço, encerrar o carregamento e informar o motivo; a retirada permanece disponível.
- Definir claramente a política da tabela local: ela poderá continuar como contingência visível ou ser restrita a indisponibilidade temporária, sem ser apresentada como preço oficial da Uber.

### 4. Persistência mínima no pedido

Adicionar somente os campos necessários para operar a entrega:

- identificador da cotação Uber;
- validade da cotação;
- identificador da entrega Uber;
- preço cotado/contratado;
- status da entrega;
- URL pública de acompanhamento, se retornada;
- estimativas de coleta e entrega;
- data da última atualização;
- motivo de cancelamento/falha, quando houver.

Aplicar permissões para que clientes leiam apenas os dados públicos do próprio pedido e somente o servidor/admin altere dados operacionais da Uber.

### 5. Criação da entrega após pagamento

- Permitir a criação somente quando:
  - o pedido estiver pago;
  - o método escolhido for Uber Direct;
  - houver endereço e contato completos do cliente;
  - houver uma cotação válida ou uma nova cotação for confirmada;
  - ainda não existir uma entrega Uber para o pedido.
- Criar a entrega com remetente, destinatário, endereço de coleta, endereço de entrega, itens/manifesto, valor e instruções.
- Usar o número do pedido como referência externa.
- Implementar idempotência: cliques repetidos ou reprocessamentos nunca podem criar duas corridas para o mesmo pedido.
- Não criar entrega automaticamente apenas porque o checkout foi aberto ou o pagamento foi iniciado.

### 6. Operação no painel administrativo

No pedido local pago, incluir uma área específica “Uber Direct” com:

- cotação escolhida, preço e validade;
- botão para atualizar a cotação quando expirada;
- botão de confirmação para solicitar o motorista;
- status atual da coleta/entrega;
- estimativas e link de acompanhamento;
- ação para atualizar manualmente o status;
- ação de cancelamento quando a Uber ainda permitir;
- mensagens exatas para dados pendentes ou erro retornado pela Uber.

As ações devem ficar protegidas pela autenticação e validação administrativa já existentes no servidor.

### 7. Webhook oficial da Uber

- Criar uma rota pública exclusiva para eventos da Uber.
- Validar a assinatura/autenticidade usando o método oficial e o segredo fornecido pela Uber antes de processar qualquer evento.
- Rejeitar eventos inválidos sem alterar pedidos.
- Processar eventos de forma idempotente, tolerando reenvios e eventos fora de ordem.
- Relacionar o evento ao pedido pelo identificador da entrega salvo no banco.
- Atualizar status, estimativas, acompanhamento, conclusão e cancelamento.
- Nunca confiar em valores ou identificadores enviados sem validação.

URL planejada de produção:

`https://www.jesstorejoinville.com.br/api/public/uber-direct-webhook`

A URL só será cadastrada no portal da Uber depois que a rota segura estiver implementada e publicada.

### 8. Status e experiência do cliente

Mapear os estados oficiais da Uber para estados claros da loja, sem substituir o status financeiro do pedido:

- aguardando solicitação;
- entrega solicitada;
- motorista a caminho da coleta;
- pedido coletado;
- em rota;
- entregue;
- cancelado;
- falha na entrega.

Mostrar no acompanhamento público apenas informações apropriadas ao cliente, como andamento, previsão e link oficial. Dados internos, contatos privados do motorista ou payloads da Uber não serão expostos.

### 9. Cancelamento e exceções

- Consultar o estado atual antes de cancelar.
- Solicitar cancelamento à Uber e só depois atualizar o pedido local.
- Exibir claramente quando o cancelamento não for mais permitido ou tiver cobrança.
- Manter o pedido e o pagamento separados do estado logístico: cancelar a corrida não cancela nem estorna automaticamente a venda.
- Permitir nova tentativa apenas quando não houver uma entrega ativa e sem reutilizar cotação expirada.

### 10. Testes obrigatórios

#### Configuração
- Credenciais ausentes: checkout termina o carregamento e mantém retirada disponível.
- Credenciais inválidas: erro de autenticação aparece de forma segura no painel/log.

#### Cotação
- Endereço válido em Joinville retorna preço, prazo, identificador e validade reais.
- Endereço incompleto informa exatamente o campo faltante.
- Endereço fora da cobertura não cria preço fictício da Uber.
- CEP fora de Joinville continua no Melhor Envio, sem chamar a Uber.

#### Criação
- Pedido não pago não permite criar entrega.
- Pedido pago cria uma única entrega.
- Repetir a ação não gera duplicidade.
- Cotação expirada exige recotação antes da confirmação.

#### Eventos e acompanhamento
- Evento assinado atualiza o pedido correto.
- Evento sem assinatura válida é recusado.
- Evento repetido não duplica alterações.
- Status final aparece no painel e no acompanhamento do cliente.

#### Cancelamento
- Cancelamento permitido atualiza Uber e pedido.
- Cancelamento recusado preserva o estado anterior e mostra o motivo.

### 11. Validação final em ambiente real

- Conferir compilação e imports.
- Executar uma cotação real usando endereço atendido em Joinville.
- Confirmar no servidor o status HTTP e o identificador retornado, sem registrar credenciais.
- Criar uma entrega de teste somente após autorização explícita, pois pode gerar cobrança real.
- Acompanhar o evento inicial via webhook e testar atualização manual.
- Publicar e cadastrar a URL definitiva do webhook no portal da Uber.
- Fazer um pedido controlado de ponta a ponta: pagamento, criação, coleta, rastreamento e conclusão/cancelamento.

## Decisões de segurança e escopo

- A entrega não será criada automaticamente no webhook de pagamento nesta primeira implantação; o administrador confirmará a solicitação para evitar corridas e cobranças acidentais.
- A integração da Uber será usada somente para endereços locais elegíveis; o Melhor Envio continuará responsável pelo frete nacional.
- Retirada na loja permanecerá disponível.
- Nenhum peso ou dimensão será inventado. A Uber receberá somente os dados realmente exigidos e disponíveis para o manifesto.
- O teste de cotação é seguro; o teste de criação de entrega exige confirmação por poder gerar custo real.

## Dependências externas

- Aprovação e ativação da conta Uber Direct para produção.
- Credenciais e permissões corretas emitidas pela Uber.
- Saldo/faturamento e área de cobertura habilitados na conta Uber.
- Configuração do webhook no portal da Uber após publicação da rota.
- Endereço e telefone completos do cliente em pedidos com entrega local.
