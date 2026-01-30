# Copilot / AI Agent Instructions for AixL repository

Overview
- This repository is a multi-part monorepo combining a Next.js web app (root `src/`), an admin Next.js app (`admin-web/`), a NestJS backend (`server/`), and smart contracts (`contracts/`). Agents should treat these as separate services with clear integration points.

Quick commands
- Start the primary frontend: `npm run dev` (root)
- Start frontend + backend + admin concurrently: `npm run dev:all` (root)
- Backend (NestJS) dev: `cd server && npm run start:dev`
- Admin frontend dev: `cd admin-web && npm run dev`
- Contracts: `cd contracts && npm run test` or `npm run node` for local Hardhat node

Architecture notes (big picture)
- Frontend: root `src/` uses Next.js (app router) and exposes UI in `src/app/` and components under `src/components/`.
- Admin: `admin-web/` is a separate Next.js site running on port 3002 in dev (`package.json` shows `next dev -p 3002`).
- Backend: `server/` is a NestJS application. Key entry: `server/src/main.ts`. Prisma schema is at `server/prisma/schema.prisma` and expects `DATABASE_URL`.
- Contracts: `contracts/` uses Hardhat. Compile/test/deploy scripts live in `contracts/package.json` and `contracts/scripts/`.

Project-specific conventions and patterns
- API modules: `server/src/` organizes domain modules (e.g. `market/`, `user/`, `vault/`) following NestJS module patterns—look at `server/src/app.module.ts` for wiring.
- DB / migrations: Prisma lives under `server/prisma/`. Use the `server` folder as the working directory when running prisma commands; env is read from `server/.env` (see `server/src/main.ts` which explicitly loads `.. /.env`).
- Web3: frontends use `viem` and `wagmi` for wallet & chain interactions. Contracts and backend rely on `ethers`/`viem` for on-chain ops.
- Shared UI: there are multiple component locations (`src/components/` and top-level `components/`)—check which app imports which before refactoring.

Integration points and environment
- Backend Swagger available in dev at `http://localhost:3001/api` (see `server/src/main.ts`).
- Database: set `DATABASE_URL` for Prisma migrations and runtime (`server/prisma/schema.prisma`).
- Local blockchain: use `cd contracts && npm run node` or Hardhat scripts under `contracts/scripts/` for local deployment.
- Concurrent dev: `npm run dev:all` launches frontend, backend and admin together—use this when testing cross-service flows.

Environment keys and external APIs
- `INFURA_API_KEY`: used by on-chain integrations (see `server/.env` example).
- `DEEPSEEK_API_KEY` / `AI_PROVIDER`: LLM provider keys used by `server/src/strategy/strategy.service.ts`.
- `GOLD_API_KEY`: optional key for `goldapi.io` if you want a paid reliable gold price source.
- `EXCHANGERATE_API_KEY`: optional key for `exchangerate.host` (some deployments now require an access_key). The backend will append `access_key` to exchange requests when provided.
- `FALLBACK_GOLD_PRICE`: optional numeric env var; if set the backend uses it as the gold price when external APIs fail (prevents simulated/unstable values).

Examples to reference
- Backend bootstrap: `server/src/main.ts` (CORS, Swagger, env loading)
- Prisma schema: `server/prisma/schema.prisma` (data models like `User`, `Market`, `Agent`)
- Contracts scripts: `contracts/scripts/deploy.ts` and `contracts/package.json`
- Root app entry: `src/app/layout.tsx` and `src/components/layout/` for UI shell patterns.

Agent guidance (how to act here)
- Make minimal, focused edits; preserve domain boundaries (avoid moving server logic into frontend).
- When adding or changing APIs, update backend Swagger or controller files in `server/src/*` and mention migration steps for Prisma if schema changes.
- For front-end work, prefer editing files under `src/` (root) or `admin-web/` depending on target app; ensure imports reference the correct component tree.

If something is missing
- If you need env values: check `.env` or `server/.env`; create a local `.env` with `DATABASE_URL` for dev.
- If uncertain which app owns a component, search imports for the component name—there are duplicate-named component folders.

Next steps / Who to ask
- After generating code or changes, run `npm run dev:all` and open `http://localhost:3000` and `http://localhost:3002` plus backend at `http://localhost:3001` to validate.
- Ask maintainers for database credentials, private keys, or external service tokens; do not hardcode secrets.

This file was generated to help AI agents onboard quickly. If any referenced path is outdated, please update this file.
