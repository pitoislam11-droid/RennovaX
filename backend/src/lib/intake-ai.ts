import { env } from "../env";
import {
  intakeStepSchema,
  type IntakeAnswer,
  type IntakeQuestion,
  type IntakeStep,
  type NextIntakeRequest,
  type ProjectBrief,
} from "../types";

const SYSTEM_PROMPT = `You are Rennova's UK homeowner project intake engine.
Your job is to turn ordinary homeowner language into the minimum contractor-ready information needed to understand and quote a job.

Operating rules:
- Return only the requested JSON schema. Never return markdown or commentary outside it.
- Ask exactly one short question at a time.
- Choose the most suitable native UI question type.
- Be genuinely adaptive. Use every previous answer, infer facts already supplied, skip irrelevant branches, and never ask the same fact twice.
- Stop as soon as the project is useful. Five questions can be enough. A complicated job may need eight. Do not exceed 12.
- Use plain UK English. Never ask homeowners to understand trade terms such as substrate, first fix, tanking, screed or joists.
- Translate simple answers into clear contractor language only in the completed brief.
- Ask for 3–5 useful photos only when they materially help. Photo steps must be optional, with minSelections 0 and maxSelections 5. Do not demand a property survey.
- Never ask a homeowner to climb, access a roof, approach exposed electrics, disturb suspected asbestos, or take any other risk. Record unavailable unsafe information in the brief.
- Do not estimate prices, quantities, regulations, structural safety, or product performance.
- The progress estimate is approximate because the flow is dynamic.

Question field rules:
- options must be [] unless the type uses choices.
- unitOptions must be [] unless type is measurement.
- mediaGuidance must be [] unless type is media_upload.
- helperText and placeholder must be null when unused.
- For yes_no use option ids yes, no and optionally not_sure.
- minSelections and maxSelections must always be valid integers; use 1 and 1 for non-multi controls.

Completion rules:
- kind must be complete, question null and brief populated.
- Write a concise title and scannable sections such as Current space, Required work, Layout, Access or Condition.
- Translate homeowner wording into sensible contractor-ready phrasing without inventing facts.
- If a fact is unknown, say Not confirmed rather than guessing.
- Keep the homeowner's location if provided.
- acknowledgement should be warm and very short.`;

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "category", "progress", "question", "brief", "acknowledgement"],
  properties: {
    kind: { type: "string", enum: ["question", "complete"] },
    category: { type: "string", minLength: 1, maxLength: 80 },
    progress: {
      type: "object",
      additionalProperties: false,
      required: ["answeredCount", "estimatedRemaining", "label"],
      properties: {
        answeredCount: { type: "integer", minimum: 0 },
        estimatedRemaining: { anyOf: [{ type: "integer", minimum: 0, maximum: 12 }, { type: "null" }] },
        label: { type: "string", maxLength: 80 },
      },
    },
    question: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "type", "title", "helperText", "required", "options", "placeholder", "unitOptions", "mediaGuidance", "minSelections", "maxSelections"],
          properties: {
            id: { type: "string", minLength: 1, maxLength: 80 },
            type: { type: "string", enum: ["single_choice", "multi_choice", "yes_no", "short_text", "measurement", "date_choice", "media_upload"] },
            title: { type: "string", minLength: 1, maxLength: 180 },
            helperText: { anyOf: [{ type: "string", maxLength: 240 }, { type: "null" }] },
            required: { type: "boolean" },
            options: {
              type: "array",
              maxItems: 12,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "label", "detail"],
                properties: {
                  id: { type: "string", minLength: 1 },
                  label: { type: "string", minLength: 1, maxLength: 80 },
                  detail: { anyOf: [{ type: "string", maxLength: 140 }, { type: "null" }] },
                },
              },
            },
            placeholder: { anyOf: [{ type: "string", maxLength: 100 }, { type: "null" }] },
            unitOptions: { type: "array", maxItems: 8, items: { type: "string", maxLength: 24 } },
            mediaGuidance: { type: "array", maxItems: 5, items: { type: "string", maxLength: 100 } },
            minSelections: { type: "integer", minimum: 0, maximum: 12 },
            maxSelections: { type: "integer", minimum: 1, maximum: 12 },
          },
        },
      ],
    },
    brief: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["title", "category", "location", "property", "summary", "sections", "materials", "timing", "photosSummary", "safetyNotes"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 100 },
            category: { type: "string", minLength: 1, maxLength: 80 },
            location: { type: "string", maxLength: 120 },
            property: { type: "string", maxLength: 180 },
            summary: { type: "string", minLength: 1, maxLength: 500 },
            sections: {
              type: "array",
              minItems: 2,
              maxItems: 10,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "items"],
                properties: {
                  title: { type: "string", minLength: 1, maxLength: 80 },
                  items: { type: "array", minItems: 1, maxItems: 12, items: { type: "string", minLength: 1, maxLength: 220 } },
                },
              },
            },
            materials: { type: "string", maxLength: 180 },
            timing: { type: "string", maxLength: 180 },
            photosSummary: { type: "string", maxLength: 100 },
            safetyNotes: { type: "array", maxItems: 5, items: { type: "string", maxLength: 180 } },
          },
        },
      ],
    },
    acknowledgement: { type: "string", minLength: 1, maxLength: 180 },
  },
} as const;

function answerLabels(question: IntakeQuestion, answer: IntakeAnswer) {
  const selected = new Set(answer.selectedOptionIds ?? []);
  const labels = question.options.filter((option) => selected.has(option.id)).map((option) => option.label);
  return {
    selected: labels,
    text: answer.text,
    measurement: answer.value === undefined ? undefined : `${answer.value} ${answer.unit ?? ""}`.trim(),
    mediaCount: answer.mediaCount,
  };
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { output_text?: unknown; output?: unknown };
  if (typeof body.output_text === "string") return body.output_text;
  if (!Array.isArray(body.output)) return null;

  for (const item of body.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

async function askModel(request: NextIntakeRequest): Promise<IntakeStep> {
  if (!env.OPENAI_API_KEY) throw new Error("AI provider is not configured");

  const history = request.turns.map((turn, index) => ({
    order: index + 1,
    question: turn.question.title,
    type: turn.question.type,
    answer: answerLabels(turn.question, turn.answer),
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              initialRequest: request.initialRequest,
              location: request.location || "Not provided yet",
              previousAnswers: history,
            }),
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "rennova_intake_step",
          strict: true,
          schema: responseJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI provider returned ${response.status}: ${text.slice(0, 300)}`);
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("AI provider returned no structured output");

  const parsed = intakeStepSchema.parse(JSON.parse(outputText));
  if (parsed.question?.type === "media_upload") {
    parsed.question.required = false;
    parsed.question.minSelections = 0;
    parsed.question.maxSelections = 5;
  }
  if (parsed.kind === "question" && !parsed.question) throw new Error("AI question response had no question");
  if (parsed.kind === "complete" && !parsed.brief) throw new Error("AI completion response had no brief");
  return parsed;
}

const option = (id: string, label: string, detail: string | null = null) => ({ id, label, detail });

function question(
  id: string,
  type: IntakeQuestion["type"],
  title: string,
  options: IntakeQuestion["options"] = [],
  extra: Partial<IntakeQuestion> = {},
): IntakeQuestion {
  return {
    id,
    type,
    title,
    helperText: null,
    required: true,
    options,
    placeholder: null,
    unitOptions: [],
    mediaGuidance: [],
    minSelections: 1,
    maxSelections: type === "multi_choice" ? Math.max(1, options.length) : 1,
    ...extra,
  };
}

function inferCategory(text: string) {
  const value = text.toLowerCase();
  if (/bath|shower|toilet|wc|basin/.test(value)) return "Bathroom renovation";
  if (/paint|decorat|wallpaper/.test(value)) return "Painting & decorating";
  if (/roof|leak|gutter/.test(value)) return "Roof repair";
  if (/kitchen/.test(value)) return "Kitchen renovation";
  if (/floor|carpet|laminate|tile/.test(value)) return "Flooring";
  return "Home improvement";
}

function getTurn(request: NextIntakeRequest, id: string) {
  return request.turns.find((turn) => turn.question.id === id);
}

function selected(request: NextIntakeRequest, id: string, value: string) {
  return getTurn(request, id)?.answer.selectedOptionIds?.includes(value) ?? false;
}

function answerText(request: NextIntakeRequest, id: string) {
  const turn = getTurn(request, id);
  if (!turn) return "Not confirmed";
  const labels = answerLabels(turn.question, turn.answer).selected;
  return turn.answer.text || labels.join(", ") || (turn.answer.mediaCount !== undefined ? `${turn.answer.mediaCount} attached` : "Not confirmed");
}

function makeBrief(request: NextIntakeRequest, category: string): ProjectBrief {
  const isBathroom = category === "Bathroom renovation";
  const isPainting = category === "Painting & decorating";
  const isRoof = category === "Roof repair";
  const scope = answerText(request, isBathroom ? "bathroom_scope" : isPainting ? "paint_scope" : isRoof ? "roof_symptoms" : "work_details");
  const photoTurn = request.turns.find((turn) => turn.question.type === "media_upload");
  const photoCount = photoTurn?.answer.mediaCount ?? 0;
  const sections = [
    { title: "Required work", items: [scope] },
    { title: "Property", items: [answerText(request, "property_type")] },
  ];

  if (isBathroom) {
    sections.push({ title: "Layout", items: [selected(request, "layout_change", "yes") ? "Fixtures to remain in their current positions" : answerText(request, "moving_items")] });
  }
  if (isPainting) {
    sections.push({ title: "Condition", items: [answerText(request, "wall_condition")] });
  }
  if (isRoof) {
    sections.push({ title: "Leak details", items: [answerText(request, "roof_timing"), answerText(request, "roof_weather")] });
  }

  return {
    title: category,
    category,
    location: request.location || "Location to be confirmed",
    property: answerText(request, "property_type"),
    summary: request.initialRequest,
    sections,
    materials: answerText(request, "materials_supply"),
    timing: answerText(request, "timing"),
    photosSummary: photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"} attached` : "No photos attached yet",
    safetyNotes: isRoof ? ["Roof-level information was not requested where it could not be collected safely."] : [],
  };
}

function fallbackStep(request: NextIntakeRequest): IntakeStep {
  const category = inferCategory(request.initialRequest);
  const ids = new Set(request.turns.map((turn) => turn.question.id));
  let next: IntakeQuestion | null = null;

  if (category === "Bathroom renovation") {
    if (!ids.has("bathroom_scope")) next = question("bathroom_scope", "multi_choice", "What are you planning to change?", [option("everything", "Everything"), option("shower_bath", "Shower or bath"), option("toilet", "Toilet"), option("basin", "Basin"), option("tiles", "Tiles"), option("other", "Something else")]);
    else if (!ids.has("layout_change")) next = question("layout_change", "yes_no", "Are the main fittings staying in the same positions?", [option("yes", "Yes"), option("no", "No"), option("not_sure", "Not sure")]);
    else if (selected(request, "layout_change", "no") && !ids.has("moving_items")) next = question("moving_items", "multi_choice", "What would you like to move?", [option("shower_bath", "Shower or bath"), option("toilet", "Toilet"), option("basin", "Basin"), option("other", "Something else")]);
  } else if (category === "Painting & decorating") {
    if (!ids.has("paint_scope")) next = question("paint_scope", "multi_choice", "What would you like painted?", [option("walls", "Walls"), option("ceilings", "Ceilings"), option("woodwork", "Doors & woodwork"), option("everything", "Everything")]);
    else if (!ids.has("wall_condition")) next = question("wall_condition", "multi_choice", "What condition are the walls in now?", [option("good", "Generally good"), option("cracks", "Cracks"), option("peeling", "Peeling paint"), option("damage", "Damaged areas"), option("wallpaper", "Wallpaper to remove")]);
  } else if (category === "Roof repair") {
    if (!ids.has("roof_symptoms")) next = question("roof_symptoms", "short_text", "Where can you see the leak or damage from inside?", [], { placeholder: "For example, a ceiling stain in the rear bedroom" });
    else if (!ids.has("roof_timing")) next = question("roof_timing", "short_text", "How long has this been happening?", [], { placeholder: "For example, since last week" });
    else if (!ids.has("roof_weather")) next = question("roof_weather", "yes_no", "Does it appear only during or after rain?", [option("yes", "Yes"), option("no", "No"), option("not_sure", "Not sure")]);
  } else if (!ids.has("work_details")) {
    next = question("work_details", "short_text", "What would a good finished result look like to you?", [], { placeholder: "Tell us in your own words" });
  }

  if (!next && !ids.has("property_type")) next = question("property_type", "single_choice", "What type of property is it?", [option("flat", "Flat"), option("terraced", "Terraced house"), option("semi", "Semi-detached"), option("detached", "Detached house"), option("other", "Other")]);
  if (!next && !ids.has("materials_supply") && category !== "Roof repair") next = question("materials_supply", "single_choice", "Who should supply the main materials?", [option("contractor", "Contractor to supply"), option("homeowner", "I’ll supply them"), option("discuss", "I’d like advice")]);
  if (!next && !ids.has("timing")) next = question("timing", "date_choice", "When would you ideally like the work to start?", [option("asap", "As soon as possible"), option("four_weeks", "Within 4 weeks"), option("three_months", "Within 3 months"), option("flexible", "I’m flexible")]);
  if (!next && !ids.has("photos")) next = question("photos", "media_upload", "A few photos will help contractors understand the job.", [], { required: false, helperText: "Three to five useful photos is plenty. Only take photos where it is safe.", mediaGuidance: category === "Roof repair" ? ["Visible damage from a safe position", "Where the leak appears inside", "A wider view for context"] : ["A wide view of the space", "The main work area", "Any visible damage"], minSelections: 0, maxSelections: 5 });

  if (next) {
    return {
      kind: "question",
      category,
      progress: { answeredCount: request.turns.length, estimatedRemaining: Math.max(1, 6 - request.turns.length), label: "A few quick details" },
      question: next,
      brief: null,
      acknowledgement: request.turns.length === 0 ? "I’ll ask only what contractors need." : "Got it.",
    };
  }

  return {
    kind: "complete",
    category,
    progress: { answeredCount: request.turns.length, estimatedRemaining: 0, label: "Brief ready" },
    question: null,
    brief: makeBrief(request, category),
    acknowledgement: "Your contractor-ready brief is ready to review.",
  };
}

export async function getNextIntakeStep(request: NextIntakeRequest): Promise<{ step: IntakeStep; source: "ai" | "fallback" }> {
  try {
    return { step: await askModel(request), source: "ai" };
  } catch (error) {
    console.error("AI intake fallback used:", error);
    return { step: fallbackStep(request), source: "fallback" };
  }
}
