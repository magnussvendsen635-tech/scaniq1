import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Mail, Info, Trash2, Bug, HelpCircle, Activity, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SUPPORT_EMAIL = "support.kcally@gmail.com";

const FAQS = [
  {
    q: "Hvordan scanner jeg mad?",
    a: "Tryk på den store orange scan-knap i bunden af skærmen. Tag et billede af din mad, og AI'en analyserer kalorier og næringsstoffer automatisk.",
  },
  {
    q: "Er mine data private?",
    a: "Ja. Vi følger GDPR. Dine data gemmes sikkert, deles ikke med tredjeparter, og du kan slette din konto når som helst.",
  },
  {
    q: "Hvordan opgraderer jeg til Premium?",
    a: "Gå til Profil → Go Premium. Premium giver dig ubegrænsede scanninger, AI-måltidsforslag og avancerede analyser.",
  },
  {
    q: "Hvor præcis er AI-scanningen?",
    a: "AI'en er meget præcis for almindelige fødevarer, men du kan altid justere portionsstørrelse og næringsindhold manuelt efter scanning.",
  },
  {
    q: "Kan jeg bruge appen offline?",
    a: "De fleste funktioner kræver internet, da AI-scanning og synkronisering sker i skyen.",
  },
];

export default function Help() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const mailto = (subject: string, body = "") =>
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Er du sikker på, at du vil slette din konto? Dette kan ikke fortrydes.")) return;
    if (!confirm("Sidste advarsel: Alle dine data slettes permanent. Fortsæt?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Din konto er slettet");
      await signOut();
      nav("/auth", { replace: true });
    } catch (e: any) {
      // Fallback: open email request
      window.location.href = mailto(
        "Anmodning om kontosletning",
        `Hej Kcally support,\n\nJeg ønsker at få min konto slettet.\nBruger-ID: ${user.id}\nEmail: ${user.email}\n\nTak.`,
      );
      toast.error("Kunne ikke slette automatisk – e-mail åbnet til support");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Hjælp</h1>
      </header>

      {/* Contact support */}
      <Section>
        <a href={mailto("Kcally support")} className="row">
          <Icon Cmp={Mail} />
          <div className="flex-1">
            <div className="font-medium">Kontakt support</div>
            <div className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
        <a href={mailto("Fejlrapport", "Beskriv venligst fejlen og hvilken enhed du bruger:\n\n")} className="row">
          <Icon Cmp={Bug} />
          <div className="flex-1">
            <div className="font-medium">Rapporter en fejl</div>
            <div className="text-xs text-muted-foreground">Send bug-rapport til vores team</div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </Section>

      {/* Service status */}
      <Section title="Service status">
        <div className="row !cursor-default">
          <Icon Cmp={Activity} />
          <div className="flex-1">
            <div className="font-medium">Alle systemer kører</div>
            <div className="text-xs text-muted-foreground">AI-scanner, login og synkronisering OK</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Ofte stillede spørgsmål">
        {FAQS.map((f, i) => (
          <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left">
            <div className="row">
              <Icon Cmp={HelpCircle} />
              <div className="flex-1">
                <div className="font-medium text-sm">{f.q}</div>
                {openFaq === i && <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{f.a}</div>}
              </div>
              <ChevronDown className={"w-4 h-4 text-muted-foreground transition-transform " + (openFaq === i ? "rotate-180" : "")} />
            </div>
          </button>
        ))}
      </Section>

      {/* About */}
      <Section title="Om os">
        <div className="px-4 py-4 space-y-2">
          <div className="font-medium">Kcally</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kcally er en AI-drevet kalorie- og ernæringstracker, der gør det nemt at logge dine måltider via foto-scanning. Bygget af Prime Studio for at hjælpe dig med at nå dine helbredsmål.
          </p>
          <div className="text-xs text-muted-foreground">Version 1.0.0 • © 2026 Prime Studio</div>
          <button onClick={() => nav("/privacy")} className="text-xs text-primary-glow underline">Privatlivspolitik</button>
        </div>
      </Section>

      {/* Delete account */}
      <Section title="Konto">
        <button onClick={handleDelete} disabled={deleting} className="row hover:bg-destructive/10 disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
            <Trash2 className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-destructive">Slet konto</div>
            <div className="text-xs text-muted-foreground">Slet permanent din konto og alle data</div>
          </div>
        </button>
      </Section>
    </div>
  );
}

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="mb-3">
    {title && <div className="px-2 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>}
    <div className="k-card divide-y divide-border/60 overflow-hidden [&_.row]:w-full [&_.row]:p-4 [&_.row]:flex [&_.row]:items-center [&_.row]:gap-4 [&_.row]:hover:bg-surface-2 [&_.row]:transition-colors">
      {children}
    </div>
  </div>
);

const Icon = ({ Cmp }: { Cmp: any }) => (
  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
    <Cmp className="w-4.5 h-4.5 text-primary-glow" />
  </div>
);
