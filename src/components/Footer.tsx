import { Instagram, Facebook } from "lucide-react";
import { NewsletterCapture } from "@/components/NewsletterCapture";


export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="font-display font-extrabold text-3xl"><span className="text-primary">MD</span> Modas</div>
          <span className="gold-rule mt-4" />
          <p className="text-sm text-background/70 mt-6 leading-relaxed">
            Moda feminina e masculina para todas as ocasiões. Atendimento próximo e entregas para toda a região.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.3em] uppercase mb-5 text-gold">Instituição</h4>
          <ul className="space-y-3 text-sm text-background/80">
            <li><a href="#" className="hover:text-background">Sobre Nós</a></li>
            <li><a href="#" className="hover:text-background">Trocas e Devoluções</a></li>
            <li><a href="#" className="hover:text-background">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-background">FAQ</a></li>
            <li><a href="#" className="hover:text-background">Contato</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.3em] uppercase mb-5 text-gold">Social</h4>
          <div className="flex gap-4 text-background/80">
            <a href="#" aria-label="Instagram" className="hover:text-gold"><Instagram className="h-5 w-5" strokeWidth={1.25} /></a>
            <a href="#" aria-label="Facebook" className="hover:text-gold"><Facebook className="h-5 w-5" strokeWidth={1.25} /></a>
          </div>
          <p className="text-xs text-background/60 mt-6">WhatsApp · TikTok</p>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.3em] uppercase mb-5 text-gold">Newsletter</h4>
          <p className="text-sm text-background/70 mb-4">Ganhe 5% OFF na primeira compra.</p>
          <div className="bg-background text-foreground rounded-lg p-4">
            <NewsletterCapture compact />
          </div>
        </div>

      </div>
      <div className="border-t border-background/10 py-6 text-center text-xs text-background/60">
        © {new Date().getFullYear()} MD Modas · Todos os direitos reservados
      </div>
    </footer>
  );
}
