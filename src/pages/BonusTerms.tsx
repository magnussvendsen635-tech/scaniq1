import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BonusTerms() {
  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="k-tap w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Bonus Terms</h1>
      </header>

      <div className="k-card p-5 space-y-3 text-sm leading-relaxed">
        <p className="font-semibold">Bonus Terms:</p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Bonuses are only valid for new, unique, active, and verified user profiles.</li>
          <li>The use of bots, dummy accounts, or automated scripts to manipulate the referral system is strictly prohibited.</li>
          <li>We reserve the right to investigate suspicious activity (including checking IP addresses and Device IDs) and withhold payments if fraud is detected.</li>
          <li>Our decision regarding potential abuse of the program is final.</li>
        </ul>
      </div>
    </div>
  );
}
