import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const checkAdminRole = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { isAdmin: false };

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (error || !roles) return { isAdmin: false };

    const isAdmin = roles.some(r => r.role === 'admin');
    return { isAdmin };
  });
