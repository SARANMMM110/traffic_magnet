import type { CalculationEngineId, EngineResult } from "./types";
import { runEngineById } from "./calculationEngines";
import { CLIENT_ENGINE_RUNTIME } from "./clientEngineRuntime";

export type { EngineResult } from "./types";

export function runCalculationEngine(
  engineId: CalculationEngineId,
  values: Record<string, string>
): EngineResult {
  return runEngineById(engineId, values);
}

/** Inlined runtime — must stay aligned with `calculationEngines.ts`. */
export function clientCalculationSnippet(): string {
  return CLIENT_ENGINE_RUNTIME;
}
