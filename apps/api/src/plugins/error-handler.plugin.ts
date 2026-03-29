import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import {
  DomainError,
  ProductNotFoundException,
  CategoryNotFoundException,
  InsufficientStockError,
  OrderNotFoundException,
  InvalidOrderStatusTransitionError,
} from '@domain/index';

/**
 * Shape of a single Zod validation issue translated for the API consumer.
 */
interface ValidationDetail {
  field: string;
  message: string;
}

/**
 * Mapping entry that describes how a DomainError subclass should be
 * translated into an HTTP response.
 */
interface ErrorMapEntry {
  /** HTTP status code to return. */
  status: number;
  /** Technical error identifier (always in English). */
  error: string;
  /** Human-readable message in pt-BR. */
  message: string;
}

/**
 * Maps DomainError constructors to their HTTP response configuration.
 *
 * Open/Closed principle: add a new entry here and in `libs/domain/src/errors/`
 * without touching handler logic. Each entry is the single source of truth for
 * how a domain error surfaces as an HTTP response.
 */
const errorMap = new Map<new (...args: never[]) => DomainError, ErrorMapEntry>([
  [
    ProductNotFoundException,
    { status: 404, error: 'ProductNotFoundException', message: 'Produto não encontrado' },
  ],
  [
    CategoryNotFoundException,
    { status: 404, error: 'CategoryNotFoundException', message: 'Categoria não encontrada' },
  ],
  [
    InsufficientStockError,
    { status: 400, error: 'InsufficientStockError', message: 'Estoque insuficiente' },
  ],
  [
    OrderNotFoundException,
    { status: 404, error: 'OrderNotFoundException', message: 'Pedido não encontrado' },
  ],
  [
    InvalidOrderStatusTransitionError,
    {
      status: 400,
      error: 'InvalidOrderStatusTransitionError',
      message: 'Transição de status inválida para o pedido',
    },
  ],
]);

/**
 * Registers the global Fastify error handler.
 *
 * Classification logic (ADR-0002):
 *  1. `DomainError`  → look up `errorMap` → respond with mapped status + envelope.
 *  2. `ZodError`     → 400 + `{ error, message, details[] }`.
 *  3. Any other      → log internally with stack trace + respond 500 with generic envelope.
 *
 * Guarantees:
 * - No stack trace is ever exposed in the HTTP response body.
 * - `statusCode` is only in the HTTP header, never in the body.
 * - `message` is always in pt-BR (ADR-0001).
 *
 * @param app - The Fastify instance to register the handler on.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply): void => {
    // ── Path 1: Known domain errors ──────────────────────────────────────
    if (error instanceof DomainError) {
      const entry = errorMap.get(error.constructor as new (...args: never[]) => DomainError);

      if (entry) {
        reply.status(entry.status).send({
          error: entry.error,
          message: entry.message,
        });
        return;
      }

      // Unmapped DomainError subclass — treat as internal (defensive).
      request.log.error({ err: error }, 'Unmapped DomainError encountered');
      reply.status(500).send({
        error: 'InternalServerError',
        message: 'Erro interno do servidor',
      });
      return;
    }

    // ── Path 2: Zod validation errors ────────────────────────────────────
    if (error instanceof ZodError) {
      const details: ValidationDetail[] = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'unknown',
        message: issue.message,
      }));

      reply.status(400).send({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details,
      });
      return;
    }

    // ── Path 3: Unexpected / infrastructure errors ────────────────────────
    // Log with full stack trace internally — never expose to the client.
    request.log.error({ err: error }, 'Unexpected internal error');
    reply.status(500).send({
      error: 'InternalServerError',
      message: 'Erro interno do servidor',
    });
  });
}
