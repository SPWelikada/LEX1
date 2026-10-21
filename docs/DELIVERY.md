# Architecture delivery map

Source: user-supplied Lanka Energy Exchange Website Architecture, v1.0. The reference system architecture, original 110-feature document, route CSV and approved logo were mentioned by the document but not supplied. No unverified organisational, licence, partner or market claims are published.

| Property | Current implementation | Remaining work |
|---|---|---|
| Public P01–P20 | Landing, markets, solutions, process and route resources; approved-content pending pages | Reviewed legal/company/editorial content, locale translations, enquiry service, publishing workflow |
| Identity U01–U10 | Clearly labelled demo identity selection and session lifecycle; admission preview | OIDC/MFA, saved server admission forms, evidence scanning, invitations, recovery, step-up |
| Participant A01–A60 | Procurement demonstration and scoped assets/reports; planned capability states | Full asset management, onboarding, signatures, domain integrations, product-specific functionality |
| Operations O01–O27 | Catalogue only; no staff authority provided | Separate restricted staff app/SSO, desk-specific policies, makers/checkers, evidence and partner integrations |
| Status T01–T02 | Explicitly labelled in-app preview | Independent hosting, monitoring, incident publication and timeline |
| Simulation X01 | No live trading path exists; current app is a synthetic procurement demo | Separate simulation deployment, identity, database, keys and adapters |

## Current workflow semantics

A buyer creates a draft requirement. Publishing creates an open tender in a transaction. A synthetic supplier sees open invitations without competitor responses and can submit once per invitation. Closing disclosure changes the tender to Evaluation. The buyer can then request independent approval, and a distinct approver can approve the current version. This creates a draft contract using the lowest synthetic energy-rate response. All demo responses use the same illustrative service charge; network charges, losses and taxes are excluded, and there is no claim of a complete delivered-cost calculation or automated production award suitability. Production qualification, exclusions, weighted evaluation, independent sealed-bid policy and explicit supplier selection require domain design.

The server checks session, organisation, actor role, record kind, status and expected version. Transactions protect workflow writes. History records all implemented state changes. Supplier access is limited to the demo invitation projection and response command. Production record entitlements, mandate and policy versions are not implemented.

## Next delivery gates

1. Complete Gate A: real identity/admission, company/asset/evidence workflows, draft editing with conflict handling, tenders/invitations/deadlines, supplier qualifications, approved comparison criteria, decision rejection/resubmission, signatures, reports and private support.
2. Gate B: separate synthetic trading application and authoritative simulation adapters, durable command receipts and unknown-outcome resolution.
3. Gate C: only after operating arrangements and services exist, integrate matching, credit, scheduling, metering, settlement and bank confirmations with domain-level deduplication and entitlement checks.
4. Gate D: scheme/product-specific certificates, flexibility, derivatives and cross-border functionality, each independently entitled and qualified.

Do not activate a product based on a visible route or demo login. Real legal commitments and financial confirmations must come from authoritative services.
