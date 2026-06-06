import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Atendimento WhatsApp"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gold text-foreground flex items-center justify-center shadow-lg hover:scale-105 transition"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
    </a>
  );
}
