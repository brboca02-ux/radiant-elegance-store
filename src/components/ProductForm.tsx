import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Star, StarOff, Upload, GripVertical, X, Plus, Loader2, Sparkles, Check } from "lucide-react";
import {
  useProductsStore, CATEGORIES, SIZES, emptyProduct, slugify,
  type Product, type ProductImage, type ProductVariant, type ProductStatus,
} from "@/stores/productsStore";
import { uploadProductImage } from "@/lib/api/supaProducts";
import { analyzeProductImage, type DetectedColor } from "@/lib/api/analyzeProduct.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const uid = () => Math.random().toString(36).slice(2, 10);

export function ProductForm({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const existing = useProductsStore((s) => (productId ? s.products.find((p) => p.id === productId) : undefined));
  const create = useProductsStore((s) => s.create);
  const update = useProductsStore((s) => s.update);

  const [data, setData] = useState<Omit<Product, "id" | "store_id" | "created_at">>(() =>
    existing
      ? {
          name: existing.name, slug: existing.slug, description: existing.description,
          category_id: existing.category_id, brand: existing.brand, sku: existing.sku,
          price: existing.price, sale_price: existing.sale_price, stock: existing.stock,
          reserved_stock: existing.reserved_stock ?? 0,
          minimum_stock: existing.minimum_stock ?? 5,
          track_stock: existing.track_stock ?? true,
          weight: existing.weight, status: existing.status,
          meta_title: existing.meta_title, meta_description: existing.meta_description,
          images: existing.images, variants: existing.variants,
        }
      : emptyProduct(),
  );

  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData((d) => ({ ...d, [k]: v }));

  // Auto-slug while creating new
  useEffect(() => {
    if (!existing && data.name && !data.slug) set("slug", slugify(data.name));
  }, [data.name]); // eslint-disable-line

  // ---------- Images ----------
  const dragIdx = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setUploading(true);
    try {
      const urls = await Promise.all(arr.map((f) => uploadProductImage(f)));
      setData((d) => {
        const next = [...d.images];
        urls.forEach((url) => {
          next.push({
            id: uid(), product_id: productId ?? "new", url,
            position: next.length, is_primary: next.length === 0,
          });
        });
        return { ...d, images: next };
      });
    } catch (e) {
      toast.error("Falha no upload: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => setData((d) => {
    const next = d.images.filter((i) => i.id !== id).map((i, idx) => ({ ...i, position: idx }));
    if (next.length && !next.some((i) => i.is_primary)) next[0].is_primary = true;
    return { ...d, images: next };
  });

  const setPrimary = (id: string) => setData((d) => ({
    ...d, images: d.images.map((i) => ({ ...i, is_primary: i.id === id })),
  }));

  const reorder = (from: number, to: number) => setData((d) => {
    const next = [...d.images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return { ...d, images: next.map((i, idx) => ({ ...i, position: idx })) };
  });

  // ---------- Variants ----------
  const addVariant = () => setData((d) => ({
    ...d, variants: [...d.variants, { id: uid(), product_id: productId ?? "new", size: "M", color: "", stock: 0 }],
  }));
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => setData((d) => ({
    ...d, variants: d.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  }));
  const removeVariant = (id: string) => setData((d) => ({ ...d, variants: d.variants.filter((v) => v.id !== id) }));

  // ---------- AI variant suggestion ----------
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiColors, setAiColors] = useState<DetectedColor[]>([]);
  const [aiSizesSuggested, setAiSizesSuggested] = useState<string[]>([]);
  const [selColors, setSelColors] = useState<Set<string>>(new Set());
  const [selSizes, setSelSizes] = useState<Set<string>>(new Set());
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [perStock, setPerStock] = useState<number>(5);

  const openAiSuggest = async () => {
    const primary = data.images.find((i) => i.is_primary) ?? data.images[0];
    if (!primary) {
      toast.error("Envie ao menos uma imagem antes de usar a IA.");
      return;
    }
    setAiLoading(true);
    setAiOpen(true);
    try {
      // Convert to data URL so any bucket (public or signed) works.
      const resp = await fetch(primary.url);
      const blob = await resp.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ""));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      const result = await analyzeProductImage({ data: { imageDataUrl: dataUrl } });
      const colors = result.colors.length ? result.colors : [{ name: result.color, hex: "" }];
      setAiColors(colors);
      setAiSizesSuggested(result.sizes_suggested);
      setSelColors(new Set(colors.map((c) => c.name)));
      setSelSizes(new Set(result.sizes_suggested));
    } catch (e) {
      toast.error((e as Error).message);
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    setter(next);
  };

  const addCustomColor = () => {
    const name = customColor.trim();
    if (!name) return;
    if (!aiColors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setAiColors((c) => [...c, { name, hex: "" }]);
    }
    setSelColors((s) => new Set(s).add(name));
    setCustomColor("");
  };

  const addCustomSize = () => {
    const s = customSize.trim().toUpperCase();
    if (!s) return;
    if (!aiSizesSuggested.includes(s)) setAiSizesSuggested((arr) => [...arr, s]);
    setSelSizes((set) => new Set(set).add(s));
    setCustomSize("");
  };

  const applyAiVariants = () => {
    const cols = [...selColors];
    const szs = [...selSizes];
    if (cols.length === 0 || szs.length === 0) {
      toast.error("Selecione ao menos uma cor e um tamanho.");
      return;
    }
    const variants: ProductVariant[] = [];
    cols.forEach((c) => {
      szs.forEach((s) => {
        variants.push({
          id: uid(),
          product_id: productId ?? "new",
          size: s,
          color: c,
          stock: Math.max(0, Math.floor(perStock) || 0),
        });
      });
    });
    setData((d) => ({ ...d, variants }));
    setAiOpen(false);
    toast.success(`${variants.length} variações criadas`);
  };

  // ---------- Save ----------
  const save = async () => {
    if (!data.name.trim()) return toast.error("Informe o nome do produto.");
    if (data.price <= 0) return toast.error("Informe um preço válido.");
    const payload = { ...data, slug: data.slug || slugify(data.name) };
    setSaving(true);
    try {
      if (existing) {
        await update(existing.id, payload);
        toast.success("Produto atualizado");
      } else {
        await create(payload);
        toast.success("Produto criado");
      }
      navigate({ to: "/produtos" });
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar para produtos
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {existing ? "Editar" : "Novo"}
            </p>
            <h1 className="font-display text-3xl tracking-tight mt-1">
              {existing ? existing.name : "Cadastrar Produto"}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate({ to: "/produtos" })}
              className="rounded-lg border border-border px-4 py-2.5 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/85 disabled:opacity-60">
              {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {existing ? "Salvar alterações" : "Criar produto"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basics */}
            <Card title="Informações Básicas">
              <Field label="Nome">
                <input value={data.name} onChange={(e) => set("name", e.target.value)} className={input} />
              </Field>
              <Field label="Descrição">
                <textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={4} className={input} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Categoria">
                  <select value={data.category_id} onChange={(e) => set("category_id", e.target.value)} className={input}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Marca">
                  <input value={data.brand} onChange={(e) => set("brand", e.target.value)} className={input} />
                </Field>
                <Field label="SKU">
                  <input value={data.sku} onChange={(e) => set("sku", e.target.value)} className={input} />
                </Field>
                <Field label="Status">
                  <select value={data.status} onChange={(e) => set("status", e.target.value as ProductStatus)} className={input}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Preço (R$)">
                  <input type="number" step="0.01" value={data.price} onChange={(e) => set("price", Number(e.target.value))} className={input} />
                </Field>
                <Field label="Preço Promocional">
                  <input type="number" step="0.01" value={data.sale_price ?? ""} onChange={(e) => set("sale_price", e.target.value ? Number(e.target.value) : null)} className={input} />
                </Field>
                <Field label="Estoque">
                  <input type="number" value={data.stock} onChange={(e) => set("stock", Number(e.target.value))} className={input} />
                </Field>
                <Field label="Peso (kg)">
                  <input type="number" step="0.01" value={data.weight} onChange={(e) => set("weight", Number(e.target.value))} className={input} />
                </Field>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                <Field label="Estoque mínimo">
                  <input type="number" min={0} value={data.minimum_stock}
                    onChange={(e) => set("minimum_stock", Number(e.target.value))} className={input} />
                </Field>
                <Field label="Estoque reservado">
                  <input type="number" min={0} value={data.reserved_stock}
                    onChange={(e) => set("reserved_stock", Number(e.target.value))} className={input} />
                </Field>
                <label className="flex items-end gap-2 pb-1.5">
                  <input type="checkbox" checked={data.track_stock}
                    onChange={(e) => set("track_stock", e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm">Controlar estoque</span>
                </label>
              </div>
            </Card>

            {/* Images */}
            <Card title="Imagens" hint="Proporção recomendada: 4:5. Arraste para reordenar.">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/30"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Arraste imagens ou clique para selecionar</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)} />
              </label>

              {data.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {data.images.map((img, idx) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => (dragIdx.current = idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx.current !== null) reorder(dragIdx.current, idx); dragIdx.current = null; }}
                      className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted group ring-1 ring-border"
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      {img.is_primary && (
                        <span className="absolute top-1 left-1 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded">Principal</span>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={(e) => { e.preventDefault(); setPrimary(img.id); }}
                          className="bg-background/90 rounded p-1" title="Definir principal">
                          {img.is_primary ? <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> : <StarOff className="h-3 w-3" />}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); removeImage(img.id); }}
                          className="bg-background/90 rounded p-1 text-destructive" title="Remover">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 bg-background/90 rounded p-0.5 cursor-grab"><GripVertical className="h-3 w-3" /></span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Variants */}
            <Card title="Variações" hint="Controle estoque por tamanho e cor.">
              <div className="-mt-2 mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openAiSuggest}
                  disabled={aiLoading || data.images.length === 0}
                  title={data.images.length === 0 ? "Envie uma imagem primeiro" : "Detectar cores e sugerir tamanhos com IA"}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 text-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/10 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Detectar cores e tamanhos com IA
                </button>
                <span className="text-[11px] text-muted-foreground">
                  Só clicar, marcar tamanhos e confirmar cores.
                </span>
              </div>
              <div className="space-y-2">
                {data.variants.map((v) => (
                  <div key={v.id} className="grid grid-cols-12 gap-2 items-center">
                    <select value={v.size} onChange={(e) => updateVariant(v.id, { size: e.target.value })}
                      className={`${input} col-span-3`}>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      {!SIZES.includes(v.size as typeof SIZES[number]) && v.size && (
                        <option value={v.size}>{v.size}</option>
                      )}
                    </select>
                    <input placeholder="Cor (livre)" value={v.color} onChange={(e) => updateVariant(v.id, { color: e.target.value })}
                      className={`${input} col-span-5`} />
                    <input type="number" placeholder="Estoque" value={v.stock} onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) })}
                      className={`${input} col-span-3`} />
                    <button onClick={() => removeVariant(v.id)} className="col-span-1 rounded p-2 hover:bg-muted text-destructive" title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {data.variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma variação cadastrada.</p>
                )}
              </div>
              <button onClick={addVariant} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <Plus className="h-4 w-4" /> Adicionar variação
              </button>
            </Card>
          </div>

          {/* Sidebar: SEO */}
          <div className="space-y-6">
            <Card title="SEO">
              <Field label="Slug">
                <input value={data.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={input} placeholder="vestido-aurora" />
              </Field>
              <Field label="Meta Title">
                <input value={data.meta_title} onChange={(e) => set("meta_title", e.target.value)} className={input} maxLength={60} />
                <p className="text-[11px] text-muted-foreground mt-1">{data.meta_title.length}/60</p>
              </Field>
              <Field label="Meta Description">
                <textarea value={data.meta_description} onChange={(e) => set("meta_description", e.target.value)} rows={3} className={input} maxLength={160} />
                <p className="text-[11px] text-muted-foreground mt-1">{data.meta_description.length}/160</p>
              </Field>
            </Card>

            <p className="text-xs text-muted-foreground">
              Multiempresa: registros serão salvos com <code className="font-mono">store_id</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Re-export type for routes if needed
export type { ProductImage };
