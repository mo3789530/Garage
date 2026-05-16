import { HTTPException } from "hono/http-exception";
import { ZodError, type ZodSchema } from "zod";

export function badRequest(message: string, details?: unknown) {
  return new HTTPException(400, {
    message,
    cause: details,
  });
}

export function notFound(message: string) {
  return new HTTPException(404, { message });
}

export function conflict(message: string) {
  return new HTTPException(409, { message });
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("invalid json body");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw badRequest("validation failed", error.flatten());
    }
    throw error;
  }
}

export function apiErrorBody(code: string, message: string, details?: unknown) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
