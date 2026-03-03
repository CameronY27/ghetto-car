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

  // If mode already picked, show the mode-specific rules too
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

  const rulesCount = renderRules(); // includes mode rules if selected
  qs("#sumRules").textContent = `${rulesCount} rules`;
}

// Nav buttons
qsa("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("data-next");
    // If going to rules, render them
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
    qs("#toPayment").disabled = false;

    // Update rules list if user opens rules later
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

qs("#toSummary").addEventListener("click", () => {
  updateSummary();
  showScreen("summary");
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

// Copy link
qs("#copyLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    qs("#copyLink").textContent = "Copied ✅";
    setTimeout(() => (qs("#copyLink").textContent = "Copy page link"), 1200);
  } catch {
    alert("Couldn’t copy. Just manually copy the URL from your browser.");
  }
});

// Initial rules render (welcome -> rules can be clicked)
renderRules();
