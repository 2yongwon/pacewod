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
      const splitItems = splits
        .filter((d) => d <= distance || d === 1)
        .map((d) => {
          const splitTime = pacePerKm * d;
          const label = d === 21.0975 ? "Half" : d === 42.195 ? "Full" : d + " km";
          return { label, value: formatPace(splitTime), barValue: splitTime };
        });
      splitContainer.className = "pace-bars";
      splitContainer.innerHTML = renderPaceBars(splitItems);

      document.getElementById("pace-results").hidden = false;
    });
  }

  function formatPace(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return m + ":" + String(s).padStart(2, "0");
  }

  function parseTime(hoursId, minutesId, secondsId) {
    const hours = parseInt(document.getElementById(hoursId).value, 10) || 0;
    const minutes = parseInt(document.getElementById(minutesId).value, 10) || 0;
    const seconds = parseInt(document.getElementById(secondsId).value, 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  function renderPaceBars(items) {
    const maxVal = Math.max(...items.map((item) => item.barValue), 1);
    return items
      .map((item) => {
        const pct = (item.barValue / maxVal) * 100;
        return `<div class="pace-bar-row">
          <span class="pace-bar-label">${item.label}</span>
          <div class="pace-bar-track"><div class="pace-bar-fill" style="width:${pct}%"></div></div>
          <span class="pace-bar-value">${item.value}</span>
        </div>`;
      })
      .join("");
  }

  function renderHrZoneBars(zoneDefs, zones, formatRange) {
    const highs = zones.map((zone) => zone.high ?? zone.low + 20);
    const maxScale = Math.max(...highs) + 5;
    return zoneDefs
      .map((zone, index) => {
        const range = zones[index];
        const high = range.high ?? maxScale;
        const leftPct = (range.low / maxScale) * 100;
        const widthPct = Math.max(((high - range.low) / maxScale) * 100, 2);
        const highlight = index === 1 ? " hr-zone-row--highlight" : "";
        return `<div class="hr-zone-row zone-${index + 1}${highlight}">
          <div class="hr-zone-header">
            <span class="hr-zone-name">${zone.name} · ${zone.label}</span>
            <span class="hr-zone-range">${formatRange(range.low, range.high)} bpm</span>
          </div>
          <div class="hr-zone-track">
            <div class="hr-zone-fill" style="left:${leftPct}%;width:${widthPct}%"></div>
          </div>
        </div>`;
      })
      .join("");
  }

  function renderCalBreakdown(distance, perKm) {
    const kmCount = Math.min(Math.ceil(distance), 20);
    const segments = [];
    for (let km = 1; km <= kmCount; km++) {
      segments.push({ label: "Km " + km, value: perKm });
    }
    const remainder = distance - Math.floor(distance);
    if (remainder > 0.05 && kmCount < 20) {
      segments.push({
        label: distance.toFixed(1) + " km",
        value: Math.round(perKm * remainder),
      });
    }
    const maxCal = Math.max(...segments.map((seg) => seg.value), 1);
    return segments
      .map((seg) => {
        const pct = (seg.value / maxCal) * 100;
        return `<div class="cal-bar-row">
          <span class="cal-bar-label">${seg.label}</span>
          <div class="cal-bar-track"><div class="cal-bar-fill" style="width:${pct}%"></div></div>
          <span class="cal-bar-value">${seg.value}</span>
        </div>`;
      })
      .join("");
  }

  function updateZone2Gauge(zone2Low, zone2High, maxHR) {
    const gauge = document.getElementById("zone2-gauge");
    const fill = document.getElementById("zone2-gauge-fill");
    const maxLabel = document.getElementById("zone2-gauge-max");
    if (!gauge || !fill || !maxLabel || !maxHR) return;

    const leftPct = (zone2Low / maxHR) * 100;
    const widthPct = ((zone2High - zone2Low) / maxHR) * 100;
    fill.style.left = leftPct + "%";
    fill.style.width = Math.max(widthPct, 2) + "%";
    maxLabel.textContent = maxHR + " bpm";
    gauge.hidden = false;
  }

  /* ── Pace Chart ── */
  const chartBtn = document.getElementById("chart-lookup");
  if (chartBtn) {
    chartBtn.addEventListener("click", () => {
      const race = document.getElementById("chart-race").value;
      const totalSeconds = parseTime("chart-hours", "chart-minutes", "chart-seconds");
      const distance = race === "half" ? 21.0975 : 42.195;

      if (totalSeconds <= 0) return;

      const pacePerKm = totalSeconds / distance;
      const pacePerMile = totalSeconds / (distance / 1.60934);

      document.getElementById("chart-pace-km").textContent = formatPace(pacePerKm);
      document.getElementById("chart-pace-mile").textContent = formatPace(pacePerMile);

      const splitPoints = [];
      const fullKm = Math.floor(distance);
      for (let km = 1; km <= fullKm; km++) splitPoints.push(km);
      if (distance % 1 !== 0) splitPoints.push(distance);

      const splitsEl = document.getElementById("chart-splits");
      const splitItems = splitPoints.map((km) => {
        const label = km === distance ? "Finish" : "Km " + km;
        const cumulative = pacePerKm * km;
        return { label, value: formatDuration(cumulative), barValue: cumulative };
      });
      splitsEl.className = "pace-bars";
      splitsEl.innerHTML = renderPaceBars(splitItems);

      document.getElementById("chart-placeholder").hidden = true;
      document.getElementById("chart-results").hidden = false;
    });
  }

  /* ── Race Predictor (Riegel formula) ── */
  const predictorBtn = document.getElementById("predictor-calculate");
  if (predictorBtn) {
    const RIEGEL_EXPONENT = 1.06;
    const races = [
      { distance: 5, label: "5K" },
      { distance: 10, label: "10K" },
      { distance: 21.0975, label: "Half Marathon" },
      { distance: 42.195, label: "Marathon" },
    ];

    predictorBtn.addEventListener("click", () => {
      const knownDistance = parseFloat(document.getElementById("predictor-race").value);
      const knownTime = parseTime("predictor-hours", "predictor-minutes", "predictor-seconds");
      const strategy = document.getElementById("predictor-strategy").value;

      if (!knownDistance || knownTime <= 0) return;

      const grid = document.getElementById("predictor-grid");
      const rows = races
        .map((race) => {
          const predicted =
            knownTime * Math.pow(race.distance / knownDistance, RIEGEL_EXPONENT);
          const pacePerKm = predicted / race.distance;
          const splits = getPacingSplits(pacePerKm, strategy);
          const isInput = Math.abs(race.distance - knownDistance) < 0.001;
          const rowClass = isInput ? " class=\"highlight-row\"" : "";
          const inputTag = isInput ? ' <span class="predictor-input-tag">Your race</span>' : "";
          return `<tr${rowClass}>
            <td>${race.label}${inputTag}</td>
            <td>${formatDuration(predicted)}</td>
            <td>${formatPace(pacePerKm)}/km</td>
            <td>${formatPace(splits.first)}/km</td>
            <td>${formatPace(splits.second)}/km</td>
          </tr>`;
        })
        .join("");

      grid.innerHTML = `
        <div class="predictor-table-wrap">
          <table class="predictor-table">
            <thead>
              <tr>
                <th>Distance</th>
                <th>Predicted Time</th>
                <th>Avg Pace</th>
                <th>1st Half Pace</th>
                <th>2nd Half Pace</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="predictor-note">Predicted times are estimates based on the Riegel formula. Actual race performance depends on training, course conditions, weather, and pacing execution.</p>
      `;

      document.getElementById("predictor-placeholder").hidden = true;
      document.getElementById("predictor-results").hidden = false;
    });

    function getPacingSplits(avgPacePerKm, strategy) {
      switch (strategy) {
        case "negative": {
          const first = avgPacePerKm / 0.985;
          return { first, second: first * 0.97, firstLabel: "1st Half", secondLabel: "2nd Half" };
        }
        case "positive": {
          const first = avgPacePerKm / 1.015;
          return { first, second: first * 1.03, firstLabel: "1st Half", secondLabel: "2nd Half" };
        }
        case "fast-start":
          return {
            first: avgPacePerKm * 0.97,
            second: avgPacePerKm * 1.01,
            firstLabel: "First 25%",
            secondLabel: "Last 75%",
          };
        default:
          return { first: avgPacePerKm, second: avgPacePerKm, firstLabel: "1st Half", secondLabel: "2nd Half" };
      }
    }
  }

  /* ── Heart Rate Zone Calculator ── */
  const hrzBtn = document.getElementById("hrz-calculate");
  if (hrzBtn) {
    const hrZones = [
      { name: "Zone 1", pct: "50–60%", low: 0.5, high: 0.6, desc: "Recovery & warm-up" },
      { name: "Zone 2", pct: "60–70%", low: 0.6, high: 0.7, desc: "Aerobic base" },
      { name: "Zone 3", pct: "70–80%", low: 0.7, high: 0.8, desc: "Tempo / steady state" },
      { name: "Zone 4", pct: "80–90%", low: 0.8, high: 0.9, desc: "Lactate threshold" },
      { name: "Zone 5", pct: "90–100%", low: 0.9, high: 1.0, desc: "VO2 max / anaerobic" },
    ];

    const hrzMethod = document.getElementById("hrz-method");
    const hrzRestingGroup = document.getElementById("hrz-resting-group");
    const hrzMaxGroup = document.getElementById("hrz-max-group");
    if (hrzMethod) {
      hrzMethod.addEventListener("change", () => {
        const v = hrzMethod.value;
        hrzRestingGroup.hidden = v !== "karvonen";
        hrzMaxGroup.hidden = v !== "measured";
      });
    }

    hrzBtn.addEventListener("click", () => {
      const age = parseInt(document.getElementById("hrz-age").value, 10);
      const method = document.getElementById("hrz-method").value;
      const resting = parseInt(document.getElementById("hrz-resting").value, 10) || null;

      if (!age || age < 10 || age > 100) return;

      let maxHR;
      if (method === "measured") {
        maxHR = parseInt(document.getElementById("hrz-max").value, 10);
        if (!maxHR) return;
      } else {
        maxHR = 220 - age;
      }

      document.getElementById("hrz-max-display").textContent = maxHR;
      document.getElementById("hrz-zones").innerHTML = hrZones
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
          return `<div class="wod-movement"><span class="wod-movement-name">${z.name} · ${z.desc} <em>(${z.pct})</em></span><span class="wod-movement-reps">${low}–${high} bpm</span></div>`;
        })
        .join("");

      document.getElementById("hrz-placeholder").hidden = true;
      document.getElementById("hrz-results").hidden = false;
    });
  }

  /* ── VO2 Max Calculator ── */
  const vo2Btn = document.getElementById("vo2-calculate");
  if (vo2Btn) {
    const vo2Method = document.getElementById("vo2-method");
    const vo2RaceFields = document.getElementById("vo2-race-fields");
    const vo2CooperFields = document.getElementById("vo2-cooper-fields");
    if (vo2Method) {
      vo2Method.addEventListener("change", () => {
        const isCooper = vo2Method.value === "cooper";
        vo2RaceFields.hidden = isCooper;
        vo2CooperFields.hidden = !isCooper;
      });
    }

    vo2Btn.addEventListener("click", () => {
      let vo2;
      let vdot;
      const method = document.getElementById("vo2-method").value;

      if (method === "cooper") {
        const meters = parseFloat(document.getElementById("vo2-cooper-distance").value);
        if (!meters || meters < 1000) return;
        vo2 = (meters - 504.9) / 44.73;
        vdot = calculateVdot(meters, 12 * 60);
      } else {
        const distance = parseFloat(document.getElementById("vo2-distance").value);
        const totalSeconds = parseTime("vo2-hours", "vo2-minutes", "vo2-seconds");
        if (!distance || totalSeconds <= 0) return;
        const velocity = (distance * 1000) / (totalSeconds / 60);
        vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
        vdot = calculateVdot(distance * 1000, totalSeconds);
      }

      vo2 = Math.round(vo2 * 10) / 10;
      vdot = Math.round(vdot);
      const rating = getVo2Rating(vo2);

      document.getElementById("vo2-value").textContent = vo2;
      document.getElementById("vo2-rating").textContent = rating.label;
      document.getElementById("vdot-value").textContent = vdot;
      document.getElementById("vo2-details").innerHTML = VO2_LEVELS.map((level, index) => {
        const active = rating.index === index ? " compare-benchmark--active" : "";
        return `<div class="compare-benchmark${active}">
          <span class="compare-benchmark-range">${level.range}</span>
          <div class="compare-benchmark-body">
            <strong>${level.label}</strong>
            <span>${level.desc}</span>
          </div>
        </div>`;
      }).join("");

      const insightEl = document.getElementById("vo2-insight");
      if (insightEl) {
        insightEl.innerHTML = `<strong class="info-box__title">Expert Insight</strong>
          <p class="info-box__body">${getVo2Insight(vo2, vdot, rating)}</p>`;
        insightEl.hidden = false;
      }

      document.getElementById("vo2-placeholder").hidden = true;
      document.getElementById("vo2-results").hidden = false;
    });

    const VO2_LEVELS = [
      { range: "<35", label: "Running Beginner", desc: "Building basic aerobic fitness" },
      { range: "35–44.9", label: "Recreational Runner", desc: "Solid fitness for casual running" },
      { range: "45–54.9", label: "Running Enthusiast", desc: "Strong aerobic fitness for regular runners" },
      { range: "55+", label: "Competitive / Athlete Level", desc: "High performance endurance level" },
    ];

    function calculateVdot(distanceMeters, timeSeconds) {
      const velocity = distanceMeters / (timeSeconds / 60);
      const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
      const timeMinutes = timeSeconds / 60;
      const percentMax =
        0.8 +
        0.1894393 * Math.exp(-0.012778 * timeMinutes) +
        0.2989558 * Math.exp(-0.1932605 * timeMinutes);
      return vo2 / percentMax;
    }

    function getVo2Rating(vo2) {
      if (vo2 >= 55) return { label: "Competitive / Athlete Level", index: 3 };
      if (vo2 >= 45) return { label: "Running Enthusiast", index: 2 };
      if (vo2 >= 35) return { label: "Recreational Runner", index: 1 };
      return { label: "Running Beginner", index: 0 };
    }

    function getVo2Insight(vo2, vdot, rating) {
      if (rating.index === 3) {
        return `Your VO2 max of ${vo2} and VDOT of ${vdot} suggest strong aerobic capacity. Focus on race-specific workouts and recovery quality rather than adding more easy volume.`;
      }
      if (rating.index === 2) {
        return `At VO2 ${vo2} (VDOT ${vdot}), you have solid fitness for structured training. Tempo and threshold work will move race times more than extra Zone 2 alone.`;
      }
      if (rating.index === 1) {
        return `VO2 ${vo2} with VDOT ${vdot} is a typical recreational range. Consistent easy mileage and one weekly quality session usually produce the fastest gains from here.`;
      }
      return `VO2 ${vo2} and VDOT ${vdot} indicate you are building your aerobic base. Prioritize regular easy runs and gradual weekly volume before adding hard intervals.`;
    }
  }

  /* ── Running Calories Calculator ── */
  const calBtn = document.getElementById("cal-calculate");
  if (calBtn) {
    calBtn.addEventListener("click", () => {
      const weight = parseFloat(document.getElementById("cal-weight").value);
      const distance = parseFloat(document.getElementById("cal-distance").value);
      const paceMin = parseInt(document.getElementById("cal-pace-min").value, 10) || 0;
      const paceSec = parseInt(document.getElementById("cal-pace-sec").value, 10) || 0;

      if (!weight || !distance || distance <= 0) return;

      const paceSeconds = paceMin * 60 + paceSec;
      if (paceSeconds <= 0) return;

      const speedKmh = 3600 / paceSeconds;
      const met = runningMetFromSpeed(speedKmh);
      const durationHours = (paceSeconds * distance) / 3600;
      const totalCal = Math.round(met * weight * durationHours);
      const perKm = Math.round(totalCal / distance);

      document.getElementById("cal-total").textContent = totalCal;
      document.getElementById("cal-per-km").textContent = perKm;
      document.getElementById("cal-duration").textContent = formatDuration(paceSeconds * distance);
      document.getElementById("cal-met").textContent = met.toFixed(1);

      const breakdownEl = document.getElementById("cal-breakdown");
      if (breakdownEl) {
        breakdownEl.innerHTML = renderCalBreakdown(distance, perKm);
      }

      document.getElementById("cal-placeholder").hidden = true;
      document.getElementById("cal-results").hidden = false;
    });

    function runningMetFromSpeed(speedKmh) {
      if (speedKmh < 6.4) return 6.0;
      if (speedKmh < 8.0) return 8.3;
      if (speedKmh < 9.7) return 9.8;
      if (speedKmh < 11.3) return 11.0;
      if (speedKmh < 12.9) return 11.5;
      if (speedKmh < 14.5) return 12.8;
      return 14.5;
    }
  }

  /* ── Zone 2 Calculator ── */
  const zone2Form = document.getElementById("zone2-form");
  if (zone2Form) {
    const zone2Method = document.getElementById("zone2-method");
    const zone2AgeGroup = document.getElementById("zone2-age-group");
    const zone2MaxGroup = document.getElementById("zone2-max-group");
    const zone2RestingGroup = document.getElementById("zone2-resting-group");
    const zone2LthrGroup = document.getElementById("zone2-lthr-group");

    function updateZone2Fields() {
      const method = zone2Method.value;
      zone2AgeGroup.hidden = method === "maxhr" || method === "lthr";
      zone2MaxGroup.hidden = method !== "maxhr";
      zone2RestingGroup.hidden = method !== "karvonen";
      zone2LthrGroup.hidden = method !== "lthr";
    }

    if (zone2Method) {
      zone2Method.addEventListener("change", updateZone2Fields);
      updateZone2Fields();
    }

    zone2Form.addEventListener("submit", (e) => {
      e.preventDefault();
      const method = zone2Method.value;
      const age = parseInt(document.getElementById("zone2-age").value, 10);
      const maxHRInput = parseInt(document.getElementById("zone2-max").value, 10);
      const resting = parseInt(document.getElementById("zone2-resting").value, 10);
      const lthr = parseInt(document.getElementById("zone2-lthr").value, 10);

      let zone2Low, zone2High, explanation, gaugeMax;

      if (method === "lthr") {
        if (!lthr || lthr < 100 || lthr > 210) return;
        zone2Low = Math.round(lthr * 0.85);
        zone2High = Math.round(lthr * 0.89);
        gaugeMax = Math.max(zone2High + 40, Math.round(lthr * 1.05));
        explanation =
          "Based on 85–89% of your lactate threshold heart rate — the standard zone 2 range for runners using LTHR.";
      } else if (method === "maxhr") {
        if (!maxHRInput || maxHRInput < 100 || maxHRInput > 220) return;
        zone2Low = Math.round(maxHRInput * 0.6);
        zone2High = Math.round(maxHRInput * 0.7);
        gaugeMax = maxHRInput;
        explanation =
          "Based on 60–70% of your measured max heart rate — a simple percentage method for aerobic base training.";
      } else if (method === "karvonen") {
        if (!age || age < 10 || age > 100 || !resting || resting < 30 || resting > 120) return;
        const maxHR = 220 - age;
        if (maxHR <= resting) return;
        const reserve = maxHR - resting;
        zone2Low = Math.round(reserve * 0.6 + resting);
        zone2High = Math.round(reserve * 0.7 + resting);
        gaugeMax = maxHR;
        explanation =
          "Based on 60–70% of heart rate reserve (Karvonen) using estimated max HR (220 − age) and your resting HR.";
      } else {
        if (!age || age < 10 || age > 100) return;
        const maxHR = 220 - age;
        zone2Low = Math.round(maxHR * 0.6);
        zone2High = Math.round(maxHR * 0.7);
        gaugeMax = maxHR;
        explanation =
          "Based on 60–70% of estimated max heart rate (220 − age) — the most common starting point for zone 2 training.";
      }

      document.getElementById("zone2-low").textContent = zone2Low;
      document.getElementById("zone2-high").textContent = zone2High;
      document.getElementById("zone2-explanation").textContent = explanation;
      updateZone2Gauge(zone2Low, zone2High, gaugeMax);

      const zone2Insight = document.getElementById("zone2-insight");
      if (zone2Insight) {
        const methodTips = {
          lthr: "LTHR-based Zone 2 usually tracks conversational easy runs better than age formulas. If breathing feels labored, drop 2–3 bpm.",
          maxhr: "Percentage-of-max methods are a starting point. Validate with a 45-minute easy run and adjust if drift or decoupling is high.",
          karvonen: "Karvonen accounts for resting HR, which helps fit athletes with lower resting rates. Recheck after fitness changes.",
          age: "Age-based estimates are the simplest baseline. Upgrade to LTHR or Karvonen once you have threshold or resting HR data.",
        };
        zone2Insight.innerHTML = `<strong class="info-box__title">Expert Insight</strong>
          <p class="info-box__body">${methodTips[method] || methodTips.age}</p>`;
        zone2Insight.hidden = false;
      }
      document.getElementById("zone2-placeholder").hidden = true;
      document.getElementById("zone2-results").hidden = false;
    });
  }

  /* ── HR Zones Calculator ── */
  const hrzonesBtn = document.getElementById("hrzones-calculate");
  if (hrzonesBtn) {
    const HR_ZONE_DEFS = [
      { name: "Zone 1", label: "Recovery" },
      { name: "Zone 2", label: "Aerobic Base" },
      { name: "Zone 3", label: "Tempo" },
      { name: "Zone 4", label: "Threshold" },
      { name: "Zone 5", label: "VO2 Max" },
    ];

    const MAXHR_PCTS = [
      { low: 0.5, high: 0.6 },
      { low: 0.6, high: 0.7 },
      { low: 0.7, high: 0.8 },
      { low: 0.8, high: 0.9 },
      { low: 0.9, high: 1.0 },
    ];

    const LTHR_PCTS = [
      { low: 0.65, high: 0.84 },
      { low: 0.85, high: 0.89 },
      { low: 0.9, high: 0.94 },
      { low: 0.95, high: 0.99 },
      { low: 1.0, high: null },
    ];

    const hrzonesMethod = document.getElementById("hrzones-method");
    const hrzonesAgeGroup = document.getElementById("hrzones-age-group");
    const hrzonesMaxGroup = document.getElementById("hrzones-max-group");
    const hrzonesRestingGroup = document.getElementById("hrzones-resting-group");
    const hrzonesLthrGroup = document.getElementById("hrzones-lthr-group");
    const hrzonesMaxOptional = document.getElementById("hrzones-max-optional");

    function updateHrzonesFields() {
      const method = hrzonesMethod.value;
      hrzonesAgeGroup.hidden = method === "lthr";
      hrzonesMaxGroup.hidden = method === "lthr";
      hrzonesRestingGroup.hidden = method !== "karvonen";
      hrzonesLthrGroup.hidden = method !== "lthr";
      if (hrzonesMaxOptional) {
        hrzonesMaxOptional.textContent = method === "karvonen" ? "(optional)" : "";
      }
    }

    function resolveMaxHR(age, maxHRInput) {
      if (maxHRInput && maxHRInput >= 100 && maxHRInput <= 220) return maxHRInput;
      if (age && age >= 10 && age <= 100) return 220 - age;
      return null;
    }

    let HR_ZONE_RANGES = [];

    function formatZoneRange(low, high) {
      return high === null ? `${low}+` : `${low}–${high}`;
    }

    function buildZones(method, maxHR, resting, lthr) {
      if (method === "lthr") {
        HR_ZONE_RANGES = LTHR_PCTS.map((pct) => ({
          low: Math.round(lthr * pct.low),
          high: pct.high === null ? null : Math.round(lthr * pct.high),
        }));
        for (let i = 1; i < HR_ZONE_RANGES.length; i++) {
          if (HR_ZONE_RANGES[i].low <= HR_ZONE_RANGES[i - 1].high) {
            HR_ZONE_RANGES[i].low = HR_ZONE_RANGES[i - 1].high + 1;
          }
        }
        return {
          summary: `LTHR: ${lthr} bpm · Joe Friel running zones`,
          zones: HR_ZONE_RANGES,
        };
      }

      if (method === "karvonen") {
        const reserve = maxHR - resting;
        HR_ZONE_RANGES = MAXHR_PCTS.map((pct, index) => {
          let low = Math.round(reserve * pct.low + resting);
          let high = Math.round(reserve * pct.high + resting);
          if (index > 0 && low <= HR_ZONE_RANGES[index - 1].high) {
            low = HR_ZONE_RANGES[index - 1].high + 1;
          }
          if (index === MAXHR_PCTS.length - 1) high = null;
          return { low, high };
        });
        return {
          summary: `Max HR: ${maxHR} bpm · Resting HR: ${resting} bpm · Karvonen method`,
          zones: HR_ZONE_RANGES,
        };
      }

      HR_ZONE_RANGES = MAXHR_PCTS.map((pct, index) => {
        let low = Math.round(maxHR * pct.low);
        let high = index === MAXHR_PCTS.length - 1 ? null : Math.round(maxHR * pct.high);
        if (index > 0 && low <= HR_ZONE_RANGES[index - 1].high) {
          low = HR_ZONE_RANGES[index - 1].high + 1;
        }
        return { low, high };
      });
      return {
        summary: `Max HR: ${maxHR} bpm · Percentage of max heart rate`,
        zones: HR_ZONE_RANGES,
      };
    }

    if (hrzonesMethod) {
      hrzonesMethod.addEventListener("change", updateHrzonesFields);
      updateHrzonesFields();
    }

    hrzonesBtn.addEventListener("click", () => {
      const method = hrzonesMethod.value;
      const age = parseInt(document.getElementById("hrzones-age").value, 10);
      const maxHRInput = parseInt(document.getElementById("hrzones-max").value, 10);
      const resting = parseInt(document.getElementById("hrzones-resting").value, 10);
      const lthr = parseInt(document.getElementById("hrzones-lthr").value, 10);

      let result;

      if (method === "lthr") {
        if (!lthr || lthr < 100 || lthr > 210) return;
        result = buildZones("lthr", null, null, lthr);
      } else if (method === "karvonen") {
        if (!resting || resting < 30 || resting > 120) return;
        const maxHR = resolveMaxHR(age, maxHRInput);
        if (!maxHR || maxHR <= resting) return;
        result = buildZones("karvonen", maxHR, resting, null);
      } else {
        const maxHR = resolveMaxHR(age, maxHRInput);
        if (!maxHR) return;
        result = buildZones("maxhr", maxHR, null, null);
      }

      document.getElementById("hrzones-method-label").textContent = result.summary;
      document.getElementById("hrzones-grid").innerHTML = renderHrZoneBars(
        HR_ZONE_DEFS,
        result.zones,
        formatZoneRange
      );

      const hrInsight = document.getElementById("hrzones-insight");
      if (hrInsight) {
        const z2 = result.zones[1];
        hrInsight.innerHTML = `<strong class="info-box__title">Expert Insight</strong>
          <p class="info-box__body">Zone 2 (${formatZoneRange(z2.low, z2.high)} bpm) is highlighted because it drives most aerobic gains. Spend 70–80% of weekly training time at or below Zone 2 for base building.</p>`;
        hrInsight.hidden = false;
      }

      document.getElementById("hrzones-placeholder").hidden = true;
      document.getElementById("hrzones-results").hidden = false;
    });
  }

  /* ── WOD Generator ── */
  const wodForm = document.getElementById("wod-form");
  if (wodForm) {
    /* Each movement has one primary pattern to avoid duplicates (e.g. one squat, one cardio). */
    const movementCatalog = [
      { name: "Push-ups", pattern: "push", equipment: "bodyweight" },
      { name: "Air Squats", pattern: "squat", equipment: "bodyweight" },
      { name: "Burpees", pattern: "push", equipment: "bodyweight" },
      { name: "Sit-ups", pattern: "core", equipment: "bodyweight" },
      { name: "Lunges", pattern: "squat", equipment: "bodyweight" },
      { name: "Mountain Climbers", pattern: "core", equipment: "bodyweight" },
      { name: "Box Jumps", pattern: "squat", equipment: "bodyweight" },
      { name: "Pull-ups", pattern: "pull", equipment: "bodyweight" },

      { name: "Deadlifts", pattern: "hinge", equipment: "barbell" },
      { name: "Back Squats", pattern: "squat", equipment: "barbell" },
      { name: "Front Squats", pattern: "squat", equipment: "barbell" },
      { name: "Power Cleans", pattern: "hinge", equipment: "barbell" },
      { name: "Push Press", pattern: "push", equipment: "barbell" },
      { name: "Thrusters", pattern: "squat", equipment: "barbell" },
      { name: "Hang Cleans", pattern: "hinge", equipment: "barbell" },

      { name: "DB Snatches", pattern: "hinge", equipment: "dumbbell" },
      { name: "DB Thrusters", pattern: "squat", equipment: "dumbbell" },
      { name: "DB Swings", pattern: "hinge", equipment: "dumbbell" },
      { name: "DB Lunges", pattern: "squat", equipment: "dumbbell" },
      { name: "DB Push Press", pattern: "push", equipment: "dumbbell" },
      { name: "Devil Press", pattern: "hinge", equipment: "dumbbell" },

      { name: "Row (cal)", pattern: "cardio", equipment: "cardio", cardioGroup: "erg" },
      { name: "Assault Bike (cal)", pattern: "cardio", equipment: "cardio", cardioGroup: "erg" },
      { name: "Run (m)", pattern: "cardio", equipment: "cardio", cardioGroup: "run" },
      { name: "Double Unders", pattern: "cardio", equipment: "cardio", cardioGroup: "jumprope" },
      { name: "Single Unders", pattern: "cardio", equipment: "cardio", cardioGroup: "jumprope" },
      { name: "Ski Erg (cal)", pattern: "cardio", equipment: "cardio", cardioGroup: "erg" },

      { name: "KB Swings", pattern: "hinge", equipment: "kettlebell" },
      { name: "KB Goblet Squats", pattern: "squat", equipment: "kettlebell" },
      { name: "KB Clean & Press", pattern: "push", equipment: "kettlebell" },
      { name: "KB Snatches", pattern: "hinge", equipment: "kettlebell" },
    ];

    const PATTERNS = ["cardio", "squat", "hinge", "push", "pull", "core"];

    const wodTargets = {
      amrap: {
        rx: "4–6 rounds",
        scaled: "3–5 rounds",
        beginner: "2–4 rounds",
        note: "Aim for steady rounds. Avoid redlining in the first few minutes.",
      },
      fortime: {
        rx: "8–12 minutes",
        scaled: "10–15 minutes",
        beginner: "12–18 minutes",
        note: "Choose a load that lets you keep moving with short breaks.",
      },
      emom: {
        rx: "Finish each minute with 10–20 seconds rest",
        scaled: "Finish each minute with 15–25 seconds rest",
        beginner: "Finish each minute with 20–30 seconds rest",
        note: "If you cannot finish the work inside the minute, reduce reps or load.",
      },
      chipper: {
        rx: "15–20 minutes",
        scaled: "18–25 minutes",
        beginner: "20–30 minutes",
        note: "Break reps early and keep transitions short.",
      },
    };

    const weightGuide = {
      Deadlifts: { rx: "225/155 lb", scaled: "155/105 lb", beginner: "95/65 lb" },
      "Back Squats": { rx: "135/95 lb", scaled: "95/65 lb", beginner: "65/45 lb" },
      "Front Squats": { rx: "135/95 lb", scaled: "95/65 lb", beginner: "65/45 lb" },
      "Power Cleans": { rx: "135/95 lb", scaled: "95/65 lb", beginner: "65/45 lb" },
      "Push Press": { rx: "95/65 lb", scaled: "65/45 lb", beginner: "45/35 lb" },
      Thrusters: { rx: "95/65 lb", scaled: "65/45 lb", beginner: "45/35 lb" },
      "Hang Cleans": { rx: "135/95 lb", scaled: "95/65 lb", beginner: "65/45 lb" },

      "DB Snatches": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },
      "DB Thrusters": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },
      "DB Swings": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },
      "DB Lunges": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },
      "DB Push Press": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },
      "Devil Press": { rx: "50/35 lb", scaled: "35/20 lb", beginner: "20/10 lb" },

      "KB Swings": { rx: "53/35 lb", scaled: "35/26 lb", beginner: "26/18 lb" },
      "KB Goblet Squats": { rx: "53/35 lb", scaled: "35/26 lb", beginner: "26/18 lb" },
      "KB Clean & Press": { rx: "53/35 lb", scaled: "35/26 lb", beginner: "26/18 lb" },
      "KB Snatches": { rx: "53/35 lb", scaled: "35/26 lb", beginner: "26/18 lb" },

      "Pull-ups": { rx: "Pull-ups", scaled: "Ring Rows", beginner: "Band Pull-ups" },
      "Double Unders": { rx: "Double Unders", scaled: "Single Unders x2", beginner: "Single Unders" },
    };

    const formats = {
      amrap: (time, list) => `${time}-Minute AMRAP\n\n${list.map(formatMovementLine).join("\n")}`,
      fortime: (time, list) => `${list.length} Rounds For Time\n\n${list.map(formatMovementLine).join("\n")}`,
      emom: (time, list) => `EMOM ${time}\n\n${list.map((m, i) => "Min " + (i + 1) + ": " + formatMovementLine(m)).join("\n")}`,
      chipper: (time, list) => `Chipper\n\n${list.map(formatMovementLine).join("\n")}`,
    };

    document.getElementById("wod-generate").addEventListener("click", () => {
      const format = document.getElementById("wod-format").value;
      const difficulty = document.getElementById("wod-difficulty")?.value || "rx";
      const duration = parseInt(document.getElementById("wod-duration").value, 10) || 12;
      const numMovements = parseInt(document.getElementById("wod-movements-count").value, 10) || 4;
      const checked = [...document.querySelectorAll('input[name="wod-equipment"]:checked')].map((el) => el.value);

      if (checked.length === 0) return;

      const pool = movementCatalog.filter((m) => checked.includes(m.equipment));
      const isCardioOnly = checked.length === 1 && checked[0] === "cardio";
      const selected = isCardioOnly
        ? selectCardioOnlyMovements(pool, numMovements)
        : selectBalancedMovements(pool, numMovements);

      if (selected.length === 0) return;

      const wodMovements = selected.map((m) => ({
        name: m.name,
        reps: randomReps(m.name, format),
        guide: getMovementGuide(m.name, difficulty),
      }));

      const target = wodTargets[format];

      const text =
        `${difficulty.toUpperCase()} VERSION\n\n` +
        formats[format](duration, wodMovements) +
        `\n\nTarget Score\n${target[difficulty]}` +
        `\n\nPacing Guide\n${target.note}`;

      document.getElementById("wod-output-text").textContent = text;

      const listEl = document.getElementById("wod-movement-list");
      listEl.innerHTML = `
        <h3>Movement Guide</h3>
        ${wodMovements
          .map(
            (m) => `
            <div class="wod-movement">
              <span class="wod-movement-name">${m.name}${m.guide ? ` <em>(${m.guide})</em>` : ""}</span>
              <span class="wod-movement-reps">${m.reps}</span>
            </div>
          `
          )
          .join("")}
        <p class="note">Weights are general references. Adjust based on strength, skill, and safety.</p>
      `;

      document.getElementById("wod-placeholder").hidden = true;
      document.getElementById("wod-results").hidden = false;
    });

    function selectCardioOnlyMovements(pool, count) {
      const CARDIO_MIN = 3;
      const filtered = filterJumpRopeConflict(pool);
      const maxAvailable = filtered.length;
      if (maxAvailable === 0) return [];

      const pickCount = Math.min(Math.max(count, Math.min(CARDIO_MIN, maxAvailable)), maxAvailable);

      const byGroup = { erg: [], run: [], jumprope: [] };
      filtered.forEach((m) => {
        (byGroup[m.cardioGroup] || byGroup.erg).push(m);
      });

      const selected = [];
      const usedNames = new Set();

      for (const group of shuffle(["erg", "run", "jumprope"])) {
        if (selected.length >= pickCount || !byGroup[group].length) continue;
        const pick = randPick(byGroup[group]);
        selected.push(pick);
        usedNames.add(pick.name);
      }

      for (const m of shuffle(filtered)) {
        if (selected.length >= pickCount) break;
        if (usedNames.has(m.name)) continue;
        selected.push(m);
        usedNames.add(m.name);
      }

      return shuffle(selected);
    }

    function filterJumpRopeConflict(pool) {
      const hasDU = pool.some((m) => m.name === "Double Unders");
      const hasSU = pool.some((m) => m.name === "Single Unders");
      if (!hasDU || !hasSU) return pool;
      const drop = randPick(["Double Unders", "Single Unders"]);
      return pool.filter((m) => m.name !== drop);
    }

    function selectBalancedMovements(pool, count) {
      const byPattern = {};
      pool.forEach((m) => {
        if (!byPattern[m.pattern]) byPattern[m.pattern] = [];
        byPattern[m.pattern].push(m);
      });

      const availablePatterns = PATTERNS.filter((p) => byPattern[p]?.length);
      const selected = [];
      const usedPatterns = new Set();

      /* Prefer a balanced mix: one movement per pattern, max one cardio. */
      const priority = buildPatternPriority(availablePatterns, count);
      for (const pattern of priority) {
        if (selected.length >= count) break;
        if (usedPatterns.has(pattern)) continue;
        selected.push(randPick(byPattern[pattern]));
        usedPatterns.add(pattern);
      }

      return shuffle(selected);
    }

    function buildPatternPriority(available, count) {
      /* Anchor with cardio when available, then fill complementary patterns. */
      const hasCardio = available.includes("cardio");
      const nonCardio = shuffle(available.filter((p) => p !== "cardio"));
      const anchors = [];

      if (hasCardio && count >= 2) anchors.push("cardio");
      if (nonCardio.includes("pull")) anchors.push("pull");
      if (nonCardio.includes("push")) anchors.push("push");

      const lower = shuffle(["squat", "hinge"].filter((p) => nonCardio.includes(p)));
      const rest = shuffle(
        nonCardio.filter((p) => !anchors.includes(p) && !lower.includes(p))
      );

      const ordered = [...anchors, ...lower, ...rest];
      const seen = new Set();
      return ordered.filter((p) => {
        if (seen.has(p)) return false;
        seen.add(p);
        return true;
      });
    }

    function getMovementGuide(name, difficulty) {
      return weightGuide[name]?.[difficulty] || "";
    }

    function formatMovementLine(m) {
      return `${m.reps} ${m.name}${m.guide ? ` (${m.guide})` : ""}`;
    }
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