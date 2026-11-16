// The standing sky: the cast, group "Shallows" (docs/build/sky/3-cast-shallows.md; plan: docs/build/sky/3-cast-plan.md).
// The small life under the keel and at the two lamps:
//
//   row 4  brine shrimp     the fish family's makeShrimp: 6,000 in a box that follows the eye, a hand of water; seen in
//                           the lantern's pool and round the fallen stars, nowhere else; under the prow lantern they
//                           gather four times as thick within 6 s of the boat lying still. The fallen stars the boat can
//                           come near are handed over as lights to gather round (shrimp.light) and as local lights to
//                           show them by (ctx.light): both go out when their star leaves the bed.
//   row 5  moths            the lamp's own (makeKeptLamp, heroes_b.js): three at the kept lamp, three that come to the far
//                           lamp when it is lit; they cross to the prow lantern when the boat lies still. Nothing is made
//                           here but the call staging uses and a switch to look.
//   row 18 caustic nets     the set's (set.js, plan.lakeBed.caustics: on the bed's own mesh). Checked here, not made.
//
// What this module leaves in shared.cast.shallows:
//   shrimp                  the family's handle (gathered 0..1, light(), count, object)
//   starLights              [{ i, shrimp, lamp }]: the fallen stars' two lights, by the star's number in shared.bed
//   farMoths(delay)         brings the far lamp's three moths `delay` seconds (4) after it is lit: call it where the flame
//                           crosses (the remodelled lamp's moths come by themselves: the call is then nothing)
// Looking: &shallows=farlamp lights the far lamp at once (to see its moths); &shallows=off builds none of this.
import { makeShrimp } from '../../engine/life/fish.js';

export async function build(ctx, plan, shared) {
  const { kit } = ctx, P = plan, sky = shared.sky, cast = shared.cast = shared.cast || {}, S = cast.shallows = {};
  const dev = (new URLSearchParams(location.search).get('shallows') || '').split(',');
  if (dev.includes('off')) return {};

  // ---------------------------------------------------------------------------------------------- brine shrimp
  // (the family's numbers are the page's; its box is 12 m, twice its 6 m sight)
  // What the mirror lets through (looked at first, as the plan asks: .shots/sky_shallows_s32_a_crop.png). By night this
  // water gives back 86 parts in a hundred looking straight down and more at a glance, so of a shrimp as the family lights
  // it about a seventh is left: dull red specks no lighter than the water, hue without value. So the lamps' light in them
  // is typed a little over one and a half times the family's (LIT) and their own colour a paler rose, until
  // one in the lantern's pool is a pale comma on dark water.
  // (DEPTH: the family rides them 3 to 15 cm down and knows nothing of the hull: those under the boat's own footprint were
  // drawn above its floorboards, sparks loose in the boat two metres from the eye. Kept to the lowest hand's breadth of
  // the water they are under the boards there, and nobody can tell the difference outside it.)
  const DEPTH = [0.115, 0.17], LIT = [3.3, 0.15], shrimp = S.shrimp = makeShrimp(ctx, { count: 6000, lit: LIT, color: '#ecdfe6', pale: '#ffffff', depth: DEPTH });      // (at 8 and a full rose the lantern made orange sparks of them; at 5.5 the gathered ones round a star were still a glitter on the sheet)
  shrimp.object.name = 'brine shrimp';
  // the fallen stars within reach of water the boat can come to: each a light to gather round and a light to be seen by
  const L = cast.lights, stars = (L && L.list) || [], near = S.starLights = [], REACH = 7;
  stars.forEach((st, i) => {
    if (st.s == null || st.s < 2 || st.s > ctx.path.length - 1 || Math.abs(st.d) > kit.halfWidth(st.s) + REACH) return;
    near.push({ i, x: st.x, z: st.z, on: 1, shrimp: shrimp.light({ x: st.x, z: st.z, radius: 1.2 }), lamp: ctx.light({ position: [st.x, st.y + 0.08, st.z], color: st.color || P.colors.starWhite, radius: 1.4, intensity: 0.7 }) });
  });

  // ---------------------------------------------------------------------------------------------- moths
  // The kept lamp's three are pale on the night and read (.shots/sky_shallows_moths_b_crop.png). The far lamp is lit at
  // first light: there the same pale moths were white flecks on a pale lilac sky, light on light
  // (.shots/sky_shallows_farlamp_b_crop.png). The far lamp's own three are therefore dusky: dark against the dawn, the
  // lamp's side of them still catching its amber. (Their paint is their own material: the kept lamp's are untouched.)
  {
    const fl = shared.farLamp, mm = fl && ((fl.moths && fl.moths.mesh) || (fl.group && fl.group.getObjectByName('moths'))), u = mm && mm.material && mm.material.uniforms;
    if (u && u.uColor && u.uEmissive) { u.uColor.value.set('#4e4658'); u.uEmissive.value.multiplyScalar(0.25); S.farMothsMesh = mm; }
  }
  S.farMoths = (delay = 4) => { const fl = shared.farLamp; if (fl && fl.mothsMesh) ctx.stage.after(delay, () => { fl.mothsMesh.visible = true; }); };
  if (dev.includes('farlamp') && shared.farLamp && shared.farLamp.setLit) { shared.farLamp.setLit(true, 0.5); S.farMoths(1); }

  let turn = 0;
  const NIGHT_FLOOR = P.water && P.water.night && P.water.night.reflectFloor != null ? P.water.night.reflectFloor : 0.86, litU = shrimp.uniforms && shrimp.uniforms.uShrimpLit;
  return {
    update(dt) {
      // The shrimp are typed for the night's mirror. As the light comes the mirror lets four times as much of the bed
      // through (its floor falls from 0.86 to 0.45) and the same shrimp were a field of orange sparks at s 244
      // (.shots/sky_shallows_caustics_a_crop.png): what the lamps show of them follows what the water lets through, and
      // once the wind has broken the mirror they are lost under the chop, as the plan has it.
      if (litU) {
        const floor = ctx.waterLook && typeof ctx.waterLook.reflectFloor === 'number' ? ctx.waterLook.reflectFloor : NIGHT_FLOOR, through = Math.max(1 - NIGHT_FLOOR, 1 - floor);
        const k = (1 - NIGHT_FLOOR) / through * (1 - 0.9 * Math.min(1, Math.max(0, sky.wind || 0)));
        litU.value.set(LIT[0] * k, LIT[1] * k);
      }
      // a star that has left the bed (risen, or gleaned by the wader) lights nothing and gathers nothing; and all of it goes
      // down with the bed's own level at first light. A few a frame: the lake has hundreds.
      const level = L && L.bed ? 1 - (2 / 3) * (L.dawn ? Math.min(1, Math.max(0, (sky.e - L.dawn[0]) / (L.dawn[1] - L.dawn[0]))) : 0) : 1;
      for (let k = 0; k < 40 && near.length; k++) {
        const q = near[turn = (turn + 1) % near.length], want = !L || !L.lying || L.lying(q.i) ? 1 : 0;
        q.on += Math.max(-0.25, Math.min(0.25, want - q.on));                    // (eased: a light that leaves does not snap)
        q.shrimp.on = q.on; q.lamp.intensity = 0.7 * q.on * level;
      }
    },
  };
}
