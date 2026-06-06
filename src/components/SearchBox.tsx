import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { storefrontApiRequest, SEARCH_SUGGESTIONS_QUERY, formatPrice } from "@/lib/shopify";

interface Suggestion {
  id: string;
  title: string;
  handle: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
}

export function SearchBox({ onNavigate, autoFocus = false }: { onNavigate?: () => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const query = `title:*${term}* OR product_type:*${term}* OR tag:*${term}* OR variants.option_value:*${term}*`;
        const data = await storefrontApiRequest(SEARCH_SUGGESTIONS_QUERY, { query });
        const list = (data?.data?.products?.edges ?? []).map((e: { node: Suggestion }) => e.node);
        setResults(list);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submit = () => {
    if (!q.trim()) return;
    setOpen(false);
    onNavigate?.();
    navigate({ to: "/colecao", search: { c: q.trim() } });
  };

  return (
    <div ref={ref} className="relative w-full">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-muted-foreground"
      >
        <Search className="h-4 w-4 shrink-0" />
        <input
          autoFocus={autoFocus}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nome, cor, categoria..."
          className="bg-transparent flex-1 text-sm outline-none min-w-0 text-foreground placeholder:text-muted-foreground"
        />
      </form>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {loading && <div className="px-4 py-3 text-xs text-muted-foreground">Buscando...</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">Nenhum resultado para "{q}"</div>
          )}
          {results.map((p) => {
            const img = p.images.edges[0]?.node;
            return (
              <Link
                key={p.id}
                to="/produto/$handle"
                params={{ handle: p.handle }}
                onClick={() => { setOpen(false); onNavigate?.(); }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-secondary"
              >
                {img && <img src={img.url} alt={img.altText ?? p.title} className="h-12 w-12 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1 text-foreground">{p.title}</p>
                  <p className="text-xs text-primary">
                    {formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode)}
                  </p>
                </div>
              </Link>
            );
          })}
          {results.length > 0 && (
            <button onClick={submit} className="w-full text-center text-xs font-semibold py-2.5 bg-secondary hover:bg-secondary/70">
              Ver todos os resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}
