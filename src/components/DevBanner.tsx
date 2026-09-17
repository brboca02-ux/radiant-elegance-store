import { AlertTriangle } from "lucide-react";

interface DevBannerProps {
  mode?: "topbar" | "card";
}

export function DevBanner({ mode = "topbar" }: DevBannerProps) {
  if (mode === "card") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm">
          <strong className="font-semibold text-amber-300">Ambiente de Demonstração:</strong>
          <p className="mt-1 text-amber-200/90">
            Este e-commerce está em fase de desenvolvimento e testes. Nenhum pedido real será cobrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Aviso de desenvolvimento"
      className="relative z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-black shadow-sm sm:text-sm"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        <strong>Atenção:</strong> Loja em desenvolvimento. Pedidos e pagamentos são apenas para fins de teste.
      </span>
    </aside>
  );
}