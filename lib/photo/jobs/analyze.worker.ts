/**
 * Analysis worker.
 *
 * Files arrive as `Blob` references, which structured clone passes by handle —
 * a 25 MB ARW is not copied into the worker, and the worker still only reads the
 * few kilobytes it needs from it.
 */
import { type AnalyzeInput, type AnalyzeOutput, analyzeFile } from "./analyzeTask";

export interface AnalyzeRequest extends AnalyzeInput {
  type: "analyze";
  id: string;
}

export type AnalyzeResponse =
  | { type: "done"; id: string; payload: AnalyzeOutput }
  | { type: "error"; id: string; message: string };

self.addEventListener("message", async (event: MessageEvent<AnalyzeRequest>) => {
  const request = event.data;
  if (!request || request.type !== "analyze") return;

  try {
    const payload = await analyzeFile(request);
    const response: AnalyzeResponse = { type: "done", id: request.id, payload };
    self.postMessage(response);
  } catch (error) {
    const response: AnalyzeResponse = {
      type: "error",
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
