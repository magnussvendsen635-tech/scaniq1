## Mål
Én selvstændig SQL-fil, der kan genskabe hele ScanIQ-databasen fra bunden: enums, tabeller, kolonner, nøgler, constraints, indexes, GRANTs, RLS-politikker, funktioner og triggers.

## Hvad der findes i dag (aflæst direkte fra databasen)
- **Enums:** `app_role` (admin, moderator, user), `payout_status` (pending, approved, paid, rejected)
- **22 tabeller** i `public`:
  - Kernedata: `meals`, `favorites`, `scans`, `water_logs`, `weights`, `workouts`
  - Bruger/konto: `profiles`, `user_settings`, `user_roles`, `subscriptions`, `push_subscriptions`, `reminder_preferences`
  - E-mail: `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`
  - Sikkerhed/analyse/økonomi: `ai_usage_daily`, `blocked_users`, `page_views`, `payouts`, `discount_codes`, `discount_redemptions`
- **76 RLS-politikker**, fremmednøgler mod `auth.users` (alle `ON DELETE CASCADE`, undtagen `created_by`/`subscription_id` som er `SET NULL`), samt unikke constraints og checks (fx `email_send_state.id = 1`, status-checks).
- **13 databasefunktioner** (bl.a. `has_role`, `is_admin`, `handle_new_user`, `check_and_increment_ai_quota`, `prevent_premium_self_upgrade`, e-mail-kø-funktionerne).

## Leverance
Ny fil: `supabase/migrations/00000000000000_scaniq_baseline.sql`

Rækkefølge i filen:
1. `CREATE TYPE` for begge enums (idempotent)
2. Delte funktioner der bruges af defaults/policies: `set_updated_at`, `has_role`, `is_admin`
3. For hver tabel, i afhængighedsrækkefølge: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY` (med de eksisterende USING/WITH CHECK-udtryk aflæst 1:1 fra databasen)
4. Indexes (fx `scans_user_id_scanned_at_idx`, subscriptions-indexes)
5. Resterende funktioner (kvote, e-mail-kø, premium-guard, `handle_new_user`) og triggers
6. Kommentarer der markerer legacy-tabellerne `discount_codes` / `discount_redemptions`

## Tekniske noter
- Filen er en **dokumentations-/genskabelses-artefakt** — den køres ikke mod den nuværende database (den ville fejle, da alt allerede findes). Alle statements skrives dog med `IF NOT EXISTS` / `CREATE OR REPLACE` hvor Postgres tillader det, så den kan køres på et tomt projekt.
- Fremmednøgler til `auth.users` bevares som de er i dag, så filen matcher virkeligheden.
- Objekter uden for `public` (storage-bucket `scan-images`, auth-konfiguration, cron-jobs, pgmq-køer) kan ikke ligge i en almindelig migration; de beskrives som kommentarer i toppen af filen med instruktioner.
- GRANTs sættes efter de roller politikkerne faktisk tillader: `authenticated` + `service_role` på brugertabeller, `anon` kun hvor der findes en public-politik (fx `page_views` insert).
