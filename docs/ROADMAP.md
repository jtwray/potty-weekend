# Potty Weekend — Roadmap

Updated: October 5, 2026

## Goal and rules

Help a parent run a calm weekend of potty practice with a quick reminder and log. A weekend starts learning; it is not a deadline for the child.

Ship one small slice at a time. Each slice needs an observable result and a stopping point. Keep the static app, no build step, and injected storage adapter unless a validated need requires more. Fix broken core flows before adding capabilities.

Live app: https://potty-weekend.netlify.app/
Repository: https://github.com/jtwray/potty-weekend
Verification evidence: [VERIFICATION.md](VERIFICATION.md)

## Milestones

| Milestone | Status | Deliverable | Completion gate |
| --- | --- | --- | --- |
| M0 — Barebones v1 | Shipped | Foreground timer; attempt log; optional bowl photos and volume; gentle feedback; parent guide; device storage | GitHub source and Netlify app live; browser smoke test passed for timer and log persistence |
| M1 — Phone and real-use validation | Next | Confirm the actual phone workflow and record the few biggest points of friction | Phone smoke test passes; one practice day is observed; parent reports whether the app helps without interrupting care |
| M2 — Social link preview | Planned, bounded polish | One static share image plus Open Graph and Twitter/X metadata | Public image and initial HTML metadata work; preview checked on the intended sharing platform |
| M3 — Fix observed friction | Conditional | One narrowly scoped improvement selected from M1 findings | Parent repeats the affected flow successfully; existing logs remain accessible |
| M4 — Shared parent storage | Deferred | Authenticated cloud adapter for two parents, if needed | Real demand for sharing; authorization and migration plan agreed; two devices pass save/read/delete checks |

M2 can be completed while waiting for M1's real-use feedback. It is a small sharing improvement, not permission to expand the app. M3 and M4 require the evidence above.

## M1 — Phone and real-use validation

On the final live URL, using clearly identified disposable test records:

- Start, pause, resume, and snooze the reminder.
- Save a no-output attempt.
- Save a pee attempt with an optional bowl photo; refresh and reopen the photo.
- Confirm timestamps match the phone's local time.
- Export the log; confirm the file explains that photo bytes are not included.
- Delete the test attempt and confirm its photo is gone.
- Confirm failures do not erase the draft.

During one actual practice day, note:
1. Is saving an attempt fast enough while caring for the child?
2. Are reminders helpful, too frequent, or easy to ignore?
3. Is the photo/volume step worth the effort?

Keep a phone alarm as backup. Verify phone behavior without claiming that a closed tab or locked phone can reliably alert.

**Stop:** record concrete findings. Do not add a wishlist of features to this slice.

## M2 — Social link preview

**Scope**
- One static branded image; proposed canvas: 1200 × 630.
- Existing blue/yellow palette, large readable title, simple friendly motif.
- Proposed title: “Potty Weekend”.
- Proposed description: “Gentle reminders, quick potty logs, and encouragement for little learners.”
- Open Graph title, description, type, canonical URL, image URL, dimensions, and image alt text.
- Matching Twitter/X card metadata with `summary_large_image`.
- Metadata in the initial HTML; image at a public absolute HTTPS URL.
- Check a real preview where Tucker intends to share it. Platforms can crop or cache previews differently.

**Privacy**
Use only a generic branded image. No child photos, bowl-output photos, logs, or personal data.

**Completion gate**
The deployed image loads publicly, metadata points to the final production URL, and at least one intended sharing surface shows a sensible preview. If caching or platform access prevents a check, record it as unverified.

**Stop**
One image and a few tags. No image-generation service at runtime, personalization, dependencies, landing-page redesign, or new tracking.

## M3 — Fix observed friction

Select one improvement only after M1. Candidate areas are log speed, photo handling, reminder controls, and clearer parent copy. They are candidates, not committed work.

Protect existing records and the production origin. Require explicit agreement before data-destructive migration.

## M4 — Shared storage, only when justified

Implement the existing asynchronous storage interface with an authenticated Netlify Functions + Blobs adapter. Plan per-family access, safe handling of simultaneous parent updates, photo ownership, export/deletion, and an explicit migration from device storage.

Keep credentials server-side. Do not turn on a shared unprotected store. Cloud storage must not silently replace or discard local history.

## Deferred ideas

- Reliable background/push reminders: a separate feasibility slice if foreground reminders prove insufficient; no delivery promise yet.
- Temporary screen-awake option: only if it addresses observed use friction; keep user control and acknowledge browser/device support.
- Automated volume reading from photos.
- Next-go forecasting from volume or sparse weekend logs. V1 shows observed same-day pee spacing only.
- More elaborate sounds, characters, animation, rewards, streaks, or step scoring.
- Accounts, payments, a marketing site, and broader product packaging.

Do not promote a deferred idea without a concrete use case and a small acceptance gate.
