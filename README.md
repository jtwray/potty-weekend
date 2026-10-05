# Potty Weekend v1

A single-page weekend practice aid: timer, fast attempts, optional bowl photos and manual volume estimates, child-led cue logging, calm feedback, history, and a short parent guide.

## Project documents

- [Roadmap and milestone gates](docs/ROADMAP.md)
- [Verification evidence and remaining checks](docs/VERIFICATION.md)
- Live app: https://potty-weekend.netlify.app/

## Run and deploy

No dependencies or build step. Serve `public/` over HTTP (e.g. `python3 -m http.server 8080 --directory public`). `npm test` and `npm run check` run the core checks. On Netlify import this GitHub repository with no build command; `netlify.toml` sets publish directory `public`. HTTPS enables normal phone camera picker behavior. Alternatively drag `public/` into Netlify Drop.

## Architectural boundary

The composition root in `public/app.js` injects `IndexedDBStorage` into `mountApp(storage)`. The UI never opens IndexedDB or manipulates records directly. `public/storage.js` defines the async storage port:

- `listAttempts(): Promise<Attempt[]>`
- `saveAttempt(attempt, optionalPhotoBlob): Promise<void>`
- `deleteAttempt(id): Promise<void>` (includes associated photo)
- `getPhoto(id): Promise<Blob|null>`
- `getSettings(): Promise<Settings|null>`
- `saveSettings(settings): Promise<void>`

Stable UUIDs and `schemaVersion: 1` allow later migration. Photo and attempt saves/deletes are atomic. Photos are resized to max 1200 pixels and re-encoded as JPEG to reduce size and remove original EXIF metadata. IndexedDB stores bytes separately from records. A Netlify Functions + Blobs adapter can later implement this same port behind authenticated server routes. Two-parent sharing will also require authorization, per-family scope, conflict handling, and an explicit migration from device storage. Do not put Blobs credentials in the browser or implement one shared unprotected store. No speculative cloud layer ships today.

## Honest limitations

- Logs and photos are local to this browser, device, and site origin. No cloud backup, parent sync, or accounts. Clearing browser data or moving domain loses access. JSON export includes record metadata/settings, not photo bytes; there is no import UI in v1.
- Foreground timer uses a persisted absolute deadline, so reopening catches up. Closed tabs / locked phones cannot reliably alert. Use a phone alarm as backup. No push notifications or service worker.
- Saving an attempt resets a running timer; a paused timer stays paused. Reminders are adjustable 30–120 minutes, default 60, and can be snoozed 10 minutes. These are parent-chosen check-ins, not physiological prescriptions.
- Manual estimates only; no computer vision, fluid tracking, bladder-capacity formulas, or next-void prediction. Shows median/range of same-day logged pee gaps after 4 pee events. Accidents with unspecified output and overnight gaps are excluded. Sparse or missing data remain misleading; cues outrank the log.
- Optional photos depict only the empty-of-child bowl. Photos are not required for logging. Mixed output volume should be left blank.
- Warm feedback for attempts, restrained celebration, opt-in tones, reduced-motion support. No streaks, rewards contingent on output, or promised 3-day completion.

## Validation gate

Ship once phone-width rendering, attempt save/reload/delete, photo storage/reload/delete, timer pause/resume/snooze, export, and storage-error behavior are verified. Do not add features until a parent uses this during a real practice day and identifies concrete friction.

Parent copy is informed by AAP and NHS references linked in the app. A gentle moo is offered as optional play, not a medical technique. Calibration is an observational convenience, not a requirement.
