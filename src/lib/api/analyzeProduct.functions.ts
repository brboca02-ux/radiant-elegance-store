import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DetectedColor = { name: string; hex: string };

export type AnalyzedProduct = {
  name: string;
  description: string;
  category_id: "feminino" | "masculino" | "infantil" | "calcados" | "vestidos" | "conjuntos" | "plus-size";
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
  "color": "cor predominante em português (ex: Preto, Off-White, Verde-Militar)",
  "meta_title": "Título SEO em português (máx 60 caracteres)",
  "meta_description": "Descrição SEO em português (máx 155 caracteres)"
}
Regras de categoria: peças infantis → "infantil"; sapatos/tênis/sandálias/botas → "calcados"; vestidos femininos → "vestidos"; conjuntos coordenados → "conjuntos"; peças plus size explícitas → "plus-size"; demais femininas → "feminino"; masculinas → "masculino".`;

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
    let parsed: Partial<AnalyzedProduct>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }

    const category = (CATEGORIES.includes(parsed.category_id ?? "") ? parsed.category_id : "feminino") as AnalyzedProduct["category_id"];
    return {
      name: (parsed.name ?? "").toString().slice(0, 80) || "Produto MD Modas",
      description: (parsed.description ?? "").toString(),
      category_id: category,
      color: (parsed.color ?? "Único").toString().slice(0, 40) || "Único",
      meta_title: (parsed.meta_title ?? parsed.name ?? "").toString().slice(0, 70),
      meta_description: (parsed.meta_description ?? parsed.description ?? "").toString().slice(0, 170),
    };
  });
