/* FORGEDTITANIUM ACC visual layer. Decorative only: it draws the holographic world, the cinematic backdrop and the camera tween.
   It reads no data, makes no request and stores nothing. Everything that reflects agent state is decided in index.html from the
   restricted public status document, never here. The land mask is Natural Earth 110m land at 2 degrees (public domain); the globe's
   hubs, connections and moving data are decorative scenery, not data. */
(function(){
'use strict';
const LAND_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAP8HAAAAAAAAAAAAAAAAAAAAAADo//z//wcAAAAAAAACAAAAAAAAAAAAhvvw//8PAPABAAAAwAMAAAAAAAAAwADkw////wEABAAAAABgAAAAAAAAAADAUT8A/v8PAAAAAAwA/j8AuAEAAAAAcBHtDcD/fwAAAAAwAPz/fwMAABCAAQD5w/wD8P8FAAAcAIL7//9//xOAAP/ff0668QD/HwAA+A8At///////v3/w/////x8++B8AAOD/1//7////////jP////+/+AE/gAcAn9f//////////w/w/////wEs4AEAAHz+////////////gL////8HeAAcAADg5///////////9ADgAf7/f4AnAAAAAH78////////H0QAAAiA//8f8AcAAIBB4////////38ADwAQAOD//5//AQAAHAT/////////A3AAAAAA/v//+T8AAGDz//////////8DAQAAAMD/////AwAAsP//////////LwAAAAAA6P///2IAAAD+//////////8CAAAAAAD///8/CAAA4P//////////JwAAAAAA8P///wYAAAD+/unz/////z8AAAAAAAD///8HAAAA/pgPPP//////MQAAAAAA8P//PwAAAMBD9v7n/////wcBAAAAAAD///8AAAAAPkD7f/7///8hEAAAAAAA4P//DwAAAIDhAv/n////f8YAAAAAAAD8//8AAAAA+AdE//////8jDwAAAAAAgP//AwAAAMD/APD/////PxgAAAAAAADw/x8AAAAA/n/v//////8HAAAAAAAAAPwDAgAAAOD////7////fwAAAAAAAACgHyAAAACA//9/f/7///8DAAAAAAAAAPQBAAAAAPj//+cv+P//PwAAAAAAAAAAHjAAAADA/////g/+//8EAAAAAAAAAOBhCAAAAP7//99/4D//AAAAAAAAAAAAPAMEAADA////+Qf84BcAAAAAAAAAAAA/AAAAAPz//58fgAf+QAAAAAAAAAAAAA8AAADg////ewA4gA8EAAAAAAAAAADAAAAAAPz//38BgAP4QQAAAAAAAAAAAAgPAADA////zwAwgAwQAAAAAAAAAAAA9Q8AAPj///8HAAVIAAAAAAAAAAAAAID/AQAA////fwBAAAAQAAAAAAAAAAAA+P8AAGDh//8DAAA0GAAAAAAAAAAAAID/HwAAAPj/HwAAgMIBAAAAAAAAAAAA/P8BAACA//8AAAAYXgAAAAAAAAAAAMD/fwAAAPz/BwAAAOOBAQAAAAAAAAAA/P8/AACA/z8AAABgbtQBAAAAAAAAAOD//w8AAPD/AwAAAAQIeAAAAAAAAAAA/P//AQAA/z8AAACAA4APAQAAAAAAAID//w8AAPD/AwAAAAARsEAAAAAAAAAA+P9/AAAA/j8AAAAAAAAAAAAAAAAAAAD//wcAAPD/QwAAAACAIwAAAAAAAAAA8P9/AAAA/z8EAAAAAD8GIAAAAAAAAAD8/wMAAPD/cQAAAAD4ZwAAAAAAAAAAgP8/AAAA/w8HAAAAgP8HAAAAAAAAAAD4/wMAAOD/MAAAAAD//wEBAAAAAAAAgP8PAAAA/g8DAAAA+P8fAAAAAAAAAAD4PwAAAOB/EAAAAID//wMAAAAAAAAAgP8DAAAA/AMAAAAA+P9/AAAAAAAAAAD8HwAAAMA/AAAAAID//wcAAAAAAAAAwP8BAAAA+AEAAAAA8P9/AAAAAAAAAAD8DwAAAIAPAAAAAAAP/gMAAAAAAAAAwB8AAAAAAAAAAAAAEIAfAAEAAAAAAAD+AwAAAAAAAAAAAAAA8AEgAAAAAAAA4AcAAAAAAAAAAAAAAAAAAAYAAAAAAABeAAAAAAAAAAAAAAAAwAAwAAAAAAAAwAMAAAAAAAAAAAAAAAAIgAEAAAAAAAAeAAAAAAAAAAAAAAAAAAAMAAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAABAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAB4AEDwn/8HAAAAAAAAAAAwAAAAAACA/P/h/////w8AAAAAAAAAwAcAAAD4////z///////PwAAAAAAHALwAACA//////////////8HAADw/y///wMAAP7/////////////HwAA+P///38AAID///////////////8AAPL/////BwAO////////////////DwAA8P////8HEPD//////////////z8AAOD/////////////////////////H/AfwP//////////////////////////////////////////////////////////////////////////////////////';
const LW = 180, LH = 90, FW = 360, FH = 180;
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- land field: the 2-degree mask upsampled to 1 degree and softened, so coastlines can be traced ---------- */
let FIELD = null;
function buildFields(){
  const bin = atob(LAND_B64), g = new Float32Array(LW * LH);
  for (let i = 0; i < g.length; i++) g[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  const f = new Float32Array(FW * FH);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const gx = (x + .5) / 2 - .5, gy = (y + .5) / 2 - .5, x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0;
    const at = (xx, yy) => g[clamp(yy, 0, LH - 1) * LW + ((xx % LW) + LW) % LW];
    f[y * FW + x] = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
  }
  const t = new Float32Array(f.length);                       // two 3x3 blur passes
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += f[clamp(y + dy, 0, FH - 1) * FW + (x + dx + FW) % FW];
      t[y * FW + x] = s / 9;
    }
    f.set(t);
  }
  FIELD = f;
}

/* ---------- The holographic world ----------
   A transparent, digitally drawn globe: latitude and longitude gridwork, illuminated continental outlines traced from the real land mask,
   a dotted interior, glowing network hubs and fine luminous connections with slow data movement along them. The hubs, the connections and
   the moving data are DECORATIVE scenery: they are not agent activity and carry no data. Genuine activity is drawn elsewhere, on the
   stream links of the orbit (white moving data, only while a verified agent is Working). Nothing here reads or requests anything. */
const HUBS = [   // decorative network hubs: well-known world cities, [latitude, longitude, headquarters]
  [40.7, -74.0], [37.8, -122.4], [43.7, -79.4], [19.4, -99.1], [-23.5, -46.6], [-34.6, -58.4], [-33.4, -70.7], [51.5, -.1], [48.9, 2.4], [50.1, 8.7], [40.4, -3.7], [6.5, 3.4], [-1.3, 36.8],
  [-26.2, 28.0], [30.0, 31.2], [41.0, 29.0], [35.2, 33.4, true], [25.2, 55.3], [19.1, 72.9], [28.6, 77.2], [1.35, 103.8], [-6.2, 106.8], [22.3, 114.2], [31.2, 121.5], [39.9, 116.4], [37.6, 127.0],
  [35.7, 139.7], [-33.9, 151.2], [-36.8, 174.8], [55.8, 37.6], [59.3, 18.1], [-4.3, 15.3], [33.9, -6.9], [24.7, 46.7], [13.8, 100.5]
];
const LINKS_EXTRA = [[0, 7], [1, 26], [20, 27], [17, 7], [11, 4], [13, 20], [0, 4], [7, 18], [26, 1], [29, 24], [16, 7], [16, 17], [16, 14], [16, 15], [23, 1], [27, 28]];
function createEarth(canvas){
  const ctx = canvas.getContext('2d');
  if (!FIELD) buildFields();
  const tilt = 18 * Math.PI / 180, ct = Math.cos(tilt), st = Math.sin(tilt), D = Math.PI / 180;
  const unit = (la, lo) => [Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D), Math.cos(la * D) * Math.cos(lo * D)];
  // coastline and dotted land, traced once from the mask
  const coast = [], dots = [];
  for (let y = 2; y < FH - 2; y++) for (let x = 0; x < FW; x++) {
    const v = FIELD[y * FW + x], la = 90 - (y + .5), lo = (x + .5) - 180;
    if (v > .36 && v < .64) coast.push(unit(la, lo));
    else if (v >= .64 && x % 3 === 0 && y % 3 === 0) dots.push(unit(la, lo));
  }
  const cs = new Float32Array(coast.length * 3), ds = new Float32Array(dots.length * 3);
  coast.forEach((p, i) => cs.set(p, i * 3)); dots.forEach((p, i) => ds.set(p, i * 3));
  const hub = HUBS.map(h => ({ v: unit(h[0], h[1]), hq: !!h[2], ph: (h[0] * 7.3 + h[1]) % 6.28 }));
  // connections: each hub to its two nearest neighbours, plus a few long-haul routes; each is a great-circle arc lifted above the surface
  const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], seen = new Set(), pairs = [];
  const addPair = (i, j) => { const k = i < j ? i + '-' + j : j + '-' + i; if (i !== j && !seen.has(k)) { seen.add(k); pairs.push([i, j]); } };
  hub.forEach((h, i) => hub.map((o, j) => [j, dotp(h.v, o.v)]).filter(q => q[0] !== i).sort((p, q) => q[1] - p[1]).slice(0, 2).forEach(q => addPair(i, q[0])));
  LINKS_EXTRA.forEach(p => addPair(p[0], p[1]));
  const arcs = pairs.map(([i, j], n) => {
    const a = hub[i].v, b = hub[j].v, om = Math.acos(clamp(dotp(a, b), -1, 1)), so = Math.sin(om) || 1, lift = .05 + .13 * (om / Math.PI), K = 26, pts = new Float32Array((K + 1) * 3);
    for (let k = 0; k <= K; k++) {
      const u = k / K, wa = Math.sin((1 - u) * om) / so, wb = Math.sin(u * om) / so, r = 1 + lift * Math.sin(Math.PI * u);
      pts[k * 3] = (wa * a[0] + wb * b[0]) * r; pts[k * 3 + 1] = (wa * a[1] + wb * b[1]) * r; pts[k * 3 + 2] = (wa * a[2] + wb * b[2]) * r;
    }
    return { pts, K, ph: (n * .37) % 1, sp: .05 + (n % 5) * .012 };
  });
  const glow = (c1, c2) => { const s = document.createElement('canvas'); s.width = s.height = 48; const x = s.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, c1); g.addColorStop(.25, c2); g.addColorStop(1, 'rgba(40,140,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 48); return s; };
  const hubSprite = glow('rgba(220,250,255,1)', 'rgba(90,210,255,.55)'), packetSprite = glow('rgba(150,235,255,.9)', 'rgba(60,170,255,.35)');
  let N = 0, Rpx = 0, dpr = 1, scan = null;
  function size(cssSide){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    N = clamp(Math.round(cssSide * dpr), 300, 1000); canvas.width = N; canvas.height = N;
    Rpx = N / 2 / 1.34;
    scan = document.createElement('canvas'); scan.width = 4; scan.height = 4; const x = scan.getContext('2d'); x.fillStyle = 'rgba(140,225,255,.5)'; x.fillRect(0, 0, 4, 1);
  }
  function draw(t){
    if (!N) return;
    const still = reduced(), spin = still ? 1.9 : (t / 1000) * 0.075, cs0 = Math.cos(spin), sn0 = Math.sin(spin), c = N / 2, px = Math.max(1, Rpx / 250);
    const X = (x, y, z) => { const gx = x * cs0 + z * sn0, gz = z * cs0 - x * sn0; return [gx, y * ct - gz * st, y * st + gz * ct]; };
    ctx.clearRect(0, 0, N, N); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // atmosphere: cyan into electric blue
    let g = ctx.createRadialGradient(c, c, Rpx * .9, c, c, Rpx * 1.34);
    g.addColorStop(0, 'rgba(90,215,255,.8)'); g.addColorStop(.16, 'rgba(50,160,255,.42)'); g.addColorStop(.5, 'rgba(30,110,255,.15)'); g.addColorStop(1, 'rgba(20,80,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, Rpx * 1.34, 0, 7); ctx.fill();
    // the transparent holographic body: dark glass with a bright fresnel rim
    g = ctx.createRadialGradient(c - Rpx * .22, c - Rpx * .26, Rpx * .08, c, c, Rpx);
    g.addColorStop(0, 'rgba(10,44,110,.9)'); g.addColorStop(.6, 'rgba(5,22,70,.92)'); g.addColorStop(.88, 'rgba(14,70,170,.86)'); g.addColorStop(1, 'rgba(80,205,255,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, Rpx, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, Rpx, 0, 7); ctx.clip();
    ctx.globalAlpha = .12; ctx.fillStyle = ctx.createPattern(scan, 'repeat'); ctx.fillRect(0, 0, N, N); ctx.globalAlpha = 1;
    const by = c + Math.sin(still ? 1 : t / 5200) * Rpx * .85; g = ctx.createLinearGradient(0, by - Rpx * .16, 0, by + Rpx * .16);
    g.addColorStop(0, 'rgba(120,225,255,0)'); g.addColorStop(.5, 'rgba(120,225,255,.1)'); g.addColorStop(1, 'rgba(120,225,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, by - Rpx * .16, N, Rpx * .32);
    ctx.restore();
    // digital latitude and longitude gridwork
    ctx.lineWidth = Math.max(1, dpr * .6);
    const line = (pts, major) => { ctx.strokeStyle = `rgba(110,215,255,${major ? .42 : .26})`; ctx.beginPath(); let pen = false; for (const p of pts) { if (p[2] < 0) { pen = false; continue; } const x = c + p[0] * Rpx, y = c - p[1] * Rpx; pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } ctx.stroke(); };
    for (let lo = 0; lo < 360; lo += 15) { const pts = []; for (let la = -90; la <= 90; la += 5) { const u = unit(la, lo); pts.push(X(u[0], u[1], u[2])); } line(pts, lo % 90 === 0); }
    for (let la = -75; la <= 75; la += 15) { const pts = []; for (let lo = 0; lo <= 360; lo += 5) { const u = unit(la, lo); pts.push(X(u[0], u[1], u[2])); } line(pts, la === 0); }
    // continents: the far side faintly through the glass, then dotted land and the illuminated outlines on the near side
    ctx.fillStyle = 'rgba(110,200,255,.16)';
    for (let i = 0; i < cs.length; i += 6) { const p = X(cs[i], cs[i + 1], cs[i + 2]); if (p[2] < 0) ctx.fillRect(c + p[0] * Rpx - px / 2, c - p[1] * Rpx - px / 2, px, px); }
    for (let i = 0; i < ds.length; i += 3) { const p = X(ds[i], ds[i + 1], ds[i + 2]); if (p[2] > 0) { ctx.fillStyle = `rgba(100,215,255,${.4 + .5 * p[2]})`; ctx.fillRect(c + p[0] * Rpx - px * .9, c - p[1] * Rpx - px * .9, px * 1.8, px * 1.8); } }
    ctx.shadowColor = 'rgba(80,210,255,.9)'; ctx.shadowBlur = px * 4;
    for (let i = 0; i < cs.length; i += 3) { const p = X(cs[i], cs[i + 1], cs[i + 2]); if (p[2] > 0) { ctx.fillStyle = `rgba(175,244,255,${.6 + .4 * p[2]})`; ctx.fillRect(c + p[0] * Rpx - px * .9, c - p[1] * Rpx - px * .9, px * 1.8, px * 1.8); } }
    ctx.shadowBlur = 0;
    // fine luminous connections between the hubs, with soft data moving along them
    ctx.lineWidth = Math.max(1, dpr * .8);
    for (const a of arcs) {
      ctx.beginPath(); let pen = false, front = 0;
      for (let k = 0; k <= a.K; k++) { const p = X(a.pts[k * 3], a.pts[k * 3 + 1], a.pts[k * 3 + 2]); if (p[2] < 0) { pen = false; continue; } front++; const x = c + p[0] * Rpx, y = c - p[1] * Rpx; pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; }
      if (front) { ctx.strokeStyle = 'rgba(110,228,255,.62)'; ctx.stroke(); }
      const u = still ? (a.ph * .8 + .1) : (a.ph + t / 1000 * a.sp) % 1, kf = u * a.K, k0 = Math.floor(kf), p = X(a.pts[k0 * 3], a.pts[k0 * 3 + 1], a.pts[k0 * 3 + 2]);
      if (p[2] > 0) { const s = Rpx * .05; ctx.globalAlpha = Math.sin(Math.PI * u) * Math.min(1, p[2] * 2); ctx.drawImage(packetSprite, c + p[0] * Rpx - s / 2, c - p[1] * Rpx - s / 2, s, s); ctx.globalAlpha = 1; }
    }
    // glowing network hubs (the headquarters hub, Nicosia, carries a ring)
    hub.forEach(h => {
      const p = X(h.v[0], h.v[1], h.v[2]); if (p[2] < .02) return;
      const pulse = still ? 1 : .8 + .2 * Math.sin(t / 700 + h.ph), s = Rpx * (h.hq ? .075 : .05) * pulse, x = c + p[0] * Rpx, y = c - p[1] * Rpx;
      ctx.globalAlpha = Math.min(1, p[2] * 2.2); ctx.drawImage(hubSprite, x - s / 2, y - s / 2, s, s);
      if (h.hq) { ctx.strokeStyle = 'rgba(200,245,255,.9)'; ctx.lineWidth = Math.max(1, dpr * .8); ctx.beginPath(); ctx.arc(x, y, s * .72, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    // bright rim line
    g = ctx.createRadialGradient(c, c, Rpx * .95, c, c, Rpx * 1.04);
    g.addColorStop(0, 'rgba(120,225,255,0)'); g.addColorStop(.7, 'rgba(160,238,255,.7)'); g.addColorStop(1, 'rgba(120,225,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, Rpx * 1.04, 0, 7); ctx.fill();
  }
  return { size, draw, get ratio(){ return 1.34; } };
}

/* ---------- Backdrop: depth, nebula, stars, light sweeps ---------- */
function createBackdrop(canvas){
  /* A layered, cinematic environment: nebula clouds in depth, stars, an illuminated perspective floor with data packets running along its
     lanes, orbital plane rings around the hub, drifting light motes and slow light sweeps. Purely decorative: no data, no requests.
     The heavy layers (nebula, stars, floor lanes) are painted once per resize into off-screen canvases; each frame only moves them and
     draws the few live elements, so the cost stays small. Every motion stops under prefers-reduced-motion (one still frame is drawn). */
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, ox = 0, oy = 0, px = 0, py = 0, M = 0;
  let hub = { x: 0, y: 0, r: 0 };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 360 }, (_, i) => ({ x: rnd(), y: rnd(), r: rnd() * 1.2 + .25, a: rnd() * .6 + .2, p: rnd() * 6.28, d: rnd() * .8 + .2, warm: rnd() > .86, big: i < 28, live: i % 9 === 0 }));
  const motes = Array.from({ length: 90 }, () => { const q = rnd(); return { x: rnd(), y: rnd(), r: rnd() * 1.8 + .6, v: rnd() * .02 + .006, s: rnd() * .01 - .005, a: rnd() * .5 + .25, p: rnd() * 6.28, c: q < .22 ? 0 : q < .5 ? 1 : 2 }; });
  const packets = Array.from({ length: 18 }, (_, i) => ({ lane: (i % 13) - 6, u: rnd(), sp: .035 + rnd() * .05 }));
  let nebFar = null, nebNear = null, starCv = null, floorCv = null, bgGrad = null, vigGrad = null;
  const sprites = ['155,220,255', '255,200,240', '127,232,255'].map(c => { const s = document.createElement('canvas'); s.width = s.height = 32; const x = s.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(.35, `rgba(${c},.35)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return s; });
  const mk = (cw, ch) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(cw)); c.height = Math.max(2, Math.round(ch)); return c; };
  // cloud texture: soft value noise, used as a mask so each nebula has billowing gaps instead of smooth blobs
  function noiseMask(size){
    const g = 9, grid = Array.from({ length: (g + 1) * (g + 1) }, () => rnd());
    const c = mk(size, size), x = c.getContext('2d'), id = x.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
      let v = 0, amp = .55, f = 1;
      for (let o = 0; o < 4; o++) {
        const gx = (xx / size) * g * f, gy = (y / size) * g * f, x0 = Math.floor(gx) % g, y0 = Math.floor(gy) % g, fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), at = (i, j) => grid[((j + o * 3) % g) * (g + 1) + ((i + o * 5) % g)];
        v += amp * ((at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy);
        amp *= .5; f *= 2;
      }
      const k = (y * size + xx) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = clamp(Math.round(255 * smooth(.28, .8, v)), 0, 255);
    }
    x.putImageData(id, 0, 0); return c;
  }
  function cloudLayer(k, lw, lh, mask){
    const pal = [[[50, 80, 255], [140, 60, 235], [20, 130, 255]], [[0, 190, 230], [30, 120, 255], [90, 80, 255]], [[235, 60, 175], [150, 60, 235], [255, 150, 60]]][k];
    const c = mk(lw, lh), x = c.getContext('2d'); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (k === 0 ? 30 : 22); i++) {
      const col = pal[i % 3], cx0 = rnd() * lw, cy0 = rnd() * lh, r = (.1 + rnd() * .3) * Math.max(lw, lh), a = (k === 0 ? .13 : .1) * (.5 + rnd());
      const g = x.createRadialGradient(cx0, cy0, 0, cx0, cy0, r); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); g.addColorStop(.55, `rgba(${col[0]},${col[1]},${col[2]},${a * .4})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      x.fillStyle = g; x.fillRect(0, 0, lw, lh);
    }
    for (let i = 0; i < 7; i++) {                                // wispy filaments
      const col = pal[(i + 1) % 3]; x.save(); x.translate(rnd() * lw, rnd() * lh); x.rotate(rnd() * 3.14); x.scale(1, .12 + rnd() * .1);
      const r = (.22 + rnd() * .3) * Math.max(lw, lh), g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},.26)`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore();
    }
    x.globalCompositeOperation = 'destination-in'; const off = rnd() * 40; x.drawImage(mask, off, off, 128 - off, 128 - off, 0, 0, lw, lh);
    return c;
  }
  function buildStatic(){
    M = Math.round(Math.max(w, h) * .05);
    const lw = Math.round((w + 2 * M) / 2), lh = Math.round((h + 2 * M) / 2), mask = noiseMask(128);
    nebFar = cloudLayer(0, lw, lh, mask);
    nebNear = mk(lw, lh); const nx = nebNear.getContext('2d'); nx.globalCompositeOperation = 'lighter'; nx.globalAlpha = .78; nx.drawImage(cloudLayer(1, lw, lh, mask), 0, 0); nx.globalAlpha = .58; nx.drawImage(cloudLayer(2, lw, lh, mask), 0, 0);
    starCv = mk(w + 2 * M, h + 2 * M); const sx = starCv.getContext('2d');
    for (const s of stars) {
      if (s.live) continue;
      const x = s.x * (w + 2 * M), y = s.y * (h + 2 * M); sx.globalAlpha = s.a * .85; sx.fillStyle = s.warm ? '#ffd9a0' : '#a8dcff';
      if (s.big) { sx.fillRect(x - s.r * 3.2, y - .4, s.r * 6.4, .8); sx.fillRect(x - .4, y - s.r * 3.2, .8, s.r * 6.4); }
      if (s.r < .8) sx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2); else { sx.beginPath(); sx.arc(x, y, s.r, 0, 7); sx.fill(); }
    }
    // floor: horizon glow and the converging lanes (the scrolling cross lines are drawn live)
    const hz = h * .6, vx = w / 2, span = w * .105; floorCv = mk(w, h - hz + 120); const fx = floorCv.getContext('2d'), oyf = hz - 90;
    let g = fx.createLinearGradient(0, 0, 0, 210); g.addColorStop(0, 'rgba(60,160,255,0)'); g.addColorStop(.42, 'rgba(90,200,255,.2)'); g.addColorStop(1, 'rgba(60,160,255,0)'); fx.fillStyle = g; fx.fillRect(0, 0, w, 210);
    fx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
      const bx = vx + i * span, lg = fx.createLinearGradient(vx, hz - oyf, bx, h - oyf);
      lg.addColorStop(0, 'rgba(120,220,255,.5)'); lg.addColorStop(.5, 'rgba(70,170,255,.24)'); lg.addColorStop(1, 'rgba(70,170,255,.1)');
      fx.strokeStyle = lg; fx.beginPath(); fx.moveTo(vx + i * span * .03, hz - oyf); fx.lineTo(bx, h - oyf); fx.stroke();
    }
    bgGrad = ctx.createLinearGradient(0, 0, 0, h); bgGrad.addColorStop(0, '#020716'); bgGrad.addColorStop(.55, '#030b1e'); bgGrad.addColorStop(1, '#010612');
    vigGrad = ctx.createRadialGradient(w / 2, h * .48, Math.min(w, h) * .45, w / 2, h / 2, Math.max(w, h) * .85); vigGrad.addColorStop(0, 'rgba(0,0,0,0)'); vigGrad.addColorStop(1, 'rgba(0,3,10,.5)');
  }
  function resize(){
    dpr = 1;                                                       // soft imagery: no benefit from a denser canvas
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    try { buildStatic(); } catch (e) { nebFar = nebNear = starCv = floorCv = null; }
  }
  function shift(dx, dy){ ox = dx; oy = dy; }
  function parallax(dx, dy){ px = dx; py = dy; }
  function setCenter(x, y, r){ hub = { x, y, r }; }
  const still = reduced();
  function draw(t0){
    if (!w) return;
    const t = still ? 4000 : t0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = bgGrad || '#020716'; ctx.fillRect(0, 0, w, h);
    // 1. nebula in two depths, each drifting a little at its own rate
    if (nebFar) {
      ctx.globalCompositeOperation = 'lighter';
      [[nebFar, .8, 1], [nebNear, 1, 2.2]].forEach(([c, al, k]) => {
        const dx = -ox * .12 * k + px * (.3 + .35 * k) + Math.sin(t / 9000 + k * 2) * 10 * k, dy = -oy * .12 * k + py * (.3 + .35 * k) + Math.cos(t / 11000 + k) * 7 * k;
        ctx.globalAlpha = al; ctx.drawImage(c, -M + dx, -M + dy, w + 2 * M, h + 2 * M);
      });
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    if (hub.r) {                                                   // a soft light well behind the hub
      const g = ctx.createRadialGradient(hub.x, hub.y, hub.r * .4, hub.x, hub.y, hub.r * 2.7);
      g.addColorStop(0, 'rgba(30,110,230,.42)'); g.addColorStop(.4, 'rgba(20,70,170,.18)'); g.addColorStop(1, 'rgba(2,8,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // 2. stars: a pre-painted field that parallaxes, plus a few that twinkle
    if (starCv) { ctx.globalAlpha = .9; ctx.drawImage(starCv, -M + ox * .25 + px * .5, -M + oy * .25 + py * .5); ctx.globalAlpha = 1; }
    for (const s of stars) {
      if (!s.live) continue;
      const tw = .55 + .45 * Math.sin(t / 900 * s.d + s.p), x = ((s.x * w + ox * s.d * .5 + px * s.d) % w + w) % w, y = ((s.y * h + oy * s.d * .5 + py * s.d) % h + h) % h;
      ctx.globalAlpha = s.a * tw; ctx.fillStyle = s.warm ? '#ffd9a0' : '#a8dcff'; ctx.beginPath(); ctx.arc(x, y, s.r + .3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 3. illuminated perspective floor with data packets running along its lanes
    const hz = h * .6, vx = w / 2, span = w * .105, sh = px * .35 + ox * .05;
    if (floorCv) ctx.drawImage(floorCv, sh, hz - 90);
    ctx.lineWidth = 1;
    const scroll = (t / 7000) % 1;
    for (let j = 0; j < 13; j++) {
      const z = (j + scroll) / 13, y = hz + (h - hz) * z * z;
      ctx.strokeStyle = `rgba(100,200,255,${(.12 + .3 * Math.sqrt(z)) * (1 - z * .5)})`; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.lineCap = 'round';
    for (const p of packets) {
      const u = still ? (p.u * .8 + .1) : ((p.u + t / 1000 * p.sp) % 1), bx = vx + sh + p.lane * span, u2 = Math.max(0, u - .05), vxs = vx + sh;
      const x1 = vxs + (bx - vxs) * (1 - u), y1 = hz + (h - hz) * (1 - u), x2 = vxs + (bx - vxs) * (1 - u2), y2 = hz + (h - hz) * (1 - u2);
      ctx.strokeStyle = `rgba(190,240,255,${Math.sin(Math.PI * (1 - u)) * .9})`; ctx.lineWidth = .8 + 2 * (1 - u); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // 4. orbital plane rings around the hub (the polar grid of the scene)
    if (hub.r) {
      ctx.save(); ctx.translate(hub.x, hub.y); ctx.lineWidth = 1.4;
      [[1.12, .3, -.24, 1], [1.3, .34, .2, 0], [1.56, .3, -.1, 1], [1.9, .27, .3, 0]].forEach(([k, e, rot, dash], i) => {
        const rx = hub.r * k, spin = still ? 0 : t / (60000 + i * 20000) * (i % 2 ? -1 : 1) * 6.283;
        ctx.save(); ctx.rotate(rot + spin * .04); ctx.strokeStyle = `rgba(120,215,255,${.55 - i * .08})`; ctx.setLineDash(dash ? [2, 9] : [26, 12, 3, 12]);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * e, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        const an = still ? i * 1.7 : t / 4000 * (i % 2 ? -.6 : .6) + i * 1.7;
        ctx.fillStyle = i % 2 ? 'rgba(255,190,110,.95)' : 'rgba(150,230,255,.95)'; ctx.beginPath(); ctx.arc(rx * Math.cos(an), rx * e * Math.sin(an), 3, 0, 7); ctx.fill(); ctx.restore();
      });
      ctx.strokeStyle = 'rgba(90,190,255,.07)'; ctx.beginPath();
      for (let i = 0; i < 36; i++) { const an = i / 36 * 6.283 + (still ? 0 : t / 120000); ctx.moveTo(Math.cos(an) * hub.r * 1.2, Math.sin(an) * hub.r * 1.2); ctx.lineTo(Math.cos(an) * hub.r * 2.2, Math.sin(an) * hub.r * 2.2); }
      ctx.stroke(); ctx.restore();
    }
    // 5. drifting light motes (controlled: slow, soft, never faster than a gentle rise)
    for (const q of motes) {
      const y = ((q.y - (still ? 0 : t / 1000 * q.v)) % 1 + 1) % 1, x = ((q.x + (still ? 0 : t / 1000 * q.s) + Math.sin(t / 3000 + q.p) * .004) % 1 + 1) % 1;
      const fx = ((x * w + px * (1 + q.r)) % w + w) % w, fy = ((y * h + py * (1 + q.r)) % h + h) % h, sz = q.r * 7;
      ctx.globalAlpha = q.a * (.6 + .4 * Math.sin(t / 1100 + q.p)); ctx.drawImage(sprites[q.c], fx - sz / 2, fy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    // 6. slow light sweeps across the lower third (as in the approved visual)
    for (let i = 0; i < 4; i++) {
      const ph = t / 6500 + i * .9, y0 = h * (.82 + i * .03), amp = h * (.04 + i * .005);
      const lg = ctx.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, 'rgba(30,120,255,0)'); lg.addColorStop(.5 + .3 * Math.sin(ph), `rgba(80,200,255,${.28 - i * .04})`); lg.addColorStop(1, 'rgba(30,120,255,0)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-20, y0 + amp);
      ctx.bezierCurveTo(w * .3, y0 - amp * 1.4 + Math.sin(ph) * 8, w * .62, y0 + amp * 1.2, w + 20, y0 - amp * .6); ctx.stroke();
    }
    ctx.fillStyle = vigGrad || 'rgba(0,3,10,.3)'; ctx.fillRect(0, 0, w, h);
  }
  return { resize, draw, shift, parallax, setCenter };
}

/* ---------- loop, tween, helpers ---------- */
function loop(fns, fps){
  const gap = 1000 / (fps || 30); let last = 0, id = 0, n = 0;
  const tick = t => { id = requestAnimationFrame(tick); if (t - last < gap) return; last = t; n++; for (const f of fns) f(t, n); };
  if (reduced()) { requestAnimationFrame(t => { for (const f of fns) f(t || 1, 0); }); return { stop(){}, once(){ for (const f of fns) f(performance.now(), 0); } }; }
  id = requestAnimationFrame(tick);
  return { stop(){ cancelAnimationFrame(id); }, once(){ for (const f of fns) f(performance.now(), 0); } };
}

function tween(from, to, ms, onStep, onDone){
  if (reduced() || !ms) { onStep(to.slice()); if (onDone) onDone(); return { cancel(){} }; }
  const t0 = performance.now(); let raf = 0, dead = false;
  const step = now => {
    if (dead) return;
    const k = clamp((now - t0) / ms, 0, 1), e = ease(k);
    onStep(from.map((v, i) => v + (to[i] - v) * e));
    if (k < 1) raf = requestAnimationFrame(step); else if (onDone) onDone();
  };
  raf = requestAnimationFrame(step);
  return { cancel(){ dead = true; cancelAnimationFrame(raf); } };
}

/* Age of a report as plain text, for freshness. */
function ageText(ms){
  if (!Number.isFinite(ms) || ms < 0) return 'time unknown';
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' h ' + (m % 60 ? (m % 60) + ' min ' : '') + 'ago';
  return Math.floor(h / 24) + ' d ago';
}

window.ACC_FX = { createEarth, createBackdrop, loop, tween, ageText, reduced };
})();
