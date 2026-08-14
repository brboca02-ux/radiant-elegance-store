# Topo da home mais atrativo e preenchido

O topo hoje é só a foto com os dois botões e uma faixa de categorias baixinha (85px no mobile). Sobra área vazia e falta mensagem de marca. A proposta é preencher com texto curto, hierarquia elegante e uma faixa de confiança, sem poluir.

## 1. Hero com mensagem de marca
- Selo superior: "Joinville · Aventureiro" em letras espaçadas dourado suave.
- Título em Playfair Display, duas linhas: "Moda masculina e feminina" / "com curadoria J&S".
- Linha de apoio curta: "Camisas polo, camisetas peruanas, calças jeans e bermudas de sarja — peças selecionadas, entrega para todo o Brasil."
- Botões "Comprar Feminino" e "Comprar Masculino" ficam logo abaixo, alinhados à esquerda no desktop e centralizados no mobile.
- Conteúdo agrupado num bloco com respiro, alinhado à esquerda no desktop para não cobrir os modelos; overlay em degradê lateral+base para manter legibilidade.
- Altura do hero volta um pouco (para ~60vh no tablet e 80vh no desktop) para acomodar o texto sem aparência apertada.

## 2. Faixa de confiança logo abaixo do hero
Uma tira fina, fundo preto com borda dourada discreta, 3 itens em linha:
- "Frete para todo o Brasil"
- "Troca fácil em até 30 dias"
- "Atendimento no WhatsApp"
No mobile vira scroll horizontal ou grade de 3 colunas compactas.

## 3. Categorias com mais presença
- Título da seção ganha um kicker e subtítulo curto: "Escolha por estilo" / "Duas curadorias, uma só identidade".
- Cards sobem de 85px/130px para 130px/200px — ainda enxutos, mas com o nome e o "Ver coleção" legíveis.
- Nome da categoria com uma linha descritiva fixa abaixo ("Elegância no dia a dia" / "Clássico com atitude") em vez de aparecer só no hover.

## Detalhes técnicos
- Arquivo único: `src/components/HomeSections.tsx` (`HomeHero`, nova faixa `TrustStrip`, `CategoriesSection`).
- `src/routes/index.tsx` renderiza a faixa de confiança entre hero e categorias.
- Cores via tokens existentes (`gold`, `background`, `muted-foreground`); nada hardcoded novo.
- Sem mudança de dados, rotas ou lógica; apenas conteúdo e estilo.
