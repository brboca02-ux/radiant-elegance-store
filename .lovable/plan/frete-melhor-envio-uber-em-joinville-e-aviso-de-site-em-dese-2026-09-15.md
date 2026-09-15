# Frete (Melhor Envio + Uber em Joinville) e aviso de site em desenvolvimento

## O que muda para o cliente

1. **Fora de Joinville:** o checkout consulta o Melhor Envio em tempo real e mostra as opções reais (PAC, SEDEX, Jadlog etc.) com preço e prazo.
2. **Dentro de Joinville:** aparece "Entrega rápida em Joinville (moto/Uber)" com valor calculado por faixa de bairro/distância, além de "Retirada na loja" (grátis).
3. **Frete grátis** acima de R$ 299 continua valendo (aplicado sobre a opção escolhida).
4. **Aviso de site em desenvolvimento:** faixa fixa no topo de todas as páginas (com botão de fechar) e um aviso destacado dentro do checkout, antes do pagamento.

## Entrega em Joinville — faixas

Tabela editável no código, com valor base e faixas por região:

- Centro e bairros próximos (até ~5 km): R$ 12
- Faixa intermediária (5–10 km): R$ 18
- Faixa externa / distritos (10–20 km): R$ 26
- Acima disso: "consultar pelo WhatsApp"

Os bairros de cada faixa e os valores são definidos numa lista única, fácil de ajustar depois. Se você quiser outros valores/faixas, é só dizer e eu ajusto.

## O que preciso de você

- O **token do Melhor Envio** (será salvo com segurança, só o servidor lê).
- O **CEP de origem** da loja (uso 89xxx-xxx de Joinville — confirme o CEP exato).
- Peso/dimensões padrão por peça, se você tiver; senão uso 0,4 kg e 30x25x5 cm por item como padrão de vestuário.

## Detalhes técnicos

- Nova função de servidor `src/lib/integrations/melhorenvio.functions.ts`: chama `POST /api/v2/me/shipment/calculate` do Melhor Envio com `MELHORENVIO_TOKEN` (e `MELHORENVIO_ENV` para sandbox/produção), lendo `process.env` dentro do handler. Monta pacote a partir dos itens do carrinho, normaliza a resposta para `ShippingQuote[]` e trata falha retornando lista vazia com aviso.
- `src/lib/integrations/shipping.ts`: passa a orquestrar — se CEP/cidade for Joinville, gera retirada + faixa Uber (`JOINVILLE_ZONES`); caso contrário chama o Melhor Envio; se a API falhar, cai na tabela fixa atual como fallback (nada de checkout travado). `FREE_SHIPPING_THRESHOLD` aplicado ao final.
- `src/routes/checkout.tsx`: mantém a mesma UI de opções (`quotes`), acrescenta estado de carregando/erro na cotação e o bloco de aviso de desenvolvimento. Nenhuma mudança em `place_order` além de `shipping_cost`/`shipping_method` já existentes.
- Aviso global: novo `src/components/DevNoticeBar.tsx` renderizado em `src/routes/__root.tsx`, dispensável e memorizado em `localStorage`; tokens de cor existentes (dourado sobre preto), sem cor fixa em código.
- Sem alteração de banco.

## Ordem de execução

1. Salvar o token do Melhor Envio (formulário seguro) e confirmar CEP de origem.
2. Criar a função de cotação e as faixas de Joinville.
3. Ligar no checkout com estados de carregando/erro e fallback.
4. Adicionar a faixa de aviso e o bloco no checkout.
5. Testar cotação para um CEP de Joinville e um de fora, em celular e computador.
