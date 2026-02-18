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
- **BLESS_TOKEN** – (optional) [Browserless](https://browserless.io) API token for screenshot generation; omit to skip remote screenshots

## Database

Use your own PostgreSQL. Run the schema once:

```bash
psql "$DATABASE_URL" -f schema.sql
```

---

## Deploy on Coolify

### 1. Create the application

- In Coolify: **New resource** → **Application**
- Connect your Git repository (GitHub/GitLab/etc.)
- **Build pack**: select **Dockerfile**

### 2. Add PostgreSQL

- **New resource** → **Database** → **PostgreSQL**
- Create the database and note the connection string (or use Coolify’s “Link” if available)
- In your **Application** → **Environment**, add:
  - `DATABASE_URL` = your Postgres connection string (e.g. `postgresql://user:password@postgres:5432/dbname` if Postgres is in the same Coolify network)
  - `ADMIN_PIN` = PIN for `/login` and `/admin`
  - `BLESS_TOKEN` = (optional) Browserless token for screenshot generation

### 3. Run the database schema

After the first deploy (or before, if you have DB access):

- Use **Coolify** → your app → **Terminal**, or any client connected to the same Postgres
- Run: `psql "$DATABASE_URL" -f schema.sql`  
  (from a shell that has `DATABASE_URL` set, or paste the connection string into `psql` and run the contents of `schema.sql`)

### 4. (Optional) Persist screenshots

Screenshots are stored in `public/screenshots` (or `SCREENSHOT_STORAGE_PATH` if set) and served at `/screenshots/{id}.jpg`. To keep them across redeploys:

- In your **Application** → **Storages** (or **Volumes**): set **SCREENSHOT_STORAGE_PATH** to a persistent path (e.g. `/storage/screenshots`) and mount that volume, or mount `public/screenshots`

### 5. Deploy

- Trigger a **Deploy** from Coolify. The Dockerfile build will run `npm ci`, `npm run build`, and `npm start`.
- Set the **Public URL** (domain or Coolify proxy) in the application settings.

### References

- [Coolify – Applications](https://coolify.io/docs/applications)
- [Coolify – Dockerfile](https://coolify.io/docs/applications/build-packs/dockerfile)
- [Next.js Documentation](https://nextjs.org/docs)