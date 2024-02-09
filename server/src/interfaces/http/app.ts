import path from 'node:path';
import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { buildRouter, type RouterDeps } from './routes';
import { errorHandler, notFound } from './middleware';
import { openapiDocument } from './openapi';

export function createApp(deps: RouterDeps): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.use('/api', buildRouter(deps));
  app.get('/openapi.json', (_req, res) => res.json(openapiDocument));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

  // One process serves the API and the built UI — that is the whole point of the
  // monolith. STATIC_DIR is set by the Docker image; in dev, Vite serves the UI.
  const staticDir = process.env.STATIC_DIR;
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get(/^\/(?!api|docs|openapi\.json).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
