-- Função atómica para ajuste de stock — evita race condition em vendas simultâneas.
-- Substitui o padrão read-modify-write do lado do cliente.
CREATE OR REPLACE FUNCTION adjust_product_stock(
  p_product_id uuid,
  p_delta      integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock + p_delta)
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found: %', p_product_id;
  END IF;
END;
$$;

-- Permissão: apenas o role autenticado (admin) pode chamar.
REVOKE ALL ON FUNCTION adjust_product_stock(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION adjust_product_stock(uuid, integer) TO authenticated;
