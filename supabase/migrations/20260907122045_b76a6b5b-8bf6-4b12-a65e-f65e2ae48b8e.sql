-- Consolida as 3 camisas manga curta Ralph Lauren em um único produto
UPDATE public.product_images SET product_id = 'd45ae24f-306c-4d5d-ade5-a5643cd58cf8'
WHERE product_id IN ('3755f2bb-bf56-4d90-b76d-2ae11cdca045','6636411a-a90d-440d-aed4-03c956cc5412');

WITH ord AS (
  SELECT id, row_number() OVER (ORDER BY is_primary DESC, position, id) - 1 AS pos
  FROM public.product_images WHERE product_id = 'd45ae24f-306c-4d5d-ade5-a5643cd58cf8'
)
UPDATE public.product_images i SET position = o.pos, is_primary = (o.pos = 0)
FROM ord o WHERE i.id = o.id;

UPDATE public.product_variants SET product_id = 'd45ae24f-306c-4d5d-ade5-a5643cd58cf8'
WHERE product_id IN ('3755f2bb-bf56-4d90-b76d-2ae11cdca045','6636411a-a90d-440d-aed4-03c956cc5412');

DELETE FROM public.stock_movements WHERE product_id IN ('3755f2bb-bf56-4d90-b76d-2ae11cdca045','6636411a-a90d-440d-aed4-03c956cc5412');
DELETE FROM public.products WHERE id IN ('3755f2bb-bf56-4d90-b76d-2ae11cdca045','6636411a-a90d-440d-aed4-03c956cc5412');

UPDATE public.products p SET
  name = 'Camisa Manga Curta Masculina Ralph Lauren',
  slug = 'camisa-manga-curta-masculina-ralph-lauren',
  price = 159.90,
  status = 'ativo',
  meta_title = 'Camisa Manga Curta Masculina Ralph Lauren | J&S Store',
  meta_description = 'Camisa manga curta masculina Ralph Lauren nas cores branco, azul claro e cinza claro, tamanhos P ao GG.',
  stock = (SELECT COALESCE(SUM(GREATEST(v.stock,0)),0) FROM public.product_variants v WHERE v.product_id = p.id)
WHERE p.id = 'd45ae24f-306c-4d5d-ade5-a5643cd58cf8';

-- Sincronização ao vivo (realtime) para produtos, fotos e variações
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_images REPLICA IDENTITY FULL;
ALTER TABLE public.product_variants REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_images; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;