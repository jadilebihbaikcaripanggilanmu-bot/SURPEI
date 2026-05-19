const screens = [...document.querySelectorAll(".screen")];
const modalLayer = document.getElementById("modalLayer");
const modals = [...document.querySelectorAll(".modal")];

const staNames = ["STA 0+000", "STA 0+025", "STA 0+050", "STA 0+075", "STA 0+100"];
const design = [100.000, 100.125, 100.250, 100.375, 100.500];
const existing = [100.032, 100.078, 100.318, 100.292, 100.612];
const fsHints = [1.468, 1.547, 1.432, 1.583, 1.388];

let currentSta = 0;
let measured = [];
let audioOn = false;
let audioCtx, osc, gain;

function showScreen(id) {
  screens.forEach(screen => screen.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "loading") {
    setTimeout(() => showScreen("home"), 1850);
  }
}

function openModal(name) {
  modalLayer.classList.add("active");
  modals.forEach(modal => modal.classList.remove("active"));
  document.getElementById(`${name}Modal`).classList.add("active");
}

function closeModal() {
  modalLayer.classList.remove("active");
  modals.forEach(modal => modal.classList.remove("active"));
}

document.querySelectorAll("[data-goto]").forEach(el => {
  el.addEventListener("click", () => {
    closeModal();
    showScreen(el.dataset.goto);
  });
});

document.querySelectorAll("[data-modal]").forEach(el => {
  el.addEventListener("click", () => openModal(el.dataset.modal));
});

document.querySelectorAll(".close-modal").forEach(el => el.addEventListener("click", closeModal));

setTimeout(() => showScreen("menu"), 3300);

setInterval(() => {
  const boot = document.getElementById("bootText");
  if (!boot) return;
  const dots = ".".repeat(Math.floor(Date.now() / 350) % 4);
  boot.textContent = `INITIALIZING FIELD MODULES${dots}\nLOADING BM / STA DATA${dots}\nCALIBRATING WATERPASS VIEW${dots}`;
}, 280);

function updateSta() {
  document.getElementById("staName").textContent = staNames[currentSta];
  document.getElementById("fsInput").value = fsHints[currentSta].toFixed(3);
  document.getElementById("calcOutput").textContent = "Masukkan BS dan FS, lalu klik calculate.";
}
updateSta();

document.getElementById("calculate").addEventListener("click", () => {
  const bs = parseFloat(document.getElementById("bsInput").value.replace(",", "."));
  const fs = parseFloat(document.getElementById("fsInput").value.replace(",", "."));

  if (Number.isNaN(bs) || Number.isNaN(fs)) {
    document.getElementById("calcOutput").textContent = "Input salah. Gunakan angka seperti 1.500.";
    return;
  }

  const hi = 100.000 + bs;
  const elev = hi - fs;
  const cutFill = elev - design[currentSta];
  const error = Math.abs(elev - existing[currentSta]);
  const decision = cutFill > 0.03 ? "CUT" : cutFill < -0.03 ? "FILL" : "OK";

  measured[currentSta] = { elev, error, decision };

  document.getElementById("calcOutput").textContent =
`HASIL ${staNames[currentSta]}

HI = BM + BS
HI = 100.000 + ${bs.toFixed(3)}
HI = ${hi.toFixed(3)} m

Elevasi Titik = HI - FS
Elevasi Titik = ${elev.toFixed(3)} m

Cut/Fill = ${cutFill.toFixed(3)} m
Decision = ${decision}
Error = ${error.toFixed(3)} m`;
});

document.getElementById("nextSTA").addEventListener("click", () => {
  currentSta = (currentSta + 1) % staNames.length;
  updateSta();
});

document.getElementById("finishMission").addEventListener("click", () => {
  const count = measured.filter(Boolean).length;
  if (count < staNames.length) {
    alert("Belum semua STA dihitung. Selesaikan 5 STA dulu.");
    return;
  }

  const avg = measured.reduce((sum, item) => sum + item.error, 0) / measured.length;
  const rating = avg <= 0.01 ? "Perfect" : avg <= 0.03 ? "Accepted" : avg <= 0.05 ? "Warning" : "Failed";
  const reward = rating === "Perfect" ? 750 : rating === "Accepted" ? 650 : rating === "Warning" ? 550 : 500;
  const rep = rating === "Perfect" ? 15 : rating === "Accepted" ? 10 : rating === "Warning" ? 7 : 3;

  document.getElementById("finalResult").innerHTML =
`Average Error: ${avg.toFixed(3)} m<br>
Rating: ${rating}<br>
Reward: $${reward}<br>
Reputation: +${rep}<br><br>
${staNames.map((name, i) => `${name}: ${measured[i].elev.toFixed(3)} m — ${measured[i].decision}`).join("<br>")}`;

  showScreen("result");
});

const scope = document.getElementById("scope");
document.getElementById("openScope").addEventListener("click", () => scope.classList.add("active"));
document.getElementById("closeScope").addEventListener("click", () => scope.classList.remove("active"));
document.getElementById("targetBM").addEventListener("click", () => {
  document.getElementById("scopeReading").textContent = "TARGET BM 01 • BS = 1.500 m";
});
document.getElementById("targetSTA").addEventListener("click", () => {
  document.getElementById("scopeReading").textContent = `${staNames[currentSta]} • FS = ${fsHints[currentSta].toFixed(3)} m`;
});

document.getElementById("audioToggle").addEventListener("click", () => {
  audioOn = !audioOn;
  document.getElementById("audioToggle").textContent = audioOn ? "ON" : "OFF";
  if (audioOn) startAmbient();
  else stopAmbient();
});

function startAmbient() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 104;
    gain.gain.value = 0.025;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
  } else {
    audioCtx.resume();
  }
}

function stopAmbient() {
  if (audioCtx) audioCtx.suspend();
}
