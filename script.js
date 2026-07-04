(function () {
  "use strict";

  /* ── Mobile nav ── */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  /* ── Pace Calculator ── */
  const paceForm = document.getElementById("pace-form");
  if (paceForm) {
    paceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const distance = parseFloat(document.getElementById("pace-distance").value);
      const hours = parseInt(document.getElementById("pace-hours").value, 10) || 0;
      const minutes = parseInt(document.getElementById("pace-minutes").value, 10) || 0;
      const seconds = parseInt(document.getElementById("pace-seconds").value, 10) || 0;

      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (!distance || distance <= 0 || totalSeconds <= 0) return;

      const pacePerKm = totalSeconds / distance;
      const pacePerMile = totalSeconds / (distance / 1.60934);
      const speedKmh = (distance / totalSeconds) * 3600;
      const speedMph = speedKmh / 1.60934;

      document.getElementById("pace-result-km").textContent = formatPace(pacePerKm);
      document.getElementById("pace-result-mile").textContent = formatPace(pacePerMile);
      document.getElementById("pace-result-kmh").textContent = speedKmh.toFixed(2);
      document.getElementById("pace-result-mph").textContent = speedMph.toFixed(2);

      const splits = [1, 5, 10, 21.0975, 42.195];
      const splitContainer = document.getElementById("pace-splits");
      splitContainer.innerHTML = splits
        .filter((d) => d <= distance || d === 1)
        .map((d) => {
          const splitTime = pacePerKm * d;
          const label = d === 21.0975 ? "Half" : d === 42.195 ? "Full" : d + " km";
          return `<div class="result-item"><div class="value">${formatPace(splitTime)}</div><div class="label">${label}</div></div>`;
        })
        .join("");

      document.getElementById("pace-results").hidden = false;
    });
  }

  function formatPace(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  /* ── Zone 2 Calculator ── */
  const zone2Form = document.getElementById("zone2-form");
  if (zone2Form) {
    zone2Form.addEventListener("submit", (e) => {
      e.preventDefault();
      const age = parseInt(document.getElementById("zone2-age").value, 10);
      const resting = parseInt(document.getElementById("zone2-resting").value, 10) || null;
      const method = document.getElementById("zone2-method").value;

      if (!age || age < 10 || age > 100) return;

      let maxHR;
      if (method === "measured") {
        maxHR = parseInt(document.getElementById("zone2-max").value, 10);
        if (!maxHR) return;
      } else {
        maxHR = 220 - age;
      }

      let zone2Low, zone2High;

      if (method === "karvonen" && resting) {
        const reserve = maxHR - resting;
        zone2Low = Math.round(reserve * 0.6 + resting);
        zone2High = Math.round(reserve * 0.7 + resting);
      } else {
        zone2Low = Math.round(maxHR * 0.6);
        zone2High = Math.round(maxHR * 0.7);
      }

      document.getElementById("zone2-low").textContent = zone2Low;
      document.getElementById("zone2-high").textContent = zone2High;
      document.getElementById("zone2-max-display").textContent = maxHR;

      const zones = [
        { name: "Zone 1", pct: "50–60%", low: 0.5, high: 0.6, desc: "Recovery" },
        { name: "Zone 2", pct: "60–70%", low: 0.6, high: 0.7, desc: "Aerobic base" },
        { name: "Zone 3", pct: "70–80%", low: 0.7, high: 0.8, desc: "Tempo" },
        { name: "Zone 4", pct: "80–90%", low: 0.8, high: 0.9, desc: "Threshold" },
        { name: "Zone 5", pct: "90–100%", low: 0.9, high: 1.0, desc: "Max effort" },
      ];

      const zoneGrid = document.getElementById("zone2-all-zones");
      zoneGrid.innerHTML = zones
        .map((z) => {
          let low, high;
          if (method === "karvonen" && resting) {
            const reserve = maxHR - resting;
            low = Math.round(reserve * z.low + resting);
            high = Math.round(reserve * z.high + resting);
          } else {
            low = Math.round(maxHR * z.low);
            high = Math.round(maxHR * z.high);
          }
          const highlight = z.name === "Zone 2" ? " highlight" : "";
          return `<div class="result-item${highlight}"><div class="value">${low}–${high}</div><div class="label">${z.name} · ${z.desc}</div></div>`;
        })
        .join("");

      document.getElementById("zone2-results").hidden = false;
    });

    const methodSelect = document.getElementById("zone2-method");
    const maxField = document.getElementById("zone2-max-group");
    const restingField = document.getElementById("zone2-resting-group");
    if (methodSelect) {
      methodSelect.addEventListener("change", () => {
        const v = methodSelect.value;
        maxField.hidden = v !== "measured";
        restingField.hidden = v !== "karvonen";
      });
    }
  }

  /* ── WOD Generator ── */
  const wodForm = document.getElementById("wod-form");
  if (wodForm) {
    const movements = {
      bodyweight: ["Push-ups", "Air Squats", "Burpees", "Sit-ups", "Lunges", "Mountain Climbers", "Box Jumps", "Pull-ups"],
      barbell: ["Deadlifts", "Back Squats", "Front Squats", "Power Cleans", "Push Press", "Thrusters", "Hang Cleans"],
      dumbbell: ["DB Snatches", "DB Thrusters", "DB Swings", "DB Lunges", "DB Push Press", "Devil Press"],
      cardio: ["Row (cal)", "Assault Bike (cal)", "Run (m)", "Double Unders", "Single Unders", "Ski Erg (cal)"],
      kettlebell: ["KB Swings", "KB Goblet Squats", "KB Clean & Press", "KB Snatches"],
    };

    const formats = {
      amrap: (time, list) => `${time}-Minute AMRAP\n\n${list.map((m) => m.reps + " " + m.name).join("\n")}`,
      fortime: (time, list) => `${list.length} Rounds For Time\n\n${list.map((m) => m.reps + " " + m.name).join("\n")}`,
      emom: (time, list) => `EMOM ${time}\n\n${list.map((m, i) => "Min " + (i + 1) + ": " + m.reps + " " + m.name).join("\n")}`,
      chipper: (time, list) => `Chipper\n\n${list.map((m) => m.reps + " " + m.name).join("\n")}`,
    };

    document.getElementById("wod-generate").addEventListener("click", () => {
      const format = document.getElementById("wod-format").value;
      const duration = parseInt(document.getElementById("wod-duration").value, 10) || 12;
      const numMovements = parseInt(document.getElementById("wod-movements-count").value, 10) || 4;
      const checked = [...document.querySelectorAll('input[name="wod-equipment"]:checked')].map((el) => el.value);

      if (checked.length === 0) return;

      const pool = checked.flatMap((cat) => movements[cat] || []);
      const selected = shuffle(pool).slice(0, numMovements);
      const wodMovements = selected.map((name) => ({
        name,
        reps: randomReps(name, format),
      }));

      const text = formats[format](duration, wodMovements);
      document.getElementById("wod-output-text").textContent = text;

      const listEl = document.getElementById("wod-movement-list");
      listEl.innerHTML = wodMovements
        .map((m) => `<div class="wod-movement"><span class="wod-movement-name">${m.name}</span><span class="wod-movement-reps">${m.reps}</span></div>`)
        .join("");

      document.getElementById("wod-results").hidden = false;
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomReps(name, format) {
    if (name.includes("cal")) return randPick([10, 12, 15, 18, 20]);
    if (name.includes("Run")) return randPick([200, 400, 600, 800]);
    if (name.includes("Double Unders")) return randPick([30, 40, 50, 60]);
    if (name.includes("Single Unders")) return randPick([50, 75, 100]);
    if (format === "emom") return randPick([8, 10, 12, 15]);
    return randPick([10, 12, 15, 20, 21, 25, 30]);
  }

  function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
})();
