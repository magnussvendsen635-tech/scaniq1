import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("pv_session_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("pv_session_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function PageViewTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;
    const session_id = getSessionId();
    supabase.auth.getUser().then(({ data }) => {
      void supabase.from("page_views").insert({
        path,
        session_id,
        user_id: data.user?.id ?? null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 500),
      });
    });
  }, [location.pathname]);

  return null;
}
