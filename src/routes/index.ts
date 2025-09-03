import type { Env } from "@/env";
import schema from "@/schema.json";
import { OpenAPIHono } from "@hono/zod-openapi";
import OpenAI from "openai";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources";

const pdfToDataUrl = async (data: Uint8Array<ArrayBuffer>): Promise<string> => {
  const base64String = Buffer.from(data).toString("base64");
  return `data:application/pdf;base64,${base64String}`;
};

const uploadLayout = (title: string, body: string): string => {
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
          <p class="muted">Upload a PDF CV. It will be converted to images (max width 1024) and parsed to JSON using OpenAI.</p>
        </header>
        ${body}
      </div>
    </body>
  </html>`;
};

const renderObj = (obj: unknown): string => {
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

export const setupRoutes = (app: OpenAPIHono<{ Bindings: Env }>): void => {
  // GET: Upload page
  app.get("/", (c) => {
    const body = `
      <form method="POST" action="/parse" enctype="multipart/form-data">
        <label><strong>PDF CV</strong> (only .pdf)</label>
        <input type="file" name="file" accept="application/pdf,.pdf" required />
        <button type="submit">Upload & Parse</button>
      </form>
    `;
    return c.html(uploadLayout("Upload CV", body));
  });

  // POST: Handle PDF upload, convert to images, call OpenAI, render results
  app.post("/parse", async (c) => {
    try {
      const form = await c.req.parseBody();
      const file = form["file"] as File | undefined;
      if (!file) {
        return c.html(uploadLayout("Error", `<p>No file uploaded.</p>`), 400);
      }
      const filename =
        (file as unknown as { name?: string }).name || "upload.pdf";
      const isPdfMime = (file as File).type === "application/pdf";
      const isPdfExt = filename.toLowerCase().endsWith(".pdf");
      if (!isPdfMime && !isPdfExt) {
        return c.html(
          uploadLayout("Error", `<p>Only PDF files are allowed.</p>`),
          400
        );
      }

      // Read PDF bytes
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfBase64 = await pdfToDataUrl(bytes);

      if (pdfBase64.length == 0) {
        return c.html(
          uploadLayout("Error", `<p>Failed to extract images from PDF.</p>`),
          400
        );
      }

      // Build OpenAI request
      const client = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

      const prompt = `You are a resume (CV) parsing assistant. Analyze the provided CV images and extract the information into a JSON object that strictly follows the provided JSON Schema. Do not include any additional fields beyond the schema. Use the best judgement to fill fields, and use empty strings or empty arrays where data is not present.`;

      // Build a single message whose content includes the prompt and all images
      const input: Array<ChatCompletionMessageParam> = [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: { filename: "cv.pdf", file_data: pdfBase64 },
            } as ChatCompletionContentPart.File,
            { type: "text", text: prompt },
          ],
        },
      ];

      const response = await client.chat.completions.create(
        {
          model: "gpt-5-mini",
          messages: input,
          response_format: {
            type: "json_schema",
            json_schema: { name: "resume", schema },
          },
          // service_tier: "flex",
        },
        { timeout: 15 * 1000 * 60 }
      );

      console.log(JSON.stringify(response, null, 2));

      // Extract structured JSON text (SDK provides output_text and output_parsed)
      const jsonText = response.choices[0].message.content || "";
      let parsed: unknown = undefined;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        console.error(e);
      }

      // Cost calculation
      const usage = response.usage;
      const inputTokens = usage?.prompt_tokens ?? 0;
      const outputTokens = usage?.completion_tokens ?? 0;
      const cost = inputTokens * 0.125e-6 + outputTokens * 1.0e-6; // $ per token based on given rates

      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const body = `
        <p>
          <span class="badge">File:</span> ${filename}
        </p>
        <h2>Parsed JSON</h2>
        <div class="grid">
          <div>
            <h3>Raw</h3>
            <pre>${jsonText ? escapeHtml(jsonText) : ""}</pre>
          </div>
          <div>
            <h3>Formatted</h3>
            ${parsed ? renderObj(parsed) : "<p>Unable to parse JSON response.</p>"}
          </div>
        </div>
        <h2>Usage & Cost</h2>
        <p class="muted">
          Input tokens: ${inputTokens.toLocaleString()} | Output tokens: ${outputTokens.toLocaleString()}<br />
          Estimated cost: $${cost.toFixed(6)} (rates: $0.125/M input, $1.00/M output)
        </p>
        <p><a href="/">&#8592; Upload another PDF</a></p>
      `;

      return c.html(uploadLayout("Parsed CV", body));
    } catch (err) {
      console.error(err);
      return c.html(
        uploadLayout("Error", `<p>Unexpected error parsing CV.</p>`),
        500
      );
    }
  });
};
