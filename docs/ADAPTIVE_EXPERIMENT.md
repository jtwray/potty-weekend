# Experimental reminder suggestions

Tucker authorized building a small removable experiment on October 6, 2026: “stop analyzing the feature and lets build it and see if it works or not and take it out if it doesnt”. This does not establish that the rules improve potty learning.

## Behavior

Opt in with **Experimental reminder suggestions**. Parent chooses an interval; no automatic changes. After a choice, the same event does not repeatedly recommend another adjustment; the next observation enables a new suggestion. Choices are current interval and 10 minutes shorter/longer, bounded to 20–120 minutes. Today’s logs produce an explanation:

- A known pee accident: highlight sooner.
- No-output attempt after the elapsed pee gap reaches the selected interval: highlight sooner.
- Two consecutive no-output attempts before the selected interval has elapsed since a pee: highlight later.
- A positive pure-pee measurement at most one quarter of the median of at least two earlier positive pure-pee measurements today: highlight sooner, explicitly as a hypothesis.
- Otherwise: highlight unchanged; no invented forecast. Records over two hours old do not trigger adjustments.

These thresholds are implementation choices for an experiment, not validated pediatric recommendations. Unknown/zero/mixed amounts do not trigger the volume rule. No age/weight targets, odds, residual-bladder estimates, or deliberately induced accidents.

The countdown remains primary. Compact context shows elapsed time since the last observed pee and a later attempt when applicable. Known pee accidents count; legacy accidents of unknown type do not.

Saving no-output or poop-only events preserves the running deadline. Saving a recent actual pee restarts the active reminder from the event time. Older backfilled events do not displace a newer pee. Paused timers stay paused.

Choosing an experimental interval anchors an active reminder to the last observed pee today, or now if none is known. An already-passed deadline becomes a check in one minute. Paused/stopped timers remain paused/stopped. Turning suggestions off hides the panel; the chosen interval remains manually adjustable.

## Evaluation and removal

Use normal supervised practice; respond to cues regardless of timer. Review whether suggestions help the parent choose, interrupt play unnecessarily, or cause confusion. Do not equate more captured pees with improved independence or claim causal benefit from one weekend. Existing export includes observations and selected interval, but no suggestion outcome study or telemetry is added.

Remove the feature if unhelpful: disable the toggle immediately; code is isolated in `reminderAdvice()` and the advice panel. No new storage service, dependency, account, or photo migration.

Push notifications and PWA installation remain separately approved roadmap ideas; this change does not implement them.
