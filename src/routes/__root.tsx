import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { LeadPopup } from "@/components/LeadPopup";
import { useCartSync } from "@/hooks/useCartSync";
import { useHydrateStores } from "@/hooks/useHydrateStores";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl">404</h1>
        <span className="gold-rule mt-6 inline-block" />
        <p className="mt-6 text-sm text-muted-foreground">Esta página não existe ou foi movida.</p>
        <div className="mt-8">
          <Link to="/" className="inline-block bg-foreground text-background px-8 py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85 transition">
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Algo deu errado</h1>
        <p className="mt-3 text-sm text-muted-foreground">Tente novamente em instantes.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-block bg-foreground text-background px-8 py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MD Modas — Moda Feminina e Masculina" },
      { name: "description", content: "MD Modas: moda feminina e masculina para todas as ocasiões. Vestidos, conjuntos, plus size e novidades toda semana." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MD Modas" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@mdmodas" },
      { name: "theme-color", content: "#E500A4" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: "MD Modas — Moda Feminina e Masculina" },
      { name: "twitter:title", content: "MD Modas — Moda Feminina e Masculina" },
      { property: "og:description", content: "MD Modas: moda feminina e masculina para todas as ocasiões. Vestidos, conjuntos, plus size e novidades toda semana." },
      { name: "twitter:description", content: "MD Modas: moda feminina e masculina para todas as ocasiões. Vestidos, conjuntos, plus size e novidades toda semana." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9cb6d142-24f3-48de-a281-08feb761ef0b" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9cb6d142-24f3-48de-a281-08feb761ef0b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "MD Modas",
  image: "/og-image.jpg",
  "@id": "https://md-modas.lovable.app/#store",
  url: "/",
  telephone: "+55 47 0000-0000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Santa Luzia, 672 - Aventureiro",
    addressLocality: "Joinville",
    addressRegion: "SC",
    postalCode: "89225-100",
    addressCountry: "BR",
  },
  areaServed: "Joinville e região",
  openingHours: "Mo-Sa 09:00-18:00",
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');` }} />
          </>
        )}
        {META_PIXEL_ID && (
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');` }} />
        )}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  useCartSync();
  useHydrateStores();
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <LeadPopup />
      <Toaster position="top-center" />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
