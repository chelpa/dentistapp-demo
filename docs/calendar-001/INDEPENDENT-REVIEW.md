# Independent Codex review · DENTISTAPP-CALENDAR-001

Decision: **REVIEW_PASS_LIMITED** for inspected source logic. This does not approve a merge, deployment, clinical use, or all UI acceptance tests.

Reviewed at 2026-10-12T19:50:03Z. Baseline HEAD: `aaa83077c462b4de8b7a509ee76946ce69fdc89a`; candidate was uncommitted when inspected. Compare the SHA-256 manifest before attaching this review to a later commit. Reviewer was separate from implementer. Claude Code was not used.

## Finding and repair

**P2, repaired:** initial `src/components/DentistApp.tsx:86` rejected dates earlier than today but accepted elapsed times today. Reproduction: today 08:00, current local time 09:30, free dentist and chair. Initial condition `form.date < today` returned false, contrary to A13. Final `DentistApp.tsx:78` calls `isPastAppointment`; helper at `src/lib/calendar.ts:43-46` checks the civil local date/time against an injectable clock. Executed tests cover earlier today, current time, later today, yesterday, tomorrow and invalid time. Independent extra check covers 09:30 versus 09:30:59. Historical appointment reading/cancellation is unaffected by this creation guard.

No remaining blocking source-logic finding identified in this review's scope.

## Evidence executed by reviewer

- `node scripts/test.mjs`: exit 0; TypeScript test compilation into temporary directory, 19 nested test cases passed. Node 18.14.0, host timezone America/Santiago. TAP reports one outer file with 19 nested cases; do not describe this as 19 browser tests.
- Separate `adversarial.cjs`: exit 0. Deterministic seed 123456789; 3,000 combinations of 1–18 appointments, 93,780 overlapping pairs checked for distinct lanes and valid lane indices. Also checked leap day, Sunday workweek, week navigation, 19:45 plus 15 minutes, resource OR conflict across Confirmada/En espera/Completada, and elapsed time including seconds.
- Logs: `tests.log`, `adversarial.log`. Hash manifest: `source-hashes.txt`. Adversarial script retained outside repository; does not edit application sources.

## Source inspection conclusions and limits

- A01/A02: date helpers use local noon and Monday anchoring; automated dates/navigation passed. Today button wiring inspected, not clicked.
- A03: 5/7-day selector only changes visible dates; Sunday under workweek uses Monday for mobile list with explicit explanatory text. No appointment deletion path. Interaction not executed.
- A04/A05: the 15/30 grid uses constant 2.4 px/minute; 15-minute appointment height remains 34 px. Logic inspected, no visual fidelity claim for all durations.
- A06/A08/A09/A10: resource filters use intersection; save/status conflict uses full `data.appointments`, independent of filters. Same dentist OR assigned chair, half-open intervals, adjacent allowed. Automated helper evidence passed; final UI flow remains browser scope.
- A07: native button Enter/click opens slot date/time and valid filtered resources; last slot now preloads a duration that fits the 20:00 boundary. Native keyboard handler code inspected, not executed.
- A11: lane invariants have independent adversarial evidence; actual on-screen widths/legibility remain browser scope.
- A12: no chair migration fabricated. Demo appointment IDs/durations remain unchanged by type extension; missing chair receives unassigned label and filter. Missing chair does not imply an occupied chair.
- A13: invalid/out-of-window appointments in a visible week receive a warning and stay in that selected day's list; renderer intentionally omits invalid geometry. No data removal. A malformed date outside all visible days is not discoverable through this weekly renderer; broader persistence validation remains outside slice.
- Cancellation releases resource conflict checks; reactivation rechecks the entire appointment set. All four states have text/color in weekly UI. Completed appointments still occupy original reserved time per explicit tests.
- A14: native `dialog.showModal()`, Escape `onCancel`, cleanup close/focus restore inspected. Browser focus containment/return not tested by reviewer.
- A15/A16: mobile hidden/visible layout, list alternative, Mes/Día persistence hooks and budget code inspected. No mobile rendering, reload or budget UI flow executed by reviewer.
- A17: localStorage writes are non-atomic snapshots; no server or concurrency control. Two-tab lost updates remain a documented risk. No concurrency PASS.
- A18: tests executed; clean install, full app typecheck/build/export, diff and browser checks belong to parent evidence and are not claimed here.

Keep G3 dependencies, G5 comparison B/C and G6 publication HOLD. G4 needs browser evidence and remains limited by scenarios not exercised.

## SHA-256 of final inspected files

```
c8e175dd58666191241bbb360818899ec94621d9c29536b4c665c6aabcdec5c2  src/components/WeeklyCalendar.tsx
21cf5e2b081fee6edeb0b45c92ca6a43d1f3e78999a401987c2be1b864296e28  src/components/ModalDialog.tsx
17c5632753573db1a0a3522e8f96fb99a75e5e806483976e2d66fab4f1c8ea82  src/components/DentistApp.tsx
e629150624f9e85e0e54686c8ed4bf2b0cd08ef53d1e525dc402a1727d7a09a0  src/lib/calendar.ts
0495e21bbcbec2ce1ef72db0d2e9f914705086a7ef4a53395c09981b27884ffe  src/lib/demo.ts
```
