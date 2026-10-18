import * as THREE from 'three';
import { RoomEnvironment } from 'https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'https://unpkg.com/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js';

/* Trang cuối: model GLB bó hoa + 5 bông hồng bấm được. Bấm hoa nào, ảnh hiện ngay tại bông đó và ở lại đó. */
const stage = document.querySelector('#stage');
const MODEL = 'assets/source/Meshy_AI_Soft_Pink_Rose_Bouque_1018142958_texture.glb';
const SRC = [
  'assets/source/Screenshot 2026-10-18 210956.png',
  'assets/source/Screenshot 2026-10-18 211001.png',
  'assets/source/Screenshot 2026-10-18 211008.png',
  'assets/source/Screenshot 2026-10-18 211014.png',
  'assets/source/Screenshot 2026-10-18 211017.png'
];
/* Vị trí 5 bông hồng theo tỉ lệ khung model nhìn từ phía trước:
   x = 0 (trái) → 1 (phải), y = 0 (đỉnh) → 1 (đáy). Chỉnh ở đây nếu điểm bấm lệch hoa.
   Nhấn phím H trong trang để hiện các điểm bấm khi căn chỉnh. */
const HOTSPOTS = [
  { x: .32, y: .25 },  // hoa trái
  { x: .41, y: .40 },  // hoa dưới trái
  { x: .56, y: .17 },  // hoa trên
  { x: .55, y: .30 },  // hoa giữa
  { x: .73, y: .27 }   // hoa phải
];

/* ---------- Bỏ nền ảnh: phóng 2x mượt, flood-fill vùng trắng nối với mép ---------- */
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = encodeURI(src); });
}
async function cutout(src) {
  const img = await loadImage(src);
  try {
    const trim = 3, S = 2, sw = img.naturalWidth - trim * 2, sh = img.naturalHeight - trim * 2, w = sw * S, h = sh * S;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(img, trim, trim, sw, sh, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), px = d.data, bg = new Uint8Array(w * h), stack = [];
    const isBg = i => { const o = i * 4, a = px[o], b = px[o + 1], k = px[o + 2], mn = Math.min(a, b, k); return mn > 232 && Math.max(a, b, k) - mn < 24; };
    const push = i => { if (!bg[i] && isBg(i)) { bg[i] = 1; stack.push(i); } };
    for (let i = 0; i < w; i++) { push(i); push((h - 1) * w + i); }
    for (let j = 0; j < h; j++) { push(j * w); push(j * w + w - 1); }
    while (stack.length) {
      const i = stack.pop(), cx = i % w, cy = (i / w) | 0;
      if (cx > 0) push(i - 1); if (cx < w - 1) push(i + 1); if (cy > 0) push(i - w); if (cy < h - 1) push(i + w);
    }
    const alpha = new Uint8Array(w * h).fill(255);
    for (let i = 0; i < w * h; i++) if (bg[i]) alpha[i] = 0;
    const ring = (from, val) => {
      const nxt = alpha.slice();
      for (let j = 1; j < h - 1; j++) for (let k = 1; k < w - 1; k++) {
        const i = j * w + k;
        if (alpha[i] === 255 && (alpha[i - 1] === from || alpha[i + 1] === from || alpha[i - w] === from || alpha[i + w] === from)) nxt[i] = val;
      }
      alpha.set(nxt);
    };
    ring(0, 90); ring(90, 180);
    for (let i = 0; i < w * h; i++) px[i * 4 + 3] = alpha[i];
    x.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  } catch (e) { return encodeURI(src); }
}

/* ---------- UI ---------- */
const css = document.createElement('style');
css.textContent = `
.bq-wrap{position:absolute;inset:0;z-index:6;display:none;opacity:0;transition:opacity 1.2s}
.blank-view .bq-wrap{display:block}.bq-wrap.on{opacity:1}
.bq-wrap canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}
.bq-title{position:absolute;top:5%;width:100%;text-align:center;pointer-events:none;color:#ffe3ee;text-shadow:0 0 24px #ff7fb355;z-index:9}
.bq-title h2{font:400 clamp(30px,5vw,54px) 'Great Vibes',cursive;margin:0}
.bq-title p{font:12px Arial,sans-serif;letter-spacing:3px;color:#d9a7bc;margin:8px 0 0;animation:bq-pulse 2.4s ease-in-out infinite}
.bq-count{position:absolute;bottom:24px;width:100%;text-align:center;pointer-events:none;font:13px Georgia,serif;color:#e7b7cb;letter-spacing:2px;z-index:9}
.bq-count i{font-style:normal;display:inline-block;margin:0 4px;color:#5a3a4b;transition:color .5s,text-shadow .5s}.bq-count i.on{color:#ff9cc3;text-shadow:0 0 10px #ff6fa8}
.bq-load{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#e7b7cb;font:13px Georgia,serif;letter-spacing:2px;pointer-events:none;transition:opacity .6s}
.bq-load b{display:block;width:180px;height:3px;border-radius:3px;background:#ffffff1f;margin:12px auto 0;overflow:hidden}.bq-load b i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff9cc3,#ffd3e5);transition:width .2s}
@keyframes bq-pulse{50%{opacity:.4}}
.bq-dot{position:absolute;z-index:7;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;pointer-events:none;border:2px solid #ffd3e5;box-shadow:0 0 12px #ff8fbd;animation:bq-ring 1.8s ease-out infinite;transition:opacity .4s}
.bq-dot.done{opacity:0;animation:none}
@keyframes bq-ring{0%{transform:scale(.4);opacity:.95}100%{transform:scale(1.7);opacity:0}}
.bq-card{position:absolute;z-index:8;left:0;top:0;opacity:0;transform:translate(-50%,-50%) scale(.04);transition:opacity .35s,transform .6s cubic-bezier(.2,1.15,.3,1);will-change:left,top}
.bq-card.open{opacity:1;transform:translate(-50%,-50%) scale(1)}
.bq-card:before{content:'';position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#ff8fbd66,#b04a9a1c 48%,transparent 68%);z-index:-1;pointer-events:none}
.bq-card img{display:block;height:var(--h,300px);width:auto;max-width:60vw;filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 10px 20px #000a);user-select:none;-webkit-user-drag:none}
.bq-x{position:absolute;right:-4px;top:-4px;width:24px;height:24px;border-radius:50%;border:1px solid #ffffff55;background:#241523d9;color:#ffd3e5;font:14px/22px Arial,sans-serif;text-align:center;cursor:pointer;padding:0}
.bq-x:hover{background:#5a2a49}
.bq-heart{position:absolute;color:#ff9cc3;pointer-events:none;animation:bq-float 2.4s ease-in infinite;opacity:0}
@keyframes bq-float{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:.9}100%{opacity:0;transform:translateY(-100px) scale(1.2)}}
`;
document.head.append(css);

const wrap = document.createElement('div'); wrap.className = 'bq-wrap';
wrap.innerHTML = `<div class="bq-title"><h2>Gửi em một bó hoa</h2><p>CHẠM VÀO TỪNG BÔNG HOA</p></div><div class="bq-count"><i>♥</i><i>♥</i><i>♥</i><i>♥</i><i>♥</i></div><div class="bq-load">ĐANG TẢI BÓ HOA…<b><i></i></b></div>`;
stage.append(wrap);
const loadBox = wrap.querySelector('.bq-load'), loadBar = loadBox.querySelector('i');

/* mỗi bông có 1 tấm ảnh riêng, mở rồi thì ở lại tại chỗ */
const cards = SRC.map((_, i) => {
  const el = document.createElement('div'); el.className = 'bq-card';
  el.innerHTML = '<img alt="Ảnh kỷ niệm" draggable="false"><button class="bq-x" aria-label="Đóng ảnh">×</button>';
  wrap.append(el);
  el.querySelector('.bq-x').addEventListener('click', e => { e.stopPropagation(); el.classList.remove('open'); });
  el.addEventListener('pointerdown', () => { el.style.zIndex = ++zTop; });
  return el;
});
let zTop = 20;
const dots = HOTSPOTS.map(() => { const d = document.createElement('i'); d.className = 'bq-dot'; d.style.display = 'none'; wrap.append(d); return d; });
const photos = SRC.map(() => null), seen = new Set();
Promise.all(SRC.map((s, i) => cutout(s).then(u => { photos[i] = u; cards[i].querySelector('img').src = u; })));

/* ---------- Three.js ---------- */
let started = false;
async function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 2), 3));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
  scene.environmentIntensity = .7;
  scene.add(new THREE.HemisphereLight('#ffe9f0', '#3b2250', .5));
  const key = new THREE.DirectionalLight('#fff1e4', 2.2); key.position.set(2.5, 4.5, 5); scene.add(key);
  const rim = new THREE.PointLight('#ff7fb8', 14, 14); rim.position.set(-3, 2, -2); scene.add(rim);

  const pivot = new THREE.Group(); scene.add(pivot);
  const hits = [], hitWorld = HOTSPOTS.map(() => new THREE.Vector3());
  let radiusBase = 1, halfW = 1.5, halfH = 1.7;

  /* tải GLB */
  const loader = new GLTFLoader();
  const draco = new DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((res, rej) => loader.load(encodeURI(MODEL), res, e => { if (e.total) loadBar.style.width = (e.loaded / e.total * 100) + '%'; }, rej)).catch(err => { console.error('Không tải được GLB', err); loadBox.textContent = 'Không tải được model GLB'; return null; });
  if (!gltf) return;
  loadBox.style.opacity = 0;
  const model = gltf.scene, holder = new THREE.Group(); holder.add(model); pivot.add(holder);
  model.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.material) { o.material.side = THREE.DoubleSide; o.material.envMapIntensity = .8; } } });
  // chuẩn hoá: cao 3.4, tâm ở gốc
  let box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const k = 3.4 / size.y; model.scale.multiplyScalar(k); model.position.sub(ctr.multiplyScalar(k));
  holder.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model); size = box.getSize(new THREE.Vector3());
  halfW = size.x / 2; halfH = size.y / 2; radiusBase = size.x * .085;

  // điểm bấm: bắn tia từ phía trước vào model để bám đúng bề mặt hoa
  const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });
  const rc = new THREE.Raycaster();
  HOTSPOTS.forEach((h, i) => {
    const x = box.min.x + h.x * size.x, y = box.max.y - h.y * size.y;
    rc.set(new THREE.Vector3(x, y, box.max.z + 2), new THREE.Vector3(0, 0, -1));
    const hit = rc.intersectObjects(meshes, false)[0];
    const z = hit ? hit.point.z : box.max.z * .4;
    const s = new THREE.Mesh(new THREE.SphereGeometry(radiusBase, 16, 12), new THREE.MeshBasicMaterial({ color: '#ff4f9a', transparent: true, opacity: .55, depthTest: false }));
    s.position.set(x, y, z - radiusBase * .2); s.visible = false; s.userData.index = i; holder.add(s); hits.push(s);
  });
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'h') hits.forEach(s => s.visible = !s.visible); });
  dots.forEach(d => d.style.display = '');

  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const z = Math.max(halfH * 1.25 / t, halfW * 1.3 / (t * camera.aspect));
    camera.position.set(0, halfH * .08, z); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); sizeCards();
  }
  function sizeCards() { const hh = Math.min(innerHeight * .34, 300) + 'px'; cards.forEach(c => c.querySelector('img').style.setProperty('--h', hh)); }
  addEventListener('resize', resize); resize();

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), v3 = new THREE.Vector3();
  let hover = -1, yaw = 0, targetYaw = 0, drag = null;
  const cv = renderer.domElement;
  function pick(e) {
    const r = cv.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const prev = hits.map(s => s.visible); hits.forEach(s => s.visible = true);
    const hit = ray.intersectObjects(hits, false)[0]; hits.forEach((s, i) => s.visible = prev[i]);
    return hit ? hit.object.userData.index : -1;
  }
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, moved: 0, yaw: targetYaw }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', e => {
    if (drag) { drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x)); targetYaw = Math.max(-.8, Math.min(.8, drag.yaw + (e.clientX - drag.x) * .006)); }
    else { hover = pick(e); cv.style.cursor = hover >= 0 ? 'pointer' : 'grab'; }
  });
  cv.addEventListener('pointerup', e => {
    const moved = drag ? drag.moved : 99; drag = null; cv.style.cursor = 'grab';
    if (moved < 6) { const i = pick(e); if (i >= 0) show(i); }
  });
  function show(i) {
    if (!photos[i]) return;
    const el = cards[i];
    el.style.zIndex = ++zTop; place(i);
    if (!el.classList.contains('open')) {
      el.querySelectorAll('.bq-heart').forEach(h => h.remove());
      for (let q = 0; q < 6; q++) { const h = document.createElement('span'); h.className = 'bq-heart'; h.textContent = '♥'; h.style.cssText = `left:${10 + Math.random() * 80}%;top:${30 + Math.random() * 50}%;animation-delay:${q * .35}s;font-size:${12 + Math.random() * 12}px`; el.append(h); }
      void el.offsetWidth; el.classList.add('open');
    }
    seen.add(i); dots[i].classList.add('done');
    wrap.querySelectorAll('.bq-count i').forEach((c, q) => c.classList.toggle('on', seen.has(q)));
  }
  function screenOf(i) {
    hits[i].getWorldPosition(v3); v3.project(camera);
    return [(v3.x + 1) / 2 * wrap.clientWidth, (1 - v3.y) / 2 * wrap.clientHeight];
  }
  // ảnh nằm đúng chỗ bông hoa, bám theo khi bó hoa xoay
  function place(i) {
    const el = cards[i]; let [x, y] = screenOf(i);
    const w = wrap.clientWidth, h = wrap.clientHeight, cw = el.offsetWidth || 150, ch = el.offsetHeight || 300;
    x = Math.max(cw / 2 + 8, Math.min(w - cw / 2 - 8, x)); y = Math.max(ch / 2 + 8, Math.min(h - ch / 2 - 8, y));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  }

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!stage.classList.contains('blank-view')) return;
    const t = clock.getElapsedTime();
    if (!drag) targetYaw += (Math.sin(t * .5) * .3 - targetYaw) * .004;
    yaw += (targetYaw - yaw) * .08; pivot.rotation.y = yaw; pivot.position.y = Math.sin(t * 1.1) * .04;
    pivot.updateMatrixWorld(true);
    renderer.render(scene, camera);
    cards.forEach((c, i) => { if (c.classList.contains('open')) place(i); });
    dots.forEach((d, i) => { const [x, y] = screenOf(i); d.style.left = x + 'px'; d.style.top = y + 'px'; });
  })();
}

new MutationObserver(() => {
  if (started || !stage.classList.contains('blank-view')) return;
  started = true; init(); requestAnimationFrame(() => setTimeout(() => wrap.classList.add('on'), 100));
}).observe(stage, { attributes: true, attributeFilter: ['class'] });
