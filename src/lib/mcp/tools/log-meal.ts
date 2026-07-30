import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_meal",
  title: "Log a meal",
  description: "Log a meal with calories and macros for the signed-in user.",
  inputSchema: {
    name: z.string().trim().describe("Meal name, e.g. 'Chicken salad'."),
    calories: z.number().describe("Total calories (kcal) for the portion."),
    protein: z.number().optional().describe("Protein in grams."),
    carbs: z.number().optional().describe("Carbohydrates in grams."),
    fat: z.number().optional().describe("Fat in grams."),
    category: z
      .string()
      .optional()
      .describe("Meal category, e.g. breakfast, lunch, dinner, snack."),
    eaten_at: z.string().optional().describe("ISO timestamp of when it was eaten. Defaults to now."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const name = input.name.trim();
    if (!name) return { content: [{ type: "text", text: "Meal name is required" }], isError: true };

    const { data, error } = await supabaseForUser(ctx)
      .from("meals")
      .insert({
        user_id: ctx.getUserId(),
        name: name.slice(0, 120),
        calories: Math.max(0, Math.round(input.calories)),
        protein: Math.max(0, input.protein ?? 0),
        carbs: Math.max(0, input.carbs ?? 0),
        fat: Math.max(0, input.fat ?? 0),
        category: input.category ?? null,
        ...(input.eaten_at ? { eaten_at: input.eaten_at } : {}),
      })
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged "${name}" (${input.calories} kcal).` }],
      structuredContent: { meal: data },
    };
  },
});
