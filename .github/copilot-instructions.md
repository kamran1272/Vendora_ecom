# Copilot Instructions for Vendora Monorepo

## Project overview
- This repository is a monorepo for Vendora ecommerce.
- Keep the existing architecture and app separation intact: `apps/web`, `apps/seller-panel`, `apps/admin-panel`, `apps/api`, and `packages/shared`.
- Do not create a new project structure or delete working code.
- Prefer incremental, production-style updates inside the current folders.

## Frontend conventions
- Use React + TypeScript + Vite for the frontend apps.
- Keep each app modular: `routes`, `layouts`, `pages`, `components`, `services`, `types`, and `config` as needed.
- Reuse the existing Tailwind styling system and preserve the current design language.
- Prefer typed data contracts and centralized service modules over inline mock logic spread across view files.

## Backend conventions
- Keep NestJS backend structure consistent with the current module-based architecture.
- Do not break the API bootstrap, configuration, or database integration flow.
- Prefer adding new modules/services under existing app paths instead of creating unrelated folders.

## Quality bar
- Make small, safe changes.
- Validate with the most relevant build or test command after code changes.
- Preserve compatibility with the current monorepo tooling and package scripts.
- Be careful with Windows-specific issues such as port conflicts and stale generated Prisma artifacts.

## Required behavior
- When working on frontend apps, keep the app runnable in the existing local Vite setup.
- When working on API/database files, avoid destructive changes and keep startup scripts intact.
- If a bug is caused by stale generated files or lock issues, clean the specific root cause instead of rewriting the app.

## Output expectations
- Keep implementation professional, organized, and consistent with the repo's established patterns.
- Favor clean folder structure, reusable components, and real domain-driven naming.
- Do not add unrelated demo scaffolding or placeholder architecture that conflicts with the current project.
