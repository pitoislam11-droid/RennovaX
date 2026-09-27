import { z } from "zod";
import { env } from "../env";
import type { ProjectBrief } from "../types";

export const askCardSchema = z.object({
  kind: z.enum(["checklist", "quote_structure", "materials_categories", "risk_notes", "next_step"]),
  title: z.string().min(1).max(80),
  items: z.array(z.string().min(1).max(220)).min(1).max(8),
  note: z.string().max(240).optional().nullable(),
});

export const askResponseSchema = z.object({
  acknowledgement: z.string().min(1).max(200),
  cards: z.array(askCardSchema).min(1).max(5),
});

export type AskResponse = z.infer<typeof askResponseSchema>;

export const askRequestSchema = z.object({
  prompt: z.string().min(3).max(800),
  projectId: z.string().optional(),
  brief: z
    .object({
      title: z.string().optional(),
      category: z.string().optional(),
      summary: z.string().optional(),
      materials: z.string().optional(),
      timing: z.string().optional(),
    })
    .optional(),
});

const SYSTEM = `You are Ask Rennova for UK contractors using Rennova.
Help them understand a homeowner brief, structure a private quotation, and think about materials.
Rules:
- UK English.
- Never invent live material prices, stock levels, or manufacturer coverage rates.
- Prefer structured cards over chatty prose.
- materials_categories lists product types/spec questions only — no £ amounts.
- Keep cards practical and short.
Return JSON matching the schema.`;

function fallbackAsk(prompt: string, brief?: AskRequestBrief): AskResponse {
  const category = brief?.category || "this project";
  const lower = prompt.toLowerCase();
  const wantsMaterials = /material|tile|paint|timber|skip|waste|supply/.test(lower);
  const wantsQuote = /quote|price|labour|cost|estimate|break/.test(lower);

  const cards: AskResponse["cards"] = [];

  if (wantsQuote || !wantsMaterials) {
    cards.push({
      kind: "quote_structure",
      title: "Private quote structure",
      items: [
        "Labour — include access, protection and making-good",
        "Materials — say whether supply is included or homeowner-supplied",
        "Waste / skip — call out separately so totals stay clear",
        "Assumptions — what the brief still leaves open",
      ],
      note: "Homeowners compare like-for-like. Keep your breakdown tidy.",
    });
  }

  if (wantsMaterials || cards.length === 0) {
    cards.push({
      kind: "materials_categories",
      title: `Materials to confirm for ${category}`,
      items: [
        brief?.materials || "Confirm finish quality and whether materials are included",
        "Ask about existing surfaces that need protecting or removing",
        "Note any lead times that could affect the start date",
        "List waste disposal if you are handling it",
      ],
      note: "Live prices appear only when a supplier connection is available — never guess.",
    });
  }

  cards.push({
    kind: "checklist",
    title: "Before you submit",
    items: [
      brief?.summary ? `Brief summary: ${brief.summary.slice(0, 140)}` : "Re-read the brief for missing access or parking notes",
      brief?.timing ? `Timing cue: ${brief.timing}` : "Confirm earliest start against your diary",
      "State warranty in plain language",
      "Request a call only if something material is still unclear",
    ],
  });

  cards.push({
    kind: "next_step",
    title: "Suggested next step",
    items: ["Draft your private quotation with a clear total and scope notes"],
  });

  return {
    acknowledgement: "Here’s a practical take based on the brief — no guessed prices.",
    cards: cards.slice(0, 4),
  };
}

type AskRequestBrief = {
  title?: string;
  category?: string;
  summary?: string;
  materials?: string;
  timing?: string;
};

async function askModel(prompt: string, brief?: AskRequestBrief): Promise<AskResponse> {
  if (!env.OPENAI_API_KEY) throw new Error("AI provider is not configured");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: SYSTEM }] },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({ prompt, brief: brief ?? null }),
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "rennova_ask_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["acknowledgement", "cards"],
            properties: {
              acknowledgement: { type: "string" },
              cards: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["kind", "title", "items", "note"],
                  properties: {
                    kind: {
                      type: "string",
                      enum: ["checklist", "quote_structure", "materials_categories", "risk_notes", "next_step"],
                    },
                    title: { type: "string" },
                    items: { type: "array", items: { type: "string" } },
                    note: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`Ask Rennova model failed (${response.status})`);
  const body = (await response.json()) as { output_text?: string; output?: unknown };
  const text = body.output_text
    ?? (Array.isArray(body.output)
      ? body.output
        .flatMap((item: unknown) => {
          if (!item || typeof item !== "object") return [];
          const content = (item as { content?: unknown }).content;
          if (!Array.isArray(content)) return [];
          return content
            .map((part) => (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
              ? (part as { text: string }).text
              : null))
            .filter(Boolean) as string[];
        })
        .join("\n")
      : null);

  if (!text) throw new Error("Empty Ask Rennova response");
  return askResponseSchema.parse(JSON.parse(text));
}

export async function getAskRennovaHelp(prompt: string, brief?: AskRequestBrief): Promise<{ data: AskResponse; source: "model" | "fallback" }> {
  try {
    const data = await askModel(prompt, brief);
    return { data, source: "model" };
  } catch (error) {
    console.error("Ask Rennova fallback used:", error);
    return { data: fallbackAsk(prompt, brief), source: "fallback" };
  }
}

export function briefFromJson(briefJson: unknown): AskRequestBrief | undefined {
  if (!briefJson || typeof briefJson !== "object") return undefined;
  const brief = briefJson as Partial<ProjectBrief>;
  return {
    title: brief.title,
    category: brief.category,
    summary: brief.summary,
    materials: brief.materials,
    timing: brief.timing,
  };
}
