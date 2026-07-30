import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_meals",
  title: "List meals",
  description:
    "List the signed-in user's logged meals with calories and macros, optionally filtered by date range (YYYY-MM-DD).",
  inputSchema: {
    from: z.string().optional().describe("Start date, YYYY-MM-DD."),
    to: z.string().optional().describe("End date, YYYY-MM-DD."),
    limit: z.number().int().optional().describe("Max rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 50, 1), 200);
    let query = supabaseForUser(ctx)
      .from("meals")
      .select("id,name,calories,protein,carbs,fat,fiber,sugar,category,eaten_at,health_score")
      .order("eaten_at", { ascending: false })
      .limit(max);
    if (from) query = query.gte("eaten_at", `${from}T00:00:00.000Z`);
    if (to) query = query.lte("eaten_at", `${to}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { meals: data ?? [] },
    };
  },
});
