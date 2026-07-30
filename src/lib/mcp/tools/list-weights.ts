import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_weights",
  title: "List weight entries",
  description: "List the signed-in user's recorded body-weight entries, newest first.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max rows to return (default 30, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 30, 1), 200);
    const { data, error } = await supabaseForUser(ctx)
      .from("weights")
      .select("id,weight_kg,logged_at")
      .order("logged_at", { ascending: false })
      .limit(max);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { weights: data ?? [] },
    };
  },
});
