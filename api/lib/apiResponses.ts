/**
 * Standardized API response builders
 * Ensures consistent response format across all endpoints
 */

import type { VercelResponse } from '@vercel/node';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: VercelResponse,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  } as ApiSuccessResponse<T>);
}

/**
 * Send error response
 */
export function sendError(
  res: VercelResponse,
  message: string,
  statusCode: number = 400,
  code?: string
): void {
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  } as ApiErrorResponse);
}

/**
 * Send validation error
 */
export function sendValidationError(
  res: VercelResponse,
  field: string,
  reason: string
): void {
  sendError(res, `${field} is invalid: ${reason}`, 400, 'VALIDATION_ERROR');
}

/**
 * Send not found error
 */
export function sendNotFound(res: VercelResponse, resource: string): void {
  sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Send unauthorized error
 */
export function sendUnauthorized(res: VercelResponse): void {
  sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
}

/**
 * Send forbidden error
 */
export function sendForbidden(res: VercelResponse, reason?: string): void {
  sendError(res, `Forbidden${reason ? `: ${reason}` : ''}`, 403, 'FORBIDDEN');
}

/**
 * Send internal server error
 */
export function sendInternalError(res: VercelResponse, message?: string): void {
  sendError(
    res,
    message || 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
}

/**
 * Send method not allowed error
 */
export function sendMethodNotAllowed(
  res: VercelResponse,
  method: string,
  allowed: string[]
): void {
  res.setHeader('Allow', allowed);
  sendError(
    res,
    `Method ${method} not allowed. Use: ${allowed.join(', ')}`,
    405,
    'METHOD_NOT_ALLOWED'
  );
}

/**
 * Send rate limit error
 */
export function sendRateLimited(
  res: VercelResponse,
  retryAfter?: number
): void {
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter);
  }
  sendError(
    res,
    'Too many requests',
    429,
    'RATE_LIMITED'
  );
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total?: number;
  hasMore?: boolean;
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: VercelResponse,
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Wrap async handler with error handling
 */
export function asyncHandler(
  handler: (req: any, res: VercelResponse) => Promise<void>
) {
  return async (req: any, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('[asyncHandler] Uncaught error:', error);
      if (!res.headersSent) {
        sendInternalError(res);
      }
    }
  };
}
