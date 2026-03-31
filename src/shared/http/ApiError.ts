export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, 'bad_request', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'unauthorized', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'forbidden', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'not_found', message);
  }
}
