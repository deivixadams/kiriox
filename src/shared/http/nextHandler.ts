import { ApiError } from './ApiError';
import { fail } from './response';

type RouteContext = { params?: unknown } | undefined;
type RouteHandler = (request: Request, context?: RouteContext) => Promise<Response> | Response;

export function nextHandler(handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return fail(error.status, error.code, error.message, error.details);
      }

      console.error('Unhandled route error:', error);
      return fail(500, 'internal_error', 'Internal server error');
    }
  };
}
