import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_weight",
  title: "Log weight",
  description: "Record a body-weight entry (kg) for the signed-in user.",
  inputSchema: {
    weight_kg: z.number().describe("Body weight in kilograms."),
    logged_at: z.string().optional().describe("ISO timestamp. Defaults to now."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ weight_kg, logged_at }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!(weight_kg > 0) || weight_kg > 500) {
      return { content: [{ type: "text", text: "weight_kg must be between 0 and 500" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("weights")
      .insert({
        user_id: ctx.getUserId(),
        weight_kg,
        ...(logged_at ? { logged_at } : {}),
      })
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged weight ${weight_kg} kg.` }],
      structuredContent: { weight: data },
    };
  },
});
