import { knownModels } from '../../domain/pricing';

/** Served at /docs by swagger-ui-express and at /openapi.json for codegen. */
export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Token Ledger API',
    version: '1.0.0',
    description: 'Records LLM calls and reports what they cost, per user and per model.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@token-ledger.dev' },
          password: { type: 'string', example: 'demo1234' },
        },
      },
      UsageDraft: {
        type: 'object',
        required: ['model', 'promptTokens', 'completionTokens'],
        properties: {
          model: { type: 'string', enum: knownModels() },
          promptTokens: { type: 'integer', minimum: 0, example: 1420 },
          completionTokens: { type: 'integer', minimum: 0, example: 380 },
          latencyMs: { type: 'integer', minimum: 0, example: 940 },
          occurredAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'unknown_model' },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Exchange credentials for a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } },
        },
        responses: {
          200: { description: 'Signed in' },
          401: {
            description: 'Rejected',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/usage': {
      post: {
        summary: 'Record one model call',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UsageDraft' } } },
        },
        responses: {
          201: { description: 'Recorded, with the computed cost' },
          422: { description: 'Model is not on the price list' },
        },
      },
    },
    '/usage/ledger': {
      get: {
        summary: 'Ledger lines, running balance and per-model totals',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 14 } },
        ],
        responses: { 200: { description: 'The ledger for the signed-in user' } },
      },
    },
    '/models': {
      get: { summary: 'The price list this deployment bills against', responses: { 200: { description: 'Rates' } } },
    },
    '/health': {
      get: { summary: 'Liveness probe', responses: { 200: { description: 'Up' } } },
    },
  },
} as const;
