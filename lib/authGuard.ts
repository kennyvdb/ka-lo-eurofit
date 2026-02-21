import { supabase } from "@/lib/supabaseClient";

export async function getSessionOrRedirectToLogin(): Promise<{
  userId: string | null;
  redirected: boolean;
  errorMessage?: string;
}> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    const msg = String(error.message ?? "").toLowerCase();

    // typische crash: invalid refresh token
    if (msg.includes("invalid refresh token") || msg.includes("refresh token not found")) {
      await supabase.auth.signOut({ scope: "local" });
      window.location.href = "/login";
      return { userId: null, redirected: true };
    }

    // andere auth errors
    return { userId: null, redirected: false, errorMessage: error.message };
  }

  const uid = data.session?.user?.id ?? null;

  if (!uid) {
    window.location.href = "/login";
    return { userId: null, redirected: true };
  }

  return { userId: uid, redirected: false };
}
