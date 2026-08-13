# Plano de Transição Final: J&S Store

Este plano finaliza a transição da marca, corrige metadados residuais, limpa o catálogo antigo e ajusta a navegação para o foco exclusivo em Moda Masculina e Feminina.

## Alterações Visuais e de Conteúdo

- **Atualização de Metadados e SEO**: Substituir `mdmodas.lovable.app` por `js-store.lovable.app` (ou o domínio final) em todos os arquivos de configuração, rotas e sitemaps.
- **Redes Sociais**: Atualizar handles de Instagram e Twitter de `@mdmodas` para os novos definidos pelo cliente (ou placeholders neutros da marca J&S).
- **Limpeza de Catálogo**: Remover produtos residuais da "MD Modas" que não pertencem à J&S Store.
- **Estrutura de Categorias**: Ajustar menus e seções para focar apenas em "Masculino" e "Feminino", removendo referências a "Infantil" ou "Calçados" se não forem mais vendidos.
- **Cadastro Masculino**: Inserir os itens masculinos extraídos do vídeo que ainda não constam no banco de dados.

## Detalhes Técnicos

### 1. Metadados e URLs
- **src/routes/__root.tsx**: Atualizar `twitter:site`, `og:url` e links `alternate`.
- **src/routes/index.tsx**: Atualizar `og:url` e `canonical`.
- **src/routes/colecao.tsx**: Atualizar links de `og:url` e Breadcrumbs.
- **src/routes/sobre.tsx**: Atualizar metadados SEO.
- **src/routes/sitemap.xml.ts**: Atualizar `BASE_URL`.
- **src/lib/integrations/payment.ts**: Atualizar a URL de redirecionamento.

### 2. Navegação e Rodapé
- **src/components/Header.tsx**: Remover categoria "Infantil" e "Acessórios" do menu se o foco for apenas Masc/Fem.
- **src/components/Footer.tsx**: Atualizar link do Instagram e descrições.
- **src/components/HomeSections.tsx**: Ajustar a `CategoriesSection` para refletir as novas categorias principais.

### 3. Banco de Dados (Via Rota Temporária)
- Criar script para desativar/arquivar produtos que não são da J&S Store.
- Inserir itens masculinos (Polos, Bermudas, Camisetas) com grade P-GG e estoque inicial de 10.

### 4. Correções de Acessibilidade
- Revisar contrastes de botões dourados em fundos claros para garantir conformidade WCAG.
