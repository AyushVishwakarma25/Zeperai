import express from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public userMessage?: string;

  constructor(message: string, statusCode = 500, userMessage?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.userMessage = userMessage || 'Something went wrong. Please try again.';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Checks if error message contains internal system paths, stacks, or code traces
 */
function isRawInternalError(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return true;
  const internalPatterns = [
    'node_modules',
    'at ',
    'TypeError:',
    'SyntaxError:',
    'ReferenceError:',
    'ERR_',
    'MODULE_NOT_FOUND',
    'supabase.co',
    'postgres',
    'sql',
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    '/',
    '\\'
  ];
  return internalPatterns.some(pattern => msg.includes(pattern));
}

/**
 * Structured JSON logger for server side logs (Vercel / Cloud Run compatible)
 */
export function logServerError(err: any, req?: express.Request, context?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    path: req?.originalUrl || req?.path || 'N/A',
    method: req?.method || 'N/A',
    userId: (req as any)?.user?.id || req?.body?.userId || 'anonymous',
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || 'N/A',
    errorName: err?.name || 'Error',
    errorMessage: err?.message || String(err),
    code: err?.code || err?.statusCode || 'N/A',
    stack: err?.stack || 'No stack trace available',
    context: context || {}
  };

  console.error(JSON.stringify(logData));
}

/**
 * Express Async Route Handler Wrapper
 * Automatically forwards thrown errors or rejected promises to next(err)
 */
export const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized Express Global Error Handler Middleware
 */
export const globalErrorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // 1. Log detailed error with stack trace and context server-side
  logServerError(err, req);

  // 2. Determine safe HTTP status code
  const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);

  // 3. Construct generic safe response - NEVER expose stack, file paths, or raw internal errors
  let safeMessage = 'Something went wrong. Please try again.';

  if (err instanceof AppError || err.isOperational) {
    safeMessage = err.userMessage || 'Something went wrong. Please try again.';
  } else if (statusCode === 400 && err.message && !isRawInternalError(err.message)) {
    safeMessage = err.message;
  } else if (statusCode === 401) {
    safeMessage = 'Authentication failed. Please sign in again.';
  } else if (statusCode === 403) {
    safeMessage = 'Access denied. You do not have permission to perform this action.';
  } else if (statusCode === 404) {
    safeMessage = 'The requested resource was not found.';
  } else if (statusCode === 429) {
    safeMessage = 'Too many requests. Please slow down and try again shortly.';
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
    message: safeMessage
  });
};

/**
 * Process-Level Handlers for Uncaught Exceptions and Unhandled Rejections
 */
export function setupProcessLevelHandlers() {
  process.on('uncaughtException', (err: Error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      event: 'uncaughtException',
      message: err?.message || String(err),
      stack: err?.stack || 'N/A'
    }));
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      event: 'unhandledRejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || 'N/A'
    }));
  });
}
