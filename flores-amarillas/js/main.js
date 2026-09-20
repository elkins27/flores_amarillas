import { mensajes } from "./messages.js";
import { startBouquet, BLOOM_DURATION_MS } from "./canvas.js";
import { startConfetti, startAmbientPetals } from "./effects.js";
import { unlockAudio, playChime, toggleMuted, isMuted } from "./sound.js";

const bgPetals = document.getElementById("bgPetals");
const soundToggle = document.getElementById("soundToggle");
const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");

const envelopeStage = document.getElementById("envelopeStage");
const envelope = document.getElementById("envelope");

const textEl = document.getElementById("messageText");
const btn = document.getElementById("actionBtn");
const dotsEl = document.getElementById("dots");
const letterCard = document.getElementById("letterCard");
const revealCard = document.getElementById("revealCard");
const replayBtn = document.getElementById("replayBtn");
const flowerCanvas = document.getElementById("flowerCanvas");

const couplePhoto = document.getElementById("couplePhoto");
const photoPlaceholder = document.getElementById("photoPlaceholder");

startAmbientPetals(bgPetals);

/* Si la foto ya existe, la mostramos de inmediato (puede que la imagen
   ya haya terminado de cargar antes de que este script corra); si no,
   esperamos el evento "load", y si falla, ocultamos la imagen rota. */
if (couplePhoto.complete && couplePhoto.naturalWidth > 0) {
  photoPlaceholder.style.display = "none";
} else {
  couplePhoto.addEventListener("load", () => {
    photoPlaceholder.style.display = "none";
  });
}
couplePhoto.addEventListener("error", () => {
  couplePhoto.style.display = "none";
});

/* =========================
   SONIDO
========================= */
function updateSoundIcon() {
  soundToggle.textContent = isMuted() ? "🔇" : "🔊";
  soundToggle.setAttribute("aria-label", isMuted() ? "Activar sonido" : "Silenciar sonido");
}
soundToggle.addEventListener("click", () => {
  toggleMuted();
  updateSoundIcon();
});

/* =========================
   MÚSICA DE FONDO
========================= */
const MUSIC_STOP_SECONDS = 90; // 1:30 — la parte esencial de la canción

function updateMusicIcon() {
  musicToggle.textContent = bgMusic.paused ? "🎵" : "⏸️";
  musicToggle.setAttribute("aria-label", bgMusic.paused ? "Reproducir música" : "Pausar música");
}

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  } else {
    bgMusic.pause();
  }
});

bgMusic.addEventListener("play", updateMusicIcon);
bgMusic.addEventListener("pause", updateMusicIcon);
bgMusic.addEventListener("timeupdate", () => {
  if (bgMusic.currentTime >= MUSIC_STOP_SECONDS) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
});

/* =========================
   SOBRE INICIAL
========================= */
function openEnvelope() {
  if (envelope.classList.contains("open")) return;
  unlockAudio();
  bgMusic.play().catch(() => {
    /* el navegador bloqueó el autoplay; el botón de música lo permite manualmente */
  });
  envelope.classList.add("open");

  wait(900).then(() => {
    envelopeStage.classList.add("exit");
    wait(400).then(() => {
      envelopeStage.hidden = true;
      letterCard.hidden = false;
      requestAnimationFrame(() => letterCard.classList.add("show"));
      showStep();
    });
  });
}
envelope.addEventListener("click", openEnvelope);
envelope.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openEnvelope();
  }
});

/* =========================
   CARTA
========================= */
let step = 0;
let animating = false;

function buildDots() {
  dotsEl.innerHTML = "";
  mensajes.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " active" : "");
    dotsEl.appendChild(d);
  });
}
buildDots();

function updateDots() {
  Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle("active", i <= step));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function typeWriter(text) {
  return new Promise(resolve => {
    let i = 0;
    textEl.textContent = "";
    (function write() {
      if (i < text.length) {
        textEl.textContent += text.charAt(i);
        i++;
        setTimeout(write, 30);
      } else {
        resolve();
      }
    })();
  });
}

async function showStep() {
  animating = true;
  textEl.classList.remove("show");
  await wait(250);
  textEl.classList.add("show");
  await typeWriter(mensajes[step]);
  updateDots();
  animating = false;
  btn.textContent = step === mensajes.length - 1 ? "Ver mi ramo 🌻" : "Toca aquí 💛";
}

btn.addEventListener("click", () => {
  if (animating) return;
  unlockAudio();
  if (step < mensajes.length - 1) {
    step++;
    showStep();
  } else {
    revealBouquet();
  }
});

/* =========================
   REVELACIÓN DEL RAMO
========================= */
function revealBouquet() {
  letterCard.classList.add("exit");
  wait(400).then(() => {
    letterCard.hidden = true;
    revealCard.hidden = false;
    requestAnimationFrame(() => revealCard.classList.add("show"));
    startBouquet(flowerCanvas);
    startConfetti();
    playChime();
  });
}

let replaying = false;

replayBtn.addEventListener("click", () => {
  if (replaying) return;
  replaying = true;
  replayBtn.disabled = true;
  flowerCanvas.classList.add("replaying");

  wait(350).then(() => {
    flowerCanvas.classList.remove("replaying");
    startBouquet(flowerCanvas);
    startConfetti();
    playChime();

    wait(BLOOM_DURATION_MS + 150).then(() => {
      replayBtn.disabled = false;
      replaying = false;
    });
  });
});
