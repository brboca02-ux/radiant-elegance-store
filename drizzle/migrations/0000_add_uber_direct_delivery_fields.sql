ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS uber_quote_id text,
  ADD COLUMN IF NOT EXISTS uber_quote_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS uber_delivery_id text,
  ADD COLUMN IF NOT EXISTS uber_delivery_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS uber_delivery_status text,
  ADD COLUMN IF NOT EXISTS uber_tracking_url text,
  ADD COLUMN IF NOT EXISTS uber_pickup_eta timestamptz,
  ADD COLUMN IF NOT EXISTS uber_dropoff_eta timestamptz,
  ADD COLUMN IF NOT EXISTS uber_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS uber_failure_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_uber_delivery_id_idx
  ON public.orders (uber_delivery_id)
  WHERE uber_delivery_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.attach_order_uber_quote(
  p_order_id uuid,
  p_order_number text,
  p_email text,
  p_quote_id text,
  p_quote_expires_at timestamptz,
  p_fee numeric,
  p_dropoff_eta timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quote_id IS NULL OR length(trim(p_quote_id)) = 0 OR p_fee IS NULL OR p_fee < 0 THEN
    RAISE EXCEPTION 'invalid_uber_quote';
  END IF;

  UPDATE public.orders o
  SET uber_quote_id = p_quote_id,
      uber_quote_expires_at = p_quote_expires_at,
      uber_delivery_fee = p_fee,
      uber_delivery_status = 'quoted',
      uber_dropoff_eta = p_dropoff_eta,
      uber_updated_at = now(),
      uber_failure_reason = NULL
  FROM public.customers c
  WHERE o.id = p_order_id
    AND o.order_number = p_order_number
    AND o.customer_id = c.id
    AND lower(c.email) = lower(trim(p_email))
    AND lower(coalesce(o.shipping_method, '')) LIKE '%uber%'
    AND abs(o.shipping_cost - p_fee) <= 0.01
    AND o.uber_delivery_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'uber_quote_order_mismatch';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_order_uber_quote(uuid,text,text,text,timestamptz,numeric,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_order_uber_quote(uuid,text,text,text,timestamptz,numeric,timestamptz) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_order_public(
  p_order_number text,
  p_email text
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'fulfillment_status', o.fulfillment_status,
    'fulfillment_history', o.fulfillment_history,
    'subtotal', o.subtotal,
    'shipping_cost', o.shipping_cost,
    'shipping_method', o.shipping_method,
    'discount', o.discount,
    'total', o.total,
    'payment_method', o.payment_method,
    'payment_url', o.payment_url,
    'tracking_code', o.tracking_code,
    'uber_delivery_status', o.uber_delivery_status,
    'uber_tracking_url', o.uber_tracking_url,
    'uber_pickup_eta', o.uber_pickup_eta,
    'uber_dropoff_eta', o.uber_dropoff_eta,
    'uber_updated_at', o.uber_updated_at,
    'created_at', o.created_at,
    'paid_at', o.paid_at,
    'address', to_jsonb(a.*) - 'id' - 'customer_id' - 'created_at',
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'product_name', i.product_name,
        'variant_size', i.variant_size,
        'variant_color', i.variant_color,
        'unit_price', i.unit_price,
        'quantity', i.quantity,
        'subtotal', i.subtotal
      ) ORDER BY i.id)
      FROM public.order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
  LEFT JOIN public.addresses a ON a.id = o.address_id
  WHERE o.order_number = p_order_number
    AND lower(c.email) = lower(p_email)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_public(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_public(text,text) TO anon, authenticated;