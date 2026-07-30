import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_daily_summary",
  title: "Get daily summary",
  description:
    "Summarize the signed-in user's nutrition for one day: total calories, macros, water intake and workouts.",
  inputSchema: {
    date: z.string().optional().describe("Day in YYYY-MM-DD format. Defaults to today (UTC)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const day = date ?? new Date().toISOString().slice(0, 10);
    const supabase = supabaseForUser(ctx);

    const [meals, water, workouts] = await Promise.all([
      supabase
        .from("meals")
        .select("name,calories,protein,carbs,fat")
        .gte("eaten_at", `${day}T00:00:00.000Z`)
        .lte("eaten_at", `${day}T23:59:59.999Z`),
      supabase.from("water_logs").select("ml").eq("day", day).maybeSingle(),
      supabase
        .from("workouts")
        .select("name,minutes,calories_burned")
        .gte("performed_at", `${day}T00:00:00.000Z`)
        .lte("performed_at", `${day}T23:59:59.999Z`),
    ]);

    const error = meals.error ?? workouts.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = meals.data ?? [];
    const sum = (key: "calories" | "protein" | "carbs" | "fat") =>
      Math.round(rows.reduce((a, r) => a + (Number(r[key]) || 0), 0));

    const summary = {
      date: day,
      meals: rows.length,
      calories: sum("calories"),
      protein_g: sum("protein"),
      carbs_g: sum("carbs"),
      fat_g: sum("fat"),
      water_ml: water.data?.ml ?? 0,
      workouts: (workouts.data ?? []).length,
      calories_burned: Math.round(
        (workouts.data ?? []).reduce((a, w) => a + (Number(w.calories_burned) || 0), 0),
      ),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
