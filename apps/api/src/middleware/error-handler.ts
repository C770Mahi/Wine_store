import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed',
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  const statusCode = /not found/i.test(message) ? 404 : /invalid|expired|incorrect/i.test(message) ? 401 : 500;
  response.status(statusCode).json({ message });
}
