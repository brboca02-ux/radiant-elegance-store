import { createFileRoute } from "@tanstack/react-router";
import { CategoryForm } from "@/components/CategoryForm";

export const Route = createFileRoute("/categorias/novo")({
  head: () => ({ meta: [{ title: "Nova Categoria — MD Modas" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <CategoryForm />,
});
