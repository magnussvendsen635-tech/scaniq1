import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMealsTool from "./tools/list-meals";
import logMealTool from "./tools/log-meal";
import getDailySummaryTool from "./tools/get-daily-summary";
import logWeightTool from "./tools/log-weight";
import listWeightsTool from "./tools/list-weights";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "scaniq",
  title: "ScanIQ",
  version: "0.1.0",
  instructions:
    "Tools for ScanIQ, a calorie and nutrition tracker. Use `get_daily_summary` for a day's totals, `list_meals` to read logged meals, `log_meal` to add a meal with calories and macros, and `log_weight` / `list_weights` for body weight. All tools act on the signed-in user's own data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getDailySummaryTool, listMealsTool, logMealTool, logWeightTool, listWeightsTool],
});
