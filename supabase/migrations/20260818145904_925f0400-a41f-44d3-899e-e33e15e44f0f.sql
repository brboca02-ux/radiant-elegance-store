-- Harden attach_order_payment: only allow first-time attachment on pending orders,
-- validate provider and URL, and stop callers overwriting existing payment data.
CREATE OR REPLACE FUNCTION public.attach_order_payment(
  p_order_id UUID,
  p_provider TEXT,
  p_payment_id TEXT,
  p_payment_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_provider IS NULL OR p_provider NOT IN ('mercadopago','stripe','infinitepay','manual') THEN
    RAISE EXCEPTION 'invalid_provider';
  END IF;
  IF p_payment_id IS NULL OR length(trim(p_payment_id)) = 0 OR length(p_payment_id) > 128 THEN
    RAISE EXCEPTION 'invalid_payment_id';
  END IF;
  IF p_payment_url IS NOT NULL AND p_payment_url <> '' AND p_payment_url !~ '^https://[A-Za-z0-9.-]+\.(mercadopago|mercadolibre|stripe|infinitepay)\.[A-Za-z./?=&%_-]*' THEN
    RAISE EXCEPTION 'invalid_payment_url';
  END IF;

  UPDATE public.orders SET
    payment_provider = p_provider,
    payment_id = p_payment_id,
    payment_url = NULLIF(p_payment_url, '')
  WHERE id = p_order_id
    AND status = 'aguardando_pagamento'
    AND payment_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_order_payment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_order_payment(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- has_role stays admin-check helper; keep it out of anon reach
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- fulfillment stays authenticated-only (function itself enforces admin)
REVOKE ALL ON FUNCTION public.set_order_fulfillment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_fulfillment(uuid, text) TO authenticated, service_role;

-- trigger-only function must not be callable from the API
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;