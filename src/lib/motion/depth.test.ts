// Run with: npx tsx src/lib/motion/depth.test.ts
import { zoneAtProgress, depthAtProgress, paletteAtProgress } from './depth';

function expect(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL ${label}\n  actual:   ${a}\n  expected: ${e}`);
  console.log(`PASS ${label}`);
}

expect('zoneAtProgress(0)',    zoneAtProgress(0),    'sunlit');
expect('zoneAtProgress(0.3)',  zoneAtProgress(0.3),  'twilight');
expect('zoneAtProgress(0.6)',  zoneAtProgress(0.6),  'midnight');
expect('zoneAtProgress(0.85)', zoneAtProgress(0.85), 'abyss');
expect('zoneAtProgress(1.0)',  zoneAtProgress(1.0),  'surface');

expect('depthAtProgress(0)', depthAtProgress(0), 0);
expect('depthAtProgress(0.18)', depthAtProgress(0.18), 200);
expect('depthAtProgress(0.45)', depthAtProgress(0.45), 1000);

const pal0 = paletteAtProgress(0);
expect('paletteAtProgress(0).bg', pal0.bg, '#a6ddf0');

console.log('All depth tests pass.');
