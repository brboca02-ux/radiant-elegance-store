import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, Megaphone, Settings, Store, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type MenuKey = "dashboard" | "produtos" | "pedidos" | "clientes" | "marketing" | "configuracoes";

const MENU: { key: MenuKey; label: string; to: string; icon: typeof LayoutDashboard; match: string[] }[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
  { key: "produtos", label: "Produtos", to: "/produtos", icon: Package, match: ["/produtos", "/categorias", "/estoque"] },
  { key: "pedidos", label: "Pedidos", to: "/pedidos", icon: ShoppingBag, match: ["/pedidos"] },
  { key: "clientes", label: "Clientes", to: "/clientes", icon: Users, match: ["/clientes"] },
  { key: "marketing", label: "Marketing", to: "/marketing", icon: Megaphone, match: ["/marketing"] },
  { key: "configuracoes", label: "Configurações", to: "/admin", icon: Settings, match: ["/admin"] },
];

export type AdminTab = { label: string; to: string };

export function AdminShell({
  active,
  tabs,
  children,
}: {
  active: MenuKey;
  tabs?: AdminTab[];
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [loading, session, navigate, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/login" });
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-background sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-display font-extrabold tracking-tight">
            <span className="text-primary">MD</span> Modas
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {MENU.map((m) => {
            const isActive = active === m.key;
            const Icon = m.icon;
            return (
              <Link
                key={m.key}
                to={m.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-medium text-foreground/70 hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
          <div className="text-[11px] text-muted-foreground truncate" title={session.user.email ?? ""}>
            {session.user.email}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setOpenMobile(true)}
          className="text-sm font-medium px-3 py-1.5 rounded-md border border-border"
        >
          Menu
        </button>
        <span className="font-display font-bold"><span className="text-primary">MD</span> Modas</span>
        <span className="w-12" />
      </div>

      {openMobile && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpenMobile(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-background shadow-2xl p-4">
            <div className="mb-4 font-display font-bold text-lg">
              <span className="text-primary">MD</span> Modas
            </div>
            <nav className="space-y-1">
              {MENU.map((m) => {
                const isActive = active === m.key;
                const Icon = m.icon;
                return (
                  <Link
                    key={m.key}
                    to={m.to}
                    onClick={() => setOpenMobile(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        {tabs && tabs.length > 0 && (
          <div className="sticky top-14 lg:top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((t) => {
                  const isActive = pathname === t.to || pathname.startsWith(t.to + "/");
                  return (
                    <Link
                      key={t.to}
                      to={t.to}
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export const PRODUCTS_TABS: AdminTab[] = [
  { label: "Produtos", to: "/produtos" },
  { label: "Categorias", to: "/categorias" },
  { label: "Estoque", to: "/estoque" },
];

export const MARKETING_TABS: AdminTab[] = [
  { label: "Leads", to: "/marketing" },
  { label: "Cupons", to: "/marketing" },
  { label: "Newsletter", to: "/marketing" },
];
