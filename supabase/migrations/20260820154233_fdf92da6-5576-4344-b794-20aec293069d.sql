DROP POLICY IF EXISTS "Anyone can update their own abandoned cart by email/phone" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Anyone can insert abandoned carts" ON public.abandoned_carts;

REVOKE INSERT, UPDATE ON public.abandoned_carts FROM anon, authenticated;
GRANT SELECT ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_abandoned_cart(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email TEXT := lower(nullif(trim(payload->>'customer_email'), ''));
  v_phone TEXT := nullif(regexp_replace(coalesce(payload->>'customer_phone',''), '\D', '', 'g'), '');
  v_name  TEXT := left(coalesce(nullif(trim(payload->>'customer_name'), ''), ''), 120);
  v_cart  JSONB := coalesce(payload->'cart_data', '[]'::jsonb);
  v_id UUID;
BEGIN
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'missing_identifier';
  END IF;
  IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF length(v_cart::text) > 100000 THEN
    RAISE EXCEPTION 'cart_too_large';
  END IF;

  SELECT id INTO v_id
  FROM public.abandoned_carts
  WHERE recovered_at IS NULL
    AND order_id IS NULL
    AND created_at > now() - interval '1 day'
    AND (
      (v_email IS NOT NULL AND lower(customer_email) = v_email)
      OR (v_phone IS NOT NULL AND regexp_replace(coalesce(customer_phone,''), '\D', '', 'g') = v_phone)
    )
  ORDER BY last_updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.abandoned_carts (
      customer_name, customer_email, customer_phone, cart_data,
      subtotal, shipping_cost, discount, total, last_updated_at
    ) VALUES (
      nullif(v_name, ''), v_email, nullif(payload->>'customer_phone',''), v_cart,
      coalesce((payload->>'subtotal')::numeric, 0),
      coalesce((payload->>'shipping_cost')::numeric, 0),
      coalesce((payload->>'discount')::numeric, 0),
      coalesce((payload->>'total')::numeric, 0),
      now()
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.abandoned_carts SET
      customer_name = coalesce(nullif(v_name, ''), customer_name),
      customer_email = coalesce(v_email, customer_email),
      customer_phone = coalesce(nullif(payload->>'customer_phone',''), customer_phone),
      cart_data = v_cart,
      subtotal = coalesce((payload->>'subtotal')::numeric, subtotal),
      shipping_cost = coalesce((payload->>'shipping_cost')::numeric, shipping_cost),
      discount = coalesce((payload->>'discount')::numeric, discount),
      total = coalesce((payload->>'total')::numeric, total),
      last_updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_abandoned_cart(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_cart(jsonb) TO anon, authenticated, service_role;