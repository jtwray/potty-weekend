export const OUTCOMES = ['pee', 'poop', 'both', 'try', 'accident'];
export function validateAttempt(a) {
  if (!a || !OUTCOMES.includes(a.outcome)) throw Error('Choose an outcome.');
  if (!Number.isFinite(a.at) || a.at > Date.now() + 60000 || a.at < 0) throw Error('Choose a valid time.');
  if (a.volume !== null && (!Number.isFinite(a.volume) || a.volume < 0 || a.volume > 1000)) throw Error('Enter an estimate from 0 to 1000 mL, or leave it blank.');
  if (a.volume !== null && !['pee', 'both'].includes(a.outcome)) throw Error('Volume is only for pee collected in the bowl.');
  if (typeof a.note !== 'string' || a.note.length > 280) throw Error('Keep notes under 280 characters.');
  if (!['parent', 'child'].includes(a.initiatedBy)) throw Error('Choose who noticed.');
  return a;
}
export function summarize(attempts) {
  const pees = attempts.filter(a => ['pee','both'].includes(a.outcome)).sort((a,b)=>a.at-b.at);
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
