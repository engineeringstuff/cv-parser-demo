import type { Env } from "@/env";
import completeSchema from "@/schemas/complete.json";
import {
  callLLM,
  callLLMSeparate,
  pdfToDataUrl,
  renderObj,
  uploadLayout,
  type CallLLMParams,
  type CallLLMResult,
} from "@/utils";
import { OpenAPIHono } from "@hono/zod-openapi";
import OpenAI from "openai";
import type { ReasoningEffort } from "openai/resources";

export const setupRoutes = (app: OpenAPIHono<{ Bindings: Env }>): void => {
  // GET: Upload page
  app.get("/", (c) => {
    const body = `
      <form method="POST" action="/parse" enctype="multipart/form-data">
        <label><strong>PDF CV</strong> (only .pdf)</label>
        <input type="file" name="file" accept="application/pdf,.pdf" required />

        <input type="hidden" name="model" value="gpt-4.1-mini" />
        <input type="hidden" name="reasoning_effort" value="medium" />
        <input type="hidden" name="verbosity" value="medium" />
        <input type="hidden" name="schema_type" value="separate" />

        <button type="submit">Upload & Parse</button>
      </form>
    `;
    return c.html(uploadLayout("Upload CV", body));
  });

  // GET: Upload page
  app.get("/debug", (c) => {
    const body = `
      <form method="POST" action="/parse" enctype="multipart/form-data">
        <label><strong>PDF CV</strong> (only .pdf)</label>
        <input type="file" name="file" accept="application/pdf,.pdf" required />

        <input type="hidden" name="debug" value="true" />

        <label><strong>Model:</strong></label>
        <select name="model" id="model">
          <option value="gpt-5-mini">gpt-5-mini</option>
          <option value="gpt-5">gpt-5</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4.1">gpt-4.1</option>
          <option value="gpt-4.1-mini" selected>gpt-4.1-mini</option>
        </select>
        <sub>Pricing information can be found <a href="https://platform.openai.com/docs/pricing?latest-pricing=batch" target="_blank" rel="noopener noreferrer">here</a></sub>

        <label><strong>Reasoning Effort:</strong></label>
        <select name="reasoning_effort" id="reasoning_effort">
          <option value="minimal">Minimal</option>
          <option value="low" selected>Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <label><strong>Verbosity:</strong></label>
        <select name="verbosity" id="verbosity">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>

        <label><strong>Schema:</strong></label>
        <select name="schema_type" id="schema_type">
          <option value="complete">Complete</option>
          <option value="separate" selected>Separate</option>
        </select>

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
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfBase64 = await pdfToDataUrl(bytes);
      if (pdfBase64.length == 0) {
        return c.html(
          uploadLayout("Error", `<p>Failed to extract images from PDF.</p>`),
          400
        );
      }

      const llmParams: CallLLMParams = {
        client: new OpenAI({ apiKey: c.env.OPENAI_API_KEY }),
        model: form["model"] as string | undefined,
        pdfBase64,
        reasoning_effort: form["reasoning_effort"] as
          | ReasoningEffort
          | undefined,
        verbosity: form["verbosity"] as "low" | "medium" | "high" | undefined,
        debug: form["debug"] == "true",
      };

      const schema_type = form["schema_type"] as string | undefined;
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

      let result: CallLLMResult;
      if (schema_type == "separate") {
        result = await callLLMSeparate(llmParams);
      } else {
        result = await callLLM({ ...llmParams, schema: completeSchema });
      }

      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const usageInfo = `<h2>Usage & Cost</h2>
      <p class="muted">
        Using Model: ${llmParams.model || "gpt-5-mini"}<br />
        Reasoning Effort: ${llmParams.reasoning_effort || "medium"}<br />
        Input tokens: ${result.inputTokens.toLocaleString()} | Output tokens: ${result.outputTokens.toLocaleString()}<br />
        Estimated cost: $${result.totalCost.toFixed(6)} (rates: $${result.pricingInput.toFixed(3)}/M input, $${result.pricingOutput.toFixed(3)}/M output)
      </p>`;
      const body = `${llmParams.debug ? usageInfo : ""}
        <p><a href="/">&#8592; Upload another PDF</a></p>
        <h2>Parsed JSON</h2>
        <div class="grid">
          <div>
            <h3>Raw</h3>
            <pre>${result.jsonText ? escapeHtml(result.jsonText) : ""}</pre>
          </div>
          <div>
            <h3>Formatted</h3>
            ${result.parsed ? renderObj(result.parsed) : "<p>Unable to parse JSON response.</p>"}
          </div>
        </div>
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
