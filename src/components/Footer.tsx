import { Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="font-display text-3xl tracking-[0.3em] uppercase">Aura</div>
          <span className="gold-rule mt-4" />
          <p className="text-sm text-background/70 mt-6 leading-relaxed">
            Moda feminina sofisticada para mulheres que valorizam elegância, conforto e exclusividade.
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
          <p className="text-sm text-background/70 mb-4">Receba novidades, lançamentos e acessos antecipados.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="flex-1 bg-transparent border border-background/30 px-4 py-2.5 text-sm placeholder:text-background/40 focus:outline-none focus:border-gold"
            />
            <button className="px-5 bg-gold text-foreground text-[11px] tracking-[0.25em] uppercase hover:bg-gold/85">OK</button>
          </form>
        </div>
      </div>
      <div className="border-t border-background/10 py-6 text-center text-[11px] tracking-[0.25em] uppercase text-background/50">
        © {new Date().getFullYear()} Aura Boutique · Todos os direitos reservados
      </div>
    </footer>
  );
}
