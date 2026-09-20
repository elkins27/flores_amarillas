/* ============================================================
   PÉTALOS DE FONDO — ambiente continuo con corazones y rositas
============================================================ */
export function startAmbientPetals(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const GLYPHS = ["💛", "🌸", "💕", "🤍", "🌹"];
  function spawn() {
    return {
      x: Math.random() * w,
      y: -30 - Math.random() * h,
      speed: 0.15 + Math.random() * 0.28,
      drift: Math.random() * 0.6 - 0.3,
      size: 14 + Math.random() * 14,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.008,
      opacity: 0.25 + Math.random() * 0.3
    };
  }

  const petals = Array.from({ length: 14 }, spawn);

  function tick() {
    ctx.clearRect(0, 0, w, h);
    petals.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.01) * p.drift;
      p.angle += p.spin;
      if (p.y > h + 30) Object.assign(p, spawn(), { y: -30 });
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.font = p.size + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   CONFETI — ráfaga en el momento de la revelación
============================================================ */
export function startConfetti() {
  const symbols = ["💛", "🌻", "🌸", "🤍", "💕"];
  const count = 22;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.className = "confetti-piece";
      el.style.left = Math.random() * 100 + "vw";
      el.style.fontSize = 14 + Math.random() * 16 + "px";
      document.body.appendChild(el);

      const rise = 45 + Math.random() * 30;
      const duration = 3200 + Math.random() * 1200;

      el.animate(
        [
          { transform: "translateY(0) scale(0.8)", opacity: 0 },
          { transform: `translateY(-${rise}vh) scale(1.1)`, opacity: 1, offset: 0.5 },
          { transform: `translateY(-${rise * 1.7}vh) scale(0.9)`, opacity: 0 }
        ],
        { duration, easing: "ease-out" }
      );

      setTimeout(() => el.remove(), duration + 200);
    }, i * 60);
  }
}
