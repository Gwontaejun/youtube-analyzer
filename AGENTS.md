# YouTube Analyzer — Agent Guide

## Product and scope

This is a monorepo for analyzing public YouTube comments. The stack is Next.js/TypeScript (`frontend/`) and FastAPI/Python (`backend/`).

Current completed scope is **Phase 0–11 only**: URL detection, metadata resolution, comment collection, preprocessing/batching, Gemini classification, aggregation, final insights, unified API, responsive input/loading UI, and responsive result dashboard. Do not add persistence, authentication, queues, payment, OAuth, or real-time progress until their designated phase.

## Architecture rules

- API keys are backend-only environment variables. Never expose, log, hard-code, or add them to frontend code.
- URL parsing belongs in `backend/app/services/youtube_target.py`; route handlers must stay thin.
- YouTube API integration belongs in `backend/app/services/youtube_service.py`.
- Validate all external and API-bound data with Pydantic schemas.
- Keep channel and video resolution separate until comment collection; later pipeline stages should be shared only after collection.
- Convert expected errors into safe HTTP responses. Never return tracebacks or provider error bodies.

## Commands

```powershell
cd backend; pytest
cd backend; python -m uvicorn app.main:app --reload
cd frontend; npm run lint
cd frontend; npm run build
npm run dev
npm run frontend
```

## Before ending every phase

1. Run relevant tests and build/lint checks.
2. Refactor duplicated code only where it improves clarity.
3. Remove dead files, unused imports, obsolete fixtures, and generated artifacts.
4. Confirm `.env`, credentials, and build artifacts are ignored.
5. Update README if setup, endpoint behavior, or phase scope changes.

## Test expectations

- Unit-test URL variants and malformed/non-YouTube inputs.
- Mock YouTube HTTP calls; tests must not require a real API key or network access.
- Add regression tests for each bug fixed.

## Naming and conventions

- Python: type hints, `snake_case`, Pydantic models in `schemas/`.
- TypeScript: strict mode, components in PascalCase.
- API JSON uses camelCase at the boundary; Python may use snake_case internally through Pydantic aliases.
