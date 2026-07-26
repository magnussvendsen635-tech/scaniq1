## Problem (bekræftet)

I `docs/scaniq_baseline_revenuecat.sql` bliver `public.has_role()` først oprettet på linje 1208, men den bruges allerede i RLS-politikker fra linje 63 (`profiles`), samt i `blocked_users`, `page_views`, `payouts` m.fl. På et tomt projekt fejler filen derfor med "function has_role(uuid, app_role) does not exist".

Bemærk også: `has_role` og `is_blocked` er `LANGUAGE sql` og bliver parset ved oprettelse, så de kræver at deres tabeller findes først. `is_blocked` ligger allerede efter `blocked_users` — kun `has_role`/`is_admin` skal flyttes.

## Løsning: ny rækkefølge i filen

1. Enums: `app_role`, `payout_status` (uændret, linje 19-26)
2. `user_roles`: CREATE TABLE → GRANT → ENABLE RLS → politikker (de fire politikker bruger kun `auth.uid()`/service role, så de kan køre her)
3. `set_updated_at()`, `has_role(uuid, app_role)`, `is_admin(uuid)` — flyttes op hertil
4. Alle øvrige tabeller i nuværende rækkefølge (`profiles`, `subscriptions`, `ai_usage_daily`, … `workouts`) med deres GRANTs, RLS, politikker og indexes — nu virker `has_role()` i politikkerne
5. Resterende funktioner (kvote, e-mail-kø, `handle_new_user`, `has_active_subscription`, `is_blocked`, `prevent_premium_self_upgrade`, `sync_email_verified`, `move_to_dlq`, …) — uændret indhold, minus de tre der er flyttet op
6. Triggers til sidst (uændret)

## Tekniske noter

- Ingen ændringer i SQL-indhold: kun rækkefølge. Alle kolonner, constraints, GRANTs, politikker og indexes bevares 1:1.
- Triggers bruger `CREATE TRIGGER` uden `IF NOT EXISTS`; jeg pakker dem i `DO $$ ... EXCEPTION WHEN duplicate_object` (eller `DROP TRIGGER IF EXISTS` først), så filen kan køres igen uden fejl.
- Alle policies får `DROP POLICY IF EXISTS` foran, så filen bliver fuldt idempotent på et tomt såvel som delvist oprettet projekt.
- Headerkommentaren opdateres: filen kan nu køres direkte mod et tomt Supabase-projekt.
- Filen forbliver `docs/scaniq_baseline_revenuecat.sql` (filer under `supabase/migrations/` er beskyttede og kan ikke redigeres direkte).
