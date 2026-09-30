// Baseline evidence: docs/BASELINE_COMPARISON.md. Only these two names are moved
// to the explicitly requested live-network diagnostic. All other tests remain.
export const networkTests = [
  'IP tools should resolve 127.0.0.1 to localhost',
  'IP tools should resolve unknown IPs correctly',
];
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const networkGrep = `^(?:${networkTests.map(escape).join('|')})$`;
// Retain the fork's existing exclusion for tests labeled (slow).
export const coreGrep = `^(?!.*\\(slow\\))(?!${networkGrep.slice(1)}).*`;
