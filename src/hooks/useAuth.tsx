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

const MAX_AUTH_LOADING_MS = 5000;

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

  // Fire welcome email once per user, for brand new signups only.
  const maybeSendWelcome = async (user: User) => {
    try {
      const key = `welcome_sent_${user.id}`;
      if (localStorage.getItem(key)) return;
      // Only treat as new signup if account was created in the last 5 minutes.
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      if (!createdAt || Date.now() - createdAt > 5 * 60 * 1000) {
        localStorage.setItem(key, "1");
        return;
      }
      if (!user.email) return;
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email.split("@")[0];
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome",
          recipientEmail: user.email,
          idempotencyKey: `welcome-${user.id}`,
          templateData: { name },
        },
      });
      localStorage.setItem(key, "1");
    } catch {
      /* ignore — welcome email is best-effort */
    }
  };

  useEffect(() => {
    // Safety net: never let the app hang on the loading screen.
    const failsafe = setTimeout(() => setLoading((l) => (l ? false : l)), MAX_AUTH_LOADING_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      clearTimeout(failsafe);
      if (s?.user) {
        setTimeout(() => enforceBan(s), 0);
        setTimeout(() => maybeSendWelcome(s.user), 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      clearTimeout(failsafe);
      if (data.session?.user) {
        setTimeout(() => enforceBan(data.session), 0);
        setTimeout(() => maybeSendWelcome(data.session!.user), 0);
      }
    }).catch(() => {
      setLoading(false);
      clearTimeout(failsafe);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
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
