# Token Ledger

A small monolith that answers one question: **what did our LLM calls actually cost?**

Every model call is posted as a ledger line with its own debit and a running balance
against a monthly budget, so you can point at the exact call that blew it. One React +
TypeScript frontend, one Express + TypeScript API, one process, one deploy.

```
web (React 18 + TS + Tailwind)  ──►  /api  ──►  Express + TS  ──►  SQLite
                                                    │
                                         Clean Architecture layers
```

## Why a monolith

Everything here would work as four services. It does not need to be. One process means
one deploy, one log stream, and no network hop between the dashboard and the data. The
seams that matter are still there — they are just module boundaries instead of HTTP
boundaries, so pulling `usage` out into its own service later is a refactor, not a rewrite.

## Layout

```
server/
  src/domain/         pricing rules, cost maths, ledger balances — no imports from outside
  src/application/    use cases (signIn, recordUsage, getLedger) + the ports they depend on
  src/infrastructure/ SQLite repositories, JWT signing — the only place adapters live
  src/interfaces/http Express router, middleware, OpenAPI document
  src/container.ts    the single place that wires concrete adapters to ports
  tests/              domain unit tests + API integration tests (Vitest + Supertest)
web/
  src/components/     SignIn, BudgetBanner, LedgerTable, ModelTotals, RecordCall
  src/hooks/          useLedger — fetch, error and reload state in one place
  src/api/client.ts   typed fetch wrapper; every response shape is declared in types.ts
```

The dependency rule points inwards: `domain` imports nothing, `application` imports only
`domain`, `infrastructure` and `interfaces` import inwards and never each other. That is
what makes the tests fast — most of them never touch a database or a socket.

## Running it

```bash
# API — http://localhost:4000  (docs at /docs)
cd server && npm install && npm run dev

# UI — http://localhost:5173, proxied to the API
cd web && npm install && npm run dev
```

Sign in with `demo@token-ledger.dev` / `demo1234`. The database seeds itself with two
accounts and a week of traffic on first boot.

Or build the single container:

```bash
docker build -t token-ledger . && docker run -p 4000:4000 token-ledger
```

## API

| Method | Path                 | Notes                                              |
| ------ | -------------------- | -------------------------------------------------- |
| POST   | `/api/auth/login`    | Returns a JWT valid for 8 hours                     |
| POST   | `/api/usage`         | Records one call, responds with the computed cost   |
| GET    | `/api/usage/ledger`  | Lines, running balance, per-model totals, daily rollup |
| GET    | `/api/models`        | The price list this deployment bills against        |
| GET    | `/api/health`        | Liveness                                            |

Swagger UI is at `/docs`; the raw document is at `/openapi.json`.

## Decisions worth explaining

**SQLite, written like SQL Server.** The schema uses explicit types, foreign keys and a
composite index on `(user_id, occurred_at DESC)` that matches the dashboard's only read
pattern. Swapping in SQL Server means writing one new repository class and changing one
line in `container.ts` — nothing in `domain/` or `application/` moves.

**Money maths lives in the domain.** `costOf` and `toLedgerLines` are pure functions with
no I/O, so the cases that are painful to reproduce against a real database — a zero-token
call, a model that is not on the price list, a balance that crosses into the red — are
plain unit tests.

**Validation happens once, at the edge.** Zod parses request bodies and query strings into
typed values; the domain then enforces the rules that survive any transport. A bad request
gets a 400 with the field name, not a stack trace.

**The token stays in memory.** No `localStorage`, so a reload signs you out instead of
leaving a long-lived credential on disk.

## Tests

```bash
cd server && npm test
```

16 tests: pricing and ledger maths as unit tests, plus the auth, validation and ledger
endpoints exercised over real HTTP with Supertest against an in-memory database.

## Stack

React 18 · TypeScript · TailwindCSS · Vite · Node.js · Express · Zod · JWT · SQLite ·
Vitest · Supertest · OpenAPI/Swagger · Docker · GitHub Actions
