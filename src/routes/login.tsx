import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Store } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — MD Modas Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: redirect ?? "/dashboard" });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
    setForgot(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border border-border rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-display font-extrabold text-xl tracking-tight">
            <span className="text-primary">MD</span> Modas
          </span>
        </div>
        <h1 className="text-center text-lg font-semibold mb-1">
          {forgot ? "Recuperar acesso" : "Entrar no painel"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          {forgot
            ? "Enviaremos um link para redefinir sua senha."
            : "Acesse com seu e-mail e senha de administrador."}
        </p>

        <form onSubmit={forgot ? handleForgot : handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              E-mail
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="mt-1"
              autoComplete="email"
            />
          </div>
          {!forgot && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Aguarde..." : forgot ? "Enviar link" : "Entrar"}
          </Button>
          <button
            type="button"
            onClick={() => setForgot((v) => !v)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition"
          >
            {forgot ? "← Voltar ao login" : "Esqueci minha senha"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Acesso restrito. Usuários são cadastrados pela administração.
        </p>
      </div>
    </div>
  );
}
