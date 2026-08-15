CREATE TABLE IF NOT EXISTS public.site_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_config_public_read" ON public.site_config
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_config_admin_write" ON public.site_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.place_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := NULLIF(payload->>'user_id', '')::UUID;
  v_email TEXT := lower(trim(payload->'customer'->>'email'));
  v_name TEXT := trim(coalesce(payload->'customer'->>'name', ''));
  v_customer_id UUID;
  v_address_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_qty INTEGER;
  v_unit NUMERIC(10,2);
  v_line NUMERIC(10,2);
  v_subtotal NUMERIC(10,2) := 0;
  v_shipping NUMERIC(10,2) := coalesce((payload->>'shipping_cost')::NUMERIC, 0);
  v_variant RECORD;
  v_coupon_code TEXT := upper(trim(coalesce(payload->>'coupon_code', '')));
  v_coupon RECORD;
  v_discount NUMERIC(10,2) := 0;
BEGIN
  IF payload->'items' IS NULL OR jsonb_array_length(payload->'items') = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF v_name = '' THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  SELECT id INTO v_customer_id FROM public.customers WHERE lower(email) = v_email LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (user_id, name, email, phone, cpf)
    VALUES (v_user_id, v_name, v_email,
            NULLIF(payload->'customer'->>'phone', ''),
            NULLIF(payload->'customer'->>'cpf', ''))
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET
      name = v_name,
      phone = coalesce(NULLIF(payload->'customer'->>'phone', ''), phone),
      cpf = coalesce(NULLIF(payload->'customer'->>'cpf', ''), cpf),
      user_id = coalesce(v_user_id, user_id)
    WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.addresses (customer_id, cep, street, number, complement, district, city, state)
  VALUES (
    v_customer_id,
    coalesce(payload->'address'->>'cep', ''),
    coalesce(payload->'address'->>'street', ''),
    coalesce(payload->'address'->>'number', ''),
    NULLIF(payload->'address'->>'complement', ''),
    coalesce(payload->'address'->>'district', ''),
    coalesce(payload->'address'->>'city', ''),
    coalesce(payload->'address'->>'state', '')
  ) RETURNING id INTO v_address_id;

  v_order_number := 'JS-' || to_char(now(), 'YYYY') || '-' || nextval('public.order_number_seq');

  INSERT INTO public.orders (
    order_number, customer_id, address_id, status,
    subtotal, shipping_cost, discount, total,
    payment_method, shipping_method, notes, fulfillment_status, fulfillment_history
  ) VALUES (
    v_order_number, v_customer_id, v_address_id, 'aguardando_pagamento',
    0, v_shipping, 0, 0,
    NULLIF(payload->>'payment_method', ''),
    NULLIF(payload->>'shipping_method', ''),
    NULLIF(payload->>'notes', ''),
    'recebido',
    jsonb_build_array(jsonb_build_object('stage', 'recebido', 'from', NULL, 'at', now(), 'by', 'sistema'))
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_qty := greatest(1, coalesce((v_item->>'quantity')::INTEGER, 1));

    SELECT id, name, price, sale_price, stock, track_stock, status
      INTO v_product
      FROM public.products
      WHERE id = (v_item->>'product_id')::UUID
      FOR UPDATE;

    IF v_product.id IS NULL OR v_product.status = 'arquivado' THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    v_unit := coalesce(v_product.sale_price, v_product.price);
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;

    IF NULLIF(v_item->>'variant_size', '') IS NOT NULL THEN
      SELECT id, stock INTO v_variant
        FROM public.product_variants
        WHERE product_id = v_product.id
          AND size = v_item->>'variant_size'
          AND (NULLIF(v_item->>'variant_color', '') IS NULL OR color = v_item->>'variant_color')
        LIMIT 1
        FOR UPDATE;

      IF v_variant.id IS NOT NULL THEN
        IF v_product.track_stock AND v_variant.stock < v_qty THEN
          RAISE EXCEPTION 'insufficient_stock';
        END IF;
        UPDATE public.product_variants
          SET stock = greatest(0, stock - v_qty)
          WHERE id = v_variant.id;
      END IF;
    END IF;

    IF v_product.track_stock AND v_product.stock < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;
    IF v_product.track_stock THEN
      UPDATE public.products SET stock = greatest(0, stock - v_qty) WHERE id = v_product.id;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, variant_size, variant_color,
      unit_price, quantity, subtotal
    ) VALUES (
      v_order_id, v_product.id, v_product.name,
      NULLIF(v_item->>'variant_size', ''),
      NULLIF(v_item->>'variant_color', ''),
      v_unit, v_qty, v_line
    );

    -- registra a baixa de estoque no histórico
    IF v_product.track_stock THEN
      INSERT INTO public.stock_movements (
        product_id, product_name, type, quantity, reason, notes, user_id, user_name
      ) VALUES (
        v_product.id, v_product.name, 'saida', v_qty,
        'venda', 'Pedido ' || v_order_number, v_user_id, 'sistema'
      );
    END IF;
  END LOOP;

  -- cupom: valida, aplica desconto e conta o uso
  IF v_coupon_code <> '' THEN
    SELECT id, type, value, usage_limit, usage_count
      INTO v_coupon
      FROM public.coupons
      WHERE upper(code) = v_coupon_code
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
      LIMIT 1
      FOR UPDATE;

    IF v_coupon.id IS NOT NULL THEN
      IF v_coupon.type = 'percentage' THEN
        v_discount := round(v_subtotal * (v_coupon.value / 100.0), 2);
      ELSE
        v_discount := least(v_coupon.value, v_subtotal);
      END IF;
      UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  UPDATE public.orders
    SET subtotal = v_subtotal,
        discount = v_discount,
        total = greatest(0, v_subtotal - v_discount) + v_shipping
    WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', greatest(0, v_subtotal - v_discount) + v_shipping,
    'discount', v_discount
  );
END;
$function$;