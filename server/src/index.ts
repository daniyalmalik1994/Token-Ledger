import { buildContainer } from './container';
import { createApp } from './interfaces/http/app';

const port = Number(process.env.PORT ?? 4000);
const container = buildContainer();
const app = createApp(container);

app.listen(port, () => {
  console.log(`token-ledger api  → http://localhost:${port}/api`);
  console.log(`api documentation → http://localhost:${port}/docs`);
});
