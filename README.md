# LEX · Lanka Energy Exchange

A runnable Next.js 16 / React 19 / TypeScript implementation derived from `LEX_Complete_Website_Architecture.docx` (21 October 2026). This is a **procurement foundation demonstration**, not the entire production exchange.

## Run

Requires Node.js 24 (uses built-in `node:sqlite`) and npm 11.

```sh
cd /workspace/LEX1
npm ci
npm run dev
```

For production-mode local validation: `npm run build && npm start`.

SQLite records, sessions and audit events persist in `.data/lex.sqlite`. Initial synthetic fixtures are created once; setup never resets the database. Override `LEX_DB_PATH` with an absolute writable path to use a different database. SQLite is appropriate for this single-machine demo, not a horizontally scaled exchange. Use `LEX_SECURE_COOKIE=true` when serving over HTTPS. The default supports local HTTP development.

## Try the complete procurement flow

1. Open `/sign-in` and choose **Anjali Perera · Buyer maker**.
2. Create an energy requirement, review the version and publish a demo tender.
3. Sign out. Choose **Kavindi Silva · Supplier** and open **Supplier responses**. Submit an energy rate for the new invitation. Retain its receipt reference.
4. Sign back in as Anjali. Open the tender and **Close demo tender & disclose offers**. Responses remain sealed from buyer listings until close. Compare responses, then request independent approval.
5. Sign out and choose **Nimal Fernando · Independent approver**. Open the approval inbox, review the exact version and approve the demo award.
6. Inspect the new **draft contract**, version history and authenticated JSON report export. An award does not sign a contract or confirm any physical or financial outcome.

These identities are deliberately public demo personas. Never enter real personal, financial, sealed-bid or confidential data. This is not production authentication or an admission process.

## Implemented

- Responsive maroon/yellow public landing page; markets and delivery gates; solutions, process and resources pages.
- Catalogue of all **120 route families** extracted from the document in `lib/routes.json`.
- Participant dashboard with explicitly synthetic activity, counts and illustrative chart with text alternative.
- Persistent requirement creation, tender publication/close, supplier offer receipts, post-close comparison, independent approval and contract-draft creation.
- Server-side role and organisation checks, optimistic record versions, transaction-protected workflow changes and event history.
- Opaque, expiring server-side demo sessions; HttpOnly/SameSite cookies; same-origin checks for commands; private export authentication; security headers.
- Organisation-specific assets, record search, audit history and JSON export.
- Unimplemented participant capabilities display unavailable states. Unknown routes return 404; unauthenticated workspace requests redirect to sign-in.

Public pages without approved content display a review-pending state. The LEX text mark is a typographic placeholder; no approved logo asset was supplied. English only: reviewed Sinhala/Tamil copy is still required. The in-app status screen is **not** independent monitoring. Operations and simulation are **not** separately deployed applications yet. The route catalogue is coverage metadata, not a claim that every screen is implemented.

## Verification

```sh
npm test             # full domain journey, tenant isolation, input validation, session lifecycle
npm run typecheck
npm run build
npm run test:e2e     # start the application first; requires Chromium
```

The browser smoke test defaults to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium executable, or install Playwright Chromium and unset the executable override in the test. `LEX_BASE_URL` defaults to the locally running port 3000. Browser tests create synthetic records in the selected application database. Use a separate `LEX_DB_PATH` when starting the test server if you need test isolation.

## Production work still required

See [delivery scope](docs/DELIVERY.md). This prototype has no OIDC/MFA, evidence upload/scanning, production membership, e-signatures, legal content, matching/risk/settlement engine, bank/registry/operator adapter, live data, production idempotency protocol, independently hosted status or isolated simulation. It cannot place live orders or make real payments. Accessibility support is built in, but WCAG conformance and full security qualification have not been certified.
