// The town below: the monument and the hero pieces. THE CLOCK TOWER IS MODELLED (stage 2a, docs/build/town/2-monument.md:
// tower_foot, tower_loggia, tower_upper, clock_dials, bell_great; shared.tower says what the others may use). The kept
// lamp hangs from its wrought bracket on the tower's pier. What is left here of STAGE 1 are STAND-INS of the true size in
// the true place (docs/building-an-area.md) that other modules take out as their models arrive: the clock's movement,
// pendulum and hour ring (heroes_clock.js), the church, the market hall, the fountain and the theatre front (heroes_b.js).
// The passage out (the theatre's portico, door wall and the first 12 m of the foyer) is here too, with its colliders.
// Use light.mat() (or kit.model(url, { extend: light.extend })) for everything, so that it takes the town's light.
import * as THREE from 'three';
import { makeKeptLamp, loadLamp } from '../../engine/lamp-hero.js';
import { ensureLight } from './light.js';
import { makeBatch, frameAt } from './standins.js';
import { FOG_PARS } from '../../engine/kit.js';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';

export async function build(ctx, plan, shared) {
  const light = ensureLight(ctx, plan, shared), town = light.town, P = plan.local;
  const stand = light.stand, b = makeBatch(ctx, light);
  const U = { where: 'under' }, A = { where: 'awash' };
  const mesh = (name, geo, mat, pos, yaw = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(pos[0], pos[1], pos[2]); m.rotation.y = yaw; m.name = 'standin:' + name; m.frustumCulled = false; return ctx.add(m); };

  // ---------------------------------------------------------------------------------------------- the clock tower
  // 46 m of plain stone, 22 m of it under the water. Centre s 184, d +10; 7 m square; its faces square to the route there.
  {
    const T = plan.tower, f = frameAt(town, T.s, T.d), h = T.side / 2, turn = f.yaw;
    const box = (ls, y, ld, size, color = P.stone, where = A, lit = 1) => { const p = f.at(ls, y, ld); b.box({ x: p[0], y, z: p[2], yaw: turn, sx: size[0], sy: size[1], sz: size[2], color }, { ...where, lit }); };
    // THE TOWER, MODELLED (stage 2a: source-art/models/town/tower_*.py; docs/build/town/2-monument.md). Every model of it is made
    // about one origin, the shaft's axis at the waterline, its front (-Y in Blender) the up-route face: so all are placed alike.
    const place = { position: [f.x, 0, f.z], rotation: f.yaw - Math.PI / 2 };
    const Qm = new URLSearchParams(location.search);                                   // &towermap=0: the tower without its painted stone texture (to judge the modelling)
    const stoneMap = Qm.get('towermap') === '0' ? null : await ctx.tex('art/town/surfaces_plaster.webp', { repeat: true }).catch(() => null);
    // THE STONE'S OWN SURFACE (the second look, docs/build/town/2-monument.md). The stones are modelled one by one, each a
    // flat tint with a worn edge: right from 36 m, and at arm's length a clean pastel quilt on which nothing had happened
    // but the water's mark. Paint lives on points, and a stone has eight. So what happens to a wall ACROSS its stones is
    // laid here, in the tower's own material, from one small tile of noise made in code (no picture is loaded):
    //   - the quilt is drawn together: neighbours keep their values and lose most of their difference in hue (an ochre
    //     stone beside a lilac one was orange beside pink in the light from below); paint that is not bare stone (weed,
    //     rust, verdigris, lime) keeps its own;
    //   - every stone has a face: cloud and grain a hand to a finger across, a few pits (close to; far off it is gone);
    //   - the weather crosses the joints, on the flat walls: dark runs and pale lime under every ledge (the impost, the
    //     two string courses, the corbel table, and the foot's under water), each as long as its own piece of wall lets
    //     it; the damp that climbs out of the lake above the tide line, with a ragged head; grey-green lichen in clouds a
    //     metre across, most on the up-route (weather) face, with crusts a hand across in them, and a dull ochre one higher
    //     up; and at the waterline the weed: a ragged fringe a hand high, its strands hanging into the water (the model's
    //     own cushions of weed and lichen were eight-sided stickers at 2 m and are gone).
    // All of it multiplies the paint, so the area's light and the water's hue fall on it as on any paint.
    // &twstone=0: none (as it was). &twstone=a,b,c,d,e,f,g,h,i,j,k,l,m tries other strengths (hue, value, face, runs, damp, lichen, ochre, near, weed, crusts, relief,
    // the pick's relief at arm's length, the face's broad relief).
    const stoneWork = (() => {
      const q = Qm.get('twstone'); if (q === '0') return null;
      // (the sixth holder: `value` was 0.22, drawing every stone's value toward one, close to: on the lamp's pier every stone was the same pale
      // orange, biscuit. It is -0.45 now: close to, a stone is a little MORE unlike its neighbour than it was painted, in value only;
      // the fifth holder's shoulder on the light lets that show beside the lamp. Far off nothing changes.)
      const K = [0.58, -0.45, 0.2, 0.5, 0.42, 0.42, 0.3, 1, 0.85, 0.6, 0.8, 0.6, 0.5]; if (q) q.split(',').forEach((v, i) => { if (v !== '' && isFinite(+v)) K[i] = +v; });      // (the last two, the seventh holder's: the pick's relief, the face's broad relief)
      // (the fourth holder) &twrise=from,to,amount,vault,r,g,b: the paint drawn down and toward plum between two heights, and inside the
      // loggia's vault; &twwet=damp,jade,mark,grain: the damp from the line to the old high water, the dull jade in the growth, the pale thread at the mark, the skin at arm's length
      const more = (key, d) => { const v = (Qm.get(key) || '').split(','); return d.map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x)); };
      const RISE_K = more('twrise', [7.2, 12.6, 1, 0.42, 0.62, 0.60, 0.93]), WET_K = more('twwet', [0.9, 1, 0.55, 1]);
      const Nn = 256, data = new Uint8Array(Nn * Nn * 4), rnd = ctx.rng(4184);
      // value noise that repeats: octaves of a lattice of `p` cells across the tile
      const field = (periods, weights) => { const out = new Float32Array(Nn * Nn);
        periods.forEach((p, k) => { const L = new Float32Array(p * p).map(() => rnd()), w = weights[k];
          for (let y = 0; y < Nn; y++) { const fy = y / Nn * p, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = y0 % p, yb = (y0 + 1) % p;
            for (let x = 0; x < Nn; x++) { const fx = x / Nn * p, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % p, xb = (x0 + 1) % p;
              out[y * Nn + x] += w * ((L[ya * p + xa] * (1 - sx) + L[ya * p + xb] * sx) * (1 - sy) + (L[yb * p + xa] * (1 - sx) + L[yb * p + xb] * sx) * sy); } } });
        let m = 0, v = 0; for (const o of out) m += o; m /= out.length; for (const o of out) v += (o - m) * (o - m); const sd = Math.sqrt(v / out.length) || 1;
        return out.map((o) => Math.min(1, Math.max(0, 0.5 + (o - m) / (4.4 * sd)))); };                        // spread over 0..1 (2.2 deviations either side of the middle)
      const grain = field([32, 64, 128], [0.5, 0.32, 0.18]), cloud = field([4, 8, 16, 32], [0.45, 0.3, 0.17, 0.08]), cloud2 = field([3, 7, 13, 29], [0.45, 0.3, 0.17, 0.08]), pit = field([40, 90], [0.6, 0.4]);
      for (let i = 0; i < Nn * Nn; i++) { data[i * 4] = Math.round(grain[i] * 255); data[i * 4 + 1] = Math.round(cloud[i] * 255); data[i * 4 + 2] = Math.round(cloud2[i] * 255);
        const pv = (pit[i] - 0.74) / 0.12; data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, pv))); }
      const tex = new THREE.DataTexture(data, Nn, Nn, THREE.RGBAFormat);
      tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
      return {
        uniforms: { tTwStone: { value: tex }, uTwAt: { value: new THREE.Vector4(f.x, f.z, Math.cos(f.yaw), Math.sin(f.yaw)) }, uTwK: { value: new THREE.Vector4(K[0], K[1], K[2], K[3]) }, uTwK2: { value: new THREE.Vector4(K[4], K[5], K[6], K[7]) }, uTwK3: { value: new THREE.Vector4(K[8], K[9], K[10], K[11]) }, uTwK4: { value: new THREE.Vector4(K[12], 0, 0, 0) },
          uTwMean: { value: new THREE.Color('#978da6') }, uTwRise: { value: new THREE.Vector4(RISE_K[0], RISE_K[1], RISE_K[2], RISE_K[3]) }, uTwPlum: { value: new THREE.Color().setRGB(RISE_K[4], RISE_K[5], RISE_K[6]) }, uTwWet: { value: new THREE.Vector4(WET_K[0], WET_K[1], WET_K[2], WET_K[3]) } },
        fragmentPars: /* glsl */`uniform sampler2D tTwStone; uniform vec4 uTwAt, uTwK, uTwK2, uTwK3, uTwK4, uTwRise, uTwWet; uniform vec3 uTwMean, uTwPlum;`,
        // (What it costs: on a flat wall four reads of the one small tile, five within 6 m, one more in a cloud of lichen, two
        // more beside the waterline; three times that only on what is round, the vault and the soffits. Every read is given
        // its own slopes, textureGrad, so that it may stand inside a branch. The first version read it twelve times everywhere.)
        albedo: /* glsl */`{
          // where, in the tower's own frame: x down the route from its axis, z to the right of it
          vec3 sq = vWPos - vec3(uTwAt.x, 0.0, uTwAt.y);
          vec3 sp = vec3(sq.x * uTwAt.z - sq.z * uTwAt.w, sq.y, sq.x * uTwAt.w + sq.z * uTwAt.z);
          vec3 sn = vec3(N.x * uTwAt.z - N.z * uTwAt.w, N.y, N.x * uTwAt.w + N.z * uTwAt.z), san = abs(sn);
          vec3 sdx = dFdx(sp), sdy = dFdy(sp);
          float sdist = length(vViewPos), snear = (1.0 - smoothstep(6.0, 30.0, sdist)) * uTwK2.w;
          // the quilt drawn together: bare stone keeps its value and takes the wall's one hue; close to, its values come nearer too
          float slum = dot(albedo, vec3(0.3, 0.5, 0.2)), smx = max(albedo.r, max(albedo.g, albedo.b)), smn = min(albedo.r, min(albedo.g, albedo.b));
          float sbare = 1.0 - smoothstep(0.36, 0.52, (smx - smn) / max(smx, 1e-3));
          albedo = mix(albedo, uTwMean * (slum / dot(uTwMean, vec3(0.3, 0.5, 0.2))), uTwK.x * sbare);
          albedo *= mix(1.0, pow(0.24 / max(slum, 0.03), uTwK.y), sbare * smoothstep(0.13, 0.2, slum) * snear);
          // every stone has a face: cloud and grain, a few pits. Laid on from the side a face looks to (one read) where it
          // lies square to an axis, as nearly all of a tower does; from three sides, blended, where it is round
          vec2 suv, sux, suy;
          if (san.x > san.z && san.x > san.y) { suv = sp.zy; sux = sdx.zy; suy = sdy.zy; } else if (san.z > san.y) { suv = sp.xy; sux = sdx.xy; suy = sdy.xy; } else { suv = sp.xz; sux = sdx.xz; suy = sdy.xz; }
          bool sround = max(san.x, max(san.y, san.z)) < 0.93;
          vec3 sw3 = pow(san, vec3(4.0)); sw3 /= sw3.x + sw3.y + sw3.z;
          vec4 sa;
          if (sround) sa = textureGrad(tTwStone, sp.zy * 0.61, sdx.zy * 0.61, sdy.zy * 0.61) * sw3.x + textureGrad(tTwStone, sp.xz * 0.61, sdx.xz * 0.61, sdy.xz * 0.61) * sw3.y + textureGrad(tTwStone, sp.xy * 0.61, sdx.xy * 0.61, sdy.xy * 0.61) * sw3.z;
          else sa = textureGrad(tTwStone, suv * 0.61, sux * 0.61, suy * 0.61);
          albedo *= 1.0 + uTwK.z * (1.2 * (sa.g - 0.5) + 0.4 * (sa.r - 0.5) * snear);
          albedo *= 1.0 - 0.35 * uTwK.z * sa.a * snear;
          // and at arm's length (under 6 m) the stone's own skin, as the pick left it: a speckle of grains a few millimetres
          // across, short slanting tool marks a finger wide and a hand long, a few pits. (The fourth holder: this was the cloud
          // itself a quarter the size, pulled about by the larger cloud so that it should not be seen to repeat: swirls and
          // veins, a polished marble, on a tower of picked limestone.)
          float sarm = (1.0 - smoothstep(2.5, 6.0, sdist)) * uTwK2.w * uTwWet.w;
          // THE FACE HAS RELIEF (the seventh holder). Six second looks ended on the same item: at arm's length every stone was a
          // smooth cushion with a cloud in it (a quilt, a soap, a biscuit, soft). The paint had been made right; the SURFACE had
          // not: speckle and tool marks were laid on as lighter and darker paint, and paint lies flat. A picked face is LIT:
          // in this place from below, by the lake, so every mark of the pick has a lit lower lip and a dark upper one. So the
          // tile of noise is read as a HEIGHT, and what shows is its slope toward the light: two reads a hand apart for the
          // pick's own grain (a thumb across: the painter's filter takes what is finer), and one more of the broad cloud for
          // the hollows of a weathered face (a hand to a forearm across; that one holds to 30 m). Toward the lake; within
          // reach of the kept lamp the relief turns to the flame, and under the lamp the lit lips are the upper ones. Not on
          // what is round (the vault, the soffits: three projections share them) and not on what lies level.
          // (This took the place of the slanting tool marks, which were pale scratches a hand long, and of half the speckle.)
          if ((sarm > 0.0 || snear > 0.0) && !sround && san.y < max(san.x, san.z)) {
            vec3 slq = uLampPos - vec3(uTwAt.x, 0.0, uTwAt.y);
            vec3 slp = vec3(slq.x * uTwAt.z - slq.z * uTwAt.w, slq.y, slq.x * uTwAt.w + slq.z * uTwAt.z) - sp;
            vec2 sl2 = san.x > san.z ? slp.zy : slp.xy;
            float slw = (1.0 - smoothstep(uLampRadius * 0.15, uLampRadius * 0.7, length(slp))) * 0.9;
            vec2 sl = mix(vec2(0.0, -1.0), sl2 / max(length(sl2), 1e-3), slw); sl /= max(length(sl), 1e-3);      // toward the light, in the face's own (along, up)
            float shb = textureGrad(tTwStone, suv * 0.61 + sl * 0.03, sux * 0.61, suy * 0.61).g;
            albedo *= 1.0 + uTwK4.x * snear * clamp((sa.g - shb) * 3.0, -0.5, 0.5);
            if (sarm > 0.0) {
              vec2 sru = suv * 1.8 + 0.13, srx = sux * 1.8, sry = suy * 1.8;
              vec4 sha = textureGrad(tTwStone, sru - sl * 0.011, srx, sry), shc = textureGrad(tTwStone, sru + sl * 0.011, srx, sry);
              // (PITS in a flat face, not a skin of bumps: the first try read the noise itself as the height, and the pier beside the
              // lamp was crocodile hide. The point leaves a dent a thumb across here and there; between them the face is flat.
              // And not everywhere alike: where the face is worn the dents are nearly gone, and under the water they are silted up.)
              float sworn = (0.3 + 0.7 * smoothstep(0.3, 0.7, sa.b)) * (0.3 + 0.7 * smoothstep(-0.5, 0.05, sp.y));
              float spa = smoothstep(0.54, 0.8, sha.r), spc = smoothstep(0.54, 0.8, shc.r);
              albedo *= 1.0 + sarm * (uTwK3.w * sworn * clamp(spc - spa, -0.7, 0.7) + uTwK.z * 0.5 * (sha.r + shc.r - 1.0)) - sarm * (uTwK3.w * sworn * 0.22 * (spa + spc) + uTwK.z * 0.7 * max(sha.a, shc.a));
            }
          }
          // relief: a facet that leans a little toward the lake takes more of its light and one that leans away less (the
          // chamfers of the piers' dressed panels, the mason's tooling: the ride's stepped light is too coarse to tell 8 degrees)
          albedo *= 1.0 - uTwK3.z * clamp(N.y, -0.3, 0.3) * (1.0 - smoothstep(0.3, 0.6, abs(N.y))) * snear;
          // the weather, across the joints: on the flat walls only
          float swall = smoothstep(0.9, 0.98, max(san.x, san.z));
          // (the fifth holder: within the water's reach a stone's worn edge and its drafted margin are wall too. With the flat faces only,
          // every stone at the waterline kept an orange frame round a stained panel, and the mark at 0.6 broke at every joint: a
          // decoration of each stone, not a line the lake drew across all of them.)
          if (sp.y < 0.78 && sp.y > -1.05) swall = max(swall, smoothstep(0.42, 0.7, max(san.x, san.z)));
          if (swall > 0.0) {
            bool sacross = san.x > san.z;                                           // an up-route or a down-route face
            float sface = sacross ? (sn.x < 0.0 ? 0.0 : 2.0) : (sn.z > 0.0 ? 1.0 : 3.0), sh = sp.y;
            float su = (sacross ? sp.z : sp.x) + sface * 9.7;                       // along the wall; each face its own piece of the tile
            vec2 swx = sacross ? sdx.zy : sdx.xy, swy = sacross ? sdy.zy : sdy.xy;  // the slopes of (su, sh)
            vec4 sbig = textureGrad(tTwStone, vec2(su, sh) * 0.083 + 0.21, swx * 0.083, swy * 0.083);                                        // a tile of 12 m: what spreads over many stones
            vec4 srun = textureGrad(tTwStone, vec2(su * 1.05, sh * 0.055), swx * vec2(1.05, 0.055), swy * vec2(1.05, 0.055));                // drawn out twenty to one down the wall: runs
            vec4 sedge = textureGrad(tTwStone, vec2(su * 0.19, 0.43 + sface * 0.13), vec2(swx.x * 0.19, 0.0), vec2(swy.x * 0.19, 0.0));      // along the wall only: how far a run gets, how high the damp climbs
            float sled = 0.0, spale = 0.0, sb;
            #define TW_LEDGE(H, L) sb = (H) - sh; if (sb > 0.0) { sled = max(sled, 1.0 - smoothstep(0.0, (L) * (0.45 + 1.1 * sedge.g), sb)); spale = max(spale, 1.0 - smoothstep(0.0, (L) * 0.4, sb)); }
            TW_LEDGE(4.40, 1.5) TW_LEDGE(7.34, 2.3) TW_LEDGE(13.34, 2.5) TW_LEDGE(19.5, 1.5) TW_LEDGE(-8.6, 2.2) TW_LEDGE(-15.8, 2.2)
            albedo *= mix(vec3(1.0), vec3(0.60, 0.59, 0.69), uTwK.w * sled * smoothstep(0.5, 0.72, srun.g) * swall);
            albedo = mix(albedo, albedo * 0.4 + vec3(0.36, 0.33, 0.38), uTwK.w * spale * smoothstep(0.62, 0.82, srun.b) * swall);
            float sdamp = step(0.62, sh) * (1.0 - smoothstep(0.62, 0.95 + 2.1 * sedge.b, sh)) * (0.55 + 0.45 * srun.g);
            albedo *= mix(vec3(1.0), vec3(0.70, 0.76, 0.80), uTwK2.x * sdamp * swall);
            float slich = smoothstep(0.55, 0.66, sbig.b + 0.3 * (sa.g - 0.5)) * smoothstep(1.3, 5.0, sh) * (sface < 0.5 ? 1.0 : 0.55);
            albedo = mix(albedo, dot(albedo, vec3(0.3, 0.5, 0.2)) * vec3(0.90, 1.01, 0.86), uTwK2.y * slich * swall);
            float sochre = smoothstep(0.6, 0.68, sbig.g + 0.35 * (sa.b - 0.5)) * smoothstep(2.5, 9.0, sh);
            albedo = mix(albedo, dot(albedo, vec3(0.3, 0.5, 0.2)) * vec3(1.16, 0.98, 0.72), uTwK2.z * sochre * swall);
            // crusts of lichen a hand across, with edges, where the clouds of it are (pale grey-green, a tone over the stone)
            float scl = smoothstep(0.5, 0.66, sbig.b) * smoothstep(0.85, 2.0, sh) * (1.0 - smoothstep(19.0, 19.6, sh));
            if (scl > 0.0) {
              float scrust = smoothstep(0.70, 0.725, textureGrad(tTwStone, vec2(su, sh) * 1.37 + 0.6 + 0.3 * sa.gr, swx * 1.37, swy * 1.37).b) * scl;
              albedo = mix(albedo, max(dot(albedo, vec3(0.3, 0.5, 0.2)), 0.1) * vec3(1.13, 1.2, 1.08), uTwK3.y * scrust * swall);
            }
            // THE WATER'S MARK (the fifth holder: one piece now, where there were three). What stood here at arm's length was cute: a row
            // of round leaf-green bushes a hand high sitting on the water's line (the weed, with a thread of jade at its tips), a
            // red-brown skirting board under them (the wet, to a ragged head), and at 0.6 m a strip of yellow icing with scallops
            // (the lime). A wall that stands in a lake is STAINED by it, and the stain hangs DOWN:
            //   - from the line up to the lake's old height (0.6 m, level but not ruled) the stone is damp: darker and cooler,
            //     darkest at the water, with patches high up where it has dried;
            //   - on it the growth: black-green, never leaf green (under the lamp a dark olive), thick at the line and breaking
            //     upward into streaks a finger wide, its head now a hand above the water and now two: drawn out DOWN the wall, so
            //     that it reads as a stain with runs in it and never as things that stand up;
            //   - at the old height the mark itself: a thread of pale crust a finger thick, broken; the step from the dark stone
            //     under it to the dry stone over it is the mark, more than the thread is;
            //   - under the water the growth thins into strands that hang half a metre down (as before).
            if (sh < 0.78 && sh > -1.05) {
              vec4 sweed = textureGrad(tTwStone, vec2(su * 1.43, 0.71 + sface * 0.07), vec2(swx.x * 1.43, 0.0), vec2(swy.x * 1.43, 0.0));      // along the wall only: where the growth is thick
              if (sh > 0.0) {
                vec4 sfil = textureGrad(tTwStone, vec2(su * 5.0, sh * 0.9 + 0.3), swx * vec2(5.0, 0.9), swy * vec2(5.0, 0.9));                 // drawn out down the wall, a finger wide: streaks
                float stide = 0.60 + 0.03 * (sedge.r - 0.5), sup = sh / stide;
                float sdried = smoothstep(0.5, 0.8, srun.g) * smoothstep(0.35, 0.8, sup);
                float szone = (1.0 - smoothstep(stide - 0.02, stide + 0.006, sh)) * (1.0 - 0.45 * sup) * (1.0 - 0.7 * sdried);
                albedo *= mix(vec3(1.0), vec3(0.45, 0.50, 0.63), uTwWet.x * szone * swall);
                vec4 shang = textureGrad(tTwStone, vec2(su * 1.9, sh * 0.35 + 0.3), swx * vec2(1.9, 0.35), swy * vec2(1.9, 0.35));           // drawn out five to one down the wall, a hand wide: what hangs
                // (its head is a soft line that wanders along the wall, a hand to two hands up, and whatever runs in it runs DOWN: a head
                // thrown up by streaks was a row of green flames, grass again)
                float shead = 0.13 + 0.22 * smoothstep(0.3, 0.75, sedge.g) + 0.08 * smoothstep(0.3, 0.8, sweed.g) + 0.03 * (sfil.g - 0.5);      // (broad: where it climbs it climbs over a stone's width, not in a tongue)
                float sgrow = 1.0 - smoothstep(shead - 0.09, shead + 0.02, sh);
                float sthin = smoothstep(0.03, shead, sh);                                                         // 0 at the line .. 1 at its head
                sgrow *= 1.0 - sthin * (0.25 + 0.5 * smoothstep(0.55, 0.3, shang.g + 0.3 * (shang.b - 0.5)));      // a film that thins toward its head, in runs a hand wide: the stone shows through it
                vec3 swcol = mix(vec3(0.008, 0.014, 0.014), vec3(0.016, 0.030, 0.026), smoothstep(0.35, 0.7, shang.b) * uTwWet.y) * (0.85 + 0.3 * sweed.b);
                albedo = mix(albedo, swcol, min(1.0, uTwK3.x * 1.1) * sgrow * swall);
                float slime = exp(-pow((sh - stide) / 0.007, 2.0)) * smoothstep(0.32, 0.6, srun.b);
                albedo = mix(albedo, albedo * 0.5 + vec3(0.26, 0.25, 0.28), uTwWet.z * slime * swall);
              } else {
                // (the sixth holder: WHAT HANGS UNDER THE LINE. It was read from a piece of the tile 0.2 m wide, so the same
                // strands came round eight times across a pier, and all of it was cut off level half a metre down: at arm's
                // length a fringe on a rug, with the lit stone between the strands reading as a row of pale tassels. Weed
                // hangs in strands a thumb wide that keep their line down the wall, a hand long in one place and an arm long
                // in the next; it is whole just under the line and thins away downward, each strand to its own point.)
                vec4 sstr = textureGrad(tTwStone, vec2(su * 1.5 + 0.17, sh * 0.07 + 0.4 + sface * 0.21), swx * vec2(1.5, 0.07), swy * vec2(1.5, 0.07));
                float slen = 0.10 + 0.82 * smoothstep(0.28, 0.76, sweed.g) * (0.5 + 0.5 * smoothstep(0.2, 0.8, sweed.b));      // how far it hangs, here
                float sdown = clamp(-sh / slen, 0.0, 1.3), sthr = 0.93 * pow(sdown, 0.6);                                  // the deeper, the fewer strands reach
                float sgrow = max(smoothstep(sthr - 0.05, sthr + 0.07, sstr.r + 0.2 * (sstr.g - 0.5)) * (1.0 - 0.55 * min(sdown, 1.0)), 1.0 - smoothstep(0.015, 0.07, -sh));      // (and thinner toward its end: the stone shows through it)
                albedo = mix(albedo, vec3(0.010, 0.030, 0.032) * (0.6 + 1.1 * sstr.b), min(1.0, uTwK3.x * 1.12) * sgrow * swall);
              }
            }
          }
          // out of rose into plum (the fourth holder). The area's light gives the monument the lake's light to its top (right
          // for its lowest third from 80 m), and the whole tower stood pale rose from the water to the corbels, lower and
          // flatter for it from beside and beneath. The key painting's tower, and the page's ("the wall going up out of rose
          // into plum"; plum: "the upper half of the tower"), is rose to the string course and plum from the clock stage up:
          // so the PAINT is drawn down and toward plum between those heights. Not the lead of the roof, which takes the
          // night's top-light.
          float srise = smoothstep(uTwRise.x, uTwRise.y, sp.y) * (1.0 - smoothstep(0.3, 0.6, N.y));
          albedo *= mix(vec3(1.0), uTwPlum, srise * uTwRise.z);
          // and the vault has depth: inside the loggia the stone darkens from the springing up to the oculus (it was one
          // value with the outer wall, and the oculus had no dark to open into); the rooms above it likewise
          albedo *= 1.0 - uTwRise.w * (1.0 - smoothstep(1.93, 2.03, max(abs(sp.x), abs(sp.z)))) * smoothstep(4.5, 7.2, sp.y);
        }`,
      };
    })();
    // THE STONE'S LIT COLOUR (the fourth holder). Beside the boat the stone stood at value 0.8 to 0.9 and saturation 0.4, a pale
    // salmon, from the waterline to the impost: the lake's light at the tower's foot, the rider's lantern and the kept lamp
    // together burnt it out, and the lamp's own light could not be seen on it. The key painting's most lit stone is a deep
    // rose (#b8695f: value 0.72, saturation 0.48). So what all the lights together give the stone has a shoulder: above
    // `knee` it climbs ever more slowly toward `ceiling` (in the picture's own linear light, before the tone curve), a little
    // more saturated as it goes (lit stone is the colour of its light, never white); and then the kept lamp's pool is laid
    // on top of that, so that the stone is warmed where the lamp reaches, as the page has it. Far off nothing changes: at
    // 36 m the foot stands under the knee. &twlit=knee,ceiling,saturation,lamp tries others (&twlit=99,99,1,0: none).
    // (The fifth holder: the shoulder is on the LIGHT, not on the lit colour. On the lit colour it pressed everything in strong
    // light to the one ceiling, pale stone and dark stain alike: beside the lamp the stone lost all its paint, the damp, the
    // runs, its own clouds, and was one flat tone, a soap; and the dark growth at the waterline came up as bright as the stone
    // and leaf green. Now it is how much light FALLS on the stone that climbs ever more slowly, knee and ceiling in units of
    // the stone's own paint (1 = the paint shown as painted), and every tone of the paint keeps its place under it.)
    const LIT_K = (() => { const v = (Qm.get('twlit') || '').split(','); return [0.62, 1.3, 1.12, 0.45].map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x)); })();
    const stoneLit = { uniforms: { uTwLit: { value: new THREE.Vector4(LIT_K[0], LIT_K[1], LIT_K[2], LIT_K[3]) } }, fragmentPars: 'uniform vec4 uTwLit;',
      light: /* glsl */`{
        float zl = max(c.r, max(c.g, c.b)) / max(max(albedo.r, max(albedo.g, albedo.b)), 0.03);
        // (but not the area's line of light where the water meets the stone: that is light ON the water's edge, not on the paint,
        // and over the dark growth at the waterline a shoulder in units of the paint put it out. The same width the area draws it.)
        float zlw = max(0.008, 0.0013 * length(vViewPos)), zedge = 1.0 - smoothstep(zlw * 0.5, zlw * 1.5, abs(vWPos.y - zlw * 0.5));
        if (zl > uTwLit.x) { float zr = max(uTwLit.y - uTwLit.x, 1e-3); c *= mix((uTwLit.x + zr * (1.0 - exp(-(zl - uTwLit.x) / zr))) / zl, 1.0, zedge); }
        float zg = dot(c, vec3(0.3, 0.5, 0.2)); c = max(mix(vec3(zg), c, uTwLit.z), vec3(0.0));
        c += albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * vec3(1.0, 0.8, 0.6) * (uTwLit.w * (vWPos.y > 0.0 ? 1.0 : exp(vWPos.y * 0.7)));      // (deeper than the flame: lamplight on stone is amber, never cream)
      }` };
    const stoneExt = (lit) => (stoneWork ? [stoneWork, light.extendFor(lit), stoneLit] : light.extendFor(lit));
    const stone = { extend: stoneExt(1), brush: 0.8, ...(stoneMap ? { map: stoneMap, triplanar: +(Qm.get('towermap') || 1.9) } : {}) };
    // THE BELFRY'S OWN SHARE OF THE LIGHT FROM BELOW. The area's material gives a thing 16 m up almost none of the town's
    // light (rightly, for a wall), so the bell, its frame and the roof's timbers were one dark with the room they hang
    // in, and the thing that strikes one could not be seen. But the belfry stands open on four sides over a lit lake:
    // the light comes up through its eight lights. So what hangs in it takes a share of that light of its own (as the
    // movement does behind the dials: heroes_clock.js): a little on every face, more on what looks down (the bell's
    // mouth, the headstock's underside, the boarding of the roof), and an edge of it where a form turns away. It is the
    // town's own light, read every frame: its colour and strength are the area's, and it fails when the square sleeps.
    // The timber takes little (a quiet rose where the eye looks up into it), the bell a little more: it is the thing to be
    // seen. &belfry=<factor> tries more or less of it (0: none, as it was).
    const fillK = Qm.has('belfry') ? +Qm.get('belfry') || 0 : 1, fillFrom = { value: new THREE.Color(0, 0, 0) };
    const fillOf = (base, down, edge) => ({ uniforms: { uTwFill: { value: new THREE.Vector3(base * fillK, down * fillK, edge * fillK) }, uTwFrom: fillFrom }, fragmentPars: 'uniform vec3 uTwFill, uTwFrom;',
      light: /* glsl */`{
        float twEdge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.0);
        c += albedo * uTwFrom * (uTwFill.x + uTwFill.y * max(-N.y, 0.0)) + uTwFrom * (uTwFill.z * twEdge) * (0.06 + 0.94 * albedo);
      }` });
    // tower_foot: the shaft under the water, down to the square (y -22 to -1.3): large courses, two string courses, five slit
    // windows a face in splayed reveals, the door and its fanlight at the square. Wholly under water: kept out of the mirror.
    // The stair's lights are the area's windows, laid on the glass the model names (lit only below the waterline: all of them).
    const foot = await ctx.kit.model('models/town/tower_foot.glb', { ...place, ...stone, extend: stoneExt(0.9) });
    ctx.only(foot.group, 'direct');
    { const lit = [], ry = place.rotation;
      for (let k = 0; k < 4; k++) for (let i = 0; i < 5; i++) { const p = foot.point(`slit_${k}_${i}`); lit.push({ x: p.x, y: p.y, z: p.z, yaw: ry + k * Math.PI / 2, pitch: 0, w: 0.3, h: 1.5, tone: (k * 5 + i) % 7 === 3 ? 1 : 0, rnd: 0.08 + 0.02 * ((k * 5 + i) % 5), stay: 1, s: T.s }); }
      const p = foot.point('fanlight'); lit.push({ x: p.x, y: p.y, z: p.z, yaw: ry, pitch: 0, w: 1.2, h: 0.58, tone: 3, rnd: 0.1, stay: 1, s: T.s });
      const w = light.windows(lit); ctx.add(w); ctx.only(w, 'direct'); }
    // tower_loggia: the four piers on their flagged floor under the water, the four arches, the sail vault and its oculus,
    // the string course, the eleven rungs, the mooring ring, the water's mark on every pier (y -1.3 to 7.5)
    // (Its slots: `paint` the stone, its moss, weed and lichen and the painter's end; `thin` the rungs and the mooring ring.)
    // THE IRON WEARS ITS OWN MATERIAL (the fifth holder). The slot `thin` took the stone's (a slot inherits the model's options): the
    // stone's material took iron for bare stone, drew its hue to the wall's, laid the wall's clouds, lichen and runs on it, and
    // then the kept lamp's pool on top: beside the lamp the rungs, the mooring ring and the painter's end were bright orange line
    // drawings, and 25 m up the vane was drawn down into the plum of the upper wall and lost against the sky. Iron wears the
    // area's light and nothing else; its darkness is its paint's (tower_loggia.py, tower_upper.py).
    // And it has a shoulder of its own, far lower than the stone's: the stone beside the lamp is held to a deep orange (`stoneLit`),
    // so iron and old rope must be held under it, or a rope a metre from the flame is the brightest thing on the pier.
    // &twiron=knee,ceiling,saturation tries others.
    // `held(name, key, [knee, ceiling, saturation])`: what all the lights together give a thing climbs ever more slowly above `knee`
    // toward `ceiling` (in the picture's linear light), its hue kept, its saturation scaled: a thing that is lit, never alight.
    // (the seventh holder: `pale`, [knee, ceiling, from, to]: paint lighter than `from` (its own linear light) is held less hard, by
    // `to` at this other knee and ceiling: dry hemp beside iron in one slot.)
    const held = (name, key, d, pale) => { const v = (Qm.get(key) || '').split(','), K = d.map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x));
      return { uniforms: { [name]: { value: new THREE.Vector3(K[0], K[1], K[2]) }, ...(pale ? { [name + 'P']: { value: new THREE.Vector4(pale[0], pale[1], pale[2], pale[3]) } } : {}) },
        fragmentPars: `uniform vec3 ${name};` + (pale ? ` uniform vec4 ${name}P;` : ''),
        light: /* glsl */`{
          float hl = max(c.r, max(c.g, c.b)), hknee = ${name}.x, hceil = ${name}.y;
          ${pale ? `{ float hp = smoothstep(${name}P.z, ${name}P.w, dot(albedo, vec3(0.3, 0.5, 0.2))); hknee = mix(hknee, ${name}P.x, hp); hceil = mix(hceil, ${name}P.y, hp); }` : ''}
          if (hl > hknee) { float hr = max(hceil - hknee, 1e-3); c *= (hknee + hr * (1.0 - exp(-(hl - hknee) / hr))) / hl; }
          float hg = dot(c, vec3(0.3, 0.5, 0.2)); c = max(mix(vec3(hg), c, ${name}.z), vec3(0.0));
        }` }; };
    // (the sixth holder: the ceiling was 0.2, a mid value: 4 m off, in the rider's own lantern, the rungs and the mooring ring were mauve
    // plasticine, paler than the joints of the stone they are let into. 0.09: iron is the darkest thing on a lit pier, with a dull edge.)
    const ironLit = held('uTwIron', 'twiron', [0.025, 0.09, 0.8]);
    const iron = { map: null, triplanar: 0, brush: 0.3, crisp: true, extend: [light.extendFor(1), ironLit] };
    // (the seventh holder: THE PAINTER'S END IS HEMP. It hangs in the iron's slot, and held as iron is held it was an iron rod: as dark as
    // the ring it is knotted in. Dry hemp is a grey-tan a tone under the lit stone; where the lake has soaked up it, it is as dark
    // as the iron, and that is its paint's doing (tower_loggia.py). So in the loggia's slot paint that is pale in itself is held
    // far less hard. &twhemp=knee,ceiling tries others.)
    const HEMP_K = (() => { const v = (Qm.get('twhemp') || '').split(','); return [0.06, 0.15].map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x)); })();
    const ironAndHemp = { ...iron, extend: [light.extendFor(1), held('uTwIronL', 'twiron', [0.025, 0.09, 0.8], [HEMP_K[0], HEMP_K[1], 0.09, 0.2])] };
    const loggia = await ctx.kit.model('models/town/tower_loggia.glb', { ...place, ...stone, materials: { thin: ironAndHemp } });
    // tower_upper: the clock stage with its four round openings 0.9 m deep and the plank door ajar, the belfry with its paired
    // lights, colonnettes, louvres, the bell frame, the corbel table, the lead roof, the finial; and
    // the banner vane, a moving part that turns about its spindle (y 7.5 to 25.2)
    // (Its slots: `paint` the stone, the lead and the door; `belfry` what hangs in the belfry and roofs it, in the belfry's
    // share of the light from below; `thin` the vane and its post, kept out of the painter's filter.)
    // (The second look: the timber's share was 0.12, 0.03, 0.15, and the belfry glowed: its louvres and frame were the warmest thing
    // above the water after the lamp and the gilt, orange shutters with a lamp behind them, and the pale frame was brighter than
    // the bell. The timber is back in the night: a breath of rose on what looks down, no more. The bell keeps its own share.
    // &belfrywood=a,b,c tries others.)
    const woodFill = (Qm.get('belfrywood') || '0.035,0.03,0.035').split(',').map(Number);
    // (And its paint is drawn down: what is seen of the belfry from the lake is all UNDERSIDES, boards, louvres, the roof's boarding,
    // and the area's material gives whatever looks down a third of the light from below at any height, so mid-value timber stood
    // lit where the stone beside it was night. &belfrytint=<hex without #> tries another.)
    const wood = { map: null, triplanar: 0, brush: 0.6, color: '#' + (Qm.get('belfrytint') || '6f6c8c'), extend: [light.extendFor(1), fillOf(woodFill[0], woodFill[1], woodFill[2])] };
    // (the fifth holder) The vane is sheet copper gone green, the one thing that says there is air: an upright sheet 24 m up takes
    // none of the lake's light and almost none of the night's, and could not be found from 36 m. It turns back a little of the
    // lit overcast it stands against (the cloud's own colour, read every frame: it fails with the town): above the ball only,
    // so that the door's iron in the same slot stays dark. &twvane=<strength> tries others (0: none).
    // (the sixth holder: at 0.18 it was the lightest, coldest thing above the clock, a pale blue sticker from 26 m as from 80 m. 0.06: a
    // tone over the sky, found when looked for.)
    const VANE_K = Qm.has('twvane') ? +Qm.get('twvane') || 0 : 0.06;
    const vaneShine = { uniforms: { uTwVane: { value: VANE_K } }, fragmentPars: 'uniform float uTwVane;',
      light: 'c += albedo * dot(uTownCloud * 2.6 + uTownNight * 1.2, vec3(0.3, 0.5, 0.2)) * vec3(0.8, 1.2, 1.0) * (uTwVane * smoothstep(24.0, 24.3, vWPos.y));' };      // (a grey-green a tone over the sky: the cloud's own plum on verdigris was a pale blue sticker, and more of it a turquoise one)
    const upper = await ctx.kit.model('models/town/tower_upper.glb', { ...place, ...stone, materials: { belfry: wood, thin: { ...iron, extend: [light.extendFor(1), ironLit, vaneShine] } } });
    // clock_dials: the four skeleton dials (a gilt ring 4.6 m across standing 0.25 m off each round opening, hour bars, no
    // numerals) and their eight spade hands, which are moving parts: minute_0..3 and hour_0..3 (0 the up-route face, 1 the
    // uphill, 2 the down-route, 3 the channel's). For every one of them rotation.z = -angle is clockwise seen from outside.
    const metal = { extend: light.extendFor(1), brush: 0.45 };
    // (Its slots: `paint` the gilt rings; `thin` the hour bars, stays, arbors and the hands themselves, kept out of the painter's
    // filter: 36 m off an hour bar is two pixels wide and a hand's neck one and a half, and the filter rubbed them out.)
    // The gilt takes a little of the light from below of its own, the hands and bars a little more than the rings (the page:
    // the clock's gilt only reflects the underlight; a dull gilt ring catching light on its lower arc).
    // (The page: "a dull gilt ring catching light on its lower arc". The light comes from the lake: the ring, its bars and the hands
    // are a fifth brighter at the foot of the dial and a fifth duller at its head, evenly between.)
    const lowerArc = { uniforms: { uTwDial: { value: new THREE.Vector2(T.clock.centreY, T.clock.dial / 2) } }, fragmentPars: 'uniform vec2 uTwDial;',
      light: 'c *= mix(1.22, 0.78, smoothstep(uTwDial.x - uTwDial.y, uTwDial.x + uTwDial.y, vWPos.y));' };
    // THE GILT IS METAL, AND DULL (the fourth holder). As paint in the lake's light the rings were one even saturated orange from
    // under and beside the tower, the brightest thing above the water after the lamp, with no wear and no form in them. The
    // page: "a dull gilt ring catching light on its lower arc"; "the clock's gilt only reflects the underlight". Gilding
    // that stands upright turns the night back at an eye below it: so the flat of the ring, the bars and the hands are a dull
    // old gold (their painted light held down, and drawn from the lake's orange toward gold); what leans toward the lake
    // takes more of its light; and where the metal is turned between the lake and the eye it answers with a sheen: the ring's
    // under-edge along its lower arc, the lower arrises of the bars, the hands' edges. Bronze worn through and verdigris
    // give none. Nothing is given off: all of it is the lake's light (`fillFrom`), and it fails when the square sleeps.
    // &twgilt=ring,its sheen,bars and hands,their sheen,gold tries others (&twgilt=1,0,1,0,0: as it was).
    const GILT_K = (() => { const v = (Qm.get('twgilt') || '').split(','); return [0.6, 0.9, 0.74, 1.0, 0.62].map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x)); })();
    const gilding = (dull, sheen) => ({ uniforms: { uTwGilt: { value: new THREE.Vector4(dull, sheen, GILT_K[4], 0) } }, fragmentPars: 'uniform vec4 uTwGilt;',      // (uTwFrom is declared by fillOf, which every gilt thing wears)
      light: /* glsl */`{
        float gdown = 0.5 - 0.5 * N.y;                                             // 1 what looks down at the lake, 0.5 what stands upright, 0 what looks up
        c *= mix(uTwGilt.x, min(1.0, uTwGilt.x * 1.4), smoothstep(14.0, 44.0, length(vViewPos))) * (0.66 + 1.1 * gdown * gdown * gdown);      // (far off it is a ring a few pixels wide: a little less dull, or it is lost)
        float gl = dot(c, vec3(0.3, 0.5, 0.2)); c = mix(c, gl * vec3(1.24, 0.88, 0.46), uTwGilt.z);
        float gs = pow(max(dot(N, normalize(V + vec3(0.0, -0.9, 0.0))), 0.0), 10.0);
        float gpol = smoothstep(0.03, 0.2, dot(albedo, vec3(0.3, 0.5, 0.2)));
        c += dot(uTwFrom, vec3(0.3, 0.5, 0.2)) * vec3(1.0, 0.84, 0.52) * mix(albedo * 2.2, vec3(1.0), 0.25) * (gs * uTwGilt.y * gpol);
      }` });
    // THE GILDING IS OLD (the fifth holder). From beside and beneath the ring was one even straw colour, flat card: no wear, nothing
    // gone. The page: "gilt worn to bronze on the lower arc where the damp reaches". Paint on points cannot mottle a ring whose
    // points are half a metre apart, so the wear is laid here from the stone's own tile of noise: the leaf gone to dark bronze
    // in patches a hand to a foot across, most of them low on the dial; a little verdigris weeping in the lowest arc; a grain.
    // The rings only: the bars and the hands are thin, bright, and what tells the time. &twworn=bronze,verdigris,grain tries others (0,0,0: none).
    const WORN_K = (() => { const v = (Qm.get('twworn') || '').split(','); return [0.7, 0.5, 0.3].map((x, i) => (v[i] !== undefined && v[i] !== '' && isFinite(+v[i]) ? +v[i] : x)); })();
    const worn = (k) => (stoneWork ? { uniforms: { tTwStone: stoneWork.uniforms.tTwStone, uTwWorn: { value: new THREE.Vector3(WORN_K[0] * k, WORN_K[1] * k, WORN_K[2]) } }, fragmentPars: 'uniform sampler2D tTwStone; uniform vec3 uTwWorn;',
      albedo: /* glsl */`{
        vec2 gq = vec2(vWPos.x + vWPos.z, vWPos.y);
        vec4 ga = texture2D(tTwStone, gq * 0.83), gb = texture2D(tTwStone, gq * 3.1 + 0.37);
        float glow = 1.0 - smoothstep(-0.8, 0.35, (vWPos.y - uTwDial.x) / uTwDial.y);                      // 1 on the lower arc, 0 on the upper
        float gbare = smoothstep(0.50 - 0.16 * glow, 0.64 - 0.16 * glow, ga.g + 0.3 * (gb.g - 0.5));         // where the leaf has gone
        albedo = mix(albedo, dot(albedo, vec3(0.3, 0.5, 0.2)) * vec3(0.95, 0.52, 0.30), uTwWorn.x * gbare);
        albedo = mix(albedo, vec3(0.06, 0.15, 0.12), uTwWorn.y * glow * smoothstep(0.64, 0.8, ga.b + 0.3 * (gb.b - 0.5)));
        albedo *= 1.0 + uTwWorn.z * (gb.r - 0.5);
      }` } : null);
    const dials = await ctx.kit.model('models/town/clock_dials.glb', { ...place, ...metal, extend: [worn(1), light.extendFor(1), fillOf(0.05, 0.12, 0.04), lowerArc, gilding(GILT_K[0], GILT_K[1])],
      materials: { thin: { crisp: true, extend: [light.extendFor(1), fillOf(0.14, 0.08, 0.08), lowerArc, gilding(GILT_K[2], GILT_K[3])] } } });      // (no wear on the slot the hands are in: laid by place, it would crawl over a hand as it turns)
    const hands = { minute: [0, 1, 2, 3].map((k) => dials.parts['minute_' + k]), hour: [0, 1, 2, 3].map((k) => dials.parts['hour_' + k]) };
    // STAND-IN for clock_movement (30,000 triangles, one mesh, each wheel turned in the vertex shader): the great wheel 2.4 m,
    // the second wheel 1.4 m, the escape wheel 0.8 m and the fly 1.2 m, seen in each round opening against the dark
    { const wheels = [[2.4, -0.35, -0.3], [1.4, 0.75, 0.55], [0.8, 1.15, -0.55], [1.2, -1.05, 0.85]], tor = new THREE.TorusGeometry(0.5, 0.035, 5, 28);
      const im = new THREE.InstancedMesh(tor, light.mat({ color: '#8a6e3e' }), wheels.length * 4), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
      let n = 0;
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a), ry = turn + Math.atan2(nx, nz);
        for (const [dia, ox, oy] of wheels) { const p = f.at(nx * (h + 0.06) - nz * ox, T.clock.centreY + oy, nz * (h + 0.06) + nx * ox); M.compose(V.set(p[0], p[1], p[2]), Q.setFromEuler(E.set(0, ry, 0)), S.set(dia, dia, 1)); im.setMatrixAt(n++, M); } }
      im.frustumCulled = false; im.name = 'standin:clock_movement'; ctx.add(im); }
    // bell_great: the great bell on its oak headstock with its wheel (one moving part, `bell`) and its clapper (`clapper`,
    // made a child of the bell here, so that its own turn is its swing inside the bell). The staging moves both through
    // tower.setBell(lift, clapper) below, which knows which way they turn. The file's origin is the gudgeon line: it stands at
    // the upper tower's named point `bell_axis`. It wears the belfry's share of the light from below (`fillOf`), far more than the timber:
    // the bell is the thing to be seen in the belfry. The file's fixed body carries the TWO SMALL BELLS as well (the second look): each
    // hangs in the opening of one light, at mid-wall under the arch (the channel face's down-route light, the uphill face's up-route
    // light; named points small_bell_a, small_bell_b), so that a boat under the wall sees a bell's mouth from beneath.
    // (the fourth holder: the bells' edge of light was 0.2: from under the wall a small bell's lip, seen edge-on, was a glowing orange
    // ring, the most saturated thing on the tower once the gilt was dull. 0.13: a lip that is lit, not alight. &belledge= tries others.)
    const BELL_EDGE = Qm.has('belledge') ? +Qm.get('belledge') || 0 : 0.13;
    const axis = upper.point('bell_axis');
    // (the fifth holder: and the bells are HELD. A bell's lip is worn bright and looks straight down at the lake: with the belfry's share
    // of the light on it, it was a thin hoop of saturated orange round each mouth, neon, and from head-on the great bell's two
    // halves were two orange arcs in two arched lights over the round dial. Bronze that is lit: a dull warm lip, never a line of
    // fire. &twbell=knee,ceiling,saturation tries others; &twbell=9,9,1: as it was.)
    const bellLit = held('uTwBell', 'twbell', [0.07, 0.19, 0.72]);
    const bell = await ctx.kit.model('models/town/bell_great.glb', { position: [axis.x, axis.y, axis.z], rotation: place.rotation, ...metal, brush: 0.6, extend: [light.extendFor(1), fillOf(0.19, 0.05, BELL_EDGE), bellLit] });
    bell.parts.bell.attach(bell.parts.clapper);
    // STAND-IN for pendulum (2,000): the rod through the oculus from y 9.4 and the gilt lens bob 1.1 m across, shown at the
    // bottom of its swing, its rim at y -0.02: it kisses the lake. It swings ACROSS the route (+-1.1 m), period 6.0 s; the
    // cast swings it (shared.pendulum) and writes a ring at each kiss.
    { const rod = mesh('pendulum rod', new THREE.BoxGeometry(0.06, T.pendulum.pivotY - 0.9, 0.06).translate(0, -(T.pendulum.pivotY - 0.9) / 2, 0), light.mat({ color: P.iron }), f.at(0, T.pendulum.pivotY, 0), turn);
      const bob = mesh('pendulum bob', new THREE.CylinderGeometry(T.pendulum.bob / 2, T.pendulum.bob / 2, T.pendulum.bobThick, 24).rotateZ(Math.PI / 2), light.mat({ color: '#b08a4a', water: true }), f.at(0, T.pendulum.bob / 2 + T.pendulum.kissY, 0), turn);
      shared.pendulum = { rod, bob, pivot: f.at(0, T.pendulum.pivotY, 0), yaw: turn }; }
    // STAND-IN for hour_ring (9,000): the iron wheel 16 m across lying 1.1 m above the paving, twelve lanterns on standards
    // 2.6 m tall at the hour positions, eleven rose-gold and one jade. It turns once in 96 s (cast).
    { const ring = mesh('hour_ring', new THREE.TorusGeometry((T.hourRing.radius + T.hourRing.inner) / 2, 0.42, 5, 48).rotateX(Math.PI / 2), light.mat({ color: P.iron, lit: 1 }), f.at(0, T.hourRing.y, 0)); ctx.only(ring, 'direct');
      for (let i = 0; i < T.hourRing.lanterns; i++) { const a = i / 12 * Math.PI * 2, p = f.at(Math.cos(a) * T.hourRing.radius, T.hourRing.y, Math.sin(a) * T.hourRing.radius);
        b.box({ x: p[0], y: p[1], z: p[2], sx: 0.1, sy: T.hourRing.standard - 0.5, sz: 0.1, color: P.iron }, U);
        b.box({ x: p[0], y: p[1] + T.hourRing.standard - 0.5, z: p[2], sx: 0.5, sy: 0.6, sz: 0.5 }, { where: 'under', emissive: i === 5 ? '#4AA391' : '#F3A77E', gain: 3.4 }); }
      shared.hourRing = { ring, centre: f.at(0, T.hourRing.y, 0) }; }
    for (const c of T.colliders) { const p = f.at(c.ds, 0, c.dd); ctx.addCollider({ x: p[0], z: p[2], r: c.r }); }
    // What the others need of the tower (docs/build/town/2-monument.md lists every named point and moving part):
    //   shared.tower.point(name)       a named place of any of its five models, now, in the realm (lamp_wall, oculus, dial_0..3,
    //                                  sill_0a.., bell_mouth, bell_lip, clapper_ball, vane_tip, slit_k_n, fanlight, roost_k_n ...)
    //   shared.tower.parts             { bell, clapper, vane, minute: [4], hour: [4] }
    //   shared.tower.setBell(lift, c)   the bell lifted toward the arriving boat by `lift` radians, its clapper `c` radians toward
    //                                  the down-route lip; shared.tower.bell = { lift, clapper } is where they are
    //   shared.tower.stroke(tau)       the page's stroke at tau seconds after the wheel begins to turn the bell (it sets both)
    //   shared.tower.clock             the hands' time: `start` minutes past twelve when the realm begins, `nudge` minutes more
    //                                  (the staging's), `hold: true` stops this module turning them at all
    //   shared.tower.vane              { hold: false, amplitude (radians), period (s) }: its wander in air that has no wind
    const models = { foot, loggia, upper, dials, bell };
    // Thin iron and the hands are kept out of the mirror: in the water's picture of the tower they are less than a pixel,
    // and each is a draw call a pass (the rungs, the vane and its post, the hour bars and stays, eight hands).
    for (const m of [loggia, upper, dials]) m.group.traverse((o) => { if (o.isMesh && (o.material === m.materials.thin || o.name === 'vane' || /^(minute|hour)_\d$/.test(o.name))) ctx.only(o, 'direct'); });
    const tower = shared.tower = { frame: f, x: f.x, z: f.z, yaw: f.yaw, place, models,
      parts: { bell: bell.parts.bell, clapper: bell.parts.clapper, vane: upper.parts.vane, minute: hands.minute, hour: hands.hour },
      point(name, target) { for (const m of Object.values(models)) if (m.points[name]) return m.point(name, target); console.error(`INVALID_MODEL the tower has no point "${name}"`); return (target || new THREE.Vector3()).set(f.x, 0, f.z); },
      clock: { start: 28, nudge: 0, hold: false, minutes: 28 }, vane: { hold: false, amplitude: 25 * Math.PI / 180, period: 17 } };
    if (Qm.has('notower')) for (const m of Object.values(models)) m.group.visible = false;      // &notower=1 (measuring only): the tower's models not drawn
    // A slow first motion, by phase (nothing is added up frame by frame: the same picture twice is the same picture). The hands
    // go with the movement's centre arbor when the clockwork is there (shared.clock.minuteAngle: one turn in 240 s, in the
    // escapement's own steps), and by the realm's clock when it is not; the vane wanders. A dial the rider cannot see (he is
    // behind its wall's plane) does not draw its hands: eight parts would otherwise be twenty-four draw calls for four seen.
    const TAU = Math.PI * 2, eye = ctx.engine.shared.uCameraPos.value, cs = Math.cos(f.yaw), sn = Math.sin(f.yaw);
    // The bell, for the staging: tower.setBell(lift, clapper), both in radians. lift > 0 raises its mouth toward the UP-ROUTE
    // side, the arriving boat (the page's stroke: 42 degrees, then back through 20 and 8 to rest); clapper is its clapper's
    // own swing inside it, > 0 toward the down-route lip, where it falls when the bell is lifted (it meets the lip at 0.34).
    // (In the parts' own terms that is bell.rotation.x = -lift and clapper.rotation.x = +clapper: do not turn them by hand.)
    tower.setBell = (lift = 0, clapper = 0) => { tower.parts.bell.rotation.x = -lift; tower.parts.clapper.rotation.x = clapper; tower.bell.lift = lift; tower.bell.clapper = clapper; };
    tower.bell = { lift: 0, clapper: 0 };
    // The stroke as the page gives it (section 6: the wheel turns the bell 42 degrees up, the clapper meets the lip, the bell
    // swings back, makes two smaller, silent swings, 20 then 8 degrees, and hangs still within ten seconds), as a function of
    // the seconds since the wheel began to turn it: tower.stroke(tau) puts bell and clapper where they are at that moment and
    // returns the lift (tau <= 0: at rest). The clapper meets the lip at tau 0.48; the bell is at its height at tau 1.0. The
    // staging calls it from its show clock (tower.stroke(T - 2.5)); nothing here plays it by itself: at rest the bell hangs still.
    const LIFT = 42 * Math.PI / 180, RISE = 1.0, SWING = 3.6, DIE = 2.25;
    tower.stroke = (tau) => {
      const lift = tau <= 0 ? 0 : tau < RISE ? LIFT * (1 - Math.cos(Math.PI * tau / RISE)) / 2 : LIFT * Math.exp(-(tau - RISE) / DIE) * Math.cos(TAU * (tau - RISE) / SWING);
      tower.setBell(lift, Math.max(-0.34, Math.min(0.34, lift)));      // the clapper hangs plumb until a lip takes it
      return lift;
    };
    // &bell=<degrees>[,<clapper degrees>] holds it so, for pictures (&bell=42,19 is the stroke at the moment the clapper meets
    // the lip); &bell=strike plays the stroke every 16 s, beginning 2 s in (for strips)
    const strikeDemo = Qm.get('bell') === 'strike';
    if (Qm.has('bell') && !strikeDemo) { const [bl = 0, cl = 0] = (Qm.get('bell') || '').split(',').map(Number); tower.setBell(bl * Math.PI / 180, cl * Math.PI / 180); }
    ctx.onUpdate((dt, c) => {
      // the light from below at the tower, now (the belfry's share of it: see `fillOf` above)
      { const LU = light.U, u = LU.uTownUnder.value, burn = light.at(f.x, f.z); fillFrom.value.copy(LU.uTownUnderCol.value).multiplyScalar((u.y + (1 - u.y) * Math.min(1, burn * 1.5)) * u.x); }
      if (strikeDemo) tower.stroke((c.time % 16) - 2);
      const ck = tower.clock;
      if (!ck.hold) {
        const turned = shared.clock && shared.clock.minuteAngle ? shared.clock.minuteAngle() : c.time / 240 * TAU;
        ck.minutes = ck.start + ck.nudge + turned / TAU * 60;
        const am = ck.minutes / 60 * TAU, ah = am / 12;
        for (let k = 0; k < 4; k++) { hands.minute[k].rotation.z = -am; hands.hour[k].rotation.z = -ah; }
      }
      const ls = (eye.x - f.x) * cs - (eye.z - f.z) * sn, ld = (eye.x - f.x) * sn + (eye.z - f.z) * cs, seen = [ls < -h + 1, ld > h - 1, ls > h - 1, ld < -h + 1];
      for (let k = 0; k < 4; k++) hands.minute[k].visible = hands.hour[k].visible = seen[k];
      const v = tower.vane;
      if (!v.hold) tower.parts.vane.rotation.y = v.amplitude * (0.62 * Math.sin(c.time * TAU / v.period + 0.6) + 0.38 * Math.sin(c.time * TAU / (v.period * 1.618) + 2.1));
    });
  }

  // ---------------------------------------------------------------------------------------------- the kept lamp
  // The engine's storm lantern, lit, note G4, three moths, on a wrought bracket on the tower's up-route, channel-side
  // pier: the only flame and the only light above the waterline, and the only light in the area with a reflection.
  {
    // It hangs from the scrolled wrought bracket (the creature toolkit's: assets/models/life/lamp_bracket.glb, the same piece
    // as the sea's lighthouse door), nailed to the channel-side face of the tower's up-route pier where the loggia's model
    // names the place (`lamp_wall`): its arm reaches 0.8 m toward the channel and the flame burns 2.3 m above the lake, at
    // s 180.8, d 5.7 (the page's s 180.2, d 5.6 is 0.6 m up-route of it, in the air off the pier's corner).
    const Lp = plan.lamp, tf = frameAt(town, plan.tower.s, plan.tower.d);
    await loadLamp(['bracket']);
    const nail = shared.tower.point('lamp_wall');
    shared.lamp = makeKeptLamp(ctx.engine, ctx, { holding: 'bracket', wall: [nail.x, nail.y, nail.z], out: [-Math.sin(tf.yaw), -Math.cos(tf.yaw)], note: Lp.note, moths: Lp.moths, near: Lp.near, reach: 7 });
    // (the bracket is wrought iron a finger thick: kept out of the painter's filter, which rubbed it out beyond 6 m. The
    // material is this lamp's own. Asked of the engine: a `crisp` option on makeKeptLamp.)
    shared.lamp.holder.traverse((o) => { if (o.isMesh && o.material && o.material.defines && /bracket/.test(o.name)) { o.material.defines.CRISP = ''; o.material.needsUpdate = true; } });
    const x = shared.lamp.position.x, z = shared.lamp.position.z, flameY = shared.lamp.position.y;
    // Its stroke on the water. The lamp is the only light in the area with a reflection, and the page asks for one long
    // amber stroke under it. The water cannot give it: from an eye 1.1 m up, the mirror image of a lamp 2.3 m up lies a
    // third of the way from the eye to the lamp, which is inside the clear window for any lamp nearer than 45 m. So the
    // stroke is laid here, where the mirror would put it: from the lamp's foot toward the rider, brightest at the true
    // image, wavering on whatever ripples pass under it. Direct view only; the water's own mirror adds to it far off.
    {
      const sh = ctx.engine.shared, f = frameAt(town, plan.tower.s, plan.tower.d), h = plan.tower.side / 2;
      const geo = new THREE.PlaneGeometry(1, 1, 1, 40); geo.translate(0, 0.5, 0);
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...waterUniforms(ctx.engine), uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uCameraPos: sh.uCameraPos,
          uLampAt: { value: new THREE.Vector3(x, flameY, z) }, uStroke: { value: new THREE.Vector4(1, 0, 0, 0) }, uAmber: { value: new THREE.Color('#FFB45E') } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          uniform vec3 uLampAt, uCameraPos; varying float vT, vAcross, vDist, vGraze; varying vec2 vXZ;
          void main() {
            vec2 e = uCameraPos.xz, l = uLampAt.xz, dir = l - e; float D = length(dir); dir /= max(D, 1e-3);
            float x0 = D * uCameraPos.y / (uCameraPos.y + uLampAt.y);               // where a still mirror shows the lamp
            float xa = 0.72 * x0, xb = max(min(D - 0.35, x0 + 0.9 + 0.035 * D * D), xa + 0.5), xx = mix(xa, xb, position.y);
            float wide = 0.05 + 0.008 * xx;
            vec2 p = e + dir * xx + vec2(-dir.y, dir.x) * (position.x * 2.0 * wide);
            vT = (xx - x0) / max(xb - x0, 1e-3); vAcross = position.x * 2.0; vXZ = p; vDist = length(vec3(p.x, 0.0, p.y) - uCameraPos);
            vGraze = 1.0 - smoothstep(0.14, 0.55, uCameraPos.y / max(xx, 0.1));          // seen steeply, still water mirrors little
            gl_Position = projectionMatrix * viewMatrix * vec4(p.x, 0.012, p.y, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${FOG_PARS} ${WATER_GLSL}
          uniform vec3 uAmber; uniform vec4 uStroke; uniform float uTime; varying float vT, vAcross, vDist, vGraze; varying vec2 vXZ;
          void main() {
            if (uStroke.y > 0.5) discard;
            vec4 rip = waterRipple(vXZ);
            float across = vAcross + rip.x * 14.0;                                      // a passing ring breaks the stroke sideways
            float core = exp(-across * across * 3.2);
            float along = vT < 0.0 ? smoothstep(-0.9, 0.0, vT) * smoothstep(-1.0, -0.6, vT) : mix(1.0, 0.32, smoothstep(0.0, 0.9, vT)) * (1.0 - smoothstep(0.93, 1.0, vT));
            float dash = 0.82 + 0.18 * sin(vT * 31.0 + uTime * 0.7) - min(0.6, length(rip.xy) * 9.0);
            float a = core * along * max(dash, 0.0) * uStroke.x * vGraze * (1.0 - fogAmount(vDist)) * (1.0 - uVeil);
            gl_FragColor = vec4(uAmber * (0.8 * a), 1.0);
          }`,
      });
      const stroke = new THREE.Mesh(geo, mat); stroke.frustumCulled = false; stroke.renderOrder = 2; stroke.name = 'kept-lamp-stroke';
      stroke.onBeforeRender = (renderer) => { mat.uniforms.uStroke.value.y = renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0; mat.uniformsNeedUpdate = true; };
      ctx.add(stroke); ctx.only(stroke, 'direct');
      // hidden when the tower stands between the rider and the lamp (the rider is behind the tower's far corner)
      const cx = f.x, cz = f.z, cy = Math.cos(f.yaw), sy = Math.sin(f.yaw);
      ctx.onUpdate((dt, c) => {
        const e = sh.uCameraPos.value, ls = (e.x - cx) * cy - (e.z - cz) * sy, ld = (e.x - cx) * sy + (e.z - cz) * cy;      // the eye in the tower's frame: down the route, to the right
        const behind = Math.max(0, Math.min(1, (ls + h + 0.5) / 6)) * Math.max(0, Math.min(1, (ld + h + 0.5) / 6));          // 1 when well past both the up-route and the channel faces
        const flick = 1 + Math.sin(c.time * 9.1 + 1.0) * 0.03 + Math.sin(c.time * 13.7) * 0.02;
        mat.uniforms.uStroke.value.x = (1 - behind) * (shared.lamp ? shared.lamp.lit : 1) * flick;
      });
      shared.lampStroke = stroke;
    }
  }

  // ---------------------------------------------------------------------------------------------- the church
  // STAND-IN for church (12,000): nave 30 by 12 m, 18.2 m to the ridge. Its ridge lies along d -5 from s 119 to 147, 1.2 m
  // clear; slate planes dive under at 52 degrees; eight lit lancets a side just under the surface (y -0.4 to -3.6); a lead
  // fleche at s 127 to y 6.5; the apse hips down under water at s 147 with a stone finial awash.
  {
    const C = plan.church, len = C.s1 - C.s0, f = frameAt(town, (C.s0 + C.s1) / 2, C.d), eaves = C.ridge - (C.width / 2) * Math.tan(C.pitch * Math.PI / 180);
    b.gable({ x: f.x, y: eaves, z: f.z, yaw: f.yaw, sx: len, sy: C.ridge - eaves, sz: C.width, color: P.slate }, { where: 'awash', lit: 0.3 });
    stand({ name: 'church (nave 30 by 12 m)', position: [f.x, C.floor, f.z], size: [len, eaves - C.floor, C.width - 0.4], turn: f.yaw, color: P.plaster[2], lit: 0.8 });
    // the nave lights: lancets leaded in rose-gold and jade (the texture `glass` will fill them). See the log: they stand
    // 2.6 m out from the ridge line, rising through the roof plane (as lucarnes), so that they are seen from the boat.
    for (let i = 0; i < C.lancets.perSide; i++) for (const side of [-1, 1]) {
      const p = f.at(-len / 2 + 2.8 + i * 3.2, C.lancets.bottom, side * C.lancets.out), jade = i % 3 === 2;
      b.box({ x: p[0], y: p[1], z: p[2], yaw: f.yaw, sx: C.lancets.width, sy: C.lancets.top - C.lancets.bottom, sz: 0.3 }, { where: 'under', emissive: jade ? '#3f9484' : '#D98A78', top: jade ? '#6fcab6' : '#F3A77E', y0: C.lancets.bottom, y1: C.lancets.top, gain: jade ? 0.6 : 0.8, topGain: jade ? 0.9 : 1.25 });
      const q = f.at(-len / 2 + 2.8 + i * 3.2, C.lancets.bottom - 0.2, side * (C.lancets.out - 0.75)); b.box({ x: q[0], y: q[1], z: q[2], yaw: f.yaw, sx: C.lancets.width + 0.5, sy: C.lancets.top - C.lancets.bottom + 0.25, sz: 1.2, color: P.slate }, { where: 'under', lit: 0.3 });
    }
    // the fleche (herringbone lead, louvres, a cock vane on a ball: vane_3)
    { const p = frameAt(town, C.fleche.s, C.d); b.cone({ x: p.x, y: C.ridge - 0.5, z: p.z, sx: 1.5, sy: C.fleche.top - C.ridge + 0.5, sz: 1.5, color: P.lead }, A); b.box({ x: p.x, y: C.fleche.top, z: p.z, yaw: p.yaw + 0.4, sx: 0.5, sy: 0.3, sz: 0.03, color: P.iron }, A); }
    // the apse: its roof hips down from the ridge end; a finial awash
    { const p = frameAt(town, C.apse.s, C.d); b.cone({ x: p.x, y: eaves, z: p.z, sx: C.width, sy: C.ridge - eaves - 0.9, sz: C.width, color: P.slate }, { where: 'awash', lit: 0.3 }); b.cyl({ x: p.x, y: C.floor, z: p.z, sx: C.width - 0.6, sy: eaves - C.floor, sz: C.width - 0.6, color: P.plaster[2] }, U);
      const q = frameAt(town, C.finial.s, C.d); b.ball({ x: q.x, y: -0.3, z: q.z, sx: 0.5, sy: 0.75, sz: 0.5, color: P.stone }, A); }
    // the ridge is solid at the waterline: the hull slides along it
    for (let s = C.s0 + 0.4; s <= C.s1 + 0.3; s += 1.55) { const [x, z] = town.xz(s, C.d); ctx.addCollider({ x, z, r: 0.62 }); }
    { const [x, z] = town.xz(C.finial.s, C.d); ctx.addCollider({ x, z, r: 0.5 }); }
    shared.church = { frame: f, ridgeEnd: town.xz(C.s0 + 1, C.d) };
  }

  // ---------------------------------------------------------------------------------------------- the market hall
  // STAND-IN for market_hall (14,000): 44 by 22 by 24 m, iron and glass, on the left of the square. Its lantern roof breaks
  // the surface as the glass ridge: 44 m long, 3.2 m wide, 0.9 m clear, lit from within, jade at the eaves to turquoise at
  // the ridge, the brightest thing at the waterline. The roof below is drawn here as its iron ribs only, so that the rider
  // alongside looks down through it into the hall: its floor, three rows of stalls, hanging lamps.
  {
    const H = plan.hall, len = H.s1 - H.s0, f = frameAt(town, (H.s0 + H.s1) / 2, H.d), hw = H.width / 2, rw = H.ridgeWidth / 2;
    const glass = stand({ name: 'the glass ridge: market_hall lantern', position: f.at(0, H.lanternFoot, 0), size: [len, H.clear - H.lanternFoot, H.ridgeWidth], turn: f.yaw, emissive: '#3a8a7c', emissiveTop: '#58b8a4', y0: 0.2, y1: H.clear, gain: 0.28, topGain: 0.5, wakeS: 176 });      // (the page's gain of 2.2 is for the ridge line itself: the modelled glazing bars' crest)
    shared.glassRidge = glass;
    { const p = f.at(0, H.clear - 0.02, 0); b.box({ x: p[0], y: H.clear - 0.02, z: p[2], yaw: f.yaw, sx: len, sy: 0.1, sz: 0.5 }, { where: 'awash', emissive: '#7ADCC6', gain: 1.5 }); }      // the ridge itself: the one line of turquoise
    for (let x = -len / 2 + H.barEvery; x < len / 2; x += H.barEvery) for (const sd of [-1, 1]) { const q = f.at(x, H.lanternFoot, sd * (rw + 0.01)); b.box({ x: q[0], y: H.lanternFoot, z: q[2], yaw: f.yaw, sx: 0.035, sy: H.clear - H.lanternFoot, sz: 0.03, color: P.iron }, A); }
    for (let x = -len / 2; x <= len / 2 + 0.01; x += H.finialEvery) { const p = f.at(x, H.clear, 0); b.cone({ x: p[0], y: H.clear, z: p[2], sx: 0.12, sy: 0.5, sz: 0.12, color: P.iron }, A); for (const sd of [-1, 1]) { const q = f.at(x, H.lanternFoot, sd * rw); b.box({ x: q[0], y: H.lanternFoot, z: q[2], yaw: f.yaw, sx: 0.09, sy: H.clear - H.lanternFoot + 0.05, sz: 0.09, color: P.iron }, A); } }
    for (const sd of [-1, 1]) {
      // the glass of the roof's two slopes, lit from within: jade at the eaves, brighter toward the lantern. A film of light
      // over the hall, not a wall: the rider alongside looks down THROUGH it at the far aisle, the stalls and the lamps
      // (through the nearer slope and under the lantern: see the log), so it is drawn as light under the water's surface.
      { const a = f.at(0, H.lanternFoot - 0.06, sd * rw), c = f.at(0, H.eaves - 0.06, sd * hw), run = Math.hypot(hw - rw, H.lanternFoot - H.eaves), slope = Math.atan2(H.lanternFoot - H.eaves, hw - rw), sh = ctx.engine.shared;
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, run), new THREE.ShaderMaterial({
          uniforms: { ...light.U, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uGlassA: { value: new THREE.Color('#2f7d70').multiplyScalar(0.9) }, uGlassB: { value: new THREE.Color('#58b8a4').multiplyScalar(1.5) }, uPanes: { value: new THREE.Vector2(len / H.barEvery, 12) } },
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
          vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; varying float vDist; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
          fragmentShader: /* glsl */`
            ${FOG_PARS} ${light.GLSL}
            uniform vec3 uGlassA, uGlassB; uniform vec2 uPanes; varying vec2 vUv; varying vec3 vW; varying float vDist;
            void main() {
              vec2 g = fract(vUv * uPanes), id = floor(vUv * uPanes);
              float bar = smoothstep(0.0, 0.06, g.x) * smoothstep(1.0, 0.94, g.x) * smoothstep(0.0, 0.03, g.y) * smoothstep(1.0, 0.97, g.y);     // glazing bars every 0.6 m
              float pane = 0.75 + 0.25 * fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);                                              // each pane a little tilted: no two catch the light alike
              float missing = step(0.985, fract(sin(dot(id, vec2(39.3, 11.7))) * 24634.63));                                                    // a few panes are gone
              vec3 c = mix(uGlassA, uGlassB, smoothstep(0.1, 1.0, vUv.y)) * bar * pane * (1.0 - missing) * townWake(176.0, vW.xz, -1.0, 0.6);
              gl_FragColor = vec4(c * (1.0 - fogAmount(vDist)) * (1.0 - uVeil), 1.0);
            }`,
        }));
        pane.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); pane.rotation.set(-(Math.PI / 2 - slope), f.yaw + (sd > 0 ? 0 : Math.PI), 0, 'YXZ');
        pane.name = 'standin:market hall glass'; pane.frustumCulled = false; pane.renderOrder = -2; ctx.add(pane); ctx.only(pane, 'direct'); }
      for (let i = 0; i <= 18; i++) { const x = -len / 2 + i * len / 18; b.beam(f.at(x, H.lanternFoot, sd * rw), f.at(x, H.eaves, sd * hw), 0.22, P.iron, U); }
      for (const t of [0.33, 0.66, 1]) { const y = H.lanternFoot + (H.eaves - H.lanternFoot) * t, z = sd * (rw + (hw - rw) * t); b.beam(f.at(-len / 2, y, z), f.at(len / 2, y, z), 0.16, P.iron, U); }
      const w = f.at(0, H.floor, sd * hw); b.box({ x: w[0], y: H.floor, z: w[2], yaw: f.yaw, sx: len, sy: H.eaves - H.floor, sz: 0.5, color: '#5d5670' }, U);
    }
    for (const e of [-1, 1]) { const w = f.at(e * len / 2, H.floor, 0); b.box({ x: w[0], y: H.floor, z: w[2], yaw: f.yaw, sx: 0.5, sy: H.eaves - H.floor, sz: H.width, color: '#5d5670' }, U); }
    for (let r = -1; r <= 1; r++) for (let i = 0; i < 8; i++) { const p = f.at(-len / 2 + 4 + i * 5.1, H.floor, r * 6.2);
      b.box({ x: p[0], y: H.floor, z: p[2], yaw: f.yaw, sx: 3, sy: 0.9, sz: 2, color: '#7a6470' }, U); b.gable({ x: p[0], y: H.floor + 2.1, z: p[2], yaw: f.yaw, sx: 3.3, sy: 0.6, sz: 2.4, color: (i + r) % 2 ? '#4AA391' : '#C76C8C' }, U);
      b.ball({ x: p[0], y: H.floor + 3.4, z: p[2], sx: 0.36, sy: 0.36, sz: 0.36 }, { where: 'under', emissive: '#B8E6CF', gain: 3 }); }
  }

  // ---------------------------------------------------------------------------------------------- the fountain
  // STAND-IN for fountain (4,000): three stone tiers, basin 6 m, 4.5 m tall, on the square's floor at s 170, d -13. It still
  // plays: a column of silver bubbles climbs 22 m to a boil at the surface (cast).
  { const Fo = plan.fountain, f = frameAt(town, Fo.s, Fo.d);
    stand({ name: 'fountain', position: [f.x, Fo.floor, f.z], size: [Fo.basin, 0.9, Fo.basin], shape: 'cylinder', color: P.stone, lit: 1.2 });
    b.cyl({ x: f.x, y: Fo.floor + 0.9, z: f.z, sx: 0.9, sy: 1.5, sz: 0.9, color: P.stone }, U); b.cyl({ x: f.x, y: Fo.floor + 2.4, z: f.z, sx: 3.0, sy: 0.3, sz: 3.0, color: P.stone }, U);
    b.cyl({ x: f.x, y: Fo.floor + 2.7, z: f.z, sx: 0.5, sy: 1.2, sz: 0.5, color: P.stone }, U); b.cyl({ x: f.x, y: Fo.floor + 3.9, z: f.z, sx: 1.5, sy: 0.25, sz: 1.5, color: P.stone }, U); b.cyl({ x: f.x, y: Fo.floor + 4.15, z: f.z, sx: 0.2, sy: 0.35, sz: 0.2, color: P.lead }, U);
    shared.fountain = { x: f.x, z: f.z, top: Fo.floor + Fo.height }; }

  // ---------------------------------------------------------------------------------------------- the theatre front (the passage out)
  // STAND-IN for theatre_front (16,000; the column is one model of 1,200 used six times, and the theatre's page reuses it):
  // six unfluted columns 14 m tall standing on a stylobate 1 m under water, an entablature 2.2 m, a coffered soffit 13 m deep,
  // a pediment rising 4 m more; thirteen metres behind, a wall of three arches (7 m between two of 5 m, on piers 1.5 m) into
  // the foyer, 20 m wide and 10 m high, of which the first 12 m are this area's (built on to the end of the water here, so
  // that no opening shows in the veil).
  {
    const T = plan.theatre, Po = T.portico, top = Po.floor + Po.height, wide = 36.6;
    const pale = light.mat({ color: P.paleStone, water: true }), cg = new THREE.CylinderGeometry(Po.neck / 2, Po.base / 2, Po.height, 20).translate(0, Po.height / 2, 0);
    const cols = new THREE.InstancedMesh(cg, pale, Po.columns.length), M = new THREE.Matrix4();
    Po.columns.forEach((d, i) => { const [x, z] = town.xz(Po.s, d); M.makeTranslation(x, Po.floor, z); cols.setMatrixAt(i, M); ctx.addCollider({ x, z, r: Po.base / 2 + 0.3 }); });
    cols.name = 'standin:portico columns (theatre_front)'; cols.frustumCulled = false; ctx.add(cols);
    const mid = frameAt(town, Po.s + Po.depth / 2 + 0.2, 0);
    b.box({ x: mid.x, y: top, z: mid.z, yaw: mid.yaw, sx: Po.depth + 2.2, sy: Po.entablature, sz: wide, color: P.paleStone }, A);                        // the entablature and the soffit over the water
    b.gable({ x: mid.x, y: top + Po.entablature, z: mid.z, yaw: mid.yaw, sx: Po.depth + 2.2, sy: Po.pediment, sz: wide + 0.8, color: P.paleStone }, A);      // the roof, its pediment toward the lake
    // the stylobate under the portico and the foyer's floor, a metre down (true planes: the bed's own mesh is too coarse here),
    // and the quay of the far shore either side of the theatre, standing 1.25 m clear
    { const slab = (s0, s1, d0, d1, y0, y1, color, opt) => { const p = frameAt(town, (s0 + s1) / 2, (d0 + d1) / 2); b.box({ x: p.x, y: y0, z: p.z, yaw: p.yaw, sx: s1 - s0, sy: y1 - y0, sz: d1 - d0, color }, opt); };
      slab(224.4, 240.6, -18.4, 18.4, -3, Po.floor + 0.02, '#8f819c', { where: 'under', lit: 0.9 });
      slab(240.6, 262, -10.4, 10.4, -3, Po.floor + 0.02, '#6a5a7c', { where: 'under', lit: 1.0 });
      for (const sd of [-1, 1]) { slab(224.6, 241, sd * 18.4 + (sd < 0 ? -1.0 : 0), sd * 18.4 + (sd < 0 ? 0 : 1.0), -3, 1.25, '#6c5c78', A);
        for (let d = 19.4; d < 84; d += 6) { const dd = sd * (d + 3), s = town.farShore(dd), p = frameAt(town, s + 0.2, dd), s2 = town.farShore(sd * (d + 6)), s1 = town.farShore(sd * d); b.beam([...town.xz(s1 + 0.2, sd * d).slice(0, 1), -0.9, town.xz(s1 + 0.2, sd * d)[1]], [town.xz(s2 + 0.2, sd * (d + 6))[0], -0.9, town.xz(s2 + 0.2, sd * (d + 6))[1]], 4.3, '#6c5c78', { ...A, wide: 1.1 }); } } }
    // the stylobate's three steps, seen through the water
    for (let i = 0; i < 3; i++) { const p = frameAt(town, Po.s - 2.6 + i * 0.7, 0); b.box({ x: p.x, y: Po.floor - 1.05 + i * 0.35, z: p.z, yaw: p.yaw, sx: 0.75, sy: 0.35, sz: wide + 1, color: P.paleStone }, { where: 'under', lit: 1.3 }); }
    // the theatre steps: 22 treads from 12 m down to the stylobate, each tread edged with light from the two last lamps
    { const St = T.steps, n = 22; for (let i = 0; i < n; i++) { const s = St.s0 + (i + 0.5) * (St.s1 - St.s0) / n, y = St.from + (i + 1) * (St.to - St.from) / n, p = frameAt(town, s, 0); b.box({ x: p.x, y: y - 0.5, z: p.z, yaw: p.yaw, sx: (St.s1 - St.s0) / n + 0.03, sy: 0.5, sz: St.width, color: P.paleStone }, { where: 'under', lit: 1.4 }); } }
    // the door wall at s 239: piers, the wall either side, the heads of the three arches
    const W = T.wall, wy = top - Po.floor, ws = W.s + 0.7, piece = (d0, d1, y0, y1) => { const p = frameAt(town, ws, (d0 + d1) / 2); b.box({ x: p.x, y: y0, z: p.z, yaw: p.yaw, sx: 1.4, sy: y1 - y0, sz: d1 - d0, color: '#8a7a9c' }, A); };
    piece(-wide / 2, -10, Po.floor, top); piece(10, wide / 2, Po.floor, top);
    for (const d of W.piers) { piece(d - W.pier / 2, d + W.pier / 2, Po.floor, top); const [x, z] = town.xz(ws, d); ctx.addCollider({ x, z, r: W.pier / 2 + 0.3 }); }
    piece(-3.5, 3.5, W.archTop, top); piece(-10, -5, W.archTop - 1.6, top); piece(5, 10, W.archTop - 1.6, top);
    // the foyer: dark plaster, a coffered ceiling at y 10 (the theatre's page continues it)
    { const Fy = T.foyer, s0 = W.s + 1.4, s1 = 262, p = frameAt(town, (s0 + s1) / 2, 0), dk = '#3a2c44';
      for (const sd of [-1, 1]) { const q = frameAt(town, (s0 + s1) / 2, sd * (Fy.width / 2 + 0.3)); b.box({ x: q.x, y: Po.floor, z: q.z, yaw: q.yaw, sx: s1 - s0, sy: Fy.height + 1, sz: 0.6, color: dk }, A); }
      b.box({ x: p.x, y: Fy.height, z: p.z, yaw: p.yaw, sx: s1 - s0, sy: 0.5, sz: Fy.width + 1.2, color: dk }, A);
      const e = frameAt(town, s1, 0); b.box({ x: e.x, y: Po.floor, z: e.z, yaw: e.yaw, sx: 0.6, sy: Fy.height + 1, sz: Fy.width + 1.2, color: '#140f18' }, A); }
    shared.portico = { columns: Po.columns.map((d) => town.xz(Po.s, d)) };
  }

  b.flush();
  return {};
}
