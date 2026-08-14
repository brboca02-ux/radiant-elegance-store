ALTER TABLE public.products ADD COLUMN showcase boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS products_showcase_idx ON public.products (showcase) WHERE showcase = true;