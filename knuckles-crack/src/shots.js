// Knuckle cracking shot list
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText } from "./core/lib.js";
import { L, Le, Wd, T } from "./core/timing.js";
import * as K from "./core/kit.js";

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: hero bending fingers to crack ────────────────────────────
  {
    const st = cut(0), crack = Wd('crack', 0) - st, satisfaction = Wd('satisfying', 0) - st;
    add({ id: 'S01', at: st, cam: [540, 800], note: 'hero bends fingers, crack sound on "crack"',
      draw(lt) {
        K.room();
        const shake = lt > crack ? Math.sin(lt * 60) * 10 * Math.max(0, 1 - (lt - crack) * 3) : 0;
        const satisfied = lt > satisfaction;
        K.man({ x: 540 + shake, y: 1200, s: 1.5,
          arm: K.armPose(K.ARM.down, K.ARM.crack, eio(seg(lt, 0, 0.5))),
          finger: lt > 0.4 ? Math.sin(lt * 12) * 0.2 : 0,
          mouth: satisfied ? 'smirk' : lt > 0.5 ? 'smile' : 'flat',
          eyes: satisfied ? 'n' : 'wide', brow: satisfied ? 0.5 : 0 });
        if (lt > crack && lt < crack + 0.5) bigText('POP!', 540, 600, 120, C.yellow, 0, eob(seg(lt, crack, crack + 0.15)));
        K.shockLines(540, 750, 150, satisfied ? clamp((lt - satisfaction) * 5) : 0);
      } });
    cue(st + 0.5, 'pop', { gain: 0.8 }); cue(st + crack, 'pop', { gain: 0.9 });
  }

  // ── 2 · X-RAY: knuckle joint with synovial fluid ───────────────────────
  {
    const st = cut(1);
    add({ id: 'S02', at: st, cam: [540, 900], zoom: 0.2, note: 'x-ray knuckle joint, synovial fluid visible',
      draw(lt, d, t) {
        K.xray(t);
        K.man({ x: 540, y: 1250, s: 1.6, xray: true,
          arm: K.armPose(K.ARM.down, K.ARM.crack, 0.4),
          finger: Math.sin(lt * 8) * 0.15 });
      } });
    cue(st, 'whoosh');
  }

  // ── 3 · CLOSE-UP: gas bubble forming and popping ───────────────────────
  {
    const st = cut(2), bubble = Wd('bubble', 2) - st, popping = bubble + 0.2;
    add({ id: 'S03', at: st, cam: [540, 850], note: 'synovial fluid close-up with gas bubble forming and popping',
      draw(lt, d, t) {
        K.xray(t);
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const bob = Math.sin(lt * 3) * 10;
        K.knuckle(540, 900 + bob, 1.4, 0, 0.5);
        if (lt > bubble && lt < popping) {
          const p = seg(lt, bubble, popping);
          K.synovialBubble(540, 900 + bob, lerp(0.5, 1.2, eo(p)), clamp((lt - bubble) * 5));
          K.crackRings(540, 900 + bob, 1, clamp((lt - bubble) * 3));
        }
        if (lt > popping) K.burst(540, 900 + bob, 1, eob(seg(lt, popping, popping + 0.3)));
      } });
    cue(st, 'whoosh'); cue(st + bubble, 'pop', { gain: 0.8 }); cue(st + popping, 'pop', { gain: 0.5 });
  }

  // ── 4 · GAS EXPLANATION ───────────────────────────────────────────────
  {
    const st = cut(3), gas = Wd('gas', 3) - st;
    add({ id: 'S04', at: st, cam: [540, 800], note: 'nitrogen/carbon dioxide bubbles forming',
      draw(lt, d, t) {
        K.xray(t + 2);
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const bob = Math.sin(lt * 2) * 8;
        K.knuckle(540, 850 + bob, 1.3, 0, 0.3);
        for (let i = 0; i < 8; i++) {
          const an = i / 8 * Math.PI * 2 + lt;
          const r = 30 + Math.sin(lt * 2 + i) * 5;
          ctx.beginPath();
          ctx.arc(540 + Math.cos(an) * r, 850 + bob + Math.sin(an) * r * 0.8, 8 + rnd(i) * 6, 0, Math.PI * 2);
          ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
        }
        if (lt > gas) {
          const p = seg(lt, gas, gas + 0.4);
          K.tag('NITROGEN + CO2', 540, 550, 540, 750, 48, eob(p));
        }
      } });
    cue(st, 'whoosh'); cue(st + gas, 'pop', { gain: 0.5 });
  }

  // ── 5 · ARTHRITIS MYTH BUSTING (RED X) ────────────────────────────────
  {
    const st = cut(4), myth = Wd('myth', 4) - st - 0.1, slam = myth + 0.2;
    add({ id: 'S05', at: st, cam: [540, 800], note: 'red X slams on "myth"',
      draw(lt) {
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        const shake = lt > myth ? Math.sin(lt * 80) * 12 * Math.max(0, 1 - (lt - myth) * 4) : 0;
        ctx.save(); ctx.translate(shake, 0);
        const drop = eob(seg(lt, 0, 0.35));
        K.calendar(540, lerp(-300, 800, drop), 0.9, 'NO', 'ARTHRITIS', lerp(-0.2, 0, drop));
        if (lt > myth) {
          const p = seg(lt, myth, myth + 0.2);
          K.redX(540, 800, lerp(2, 1, eo(p)), clamp(p * 3));
        }
        ctx.restore();
      } });
    cue(st, 'whoosh'); cue(st + 0.35, 'thud'); cue(st + slam, 'slam');
  }

  // ── 6 · CARTILAGE EXPLANATION ─────────────────────────────────────────
  {
    const st = cut(5), tough = Wd('tough', 5) - st;
    add({ id: 'S06', at: st, cam: [540, 800], note: 'cartilage strength displayed',
      draw(lt, d, t) {
        K.xray(t + 4);
        const shake = lt > tough ? Math.sin(lt * 20) * 3 : 0;
        ctx.save(); ctx.translate(shake, 0);
        K.man({ x: 540, y: 1200, s: 1.7, xray: true,
          arm: K.armPose(K.ARM.down, K.ARM.crack, 0.6),
          mouth: 'smile', eyes: 'n', brow: 0 });
        ctx.restore();
        K.pill('TOUGH CARTILAGE', 540, 550, 54, C.ink, C.white, eob(seg(lt, tough, tough + 0.3)));
      } });
    cue(st, 'whoosh'); cue(st + tough, 'pop', { gain: 0.6 });
  }

  // ── 7 · OVER-CRACKING WARNING ─────────────────────────────────────────
  {
    const st = cut(6), warn = Wd('irritate', 6) - st - 0.15;
    add({ id: 'S07', at: st, cam: [540, 800], note: 'warning pulses on "irritate"',
      draw(lt) {
        K.xray(t + 6);
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
        K.man({ x: 540, y: 1200, s: 1.6, xray: true,
          arm: K.armPose(K.ARM.crack, K.ARM.crack, Math.sin(lt * 4) * 0.2 + 0.5),
          finger: Math.sin(lt * 15) * 0.4,
          eyes: 'wide', brow: 1, mouth: 'o' });
        const pr = Math.sin(lt * 8) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(540, 850, 140 + pr * 20, 0, Math.PI * 2);
        ctx.strokeStyle = C.red; ctx.globalAlpha = 0.4 + 0.5 * pr;
        ctx.lineWidth = 24; ctx.stroke(); ctx.globalAlpha = 1;
        K.warning(540, 500, lt > warn ? eob(seg(lt, warn, warn + 0.25)) * (1 + pr * 0.1) : 0);
      } });
    cue(st, 'whoosh'); cue(st + warn, 'alarm', { dur: cut(7) - st - warn });
  }

  // ── 8 · PUNCHLINE: hero to camera ─────────────────────────────────────
  {
    const st = cut(7), out = Wd('overdo', 7) - st;
    add({ id: 'S08', at: st, cam: [540, 700], note: 'hero wags finger at camera',
      draw(lt) {
        K.room();
        const p = eio(seg(lt, 0, 0.4));
        K.man({ x: 540, y: 1300, s: 2.0,
          arm: K.armPose(K.ARM.down, K.ARM.point, p),
          finger: lt > 0.3 ? Math.sin(lt * 11) * 0.35 : 0,
          mouth: lt > out ? 'grin' : 'smirk',
          brow: 0.3, smirk: true });
      } });
    cue(st, 'whoosh'); cue(st + out, 'pop', { gain: 0.6 });
  }

  return { shots: S, cues: CUES };
}
