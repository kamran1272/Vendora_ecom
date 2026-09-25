# Vendora deployment

Vendora deploys as four services:

- `apps/api` on Render
- `apps/web` on Vercel
- `apps/seller-panel` on Vercel
- `apps/admin-panel` on Vercel

## Render API

1. Push the repository to GitHub and create a Render Blueprint from the repository. Render will read the root `render.yaml`.
2. Set `CORS_ALLOWED_ORIGINS` to the three Vercel origins, separated by commas:

   ```text
   https://your-store.vercel.app,https://your-seller.vercel.app,https://your-admin.vercel.app
   ```

3. Set `PUBLIC_WEB_URL` to the storefront URL.
4. Set `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` to one-time administrator credentials.
5. Deploy and verify `https://your-api.onrender.com/api/health`.

The API currently uses SQLite migrations. The Render blueprint therefore includes a persistent disk. A paid Render plan is required for that disk. Moving to Render Postgres requires converting the existing SQLite Prisma migration history before changing the Prisma provider.

## Vercel frontends

Create three Vercel projects from the same repository. Set each project's **Root Directory** and use the matching app directory:

| Project | Root Directory | Environment variable |
| --- | --- | --- |
| Storefront | `apps/web` | `VITE_API_BASE_URL=https://your-api.onrender.com/api` |
| Seller | `apps/seller-panel` | `VITE_API_BASE_URL=https://your-api.onrender.com/api` |
| Admin | `apps/admin-panel` | `VITE_API_BASE_URL=https://your-api.onrender.com/api` |

Use Production, Preview, and Development environment scopes as appropriate. Each app has a `vercel.json` SPA rewrite so React Router routes work after a refresh.

## Local development

The deployment files do not change local development. Run the complete local stack with:

```powershell
npm.cmd run dev
```