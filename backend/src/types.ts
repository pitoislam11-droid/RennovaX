import { z } from "zod";

export const userRoleSchema = z.enum(["HOMEOWNER", "CONTRACTOR"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const intakeOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  detail: z.string().max(140).nullable(),
});

export const intakeQuestionTypeSchema = z.enum([
  "single_choice",
  "multi_choice",
  "yes_no",
  "short_text",
  "measurement",
  "date_choice",
  "media_upload",
]);

const intakeQuestionObjectSchema = z.object({
  id: z.string().min(1).max(80),
  type: intakeQuestionTypeSchema,
  title: z.string().min(1).max(180),
  helperText: z.string().max(240).nullable(),
  required: z.boolean(),
  options: z.array(intakeOptionSchema).max(12),
  placeholder: z.string().max(100).nullable(),
  unitOptions: z.array(z.string().max(24)).max(8),
  mediaGuidance: z.array(z.string().max(100)).max(5),
  minSelections: z.number().int().min(0).max(12),
  maxSelections: z.number().int().min(1).max(12),
});

export const intakeQuestionSchema = intakeQuestionObjectSchema.superRefine((question, context) => {
  const choiceTypes = new Set(["single_choice", "multi_choice", "yes_no", "date_choice"]);
  if (choiceTypes.has(question.type) && question.options.length < 2) {
    context.addIssue({ code: "custom", message: "Choice questions need at least two options", path: ["options"] });
  }
  if (question.type === "measurement" && question.unitOptions.length === 0) {
    context.addIssue({ code: "custom", message: "Measurement questions need units", path: ["unitOptions"] });
  }
  if (question.type === "media_upload" && question.mediaGuidance.length === 0) {
    context.addIssue({ code: "custom", message: "Photo requests need simple guidance", path: ["mediaGuidance"] });
  }
});
export type IntakeQuestion = z.infer<typeof intakeQuestionSchema>;

export const intakeAnswerSchema = z.object({
  selectedOptionIds: z.array(z.string()).max(12).optional(),
  text: z.string().max(1000).optional(),
  value: z.number().nonnegative().optional(),
  unit: z.string().max(24).optional(),
  mediaCount: z.number().int().min(0).max(12).optional(),
});
export type IntakeAnswer = z.infer<typeof intakeAnswerSchema>;

export const intakeTurnSchema = z.object({
  question: intakeQuestionSchema,
  answer: intakeAnswerSchema,
});
export type IntakeTurn = z.infer<typeof intakeTurnSchema>;

export const projectBriefSectionSchema = z.object({
  title: z.string().min(1).max(80),
  items: z.array(z.string().min(1).max(220)).min(1).max(12),
});

export const projectBriefSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(80),
  location: z.string().max(120),
  property: z.string().max(180),
  summary: z.string().min(1).max(500),
  sections: z.array(projectBriefSectionSchema).min(2).max(10),
  materials: z.string().max(180),
  timing: z.string().max(180),
  photosSummary: z.string().max(100),
  safetyNotes: z.array(z.string().max(180)).max(5),
});
export type ProjectBrief = z.infer<typeof projectBriefSchema>;

const intakeStepObjectSchema = z.object({
  kind: z.enum(["question", "complete"]),
  category: z.string().min(1).max(80),
  progress: z.object({
    answeredCount: z.number().int().min(0),
    estimatedRemaining: z.number().int().min(0).max(12).nullable(),
    label: z.string().max(80),
  }),
  question: intakeQuestionSchema.nullable(),
  brief: projectBriefSchema.nullable(),
  acknowledgement: z.string().min(1).max(180),
});

export const intakeStepSchema = intakeStepObjectSchema.superRefine((step, context) => {
  if (step.kind === "question" && (!step.question || step.brief)) {
    context.addIssue({ code: "custom", message: "Question steps must contain only a question" });
  }
  if (step.kind === "complete" && (!step.brief || step.question)) {
    context.addIssue({ code: "custom", message: "Completed steps must contain only a brief" });
  }
});
export type IntakeStep = z.infer<typeof intakeStepSchema>;

export const nextIntakeRequestSchema = z.object({
  initialRequest: z.string().min(3).max(1000),
  location: z.string().max(120).optional().default(""),
  turns: z.array(intakeTurnSchema).max(16).default([]),
});
export type NextIntakeRequest = z.infer<typeof nextIntakeRequestSchema>;

export const createProjectRequestSchema = z.object({
  initialRequest: z.string().min(3).max(1000),
  brief: projectBriefSchema,
  turns: z.array(intakeTurnSchema).max(16),
  media: z.array(z.object({
    assetId: z.string().min(1),
    caption: z.string().max(180).optional(),
  })).max(12).default([]),
  publish: z.boolean().default(false),
});

export const publishProjectRequestSchema = z.object({
  publish: z.literal(true),
});

export const setRoleRequestSchema = z.object({
  role: userRoleSchema,
});

export const accountKindSchema = z.enum(["COMPANY", "SOLE_TRADER"]);

export const upsertContractorProfileSchema = z.object({
  accountKind: accountKindSchema,
  businessName: z.string().min(2).max(120),
  about: z.string().max(2000).optional().nullable(),
  serviceArea: z.string().max(180).optional().nullable(),
  services: z.array(z.string().min(1).max(60)).max(20).default([]),
  logoUrl: z.string().url().optional().nullable(),
});

export const submitQuoteSchema = z.object({
  labourPence: z.number().int().min(0).max(50_000_000),
  materialsPence: z.number().int().min(0).max(50_000_000),
  wastePence: z.number().int().min(0).max(50_000_000).default(0),
  otherPence: z.number().int().min(0).max(50_000_000).default(0),
  durationText: z.string().max(120).optional().nullable(),
  materialsIncluded: z.boolean().default(false),
  warrantyText: z.string().max(300).optional().nullable(),
  scopeText: z.string().max(2000).optional().nullable(),
  assumptionsText: z.string().max(2000).optional().nullable(),
  exclusionsText: z.string().max(2000).optional().nullable(),
});

export const createPortfolioSchema = z.object({
  title: z.string().min(2).max(120),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  services: z.array(z.string().min(1).max(60)).max(12).default([]),
  mediaUrls: z.array(z.string().url()).min(1).max(20),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const createCallRequestSchema = z.object({
  note: z.string().max(400).optional().nullable(),
});

export const respondCallRequestSchema = z.object({
  decision: z.enum(["APPROVED", "DECLINED"]),
});

export type ApiError = {
  error: { message: string; code: string };
};
