// Read-only inspection of the pinned Showdown fork, not a TMT2 oracle.
import {createRequire} from 'node:module';
import path from 'node:path';
import {config, preflight} from '../workspace/core.mjs';
import {verifyPins} from '../ci/pins.mjs';
try {
  if (process.argv.length > 2) throw Error('Usage: npm run source:showdown-reference');
  const c = config(); preflight(c); verifyPins(c);
  const require = createRequire(import.meta.url);
  const {Dex} = require(path.join(c.server, 'dist/sim/dex.js'));
  const rows = [3, 6, 7, 8, 9].map(gen => {
    const dex = Dex.mod(`gen${gen}`);
    let burnHpLoss = null;
    const context = {finalModify: value => value, chainModify: modifier => 100 * modifier,
      damage: value => { burnHpLoss = value; }};
    const pokemon = {baseMaxhp: 160, hp: 100, maxhp: 160, hasAbility: () => false};
    dex.conditions.get('brn').onResidual.call(context, pokemon);
    return {
      gen: dex.gen,
      waterfallCategory: dex.moves.get('waterfall').category,
      biteCategory: dex.moves.get('bite').category,
      rapidSpinPower: dex.moves.get('rapidspin').basePower,
      scaldAvailability: dex.moves.get('scald').isNonstandard ?? 'current',
      protosynthesisAvailability: dex.abilities.get('protosynthesis').isNonstandard ?? 'current',
      megaPidgeotAvailability: dex.species.get('pidgeotmega').isNonstandard ?? 'current',
      burnHpLossFor160Hp: burnHpLoss,
      paralysisCallbackFor100Speed: dex.conditions.get('par').onModifySpe.call(context, 100, pokemon),
    };
  });
  console.log(JSON.stringify({kind: 'inherited-showdown-reference-not-ROM-evidence',
    compiledBuildRequired: true, callbackHarnessNotFullBattle: true, rows}, null, 2));
} catch (error) { console.error(`[reference] ${error.message}`); process.exitCode = 1; }
