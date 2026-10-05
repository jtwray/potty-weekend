# v1 verification

Updated: October 5, 2026

## Completed

- `npm test`: 3 domain tests passed (same-day spacing, sparse data, invalid inputs).
- `npm run check`: all three JavaScript modules passed syntax checks.
- Isolated DOM + IndexedDB simulation: record and photo byte persistence, deletion of both, settings, timer start/pause/resume/snooze, saving through the form, escaping user notes, and preserving drafts on failed writes passed.
- GitHub source uploaded to [jtwray/potty-weekend](https://github.com/jtwray/potty-weekend).
- Production app published at https://potty-weekend.netlify.app/.
- Live browser check: page rendered, reminder started and snoozed, a no-output attempt saved, reload retained the record and timer, and pause worked. The record existed only in the separate test browser.
- Desktop first viewport visually inspected.

## Still unverified

- Actual phone-width visual and touch behavior.
- Mobile camera capture, image preparation, and photo save/reload/view/delete in a real browser.
- Export and deletion through the deployed browser UI.
- Foreground/background behavior on Tucker's phone.
- One real parent/child practice day.

DOM simulation is not a substitute for phone testing. Earlier test-browser installation failed; the subsequent live check used the cloud browser.

## Next phone smoke test

On the final production URL, use clearly identified disposable test records. Start the timer; save a no-output attempt; save pee with a bowl photo; refresh and view both records/photo; pause/resume; delete a test record; export JSON. Confirm the local timestamps. Use a phone alarm as backup.

Keep the production origin stable: device data is scoped to the URL. Clearing browser data removes local logs and photos.

See [ROADMAP.md](ROADMAP.md) for milestone gates.
