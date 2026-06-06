import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Atendimento WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:scale-105 transition group"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
      <span className="hidden sm:inline text-sm font-semibold">Precisa de ajuda? Fale conosco</span>
    </a>
  );
}
