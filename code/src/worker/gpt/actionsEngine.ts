/**
 * Actions Engine
 * 
 * Handles OpenAPI schema parsing, validation, and execution of external API calls.
 */

interface ActionDefinition {
  id: number;
  name: string;
  description: string;
  openapi_schema: string;
  auth_type: string;
  api_key_encrypted: string;
  base_url: string;
}

interface ParsedAction {
  name: string;
  description: string;
  parameters: any;
  endpoint: string;
  method: string;
}

/**
 * Parse OpenAPI schema to extract action definitions
 */
export function parseOpenAPISchema(schema: string): ParsedAction[] {
  try {
    const spec = JSON.parse(schema);
    const actions: ParsedAction[] = [];
    
    // Parse paths
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, operation] of Object.entries(methods as any)) {
        if (typeof operation === 'object' && operation !== null) {
          const op = operation as any;
          actions.push({
            name: op.operationId || `${method}_${path}`,
            description: op.summary || op.description || '',
            parameters: op.parameters || [],
            endpoint: path,
            method: method.toUpperCase(),
          });
        }
      }
    }
    
    return actions;
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI schema: ${error}`);
  }
}

/**
 * Validate OpenAPI schema
 */
export function validateOpenAPISchema(schema: string): boolean {
  try {
    const spec = JSON.parse(schema);
    
    // Basic validation
    if (!spec.openapi && !spec.swagger) {
      throw new Error("Not a valid OpenAPI/Swagger schema");
    }
    
    if (!spec.paths) {
      throw new Error("Schema must contain paths");
    }
    
    return true;
  } catch (error) {
    throw new Error(`Invalid OpenAPI schema: ${error}`);
  }
}

/**
 * Execute an action/API call
 */
export async function executeAction(
  action: ActionDefinition,
  parameters: Record<string, any>
): Promise<any> {
  const schema = JSON.parse(action.openapi_schema);
  
  // Find the operation
  let targetPath = '';
  let targetMethod = '';
  let operation: any = null;
  
  for (const [path, methods] of Object.entries(schema.paths || {})) {
    for (const [method, op] of Object.entries(methods as any)) {
      if (typeof op === 'object' && op !== null) {
        targetPath = path;
        targetMethod = method.toUpperCase();
        operation = op;
        break;
      }
    }
    if (operation) break;
  }
  
  if (!operation) {
    throw new Error("No operation found in schema");
  }
  
  // Build URL
  let url = action.base_url || schema.servers?.[0]?.url || '';
  url += targetPath;
  
  // Replace path parameters
  for (const [key, value] of Object.entries(parameters)) {
    url = url.replace(`{${key}}`, String(value));
  }
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authentication
  if (action.auth_type === 'api_key') {
    headers['Authorization'] = `Bearer ${action.api_key_encrypted}`;
  } else if (action.auth_type === 'bearer') {
    headers['Authorization'] = `Bearer ${action.api_key_encrypted}`;
  }
  
  // Build request
  const requestOptions: RequestInit = {
    method: targetMethod,
    headers,
  };
  
  // Add body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(targetMethod)) {
    requestOptions.body = JSON.stringify(parameters);
  }
  
  // Execute request
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Action execution failed: ${error}`);
  }
  
  return await response.json();
}

/**
 * Convert actions to OpenAI function calling format
 */
export function actionsToFunctions(actions: ActionDefinition[]): any[] {
  return actions.map((action) => {
    try {
      const parsedActions = parseOpenAPISchema(action.openapi_schema);
      
      if (parsedActions.length === 0) {
        return null;
      }
      
      const parsed = parsedActions[0];
      
      // Build parameters schema
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      for (const param of parsed.parameters) {
        properties[param.name] = {
          type: param.schema?.type || 'string',
          description: param.description || '',
        };
        
        if (param.required) {
          required.push(param.name);
        }
      }
      
      return {
        name: action.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
        description: action.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      };
    } catch (error) {
      console.error('Failed to convert action to function:', error);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Import schema from URL
 */
export async function importSchemaFromURL(url: string): Promise<string> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch schema from ${url}`);
  }
  
  const schema = await response.text();
  
  // Validate it's valid JSON
  JSON.parse(schema);
  
  return schema;
}
