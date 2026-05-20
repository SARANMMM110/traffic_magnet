/**
 * Actions Engine
 * 
 * Executes external API calls based on OpenAPI schemas
 * Supports function calling/tool use for GPTs
 */

interface ActionConfig {
  id: number;
  name: string;
  description: string;
  action_type: string;
  auth_type: string | null;
  api_key_encrypted: string | null;
  base_url: string | null;
  openapi_schema: string;
  enabled: boolean;
}

interface FunctionCall {
  name: string;
  arguments: string;
}

interface ActionExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  status_code?: number;
}

/**
 * Parse OpenAPI schema to extract function definitions
 */
export function extractFunctionsFromSchema(schema: string): any[] {
  try {
    const parsed = JSON.parse(schema);
    const functions: any[] = [];

    // OpenAPI 3.0 format
    if (parsed.paths) {
      for (const [path, methods] of Object.entries(parsed.paths as any)) {
        for (const [method, details] of Object.entries(methods as any)) {
          if (typeof details !== "object" || !details) continue;
          const detailsObj = details as any;

          const func: any = {
            name: detailsObj.operationId || `${method}_${path.replace(/\//g, "_")}`,
            description: detailsObj.summary || detailsObj.description || "",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          };

          // Extract parameters
          if (detailsObj.parameters) {
            for (const param of detailsObj.parameters) {
              func.parameters.properties[param.name] = {
                type: param.schema?.type || "string",
                description: param.description || "",
              };
              if (param.required) {
                func.parameters.required.push(param.name);
              }
            }
          }

          // Extract request body schema
          if (detailsObj.requestBody?.content) {
            const content = detailsObj.requestBody.content;
            const schema =
              content["application/json"]?.schema ||
              content["application/x-www-form-urlencoded"]?.schema;

            if (schema?.properties) {
              for (const [propName, propSchema] of Object.entries(
                schema.properties as any
              )) {
                const propSchemaObj = propSchema as any;
                func.parameters.properties[propName] = {
                  type: propSchemaObj.type || "string",
                  description: propSchemaObj.description || "",
                };
              }
              if (schema.required) {
                func.parameters.required.push(...schema.required);
              }
            }
          }

          func._meta = {
            path,
            method: method.toUpperCase(),
          };

          functions.push(func);
        }
      }
    }

    return functions;
  } catch (error) {
    console.error("Failed to parse OpenAPI schema:", error);
    return [];
  }
}

/**
 * Execute an action
 */
export async function executeAction(
  action: ActionConfig,
  functionCall: FunctionCall,
  db: D1Database
): Promise<ActionExecutionResult> {
  try {
    const args = JSON.parse(functionCall.arguments);
    const functions = extractFunctionsFromSchema(action.openapi_schema);
    const targetFunction = functions.find((f) => f.name === functionCall.name);

    if (!targetFunction) {
      return {
        success: false,
        error: `Function ${functionCall.name} not found in schema`,
      };
    }

    const { path, method } = targetFunction._meta;
    let url = `${action.base_url || ""}${path}`;

    // Replace path parameters
    for (const [key, value] of Object.entries(args)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication
    if (action.auth_type === "api_key" && action.api_key_encrypted) {
      // In production, decrypt the key. For now, use as-is
      headers["Authorization"] = `Bearer ${action.api_key_encrypted}`;
    } else if (action.auth_type === "bearer" && action.api_key_encrypted) {
      headers["Authorization"] = `Bearer ${action.api_key_encrypted}`;
    }

    // Build request
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(method)) {
      requestOptions.body = JSON.stringify(args);
    }

    // Execute request
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    // Log the action
    await db
      .prepare(
        `INSERT INTO gpt_api_logs (gpt_id, action_id, request_type, request_payload, response_payload, status_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        0, // Will be set by caller
        action.id,
        functionCall.name,
        JSON.stringify(args),
        JSON.stringify(data),
        response.status
      )
      .run();

    if (!response.ok) {
      return {
        success: false,
        error: `API returned ${response.status}: ${JSON.stringify(data)}`,
        status_code: response.status,
      };
    }

    return {
      success: true,
      data,
      status_code: response.status,
    };
  } catch (error) {
    console.error("Action execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get actions for a GPT as function definitions for LLMs
 */
export async function getActionsAsFunctions(
  gptId: number,
  db: D1Database
): Promise<any[]> {
  const actionsResult = await db
    .prepare("SELECT * FROM gpt_actions WHERE gpt_id = ? AND enabled = 1")
    .bind(gptId)
    .all();

  const functions: any[] = [];

  for (const action of actionsResult.results || []) {
    const actionFunctions = extractFunctionsFromSchema(
      action.openapi_schema as string
    );
    functions.push(...actionFunctions);
  }

  return functions;
}

/**
 * Validate OpenAPI schema
 */
export function validateOpenAPISchema(schema: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = JSON.parse(schema);

    // Basic validation
    if (!parsed.openapi && !parsed.swagger) {
      return { valid: false, error: "Not a valid OpenAPI/Swagger schema" };
    }

    if (!parsed.paths || typeof parsed.paths !== "object") {
      return { valid: false, error: "Schema must contain 'paths' object" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid JSON" };
  }
}

/**
 * Import OpenAPI schema from URL
 */
export async function importSchemaFromURL(url: string): Promise<{
  success: boolean;
  schema?: string;
  error?: string;
}> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch: ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    let schema: string;

    if (contentType.includes("application/json")) {
      schema = await response.text();
    } else if (contentType.includes("yaml") || contentType.includes("yml")) {
      // For YAML, we'd need a parser. For now, return error
      return {
        success: false,
        error: "YAML schemas not yet supported. Please convert to JSON.",
      };
    } else {
      schema = await response.text();
    }

    // Validate
    const validation = validateOpenAPISchema(schema);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid schema: ${validation.error}`,
      };
    }

    return {
      success: true,
      schema,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
