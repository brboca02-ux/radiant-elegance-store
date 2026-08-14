# Auditoria: textos das categorias sobre os modelos

## O que a auditoria mostrou (mobile 390, 649, tablet 820, desktop 1440)
O bloco de textos está tecnicamente ancorado na base do card (`inset-x-0 bottom-0`), mas visualmente ele NÃO está no rodapé da imagem:

- O bloco reserva espaço permanente para 4 elementos (título, descrição, risco dourado e o texto de hover "Explorar curadoria →"), somando ~75px + 40px de padding.
- Como os cards têm apenas 130px (mobile) e 200px (desktop), esse bloco ocupa quase toda a altura e empurra o título para o meio do card — exatamente sobre o rosto dos modelos.
- O gradiente atual (`via-black/20`) é fraco nessa altura, então o texto disputa contraste com o rosto.

Conclusão: o ajuste anterior não resolveu o problema relatado; em todos os formatos de tela o título ainda cai sobre o personagem.

## Correção proposta (apenas visual, em `src/components/HomeSections.tsx`)
1. Retirar do fluxo os elementos de hover (risco dourado + "Explorar curadoria") usando posicionamento absoluto/`hidden` nos cards pequenos, para que somente título + descrição definam a altura do bloco.
2. Reduzir o padding do bloco (`p-4 pb-6 md:pb-8` → `px-3 pb-2.5 md:pb-4`) para que o texto encoste no rodapé real da imagem.
3. Aplicar uma faixa de contraste só na base (`bg-gradient-to-t from-black via-black/70 to-transparent` limitada a ~45% da altura), preservando o rosto do modelo sem escurecer o card inteiro.
4. Ajustar `object-position` dos dois cards (feminino `50% 18%`, masculino `50% 12%`) para que o rosto suba um pouco e a faixa inferior fique livre.
5. Aumentar levemente a altura dos cards (`h-[150px] md:h-[210px]`) para acomodar título + descrição no rodapé sem cortar os modelos — mantendo o site compacto.

## Validação
- Novas capturas dos cards em 390px, 649px, 820px e 1440px confirmando: texto no terço inferior, sem sobrepor rostos, contraste legível.
- Build sem erros.

## Arquivo afetado
- `src/components/HomeSections.tsx`
