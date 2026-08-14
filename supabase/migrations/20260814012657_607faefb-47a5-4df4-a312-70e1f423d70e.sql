-- ============================================================
-- J&S Store — schema completo
-- ============================================================

-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- user_roles ----------
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuarios veem seus proprios papeis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam papeis"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Primeiro usuario cadastrado vira admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- ---------- categories ----------
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  show_home BOOLEAN NOT NULL DEFAULT true,
  show_menu BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias visiveis publicamente"
  ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam categorias"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- products ----------
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'J&S Store',
  sku TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  track_stock BOOLEAN NOT NULL DEFAULT true,
  weight NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products (category_id);
CREATE INDEX products_status_idx ON public.products (status);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos visiveis publicamente"
  ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam produtos"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- product_variants ----------
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  color_hex TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants (product_id);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variantes visiveis publicamente"
  ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam variantes"
  ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- product_images ----------
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product_idx ON public.product_images (product_id);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Imagens visiveis publicamente"
  ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam imagens"
  ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- stock_movements ----------
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_idx ON public.stock_movements (product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam movimentacoes"
  ON public.stock_movements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- customers ----------
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_email_idx ON public.customers (lower(email));
CREATE INDEX customers_user_idx ON public.customers (user_id);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes veem seus dados"
  ON public.customers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam clientes"
  ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- addresses ----------
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  cep TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  number TEXT NOT NULL DEFAULT '',
  complement TEXT,
  district TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX addresses_customer_idx ON public.addresses (customer_id);
GRANT SELECT, INSERT, UPDATE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes veem seus enderecos"
  ON public.addresses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Admins gerenciam enderecos"
  ON public.addresses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- orders ----------
CREATE SEQUENCE public.order_number_seq START 1000;

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_provider TEXT,
  payment_id TEXT,
  payment_url TEXT,
  shipping_method TEXT,
  tracking_code TEXT,
  notes TEXT,
  fulfillment_status TEXT,
  fulfillment_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX orders_customer_idx ON public.orders (customer_id);
CREATE INDEX orders_created_idx ON public.orders (created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes veem seus pedidos"
  ON public.orders FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Admins gerenciam pedidos"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- order_items ----------
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  variant_size TEXT,
  variant_color TEXT,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes veem itens dos seus pedidos"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = order_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins gerenciam itens"
  ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RPC: place_order (SECURITY DEFINER, recalcula tudo no servidor)
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- cliente (reaproveita por e-mail)
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

  -- endereço
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

    -- valida/decrementa estoque por variante quando informada
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
  END LOOP;

  UPDATE public.orders
    SET subtotal = v_subtotal, total = v_subtotal + v_shipping
    WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', v_subtotal + v_shipping
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(JSONB) TO anon, authenticated;

-- ============================================================
-- RPC: get_order_public (numero + e-mail)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_order_public(p_order_number TEXT, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v JSONB;
BEGIN
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
    'created_at', o.created_at,
    'paid_at', o.paid_at,
    'address', CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
      'cep', a.cep, 'street', a.street, 'number', a.number,
      'complement', a.complement, 'district', a.district,
      'city', a.city, 'state', a.state
    ) END,
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_name', i.product_name,
        'variant_size', i.variant_size, 'variant_color', i.variant_color,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'subtotal', i.subtotal
      ) ORDER BY i.created_at)
      FROM public.order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  INTO v
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
  LEFT JOIN public.addresses a ON a.id = o.address_id
  WHERE o.order_number = p_order_number
    AND lower(c.email) = lower(trim(p_email))
  LIMIT 1;

  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_public(TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- RPC: attach_order_payment (checkout grava provedor/ids)
-- ============================================================
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
  UPDATE public.orders SET
    payment_provider = coalesce(NULLIF(p_provider, ''), payment_provider),
    payment_id = coalesce(NULLIF(p_payment_id, ''), payment_id),
    payment_url = coalesce(NULLIF(p_payment_url, ''), payment_url)
  WHERE id = p_order_id
    AND status = 'aguardando_pagamento';
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_order_payment(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- RPC: set_order_fulfillment (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_order_fulfillment(p_order_id UUID, p_stage TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev TEXT;
  v_actor TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_stage NOT IN ('recebido','embalado','pronto_retirada','coletado','enviado','em_transito','entregue') THEN
    RAISE EXCEPTION 'invalid_stage';
  END IF;

  SELECT fulfillment_status INTO v_prev FROM public.orders WHERE id = p_order_id;
  SELECT coalesce(email, 'admin') INTO v_actor FROM auth.users WHERE id = auth.uid();

  UPDATE public.orders SET
    fulfillment_status = p_stage,
    fulfillment_history = coalesce(fulfillment_history, '[]'::jsonb) || jsonb_build_object(
      'stage', p_stage, 'from', v_prev, 'at', now(), 'by', v_actor
    )
  WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_order_fulfillment(UUID, TEXT) TO authenticated;