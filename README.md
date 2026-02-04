# FratApp

Mobile-first web app for Greek life chapters to track receipts and reimbursements.

## Local Setup

1) Install dependencies

```bash
npm install
```

2) Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` to point at your local Postgres instance.

3) Run migrations

```bash
npx prisma migrate dev
```

4) Seed initial data

```bash
npx prisma db seed
```

5) Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.
