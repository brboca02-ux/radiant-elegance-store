import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/trocas-e-devolucoes")({
  head: () => ({
    meta: [
      { title: "Trocas e Devoluções — MD Modas" },
      { name: "description", content: "Como solicitar troca ou devolução de peças compradas na MD Modas. Prazos, condições e atendimento pelo WhatsApp." },
      { property: "og:title", content: "Trocas e Devoluções — MD Modas" },
      { property: "og:description", content: "Política de trocas, devoluções e atendimento da MD Modas." },
      { property: "og:url", content: "/trocas-e-devolucoes" },
      { property: "og:type", content: "article" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "/trocas-e-devolucoes" }],
  }),
  component: TrocasPage,
});

function TrocasPage() {
  return (
    <LegalPage eyebrow="Atendimento" title="Trocas e Devoluções">
      <p>Queremos que você fique 100% satisfeita(o) com sua compra na MD Modas. Caso algo não esteja como esperado, oferecemos troca e devolução conforme as condições abaixo.</p>

      <h2>Prazo</h2>
      <ul>
        <li><strong>7 dias corridos</strong> a partir do recebimento para arrependimento (conforme art. 49 do Código de Defesa do Consumidor).</li>
        <li><strong>30 dias corridos</strong> para troca de tamanho ou modelo de peças adquiridas online.</li>
      </ul>

      <h2>Condições da peça</h2>
      <ul>
        <li>Sem indícios de uso, lavagem ou perfume.</li>
        <li>Etiquetas e embalagens originais preservadas.</li>
        <li>Acompanhada da nota fiscal.</li>
      </ul>

      <h2>Como solicitar</h2>
      <ol>
        <li>Fale com a gente pelo WhatsApp informando o número do pedido.</li>
        <li>Confirmamos as instruções de envio em até 1 dia útil.</li>
        <li>Após recebermos e conferirmos a peça, processamos a troca ou estorno.</li>
      </ol>

      <h2>Troca por defeito</h2>
      <p>Em caso de defeito de fabricação, custeamos o frete de retorno e enviamos uma nova peça ou efetuamos o reembolso integral.</p>

      <h2>Troca por tamanho</h2>
      <p>Para troca de tamanho ou modelo, o frete de envio à MD Modas é por conta do cliente. O frete da nova peça é cortesia nossa.</p>

      <h2>Custos de envio</h2>
      <ul>
        <li><strong>Defeito de fabricação:</strong> frete custeado pela MD Modas.</li>
        <li><strong>Troca de tamanho/modelo:</strong> envio à loja por conta do cliente, reenvio por nossa conta.</li>
        <li><strong>Arrependimento:</strong> frete de retorno por conta do cliente, reembolso integral do valor da peça.</li>
      </ul>

      <h2>Atendimento</h2>
      <p>Todas as solicitações são iniciadas pelo WhatsApp para agilizar o seu atendimento. Use o botão abaixo.</p>
    </LegalPage>
  );
}
