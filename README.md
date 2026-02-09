# Backspaced Backlog

Next.js project backlog: list projects with URLs, tags, partners and screenshots.

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env` and set:

- **DATABASE_URL** – PostgreSQL connection string
- **ADMIN_PIN** – PIN for `/login` and `/admin`

## Database

Use your own PostgreSQL. Run the schema once:

```bash
psql "$DATABASE_URL" -f schema.sql
```

## Deploy on Coolify (Nixpacks)

1. In Coolify: **New resource** → **Application** → connect repo.
2. **Build pack**: choose **Nixpacks** ([docs](https://coolify.io/docs/applications/build-packs/nixpacks)). The repo root has a `nixpacks.toml` with build/start commands.
3. Add a **PostgreSQL** database in Coolify and link it. Set **DATABASE_URL** in the app’s environment (e.g. from the Postgres service’s connection string).
4. Run `schema.sql` once against that database (Coolify terminal or external client).
5. **Screenshots** are stored in `public/screenshots` and served at `/screenshots/{id}.jpg`. To keep them across redeploys, add a **persistent volume** in Coolify for `public/screenshots` (or the app root).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Coolify – Nixpacks](https://coolify.io/docs/applications/build-packs/nixpacks)
