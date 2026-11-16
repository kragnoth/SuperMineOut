// Logic-only playthrough harness: runs the real game script in Node with THREE/DOM stubbed out.
// usage: node sim.mjs <index.html> <runs> <skill> [policy] [maxMinutes]
import fs from 'fs';

const [, , file, runsArg = '5', skillArg = '0.7', policy = 'bank', maxMinArg = '25'] = process.argv;
const html = fs.readFileSync(file, 'utf8');
let code = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
code = code.replace(/import \* as THREE from '[^']+';/, 'const THREE = globalThis.__THREE;');

// ---------- universal stub: any property/call/construct works, set values are remembered
function stub() {
  const store = {};
  const target = function () {};
  return new Proxy(target, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (k in store) return store[k];
      return (store[k] = stub());
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return stub(); },
    construct() { return stub(); },
  });
}
globalThis.__THREE = stub();

const els = {};
function el(id) {
  return els[id] ??= {
    id, style:{ setProperty() {} }, dataset:{}, textContent:'', innerHTML:'', onclick:null, width:0, height:0,
    classList:{ _s:new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    focus() {}, addEventListener() {}, getBoundingClientRect:() => ({ left:0, top:0, width:1280, height:896 }),
    getContext:() => stub(), closest:() => null,
  };
}
const listeners = {};
Object.assign(globalThis, {
  window:globalThis, innerWidth:1280, innerHeight:896,
  document:{ getElementById:el, createElement:() => el('_tmp' + Math.random()) },
  addEventListener:(t, f) => (listeners[t] ??= []).push(f),
  requestAnimationFrame:() => 0,
  setTimeout:() => 0, clearTimeout:() => {},
});
globalThis.performance ??= { now:() => Date.now() };

try { new Function(code)(); }
catch (e) { console.error('BOOT ERROR', e); process.exit(1); }
const ab = globalThis.__ab;

// ---------- run loop
const DT = 1 / 60, runs = +runsArg, skill = +skillArg, maxT = +maxMinArg * 60;
const results = [];
for (let r = 0; r < runs; r++) {
  ab.start(); ab.setBot(skill);
  let t = 0, err = null, stuck = false, junctions = 0, buys = [];
  const depthAt = {};
  try {
    while (t < maxT) {
      ab.tick(DT); t += DT;
      const s = ab.s;
      if (s.state === 'over') break;
      if (s.state === 'junction') {
        junctions++;
        const bank = policy === 'bank' || (policy === 'mixed' && (s.hull < 60 || junctions % 2 === 0));
        ab.junction(bank);
      }
      if (ab.s.state === 'shop') {
        for (let guard = 0; guard < 40; guard++) {
          const st = ab.s;
          if (st.hull < st.maxHull * 0.5 && st.banked >= 150) { ab.repair(); buys.push('repair'); continue; }
          const of = ab.offers; let pick = -1, pc = 1e9;
          of.forEach((o, i) => { if (o && o.cost <= st.banked && o.cost < pc) { pc = o.cost; pick = i; } });
          if (pick < 0) break;
          buys.push(of[pick].k); ab.buyOffer(pick);
        }
        ab.closeShop();
      }
      if (s.stats.t - s.stats.lastProg > 60) { stuck = true; break; }
      const m = Math.floor(t / 60); if (!(m in depthAt)) depthAt[m] = s.depth;
    }
  } catch (e) { err = e.stack.split('\n').slice(0, 4).join(' | '); }
  const s = ab.s;
  const foundry = [];
  if (process.env.META) for (let g = 0; g < 60; g++) {
    const cand = ab.META.filter(m => ab.metaUnlocked(m.k) && (ab.save.ranks[m.k] || 0) < m.max).sort((x, y) => ab.metaCost(x.k) - ab.metaCost(y.k));
    if (!cand.length || ab.metaCost(cand[0].k) > ab.save.scrip) break;
    foundry.push(cand[0].k); ab.metaBuy(cand[0].k);
  }
  results.push({ scripEarned:s.lastRun?.earned, scripBank:ab.save.scrip, ranks:Object.values(ab.save.ranks).reduce((a, b) => a + b, 0), foundry:foundry.join(','), unlocked:s.lastRun?.fresh?.join(','), chips:s.stats.chips, stal:s.stats.stalHits, run:r, end:err ? 'ERROR' : stuck ? 'STUCK' : s.state === 'over' ? 'died' : 'timeout', min:+(t / 60).toFixed(1), depth:s.depth,
    bankedTotal:s.bankedTotal, cargoLost:s.cargo, ore:s.stats.ore, blocks:s.stats.blocks, drops:s.stats.drops, hullHits:s.stats.hullHits,
    maxCores:s.stats.maxCores, maxStack:s.stats.maxStack, pods:s.stats.pods, buys:buys.join(','), depthByMin:Object.values(depthAt).join(' '), err });
}
for (const r of results) console.log(JSON.stringify(r));
const avg = k => (results.reduce((a, r) => a + (+r[k] || 0), 0) / results.length).toFixed(1);
console.log(`AVG skill=${skill} policy=${policy}: min=${avg('min')} depth=${avg('depth')}m banked=${avg('bankedTotal')} ore=${avg('ore')} drops=${avg('drops')} hits=${avg('hullHits')} maxCores=${avg('maxCores')} maxStack=${avg('maxStack')}`);
