import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { checkImageDelivery } from "@/lib/api/imageHealth.functions";

export function ImageHealthCard() {
  const check = useServerFn(checkImageDelivery);
  const [nonce, setNonce] = useState(0);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["image-health", nonce],
    queryFn: () => check(),
    staleTime: 60_000,
  });

  const ok = data?.ok;

  return (
    <section className="border border-border rounded-lg p-4 md:p-5 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Fotos do site</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verifica se as fotos dos produtos estão sendo entregues na loja.
          </p>
        </div>
        <button
          onClick={() => { setNonce((n) => n + 1); refetch(); }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest border border-border rounded-md px-3 py-2 min-h-[40px] hover:border-primary transition-colors"
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Verificar
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2.5 text-sm">
        {isFetching && !data ? (
          <span className="text-muted-foreground">Verificando…</span>
        ) : ok ? (
          <>
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{data?.message}</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <span>
              {data?.message ?? "Não foi possível verificar agora."}
              <br />
              <span className="text-xs text-muted-foreground">
                Se aparecer este aviso, avise o suporte: a entrega das fotos precisa ser religada.
              </span>
            </span>
          </>
        )}
      </div>
    </section>
  );
}
