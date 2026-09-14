# Backend — School ERP

Express + Prisma + Redis (PostgreSQL). Real-time: Socket.io · Jobs: BullMQ · Cron: node-cron.

## Environment File Split

Do env files hain, aur `src/config/env.js` decide karta hai kaun si uthani hai:

| File | Kab load hoti hai | Kya values |
|---|---|---|
| `dev.env` | `NODE_ENV=local` | **Local Postgres + local Docker Redis** (committed, no real secrets) |
| `.env` | baqi sab cases (Docker/prod) | **Production: Neon + Upstash** (git me NAHI hai) |

Precedence (highest → lowest): real env vars (Docker `-e`) → `--env-file` values → file.
Isliye container me env vars hamesha file par bhaari hote hain.

> **Rule:** local kaam ke liye hamesha `NODE_ENV=local` ke saath chalao — warna galti se
> dev traffic production Neon/Upstash par jayega (yehi Upstash quota khatam hone ki wajah thi).

## Local Setup (Docker Compose)

Postgres 18 + Redis 7 same network par — production (Suga/Neon/Upstash) ko touch nahi karta:

```bash
cd Backend
docker compose up -d          # Postgres + Redis (pehli baar images pull hongi)

NODE_ENV=local npx prisma migrate deploy   # schema (pehli baar)
NODE_ENV=local npm run dev                 # backend on :5000, local services ke saath
```

Frontend alag se: `cd Frontend && npm run dev` (`http://localhost:3000`).

Na(objects) ke liye backend bhi container me chahiye to:

```bash
docker compose --profile full up -d        # + backend container (same network)
```

Data volumes (`schoolerp_pgdata`, `schoolerp_redisdata`) `docker compose down` par bache
rehte hain; poori reset ke liye `docker compose down -v`.

## Production Data → Local Sync (Neon)

Ek-tarafa copy: **Neon → local Postgres** (production par sirf READ hota hai, kabhi write nahi):

```bash
npm run sync:neon            # dry-run (kuch delete nahi karta, sirf dikhata hai)
npm run sync:neon -- --yes   # asli sync — local ka data REPLACE ho jata hai
```

Kya karta hai: `pg_dump` (Docker container se chalta hai, host par Postgres tools ki
zaroorat nahi) → local schema reset → single-transaction restore → row-count verify.

Safety guards (script me built-in):

1. Sirf **Neon → Local** — target localhost na ho to abort, kabhi ulta nahi
2. Source khud localhost ho to abort
3. `--yes` ke bina hamesha dry-run
4. Password kabhi logs/command-line par nahi aata (temp env file se)
5. `_prisma_migrations` copy nahi hoti — local apni migration history rakhta hai

Note: ye **live replication nahi** hai — fresh production data chahiye to command dobara chalao.

## npm Scripts

| Script | Kya karta hai |
|---|---|
| `NODE_ENV=local npm run dev` | Local dev server (`dev.env`, `--watch`) |
| `npm run seed` / `npm run demo` | Local seed/demo data (`dev.env`) |
| `npm run clean` | Org/branch data cleaner (`dev.env`) |
| `npm run sync:neon` | Neon → local sync (dry-run) |
| `npm test` | Node built-in test runner |

## Troubleshooting

| Masla | Hal |
|---|---|
| `ECONNREFUSED 127.0.0.1:6379` | Redis container nahi chal raha — `docker compose up -d` |
| `pg_dump: server version mismatch` | Local aur Neon ka major version same hona chahiye (dono v18) |
| Postgres container restart-loop | v18 image volume path `/var/lib/postgresql` hai (`/data` nahi) — compose me fix hai |
| Port 5432/6379 already allocated | Purana local Postgres/Redis service band karo ya compose ports badlo |
| Server prod DB/Redis par ja raha hai | `NODE_ENV=local` lagana bhool gaye — dev.env tabhi load hoti hai |
