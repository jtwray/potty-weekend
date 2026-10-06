export const OUTCOMES = ['pee', 'poop', 'both', 'try', 'accident'];
export function validateAttempt(a) {
  if (!a || !OUTCOMES.includes(a.outcome)) throw Error('Choose an outcome.');
  if (!Number.isFinite(a.at) || a.at > Date.now() + 60000 || a.at < 0) throw Error('Choose a valid time.');
  if (a.volume !== null && (!Number.isFinite(a.volume) || a.volume < 0 || a.volume > 1000)) throw Error('Enter an estimate from 0 to 1000 mL, or leave it blank.');
  if (a.volume !== null && !['pee', 'both'].includes(a.outcome)) throw Error('Volume is only for pee collected in the bowl.');
  if (a.accidentType != null && !['unknown','pee','poop','both'].includes(a.accidentType)) throw Error('Choose a valid accident type.');
  if (typeof a.note !== 'string' || a.note.length > 280) throw Error('Keep notes under 280 characters.');
  if (!['parent', 'child'].includes(a.initiatedBy)) throw Error('Choose who noticed.');
  return a;
}
export function summarize(attempts) {
  const pees = attempts.filter(a => ['pee','both'].includes(a.outcome)).sort((a,b)=>a.at-b.at || (a.createdAt??0)-(b.createdAt??0));
  // Same-day observations only. No overnight gaps, accidents of unknown type, or no-output attempts.
  const gaps = [];
  for (let i=1;i<pees.length;i++) {
    if (new Date(pees[i].at).toDateString() === new Date(pees[i-1].at).toDateString()) gaps.push(Math.round((pees[i].at-pees[i-1].at)/60000));
  }
  const sorted = [...gaps].sort((a,b)=>a-b);
  const middle = Math.floor(sorted.length/2);
  const median = sorted.length ? (sorted.length%2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2) : null;
  const measured = pees.filter(a=>a.volume!==null);
  return {pees:pees.length, gaps:gaps.length, median, min:sorted[0]??null, max:sorted.at(-1)??null, volume:measured.reduce((s,a)=>s+a.volume,0), measured:measured.length};
}

// Experimental heuristics, not physiological predictions. Pure function for easy removal.
export function isObservedPee(a) {
  return ['pee', 'both'].includes(a.outcome) || (a.outcome === 'accident' && ['pee', 'both'].includes(a.accidentType));
}
export function reminderAdvice(attempts, interval, now = Date.now()) {
  const today = attempts.filter(a => a.at <= now && new Date(a.at).toDateString() === new Date(now).toDateString()).sort((a,b) => a.at-b.at || (a.createdAt??0)-(b.createdAt??0));
  const latest = today.at(-1);
  const lastPee = today.filter(isObservedPee).at(-1);
  const choices = [...new Set([Math.max(20, interval-10), interval, Math.min(120, interval+10)])];
  let direction = 'same', reason = 'Not enough observations to suggest a change. Keeping your interval is reasonable.';
  const fresh = latest && now-latest.at <= 2*60*60000;
  if (fresh && latest.outcome === 'accident' && ['pee','both'].includes(latest.accidentType)) {
    direction = 'sooner'; reason = 'A pee accident was logged. An earlier check next time is one option to try.';
  } else if (fresh && latest.outcome === 'try' && lastPee) {
    if (now-lastPee.at >= interval*60000) {
      direction = 'sooner'; reason = 'The last observed pee was at least one interval ago, and this try produced nothing. An earlier recheck is one option; the try does not restart the pee clock.';
    } else {
      const recent = today.slice(-2);
      if (recent.length === 2 && recent.every(a => a.outcome === 'try')) {
        direction = 'later'; reason = 'The last two tries produced nothing after a recent pee. More time between checks is one option if there are no body cues.';
      }
    }
  } else if (fresh && latest.outcome === 'pee' && latest.volume > 0) {
    const earlier = today.filter(a => a !== latest && a.outcome === 'pee' && a.volume > 0).map(a => a.volume).sort((a,b)=>a-b);
    if (earlier.length >= 2) {
      const middle = Math.floor(earlier.length/2);
      const typical = earlier.length%2 ? earlier[middle] : (earlier[middle-1]+earlier[middle])/2;
      if (latest.volume <= typical/4) {
        direction = 'sooner'; reason = `About ${latest.volume} mL was collected, much less than earlier measured pees today (median ≈ ${Math.round(typical)} mL). Try an earlier check if useful. This tests a small-output hypothesis; it does not tell us how much remains in the bladder.`;
      }
    }
  }
  const suggested = direction === 'sooner' ? choices[0] : direction === 'later' ? choices.at(-1) : interval;
  // After no-output/poop, retain the last pee as the anchor rather than granting a new full interval.
  const anchor = lastPee?.at ?? now;
  return {direction, reason, suggested, choices, anchor, latest, lastPee};
}
