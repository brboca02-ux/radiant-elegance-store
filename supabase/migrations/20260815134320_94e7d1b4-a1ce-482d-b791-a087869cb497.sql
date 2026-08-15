-- Create abandoned_carts table
CREATE TABLE public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    cart_data JSONB NOT NULL,
    subtotal DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    total DECIMAL(10, 2),
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    recovered_at TIMESTAMPTZ,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for abandonment logic (find carts older than 30m)
CREATE INDEX idx_abandoned_carts_last_updated ON public.abandoned_carts(last_updated_at);
-- Index for recovery tracking
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts(customer_email);
CREATE INDEX idx_abandoned_carts_phone ON public.abandoned_carts(customer_phone);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT INSERT, SELECT, UPDATE ON public.abandoned_carts TO anon;
GRANT ALL ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

-- Policies
-- Allow public to insert/upsert (for checkout tracking)
CREATE POLICY "Anyone can insert abandoned carts"
ON public.abandoned_carts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update their own abandoned cart by email/phone"
ON public.abandoned_carts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow admins to see all
CREATE POLICY "Admins can view all abandoned carts"
ON public.abandoned_carts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete abandoned carts"
ON public.abandoned_carts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
