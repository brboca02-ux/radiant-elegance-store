import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Upload, Camera, Loader2, Check, ArrowLeft } from "lucide-react";
import { AdminShell, PRODUCTS_TABS } from "@/components/AdminShell";
import { analyzeProductImage, type AnalyzedProduct } from "@/lib/api/analyzeProduct.functions";
import { uploadProductImage } from "@/lib/api/supaProducts";
import { useProductsStore, slugify, SIZES } from "@/stores/productsStore";
import { buildSizeVariants } from "@/lib/products/variantSizes";

export const Route = createFileRoute("/produtos/rapido")({
  head: () => ({
    meta: [
      { title: "Cadastro Rápido com IA — MD Modas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: QuickAddPage,
});

type VariantMode = "sizes" | "color" | "unico";

function QuickAddPage() {
  const navigate = useNavigate();
  const createProduct = useProductsStore((s) => s.create);
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<AnalyzedProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const [price, setPrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [stock, setStock] = useState<string>("10");
  const [mode, setMode] = useState<VariantMode>("sizes");

  async function handlePick(f: File | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB).");
      return;
    }
    setFile(f);
    setAnalyzed(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ""));
    reader.readAsDataURL(f);
  }

  async function handleAnalyze() {
    if (!preview) {
      toast.error("Envie uma foto primeiro.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeProductImage({ data: { imageDataUrl: preview } });
      setAnalyzed(result);
      toast.success("Foto analisada! Confira os dados e ajuste se preciso.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  function updateAnalyzed<K extends keyof AnalyzedProduct>(k: K, v: AnalyzedProduct[K]) {
    if (!analyzed) return;
    setAnalyzed({ ...analyzed, [k]: v });
  }

  async function handleSave() {
    if (!file || !analyzed) return;
    const priceNum = Number(price.replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }
    const salePriceNum = salePrice ? Number(salePrice.replace(",", ".")) : null;
    const stockNum = Math.max(0, Math.floor(Number(stock) || 0));

    setSaving(true);
    try {
      const url = await uploadProductImage(file);
      const slug = slugify(analyzed.name) + "-" + Date.now().toString(36);

      const variants = buildVariants(mode, stockNum, analyzed.color, analyzed.sizes_suggested);

      await createProduct({
        name: analyzed.name,
        slug,
        description: analyzed.description,
        category_id: analyzed.category_id,
        brand: "MD Modas",
        sku: "",
        price: priceNum,
        sale_price: salePriceNum && salePriceNum > 0 && salePriceNum < priceNum ? salePriceNum : null,
        stock: stockNum,
        reserved_stock: 0,
        minimum_stock: 5,
        track_stock: true,
        weight: 0.3,
        status: "ativo",
        meta_title: analyzed.meta_title,
        meta_description: analyzed.meta_description,
        images: [
          {
            id: "temp",
            product_id: "temp",
            url,
            position: 0,
            is_primary: true,
          },
        ],
        variants,
      });

      toast.success("Produto cadastrado com sucesso!");
      navigate({ to: "/produtos" });
    } catch (e) {
      toast.error("Não foi possível cadastrar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell active="produtos" tabs={PRODUCTS_TABS}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link to="/produtos" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar para produtos
            </Link>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Cadastro rápido com IA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Envie a foto, a IA identifica a peça e preenche nome, descrição e categoria. Você só confirma preço, estoque e variações.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Foto + IA */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">1. Foto do produto</p>

            <div className="aspect-[3/4] w-full rounded-xl border border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Prévia" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground text-xs p-6">
                  Nenhuma foto ainda.
                  <br />
                  Envie do computador ou tire pelo celular.
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <Upload className="h-4 w-4" />
                Enviar
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <Camera className="h-4 w-4" />
                Câmera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!preview || analyzing}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? "Analisando com IA..." : analyzed ? "Reanalisar foto" : "Analisar com IA"}
            </button>
          </div>

          {/* Dados sugeridos + confirmação */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">2. Dados sugeridos pela IA</p>

            {!analyzed ? (
              <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground p-8 border border-dashed border-border rounded-xl">
                Assim que você analisar a foto, os campos aparecem aqui para revisão.
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Nome" value={analyzed.name} onChange={(v) => updateAnalyzed("name", v)} />
                <Field label="Descrição" value={analyzed.description} onChange={(v) => updateAnalyzed("description", v)} textarea />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Categoria"
                    value={analyzed.category_id}
                    onChange={(v) => updateAnalyzed("category_id", v as AnalyzedProduct["category_id"])}
                    options={[
                      { v: "feminino", l: "Feminino" },
                      { v: "masculino", l: "Masculino" },
                      { v: "infantil", l: "Infantil" },
                      { v: "calcados", l: "Calçados" },
                      { v: "vestidos", l: "Vestidos" },
                      { v: "conjuntos", l: "Conjuntos" },
                      { v: "plus-size", l: "Plus Size" },
                    ]}
                  />
                  <Field label="Cor detectada" value={analyzed.color} onChange={(v) => updateAnalyzed("color", v)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preço + estoque + variações */}
        <div className="mt-6 rounded-2xl border border-border bg-background p-5">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">3. Preço, estoque e variações</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Preço (R$)" value={price} onChange={setPrice} type="number" placeholder="0,00" />
            <Field label="Preço promocional (opcional)" value={salePrice} onChange={setSalePrice} type="number" placeholder="0,00" />
            <Field label="Estoque total" value={stock} onChange={setStock} type="number" />
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Como criar as variações</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ModeCard
                active={mode === "sizes"}
                onClick={() => setMode("sizes")}
                title="Tamanhos sugeridos"
                desc={
                  analyzed?.sizes_suggested?.length
                    ? `Cria ${analyzed.sizes_suggested.join(", ")} com a cor detectada. Estoque dividido igualmente.`
                    : "A IA sugere os tamanhos conforme o tipo da peça (ex: 38, 40, 42 para calças). Estoque dividido igualmente."
                }
              />
              <ModeCard
                active={mode === "color"}
                onClick={() => setMode("color")}
                title="Só cor detectada"
                desc="Uma única variação com a cor identificada pela IA."
              />
              <ModeCard
                active={mode === "unico"}
                onClick={() => setMode("unico")}
                title="Único"
                desc="Uma variação 'Único' com todo o estoque."
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!analyzed || saving}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Cadastrando..." : "Cadastrar produto"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function buildVariants(mode: VariantMode, stockTotal: number, color: string, suggested?: string[]) {
  const c = color || "Único";
  if (mode === "sizes") {
    const sizes = suggested && suggested.length ? suggested : (SIZES as readonly string[]);
    return buildSizeVariants(sizes, stockTotal, c);
  }
  if (mode === "color") {
    return [{ id: "tmp-0", product_id: "temp", size: "Único", color: c, stock: stockTotal }];
  }
  return [{ id: "tmp-0", product_id: "temp", size: "Único", color: "Único", stock: stockTotal }];
}


function Field({
  label,
  value,
  onChange,
  textarea,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition ${
        active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{desc}</div>
    </button>
  );
}
