# handoff.md

Current task:

- Refine the Odii audio page experience, including the story-first archive, sound-map list, loading states, and shared agent guidance.

Touched files:

- `src/features/odii-audio/components/OdiiArchiveBrowse.tsx` provides a paginated story-first archive and an optional current-page place grouping view.
- `src/app/api/odii/ask/route.ts` is the server-side boundary for the future Odii RAG/LangGraph service.
- `docs/decisions/0002-odii-story-first-archive.md` and `0003-odii-rag-langgraph-assistant.md` record the governing decisions.

Next step:

- Configure `ODII_RAG_API_URL` (and optionally `ODII_RAG_API_TOKEN`) to a backend that returns a cited Odii response: `{ answer, sources: [{ stid, title, locationName?, formattedDuration? }] }`.
- Implement the backend Odii ingestion, hybrid retrieval, LangGraph routing, rate limiting, and evaluation suite described in ADR-0003.
- Visually review the latest Odii page adjustments in the browser, then commit the approved changes.

Open risk:

- The repository has no GitHub Actions workflow yet; CI and branch protection must be configured in the hosting provider separately.
