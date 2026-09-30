// Read-only inspection of the pinned Showdown fork, not a TMT2 oracle.
import {createRequire} from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import {config, preflight} from '../workspace/core.mjs';
import {verifyPins} from '../ci/pins.mjs';
try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== '--damage')) {
    throw Error('Usage: npm run source:showdown-reference -- [--damage]');
  }
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
      ghostAgainstSteelMultiplier: 2 ** dex.getEffectiveness('Ghost', 'Steel'),
      burnHpLossFor160Hp: burnHpLoss,
      paralysisCallbackFor100Speed: dex.conditions.get('par').onModifySpe.call(context, 100, pokemon),
    };
  });
  let damageFixtures;
  if (args.length) {
    const {Battle} = require(path.join(c.server, 'dist/sim/battle.js'));
    const cases = [
      ['neutral', ['Normal'], ['Normal'], 'ember', 16],
      ['ordinary-stab', ['Fire'], ['Normal'], 'ember', 24],
      ['repeated-stab', ['Fire', 'Fire'], ['Normal'], 'ember', 24],
      ['ordered-triple-stab', ['Water', 'Fire', 'Fire'], ['Normal'], 'ember', 24],
      ['weakness', ['Normal'], ['Grass'], 'ember', 32],
      ['repeated-weakness', ['Normal'], ['Grass', 'Grass'], 'ember', 64],
      ['triple-weakness', ['Normal'], ['Grass', 'Grass', 'Steel'], 'ember', 128],
      ['resistance', ['Normal'], ['Water'], 'ember', 8],
      ['repeated-resistance', ['Normal'], ['Water', 'Water'], 'ember', 4],
      ['immunity', ['Normal'], ['Ghost', 'Ghost', 'Grass'], 'tackle', false],
    ];
    damageFixtures = cases.map(([id, attackerTypes, defenderTypes, moveId, expected]) => {
      // Synthetic controls using pinned base-Dex templates, not TMT2 species or sets.
      const set = moves => ({species: 'Mew', ability: 'No Ability', moves, level: 50, nature: 'Hardy',
        ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
        evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}});
      const battle = new Battle({formatid: 'gen9customgame', seed: [1, 2, 3, 4],
        p1: {name: 'Synthetic A', team: [set([moveId])]},
        p2: {name: 'Synthetic B', team: [set(['splash'])]}});
      try {
        battle.makeChoices('team 1', 'team 1');
        const source = battle.p1.active[0], target = battle.p2.active[0];
        source.setType([...attackerTypes], true); target.setType([...defenderTypes], true);
        assert.deepEqual(source.getTypes(), attackerTypes); assert.deepEqual(target.getTypes(), defenderTypes);
        const move = battle.dex.getActiveMove(moveId); move.willCrit = false;
        const immune = !target.runImmunity(move);
        const damage = immune ? false : battle.actions.getDamage(source, target, move);
        assert.equal(damage, expected, `Pinned Showdown fixture ${id}`);
        return {id, attackerTypes, defenderTypes, move: moveId, immune, damage};
      } finally { battle.destroy(); }
    });
  }
  console.log(JSON.stringify({kind: 'inherited-showdown-reference-not-ROM-evidence',
    compiledBuildRequired: true, callbackHarnessNotFullBattle: true, rows,
    ...(damageFixtures ? {damageFixtures, syntheticFixtureChecksPassed: damageFixtures.length} : {})}, null, 2));
} catch (error) { console.error(`[reference] ${error.message}`); process.exitCode = 1; }
