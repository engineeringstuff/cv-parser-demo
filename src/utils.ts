import schema1 from "@/schemas/part-1.json";
import schema2 from "@/schemas/part-2.json";
import schema3 from "@/schemas/part-3.json";
import type { SchemaType } from "@/types";
import OpenAI from "openai";
import type {
  ChatCompletionContentPart,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ReasoningEffort,
} from "openai/resources";

const pricingGrid: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.125e-6, output: 1e-6 },
  "gpt-5": { input: 0.625e-6, output: 5e-6 },
  "gpt-4o-mini": { input: 0.075e-6, output: 0.3e-6 },
  "gpt-4o": { input: 0.125e-6, output: 5e-6 },
  "gpt-4.1": { input: 1e-6, output: 4e-6 },
  "gpt-4.1-mini": { input: 0.2e-6, output: 0.8e-6 },
};

export const pdfToDataUrl = async (
  data: Uint8Array<ArrayBuffer>
): Promise<string> => {
  const base64String = Buffer.from(data).toString("base64");
  return `data:application/pdf;base64,${base64String}`;
};

export const uploadLayout = (title: string, body: string): string => {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        :root { color-scheme: light dark; }
        body { font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 2rem; line-height: 1.5; }
        .container { max-width: 980px; margin: 0 auto; }
        header { margin-bottom: 1.5rem; }
        h1 { font-size: 1.5rem; margin: 0 0 .75rem; }
        form { display: grid; gap: .75rem; padding: 1rem; border: 1px solid #9993; border-radius: 8px; }
        input[type=file] { padding: .5rem; border: 1px dashed #9996; border-radius: 6px; }
        button { padding: .6rem 1rem; border-radius: 6px; border: 1px solid #8886; cursor: pointer; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
        pre { white-space: pre-wrap; word-wrap: break-word; padding: 1rem; border: 1px solid #9993; border-radius: 8px; background: #00000008; }
        .kv { margin-left: 1rem; }
        .k { font-weight: 600; }
        details { border: 1px solid #9993; border-radius: 8px; padding: .5rem .8rem; }
        .badge { display: inline-block; padding: .2rem .5rem; border: 1px solid #9996; border-radius: 999px; font-size: .85rem; }
        .images { display: flex; gap: .5rem; flex-wrap: wrap; }
        .images img { max-width: 220px; height: auto; border: 1px solid #9993; border-radius: 6px; }
        .muted { color: #666; font-size: .9rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>CV Parser Demo</h1>
          <p class="muted">Upload and parse a PDF CV.</p>
        </header>
        ${body}
      </div>
    </body>
  </html>`;
};

const makeRequest = async (
  client: OpenAI,
  model: string | undefined,
  input: ChatCompletionMessageParam[],
  reasoning_effort: ReasoningEffort | undefined,
  verbosity: "low" | "medium" | "high" | undefined,
  schema: Record<string, unknown>,
  prompt_cache_key?: string | undefined,
  debug?: boolean | undefined
) => {
  const options: ChatCompletionCreateParamsNonStreaming = {
    model: model || "gpt-5-mini",
    messages: input,
    response_format: {
      type: "json_schema",
      json_schema: { name: "resume", schema, strict: true },
    },
    // service_tier: "flex",
  };

  if (prompt_cache_key) {
    options.prompt_cache_key = prompt_cache_key;
  }

  if (model?.startsWith("gpt-4.1")) {
    options.temperature = 0.2;
  }

  if (model == "gpt-5" || model == "gpt-5-mini") {
    options.reasoning_effort = reasoning_effort || "medium";
    options.verbosity = verbosity || "medium";
  }

  const response = await client.chat.completions.create(options, {
    timeout: 15 * 1000 * 60,
  });

  if (debug) {
    console.log("Response:", JSON.stringify(response, null, 2));
  }

  // Extract structured JSON text (SDK provides output_text and output_parsed)
  let jsonText = response.choices[0].message.content || "";
  let parsed: Partial<SchemaType> | undefined = undefined;
  try {
    parsed = JSON.parse(jsonText);
    jsonText = JSON.stringify(parsed, null, 2);
  } catch (e) {
    console.error(e);
  }

  return { jsonText, parsed, usage: response.usage };
};

export const renderObj = (obj: unknown): string => {
  if (obj === null) {
    return `<em>null</em>`;
  }
  if (typeof obj !== "object") {
    return `<span>${String(obj)}</span>`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `<span>[]</span>`;
    }
    return `<div class="kv">${obj
      .map(
        (v, i) => `<div><span class="k">[${i}]</span>: ${renderObj(v)}</div>`
      )
      .join("")}</div>`;
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) {
    return `<span>{}</span>`;
  }
  return `<div class="kv">${entries
    .map(([k, v]) => `<div><span class="k">${k}</span>: ${renderObj(v)}</div>`)
    .join("")}</div>`;
};

export interface CallLLMParams {
  client: OpenAI;
  model: string | undefined;
  pdfBase64: string;
  reasoning_effort: ReasoningEffort | undefined;
  verbosity: "low" | "medium" | "high" | undefined;
  schema?: Record<string, unknown> | undefined;
  debug: boolean;
  prompt_cache_key?: string | undefined;
}

export interface CallLLMResult {
  jsonText: string;
  parsed: Partial<SchemaType> | undefined;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  pricingInput: number;
  pricingOutput: number;
}

export const callLLM = async ({
  client,
  model,
  pdfBase64,
  reasoning_effort,
  verbosity,
  schema,
  debug,
  prompt_cache_key,
}: CallLLMParams): Promise<CallLLMResult> => {
  if (!schema) {
    throw new Error("Schema is required");
  }

  // Build a single message whose content includes the prompt and all images
  const input: Array<ChatCompletionMessageParam> = [
    {
      role: "user",
      content: [
        {
          type: "file",
          file: { filename: "cv.pdf", file_data: pdfBase64 },
        } as ChatCompletionContentPart.File,
        {
          type: "text",
          text: `You are a resume (CV) parsing assistant. Analyze the provided CV images and extract the information into a JSON object that strictly follows the provided JSON Schema. Do not include any additional fields beyond the schema. Use the best judgement to fill fields, and use empty strings or empty arrays where data is not present.`,
        },
      ],
    },
  ];

  const { jsonText, parsed, usage } = await makeRequest(
    client,
    model,
    input,
    reasoning_effort,
    verbosity,
    schema,
    prompt_cache_key,
    debug
  );

  if (debug) {
    console.log("Usage:", usage);
  }

  // Cost calculation
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const pricing = pricingGrid[model || "gpt-5-mini"];
  const totalCost = inputTokens * pricing.input + outputTokens * pricing.output; // $ per token based on given rates

  return {
    jsonText,
    parsed,
    inputTokens,
    outputTokens,
    pricingInput: pricing.input * 1e6,
    pricingOutput: pricing.output * 1e6,
    totalCost,
  };
};

export const callLLMSeparate = async (
  params: CallLLMParams
): Promise<CallLLMResult> => {
  const prompt_cache_key = `cv-parsing-${Math.random()}`;

  const candidate = await callLLM({
    ...params,
    prompt_cache_key,
    schema: schema1,
  });

  const result2 = await callLLM({
    ...params,
    prompt_cache_key,
    schema: schema2,
  });

  candidate.inputTokens += result2.inputTokens;
  candidate.outputTokens += result2.outputTokens;
  candidate.totalCost += result2.totalCost;
  if (candidate.parsed?.ResumeParserData && result2.parsed?.ResumeParserData) {
    candidate.parsed.ResumeParserData.Certification =
      result2.parsed.ResumeParserData.Certification;
    candidate.parsed.ResumeParserData.SegregatedCertification =
      result2.parsed.ResumeParserData.SegregatedCertification;
    candidate.parsed.ResumeParserData.SkillBlock =
      result2.parsed.ResumeParserData.SkillBlock;
    candidate.parsed.ResumeParserData.SkillKeywords =
      result2.parsed.ResumeParserData.SkillKeywords;
    candidate.parsed.ResumeParserData.SegregatedSkill =
      result2.parsed.ResumeParserData.SegregatedSkill;
    candidate.jsonText = JSON.stringify(candidate.parsed, null, 2);
  }

  const result3 = await callLLM({
    ...params,
    prompt_cache_key,
    schema: schema3,
  });

  candidate.inputTokens += result3.inputTokens;
  candidate.outputTokens += result3.outputTokens;
  candidate.totalCost += result3.totalCost;
  if (candidate.parsed?.ResumeParserData && result3.parsed?.ResumeParserData) {
    candidate.parsed.ResumeParserData.Experience =
      result3.parsed.ResumeParserData.Experience;
    candidate.parsed.ResumeParserData.SegregatedExperience =
      result3.parsed.ResumeParserData.SegregatedExperience;
    candidate.parsed.ResumeParserData.CurrentEmployer =
      result3.parsed.ResumeParserData.CurrentEmployer;
    candidate.parsed.ResumeParserData.JobProfile =
      result3.parsed.ResumeParserData.JobProfile;
    candidate.parsed.ResumeParserData.WorkedPeriod =
      result3.parsed.ResumeParserData.WorkedPeriod;
    candidate.parsed.ResumeParserData.GapPeriod =
      result3.parsed.ResumeParserData.GapPeriod;
    candidate.parsed.ResumeParserData.AverageStay =
      result3.parsed.ResumeParserData.AverageStay;
    candidate.parsed.ResumeParserData.LongestStay =
      result3.parsed.ResumeParserData.LongestStay;
    candidate.parsed.ResumeParserData.Summary =
      result3.parsed.ResumeParserData.Summary;
    candidate.parsed.ResumeParserData.ExecutiveSummary =
      result3.parsed.ResumeParserData.ExecutiveSummary;
    candidate.parsed.ResumeParserData.ManagementSummary =
      result3.parsed.ResumeParserData.ManagementSummary;
    candidate.parsed.ResumeParserData.Coverletter =
      result3.parsed.ResumeParserData.Coverletter;
    candidate.parsed.ResumeParserData.Publication =
      result3.parsed.ResumeParserData.Publication;
    candidate.parsed.ResumeParserData.SegregatedPublication =
      result3.parsed.ResumeParserData.SegregatedPublication;
    candidate.parsed.ResumeParserData.CurrentLocation =
      result3.parsed.ResumeParserData.CurrentLocation;
    candidate.parsed.ResumeParserData.PreferredLocation =
      result3.parsed.ResumeParserData.PreferredLocation;
    candidate.parsed.ResumeParserData.Availability =
      result3.parsed.ResumeParserData.Availability;
    candidate.parsed.ResumeParserData.Hobbies =
      result3.parsed.ResumeParserData.Hobbies;
    candidate.parsed.ResumeParserData.Objectives =
      result3.parsed.ResumeParserData.Objectives;
    candidate.parsed.ResumeParserData.Achievements =
      result3.parsed.ResumeParserData.Achievements;
    candidate.parsed.ResumeParserData.SegregatedAchievement =
      result3.parsed.ResumeParserData.SegregatedAchievement;
    candidate.jsonText = JSON.stringify(candidate.parsed, null, 2);
  }

  return candidate;
};
