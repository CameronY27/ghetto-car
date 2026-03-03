// Simple single-page flow (no backend). Great for QR links.

const state = {
  name: "",
  mode: null,
  pay: null,
};

const modeLabels = {
  chill: "😌 Chill Mode",
  normal: "😏 Regular Ghetto",
  chaos: "😭 Certified Chaos",
  vip: "👑 VIP Passenger",
};

const payLabels = {
  snacks: "🍿 Snacks",
  food: "🍕 Food",
  cash: "💵 Cash",
  goodvibes: "✨ Good Vibes",
};

// --- Audio + Speech (runs only after a user tap) ---
let audioCtx;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // iOS/Safari may start suspended until a user gesture
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function beep({ freq = 440, duration = 0.12, type = "sine", gain = 0.95, when = 0 } = {}) {
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + when;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  // Quick fade in/out to avoid clicks
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playModeSound(mode) {
  // NOTE: A website cannot increase the phone's SYSTEM volume.
  // This only plays the page audio at max volume.

  if (mode === "chill") {
    beep({ freq: 392, duration: 0.14, type: "sine", gain: 0.95 });
    beep({ freq: 523, duration: 0.14, type: "sine", gain: 0.95, when: 0.16 });
  } else if (mode === "normal") {
    beep({ freq: 440, duration: 0.10, type: "square", gain: 0.98 });
    beep({ freq: 659, duration: 0.10, type: "square", gain: 0.98, when: 0.12 });
    beep({ freq: 523, duration: 0.10, type: "square", gain: 0.98, when: 0.24 });
  } else if (mode === "chaos") {
    for (let i = 0; i < 6; i++) {
      beep({ freq: 300 + i * 120, duration: 0.07, type: "sawtooth", gain: 0.99, when: i * 0.08 });
    }
  } else if (mode === "vip") {
    beep({ freq: 784, duration: 0.12, type: "triangle", gain: 0.95 });
    beep({ freq: 988, duration: 0.12, type: "triangle", gain: 0.95, when: 0.14 });
    beep({ freq: 1175, duration: 0.14, type: "triangle", gain: 0.95, when: 0.28 });
  } else {
    beep({ freq: 440, duration: 0.12, type: "sine", gain: 0.95 });
  }
}

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    window.speechSynthesis.speak(utter);
  }
}

const baseRules = [
  "Aux is a privilege, not a right.",
  "No backseat driving unless you can parallel park in one try.",
  "If we hit a pothole, we all pretend it didn’t happen.",
  "Seatbelt stays on. We’re funny, not reckless.",
  "If the driver says “watch this,” you must mind your business.",
];

const modeRules = {
  chill: [
    "Music stays at a respectful volume (most of the time).",
    "Turns are smooth-ish. Vibes are calm.",
  ],
  normal: [
    "Lane changes may be confident.",
    "We might say “we close” even if we’re 12 minutes away.",
  ],
  chaos: [
    "You hold the drink at intersections. No questions.",
    "Sudden U-turn probability: high.",
  ],
  vip: [
    "You may request one (1) song without judgment.",
    "You get first choice of snacks (if available).",
  ],
};

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function showScreen(name) {
  qsa(".screen").forEach(s => s.classList.remove("active"));
  const el = qs(`.screen[data-screen="${name}"]`);
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRules() {
  const list = qs("#rulesList");
  list.innerHTML = "";

  const combined = [...baseRules];

  if (state.mode && modeRules[state.mode]) {
    combined.push(...modeRules[state.mode]);
  }

  combined.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    list.appendChild(li);
  });

  return combined.length;
}

function updateSummary() {
  const name = state.name?.trim() || "Guest";
  qs("#summaryGreeting").textContent = `Alright ${name}… welcome aboard. 😭`;

  qs("#sumMode").textContent = state.mode ? modeLabels[state.mode] : "—";
  qs("#sumPay").textContent = state.pay ? payLabels[state.pay] : "—";

  const rulesCount = renderRules();
  qs("#sumRules").textContent = `${rulesCount} rules`;
}

// Nav buttons
qsa("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("data-next");
    if (next === "rules") renderRules();
    showScreen(next);
  });
});

qsa("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => {
    showScreen(btn.getAttribute("data-back"));
  });
});

// Name -> Mode
qs("#toMode").addEventListener("click", () => {
  state.name = qs("#guestName").value.trim();
  showScreen("mode");
});

// Mode selection
qsa(".tile[data-mode]").forEach(tile => {
  tile.addEventListener("click", () => {
    qsa(".tile[data-mode]").forEach(t => t.classList.remove("selected"));
    tile.classList.add("selected");

    state.mode = tile.getAttribute("data-mode");
    playModeSound(state.mode);
    speak(`You selected ${modeLabels[state.mode]}`);
    qs("#toPayment").disabled = false;

    renderRules();
  });
});

qs("#toPayment").addEventListener("click", () => {
  showScreen("payment");
});

// Payment selection
qsa(".tile.pay[data-pay]").forEach(tile => {
  tile.addEventListener("click", () => {
    qsa(".tile.pay[data-pay]").forEach(t => t.classList.remove("selected"));
    tile.classList.add("selected");

    state.pay = tile.getAttribute("data-pay");
    qs("#toSummary").disabled = false;
  });
});

qs("#toSummary").addEventListener("click", async () => {
  updateSummary();
  showScreen("summary");

  // Play receipt audio (user gesture = best chance to allow audio)
  const receiptAudio = qs("#receiptAudio");
  if (receiptAudio) {
    try {
      receiptAudio.pause();
      receiptAudio.currentTime = 0;
      receiptAudio.volume = 1.0;
      receiptAudio.load();

      const p = receiptAudio.play();
      if (p && typeof p.then === "function") {
        await p;
      }
    } catch (e) {
      console.log("Receipt audio failed:", e);
    }
  } else {
    console.log("No #receiptAudio element found.");
  }
});

// Restart
qs("#restart").addEventListener("click", () => {
  state.name = "";
  state.mode = null;
  state.pay = null;

  qs("#guestName").value = "";
  qs("#toPayment").disabled = true;
  qs("#toSummary").disabled = true;

  qsa(".tile").forEach(t => t.classList.remove("selected"));
  renderRules();
  showScreen("welcome");
});

// Copy link (button may not exist anymore)
const copyBtn = qs("#copyLink");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy page link"), 1200);
    } catch {
      alert("Couldn’t copy. Just manually copy the URL from your browser.");
    }
  });
}

// Initial rules render
renderRules();

// --- Auto Play When Link Opens (may be blocked until first tap on mobile) ---
window.addEventListener("load", () => {
  setTimeout(() => {
    try {
      getAudioCtx();
      playModeSound("normal");
      speak("Welcome to the Ghetto Car. Choose your fate.");
    } catch (e) {
      console.log("Autoplay blocked by browser. Will play after first tap.");
    }
  }, 400);
});
