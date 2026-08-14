DO $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_color text;
  v_hex text;
  v_size text;
  v_colors jsonb := '[
    {"c":"Marrom","h":"#5B3A32"},
    {"c":"Preto","h":"#111111"},
    {"c":"Branco","h":"#FFFFFF"},
    {"c":"Rosê","h":"#F6C0A8"},
    {"c":"Verde Menta","h":"#B7E4C7"}
  ]'::jsonb;
  v_el jsonb;
BEGIN
  INSERT INTO public.products (
    id, slug, name, description, category_id, brand, sku,
    price, sale_price, stock, minimum_stock, track_stock, weight,
    status, showcase, meta_title, meta_description
  ) VALUES (
    v_id, 'short-alfaiataria-feminino-com-cinto',
    'Short Alfaiataria Feminino com Cinto',
    'Short de alfaiataria feminino com cinto removível e fivela dourada, cintura alta e pregas frontais. Grade P ao GG. Cores: marrom, preto, branco, rosê e verde menta.' || chr(10) || chr(10) ||
    'Preços por quantidade:' || chr(10) ||
    '1 peça — R$ 59,90' || chr(10) ||
    '2 peças — R$ 110,00' || chr(10) ||
    '3 peças — R$ 150,00' || chr(10) ||
    '4 peças — R$ 190,00',
    'feminino', 'J&S Store', 'SHT-ALF-FEM',
    59.90, NULL, 200, 5, true, 0.35,
    'ativo', true,
    'Short Alfaiataria Feminino com Cinto — J&S Store',
    'Short de alfaiataria feminino com cinto e fivela dourada, P ao GG. Kits a partir de R$ 59,90 na J&S Store.'
  );

  FOR v_el IN SELECT * FROM jsonb_array_elements(v_colors) LOOP
    v_color := v_el->>'c';
    v_hex := v_el->>'h';
    FOREACH v_size IN ARRAY ARRAY['P','M','G','GG'] LOOP
      INSERT INTO public.product_variants (product_id, size, color, color_hex, stock)
      VALUES (v_id, v_size, v_color, v_hex, 10);
    END LOOP;
  END LOOP;

  INSERT INTO public.product_images (product_id, url, position, is_primary) VALUES
    (v_id, '/api/public/img/catalogo/short-alfaiataria-marrom.webp', 0, true),
    (v_id, '/api/public/img/catalogo/short-alfaiataria-marrom-2.webp', 1, false),
    (v_id, '/api/public/img/catalogo/short-alfaiataria-preto.webp', 2, false),
    (v_id, '/api/public/img/catalogo/short-alfaiataria-branco.webp', 3, false),
    (v_id, '/api/public/img/catalogo/short-alfaiataria-rose.webp', 4, false),
    (v_id, '/api/public/img/catalogo/short-alfaiataria-menta.webp', 5, false);
END $$;