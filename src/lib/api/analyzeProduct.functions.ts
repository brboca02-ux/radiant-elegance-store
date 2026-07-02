import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DetectedColor = { name: string; hex: string };

export type AnalyzedProduct = {
  name: string;
  description: string;
  category_id: "feminino" | "masculino" | "infantil" | "calcados" | "vestidos" | "conjuntos" | "plus-size";
  piece_type: string;
  color: string;
  colors: DetectedColor[];
  sizes_suggested: string[];
  meta_title: string;
  meta_description: string;
};

const CATEGORIES = ["feminino", "masculino", "infantil", "calcados", "vestidos", "conjuntos", "plus-size"];

export const analyzeProductImage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20),
    }),
  )
  .handler(async ({ data }): Promise<AnalyzedProduct> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");

    const system = `Você é uma especialista em moda da loja MD Modas.
Analise a imagem do produto e responda APENAS com JSON puro (sem markdown, sem crase).
Formato exato:
{
  "name": "Nome curto e comercial em português (máx 60 caracteres)",
  "description": "Descrição vendedora em português com tecido, caimento e ocasião de uso (2-3 frases)",
  "category_id": "uma de: ${CATEGORIES.join(", ")}",
  "piece_type": "tipo específico da peça em português (ex: Vestido midi, Camiseta, Calça jeans, Blusa cropped, Tênis casual)",
  "color": "cor predominante em português (ex: Preto, Off-White, Verde-Militar)",
  "colors": [{"name": "nome da cor em português", "hex": "#rrggbb"}],
  "sizes_suggested": ["PP","P","M","G","GG"],
  "meta_title": "Título SEO em português (máx 60 caracteres)",
  "meta_description": "Descrição SEO em português (máx 155 caracteres)"
}
Regras:
- "colors": inclua APENAS as cores realmente visíveis na peça (1 a 4 cores), com hex real e nome curto em português.
- "sizes_suggested": tamanhos típicos para essa peça. Roupa adulta: ["PP","P","M","G","GG"]. Plus size: ["G","GG","XG","EXG"]. Infantil: ["2","4","6","8","10"]. Calçados femininos: ["34","35","36","37","38","39"]. Se for peça de tamanho único (bolsa, acessório), use ["Único"].
- "piece_type": nome específico da peça (2-4 palavras), sem cor nem marca.
- Categoria: peças infantis → "infantil"; sapatos/tênis/sandálias/botas → "calcados"; vestidos femininos → "vestidos"; conjuntos coordenados → "conjuntos"; peças plus size explícitas → "plus-size"; demais femininas → "feminino"; masculinas → "masculino".`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta peça e devolva o JSON." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha ao analisar imagem (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: Partial<AnalyzedProduct> & { colors?: unknown; sizes_suggested?: unknown };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }

    const category = (CATEGORIES.includes(parsed.category_id ?? "") ? parsed.category_id : "feminino") as AnalyzedProduct["category_id"];

    const hexRe = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;
    const rawColors = Array.isArray(parsed.colors) ? parsed.colors : [];
    const colors: DetectedColor[] = rawColors
      .map((c) => {
        const obj = c as { name?: unknown; hex?: unknown };
        const name = (obj?.name ?? "").toString().trim().slice(0, 30);
        const hex = (obj?.hex ?? "").toString().trim();
        return { name, hex: hexRe.test(hex) ? hex : "" };
      })
      .filter((c) => c.name)
      .slice(0, 5);
    if (colors.length === 0 && parsed.color) {
      colors.push({ name: parsed.color.toString().slice(0, 30), hex: "" });
    }

    const rawSizes = Array.isArray(parsed.sizes_suggested) ? parsed.sizes_suggested : [];
    const sizes_suggested = rawSizes
      .map((s) => String(s).trim().slice(0, 6))
      .filter(Boolean)
      .slice(0, 10);

    return {
      name: (parsed.name ?? "").toString().slice(0, 80) || "Produto MD Modas",
      description: (parsed.description ?? "").toString(),
      category_id: category,
      color: (parsed.color ?? colors[0]?.name ?? "Único").toString().slice(0, 40) || "Único",
      colors,
      sizes_suggested: sizes_suggested.length ? sizes_suggested : ["PP", "P", "M", "G", "GG"],
      meta_title: (parsed.meta_title ?? parsed.name ?? "").toString().slice(0, 70),
      meta_description: (parsed.meta_description ?? parsed.description ?? "").toString().slice(0, 170),
    };
  });
