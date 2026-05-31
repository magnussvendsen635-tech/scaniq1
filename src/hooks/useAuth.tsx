import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useKStore } from "@/store/useKStore";
import { toast } from "sonner";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Ban enforcement: if the signed-in user's profile is_banned=true, sign out.
  const enforceBan = async (s: Session | null) => {
    if (!s?.user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", s.user.id)
        .maybeSingle();
      if (data?.is_banned) {
        toast.error("Din konto er blokeret", {
          description: "Kontakt support hvis du mener dette er en fejl.",
        });
        await supabase.auth.signOut();
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      // Defer to avoid recursive auth calls inside the listener
      if (s?.user) setTimeout(() => enforceBan(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) setTimeout(() => enforceBan(data.session), 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    try { useKStore.getState().setOnboarded(false); } catch {}
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
