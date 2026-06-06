import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — MD Modas" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  return (
    <AdminShell active="clientes">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Base</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Lista de compradores e contatos da loja</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-10 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda. Os clientes aparecerão aqui automaticamente após o primeiro pedido.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
