-- Lock down SECURITY DEFINER functions: only expose what the app actually calls.
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.set_order_fulfillment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_fulfillment(uuid, text) TO authenticated;

-- Guest checkout flows still need these two, keep them explicit rather than PUBLIC.
REVOKE ALL ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_order_public(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_public(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.attach_order_payment(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_order_payment(uuid, text, text, text) TO anon, authenticated;