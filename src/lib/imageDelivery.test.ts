import { describe, it, expect } from "vitest";
import { IMG_ROUTE_PREFIX, buildImageUrl, isServedImageUrl } from "./imageDelivery";

describe("entrega de imagens", () => {
  it("mantém o prefixo de rota que o banco já usa", () => {
    expect(IMG_ROUTE_PREFIX).toBe("/api/public/img/");
  });

  it("monta a URL a partir do caminho no storage", () => {
    expect(buildImageUrl("1788324105878-zoejom.webp")).toBe("/api/public/img/1788324105878-zoejom.webp");
    expect(buildImageUrl("/catalogo/foo.jpg")).toBe("/api/public/img/catalogo/foo.jpg");
  });

  it("reconhece URLs servíveis e rejeita caminhos soltos", () => {
    expect(isServedImageUrl("/api/public/img/a.webp")).toBe(true);
    expect(isServedImageUrl("/__l5e/assets-v1/x/hero.jpg")).toBe(true);
    expect(isServedImageUrl("https://cdn.shopify.com/a.jpg")).toBe(true);
    expect(isServedImageUrl("a.webp")).toBe(false);
  });
});
