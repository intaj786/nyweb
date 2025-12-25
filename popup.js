const NY_CONFIG={
  start:"2025-12-20T00:00:00",
  end:"2026-01-10T23:59:59",
  frequency:"once", // "once" or "daily"
  storageKey:"nyaasa_newyear_popup_seen_v2",
  titlePrefix:"Happy New Year",
  subtitle:"Wishing you a year full of bold ideas, clean execution, and meaningful growth.",
  message:"Thank you for the trust, the conversations, and the collaboration. Let’s build more beautiful work together in the year ahead.",
  primaryCTA:"Enter website",
  secondaryCTA:"Copy message"
};

(function(){
  const now=new Date();
  if(NY_CONFIG.start && NY_CONFIG.end){
    const s=new Date(NY_CONFIG.start), e=new Date(NY_CONFIG.end);
    if(now<s || now>e) return;
  }

  const seenRaw=localStorage.getItem(NY_CONFIG.storageKey);
  if(seenRaw){
    try{
      const seen=JSON.parse(seenRaw);
      if(NY_CONFIG.frequency==="once" && seen?.seen) return;
      if(NY_CONFIG.frequency==="daily"){
        const today=now.toISOString().slice(0,10);
        if(seen?.lastSeenDate===today) return;
      }
    }catch(_){}
  }

  const overlay=document.createElement("div");
  overlay.className="ny-overlay";
  overlay.setAttribute("role","dialog");
  overlay.setAttribute("aria-modal","true");
  overlay.setAttribute("aria-label","New Year greeting");
  overlay.innerHTML=`
    <div class="ny-grain" aria-hidden="true"></div>
    <canvas id="nyFx" aria-hidden="true"></canvas>

    <section class="ny-card" id="nyCard">
      <div class="ny-glow" aria-hidden="true"></div>

      <header class="ny-top">
        <div class="ny-brand">
          <div class="ny-logoBox" aria-hidden="true">
            <img class="ny-logo" src="/logo.png" alt="Nyaasa Creatives logo" />
          </div>
          <div class="ny-name">Nyaasa Creatives</div>
        </div>
        <button class="ny-close" type="button" aria-label="Close popup">Close</button>
      </header>

      <div class="ny-content">
        <h1 class="ny-title ny-reveal d1"><span id="nyTitle"></span></h1>
        <p class="ny-sub ny-reveal d2" id="nySub"></p>

        <div class="ny-msg ny-reveal d3"><p id="nyType"></p></div>

        <div class="ny-actions ny-reveal d4">
          <button class="ny-btn" id="nyEnter" type="button"></button>
          <button class="ny-btn ny-ghost" id="nyCopy" type="button"></button>
        </div>
      </div>

      <footer class="ny-foot">
        <span>Thanks for visiting.</span>
        <span>© <span id="nyYear"></span> Nyaasa Creatives</span>
      </footer>
    </section>
  `;

  // lock scroll behind
  const prevOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow="hidden";
  document.body.style.overflow="hidden";
  document.body.appendChild(overlay);

  // year logic: if December, show next year; else current year.
  const month=now.getMonth();
  const year=(month===11)? now.getFullYear()+1 : now.getFullYear();
  overlay.querySelector("#nyYear").textContent=year;
  overlay.querySelector("#nyTitle").textContent=`${NY_CONFIG.titlePrefix} ${year}`;
  overlay.querySelector("#nySub").textContent=NY_CONFIG.subtitle;
  overlay.querySelector("#nyEnter").textContent=NY_CONFIG.primaryCTA;
  overlay.querySelector("#nyCopy").textContent=NY_CONFIG.secondaryCTA;

  function markSeen(){
    localStorage.setItem(NY_CONFIG.storageKey, JSON.stringify({seen:true,ts:Date.now(),lastSeenDate:new Date().toISOString().slice(0,10)}));
  }
  function close(){
    markSeen();
    overlay.remove();
    document.documentElement.style.overflow=prevOverflow;
    document.body.style.overflow="";
  }

  overlay.querySelector(".ny-close").addEventListener("click", close);
  overlay.querySelector("#nyEnter").addEventListener("click", close);
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) close(); });
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape" && document.body.contains(overlay)) close(); });

  overlay.querySelector("#nyCopy").addEventListener("click", async()=>{
    const text=`${NY_CONFIG.titlePrefix} ${year}!\n${NY_CONFIG.message}\n\n— Nyaasa Creatives`;
    try{ await navigator.clipboard.writeText(text); toast("Copied!"); }catch(_){ toast("Copy not allowed"); }
  });

  // typewriter
  const typeEl=overlay.querySelector("#nyType");
  const msg=NY_CONFIG.message;
  let i=0, raf=null;
  function typewriter(){
    if(raf) cancelAnimationFrame(raf);
    typeEl.textContent=""; i=0;
    const speed=17; let last=performance.now();
    function step(t){
      if(t-last>=speed){ last=t; if(i<msg.length) typeEl.textContent+=msg[i++]; }
      if(i<msg.length) raf=requestAnimationFrame(step);
    }
    raf=requestAnimationFrame(step);
  }
  typewriter();

  // toast
  let toastTimer=null;
  function toast(t){
    let el=document.getElementById("nyToast");
    if(!el){
      el=document.createElement("div");
      el.id="nyToast";
      el.style.position="fixed";
      el.style.left="50%";
      el.style.bottom="22px";
      el.style.transform="translateX(-50%)";
      el.style.background="rgba(0,0,0,.42)";
      el.style.border="1px solid rgba(255,255,255,.14)";
      el.style.backdropFilter="blur(10px)";
      el.style.padding="10px 12px";
      el.style.borderRadius="14px";
      el.style.color="rgba(255,255,255,.85)";
      el.style.fontSize="13px";
      el.style.opacity="0";
      el.style.pointerEvents="none";
      el.style.transition="opacity .2s ease, transform .2s ease";
      el.style.zIndex="100000";
      document.body.appendChild(el);
    }
    el.textContent=t;
    el.style.opacity="1";
    el.style.transform="translateX(-50%) translateY(-4px)";
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateX(-50%)"; }, 1200);
  }

  // 3D tilt (subtle, premium)
  const card=overlay.querySelector("#nyCard");
  let tiltRAF=null;
  function setTiltFromPointer(x,y){
    const r=card.getBoundingClientRect();
    const px=(x - (r.left + r.width/2)) / (r.width/2);
    const py=(y - (r.top + r.height/2)) / (r.height/2);
    const ry=Math.max(-1, Math.min(1, px)) * 6;   // degrees
    const rx=Math.max(-1, Math.min(1, -py)) * 5;  // degrees
    card.style.setProperty("--rx", rx.toFixed(2)+"deg");
    card.style.setProperty("--ry", ry.toFixed(2)+"deg");
  }
  function onMove(e){
    const x=e.clientX, y=e.clientY;
    if(tiltRAF) cancelAnimationFrame(tiltRAF);
    tiltRAF=requestAnimationFrame(()=>setTiltFromPointer(x,y));
  }
  overlay.addEventListener("pointermove", onMove, {passive:true});
  overlay.addEventListener("pointerleave", ()=>{
    card.style.setProperty("--rx","0deg");
    card.style.setProperty("--ry","0deg");
  });

  // FX canvas: sparkles + subtle burst on open (keeps dark-blue vibe)
  const c=overlay.querySelector("#nyFx");
  const ctx=c.getContext("2d",{alpha:true});
  let W=0,H=0,DPR=1;
  function resize(){
    DPR=Math.min(2, window.devicePixelRatio||1);
    W=window.innerWidth|0; H=window.innerHeight|0;
    c.width=(W*DPR)|0; c.height=(H*DPR)|0;
    c.style.width=W+"px"; c.style.height=H+"px";
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener("resize", resize, {passive:true}); resize();

  const rand=(a,b)=>Math.random()*(b-a)+a;
  const pick=(arr)=>arr[(Math.random()*arr.length)|0];

  // limited palette (icy whites / blues)
  const pal=[
    "rgba(255,255,255,0.95)",
    "rgba(183,240,255,0.90)",
    "rgba(138,211,255,0.88)",
    "rgba(255,255,255,0.65)"
  ];

  // sparkles
  const stars=[];
  const STAR_COUNT=Math.max(120, Math.min(220, (W/5)|0));
  for(let s=0;s<STAR_COUNT;s++){
    stars.push({
      x:rand(0,W), y:rand(0,H),
      r:rand(0.6,1.8),
      a:rand(0.15,0.75),
      tw:rand(0.004,0.012),
      col:pick(pal)
    });
  }

  // burst particles (on load)
  const bursts=[];
  const center={x:W/2, y:H/2};
  const BURST_N=110;
  for(let b=0;b<BURST_N;b++){
    const ang=rand(0, Math.PI*2);
    const sp=rand(0.8, 3.2);
    bursts.push({
      x:center.x, y:center.y,
      vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp,
      life:rand(0.8, 2.0),
      t:0,
      size:rand(2,7),
      col:pick(pal),
      rot:rand(0, Math.PI*2),
      vr:rand(-0.12, 0.12)
    });
  }

  let last=performance.now();
  function draw(t){
    const dt=Math.min(0.033, (t-last)/1000); last=t;
    ctx.clearRect(0,0,W,H);

    // draw stars
    for(const st of stars){
      st.a += Math.sin(t*st.tw)*0.003;
      const a=Math.max(0.05, Math.min(0.85, st.a));
      ctx.globalAlpha=a;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fillStyle=st.col;
      ctx.fill();
    }
    ctx.globalAlpha=1;

    // draw burst (fades fast)
    for(const p of bursts){
      p.t += dt;
      const k = 1 - Math.min(1, p.t/p.life);
      if(k<=0) continue;
      p.x += p.vx * (1.2 - 0.6*(1-k));
      p.y += p.vy * (1.2 - 0.6*(1-k));
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.7 * k;
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*1.8);
      ctx.restore();
    }
    ctx.globalAlpha=1;

    if(document.body.contains(overlay)) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

})();