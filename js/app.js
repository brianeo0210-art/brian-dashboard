/* ==========================================================================
   My Life Dashboard — app logic
   Vanilla JS, no build step, no dependencies. All data lives in localStorage
   on this device/browser (per-install, no server, no account).
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Storage helpers
     ------------------------------------------------------------------- */
  const STORE_KEY = "lifeDashboard.v3";
  const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const MEAL_SLOTS = [
    { key: "breakfast", label: "Breakfast" },
    { key: "snack1", label: "Snack 1" },
    { key: "lunch", label: "Lunch" },
    { key: "snack2", label: "Snack 2" },
    { key: "dinner", label: "Dinner" },
    { key: "nightSnack", label: "Night snack" }
  ];
  const BUDGET_CATEGORIES = [
    { key: "income", label: "Income" },
    { key: "fixedExpenses", label: "Fixed expenses" },
    { key: "variableExpenses", label: "Variable expenses" },
    { key: "funSpending", label: "Fun spending" },
    { key: "charitableDonations", label: "Charitable donations" },
    { key: "savingsAllocations", label: "Savings accounts" }
  ];
  const OUTFLOW_CATEGORIES = ["fixedExpenses", "variableExpenses", "funSpending", "charitableDonations", "savingsAllocations"];

  // seed set for the Luxio Ads "To do" checklist, pulled from the
  // Road to $10K timeline — work items plus the paired content/post items
  // (marked with 📱), stripped of dates/phase tags, in chronological order
  const ROAD_TO_10K_TASKS = [
    "Confirm LLC details, finalize pricing packages for locations & advertisers.",
    '📱 Post mission announcement — "Road to $10K, launching Nov 1."',
    "Logo, social profiles, bios, highlight covers.",
    "📱 Setup Log #2 — brand reveal.",
    "Prep equipment, build location pitch deck and advertiser media kit.",
    "📱 Setup Log #3 — gear + pitch deck sneak peek.",
    "List 20-30 target locations, script the walk-in pitch, test Meta Glasses/GoPro footage.",
    '📱 "Here\'s the pitch" prep video.',
    "Begin daily walk-in pitching at target locations.",
    "📱 POV pitch clips, 3-4x this week — wins and rejections both.",
    "Keep pitching, push for your first signed locations.",
    '📱 "Location #1 signed" milestone post the moment it happens.',
    "Keep pitching, install product at any signed spots.",
    '📱 Weekly "X/10 locations" recap graphic.',
    "Keep the pitch pipeline moving toward 10 locations.",
    "📱 POV pitch clips + behind-the-scenes installs.",
    "Close out remaining location slots before shifting focus.",
    '📱 "X/10 locations" recap — set up the advertiser phase.',
    "List 20-30 target advertisers, build media kit using real location numbers, script the pitch.",
    "📱 Advertiser pitch prep video.",
    "Begin calls/emails/in-person pitches to advertisers.",
    '📱 Pitch POV clips + "X days until launch" hype posts.',
    "Close remaining advertiser contracts before Nov 1.",
    "📱 Countdown hype posts + any signed-contract milestones.",
    "Go live. Lock in your starting numbers: locations, advertisers, MRR.",
    '📱 "Day 1" post — recap the journey + starting numbers.',
    "Keep pitching advertisers, keep locations running, log revenue as it lands.",
    '📱 Daily "Day N" post — locations / advertisers / MRR. Weekly recap video. Mix in the honest no-progress days too. Keep going until $10K.'
  ];

  // vehicle maintenance task frequency options (mileage-based) — declared
  // early since the load-time migration block below needs it
  const VEHICLE_FREQUENCIES = [
    { key: "5000", label: "5,000 miles", miles: 5000 },
    { key: "10000", label: "10,000 miles", miles: 10000 },
    { key: "15000", label: "15,000 miles", miles: 15000 },
    { key: "30000", label: "30,000 miles", miles: 30000 }
  ];
  const VEHICLE_FREQUENCY_KEYS = VEHICLE_FREQUENCIES.map(f => f.key);

  function defaultHealth() {
    const workouts = {};
    WEEKDAYS.forEach(d => { workouts[d] = []; });
    const meals = {};
    MEAL_SLOTS.forEach(s => { meals[s.key] = { title: "", ingredients: "", protein: null, carbs: null, fiber: null, calories: null }; });
    return { weightGoal: { current: null, target: null }, workouts, meals, activeView: "workout" };
  }

  function defaultFinance() {
    const budget = {};
    BUDGET_CATEGORIES.forEach(c => { budget[c.key] = []; });
    return { activeView: "budget", budget, savingsAccounts: [] };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt data */ }
    return {
      overview: { goals: [] },
      health: defaultHealth(),
      finance: defaultFinance(),
      business: defaultBusiness(),
      maintenance: defaultMaintenance(),
      theme: null
    };
  }

  function defaultMaintenance() {
    return {
      activeView: "home",
      home: { tasks: [] },
      vehicles: []
    };
  }

  function defaultBusiness() {
    return {
      activeView: "todo",
      todos: [],
      prospects: [],
      marketingTasks: [],
      bookEntries: []
    };
  }

  function saveStore() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  const state = loadStore();
  // migrate: ensure shape if an older version is missing a field
  state.overview = state.overview || { goals: [] };
  const dh = defaultHealth();
  state.health = state.health || dh;
  state.health.weightGoal = state.health.weightGoal || dh.weightGoal;
  state.health.workouts = state.health.workouts || dh.workouts;
  WEEKDAYS.forEach(d => { state.health.workouts[d] = state.health.workouts[d] || []; });
  state.health.meals = state.health.meals || dh.meals;
  MEAL_SLOTS.forEach(s => {
    const m = state.health.meals[s.key] || {};
    state.health.meals[s.key] = {
      title: m.title || "",
      ingredients: m.ingredients || "",
      protein: (m.protein === undefined) ? null : m.protein,
      carbs: (m.carbs === undefined) ? null : m.carbs,
      fiber: (m.fiber === undefined) ? null : m.fiber,
      calories: (m.calories === undefined) ? null : m.calories
    };
  });
  state.health.activeView = state.health.activeView || "workout";
  state.finance = state.finance || defaultFinance();
  state.finance.activeView = state.finance.activeView || "budget";
  state.finance.budget = state.finance.budget || {};
  BUDGET_CATEGORIES.forEach(c => { state.finance.budget[c.key] = state.finance.budget[c.key] || []; });
  state.finance.savingsAccounts = state.finance.savingsAccounts || [];
  state.business = state.business || defaultBusiness();
  state.business.activeView = state.business.activeView || "todo";
  state.business.todos = state.business.todos || [];
  state.business.prospects = state.business.prospects || [];
  state.business.marketingTasks = state.business.marketingTasks || [];
  state.business.bookEntries = state.business.bookEntries || [];
  // one-time seed: populate the go-live checklist from the Road to $10K
  // timeline the first time the app loads with an empty list — never
  // re-seeds after that, even if the user clears the list out
  if (!state.business._seededRoadTo10kTodos) {
    if (state.business.todos.length === 0) {
      state.business.todos = ROAD_TO_10K_TASKS.map(text => ({ id: uid(), text, done: false }));
    }
    state.business._seededRoadTo10kTodos = true;
  }
  // one-time migration from the old "revenue goal + clients/leads" shape
  if (state.business.clients && state.business.clients.length && !state.business._migratedClients) {
    const stageMap = { lead: "prospecting", proposal: "outreaching", active: "communications", churned: "undercontract" };
    state.business.clients.forEach(c => {
      const notesParts = [];
      if (c.value) notesParts.push("Deal value: $" + c.value.toLocaleString());
      if (c.followUp) notesParts.push("Follow up: " + c.followUp);
      state.business.prospects.push({
        id: c.id || uid(), name: c.name || "", phone: "", notes: notesParts.join(" · "),
        stage: stageMap[c.stage] || "prospecting"
      });
    });
  }
  state.business._migratedClients = true;
  state.maintenance = state.maintenance || defaultMaintenance();
  state.maintenance.activeView = state.maintenance.activeView || "home";
  state.maintenance.home = state.maintenance.home || { tasks: [] };
  state.maintenance.home.tasks = state.maintenance.home.tasks || [];
  state.maintenance.vehicles = state.maintenance.vehicles || [];
  // one-time migration from the old flat "items" list (home + vehicle mixed
  // together, one-off due dates) into the new home-tasks / per-vehicle shape
  if (state.maintenance.items && state.maintenance.items.length && !state.maintenance._migratedItems) {
    state.maintenance.items.forEach(item => {
      if (item.category === "vehicle") {
        let vehicle = state.maintenance.vehicles.find(v => item.vehicleName && v.name && v.name.toLowerCase() === item.vehicleName.toLowerCase());
        if (!vehicle) {
          vehicle = { id: uid(), name: item.vehicleName || "Vehicle", mileage: null, tasks: [] };
          state.maintenance.vehicles.push(vehicle);
        }
        vehicle.tasks.push({ id: uid(), name: item.name || "", notes: "", frequency: "5000", dueMileage: null });
      } else {
        state.maintenance.home.tasks.push({
          id: uid(), name: item.name || "", notes: "",
          frequency: "3m", lastCompleted: item.lastDone || null, dueDate: item.dueDate || null
        });
      }
    });
  }
  state.maintenance._migratedItems = true;
  // one-time seed: the two vehicles Brian actually owns — only seeds a
  // brand-new install (skipped if migration above already produced vehicles)
  if (!state.maintenance._seededVehicles) {
    if (state.maintenance.vehicles.length === 0) {
      state.maintenance.vehicles = ["Kia", "Type R"].map(name => ({ id: uid(), name, mileage: null, tasks: [] }));
    }
    state.maintenance._seededVehicles = true;
  }
  // which vehicle's detail is currently shown in the Vehicle tab
  if (!state.maintenance.vehicles.find(v => v.id === state.maintenance.activeVehicleId)) {
    state.maintenance.activeVehicleId = state.maintenance.vehicles.length ? state.maintenance.vehicles[0].id : null;
  }
  // one-time migration: vehicle tasks used to have a free-text frequency +
  // a manually-typed "last done at" mileage. Now frequency is a fixed
  // 5k/10k/15k/30k dropdown and completion is a checkbox that computes a
  // due-at mileage automatically — snap old free-text frequencies to the
  // nearest option and drop the old manual mileage field (no reliable way
  // to carry it forward into the new auto-computed model).
  if (!state.maintenance._migratedVehicleTaskFields) {
    state.maintenance.vehicles.forEach(v => {
      v.tasks.forEach(t => {
        if (!VEHICLE_FREQUENCY_KEYS.includes(t.frequency)) {
          const digits = String(t.frequency || "").replace(/[^0-9]/g, "");
          const n = digits ? parseInt(digits, 10) : null;
          let closest = "5000";
          if (n) {
            closest = VEHICLE_FREQUENCIES.reduce((best, f) =>
              Math.abs(f.miles - n) < Math.abs(best.miles - n) ? f : best
            ).key;
          }
          t.frequency = closest;
        }
        delete t.lastDoneMileage;
        if (t.dueMileage === undefined) t.dueMileage = null;
      });
    });
    state.maintenance._migratedVehicleTaskFields = true;
  }

  /* ---------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------- */
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function monthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function fmtMoney(n) {
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1000000) return sign + "$" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return sign + "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return sign + "$" + n.toLocaleString();
  }
  // exact (uncompacted) dollar figure — for budget line totals, where the
  // point is balancing to the cent, not an at-a-glance compacted stat
  function fmtMoneyExact(n) {
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    const hasCents = Math.round(n * 100) % 100 !== 0;
    return sign + "$" + n.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 });
  }
  function fmtCompact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ---------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------- */
  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === "dark") root.setAttribute("data-theme", "dark");
    else if (state.theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");

    const isDark = state.theme === "dark" ||
      (!state.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.getElementById("themeIconSun").style.display = isDark ? "none" : "block";
    document.getElementById("themeIconMoon").style.display = isDark ? "block" : "none";
  }
  document.getElementById("themeToggle").addEventListener("click", () => {
    const isDark = state.theme === "dark" ||
      (!state.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    state.theme = isDark ? "light" : "dark";
    saveStore();
    applyTheme();
    renderAll(); // re-draw charts against new CSS var values
  });

  /* ---------------------------------------------------------------------
     Tab navigation
     ------------------------------------------------------------------- */
  const navBtns = Array.from(document.querySelectorAll(".nav-btn"));
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
  });
  function switchTab(name) {
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.hidden = p.dataset.panel !== name;
    });
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.target === name));
    location.hash = name;
    // auto-grow textareas (goal notes, todo tasks) can't measure scrollHeight
    // while their panel is display:none — once the panel becomes visible,
    // re-run the resize pass so anything sized while hidden catches up
    requestAnimationFrame(() => {
      document.querySelectorAll("#panel-" + name + " .goal-note, #panel-" + name + " .todo-title").forEach(t => {
        t.style.height = "auto";
        t.style.height = t.scrollHeight + "px";
      });
    });
  }
  const TAB_NAMES = ["overview", "health", "finance", "business", "maintenance"];
  window.addEventListener("hashchange", () => {
    const t = location.hash.replace("#", "");
    if (TAB_NAMES.includes(t)) switchTab(t);
  });

  /* ---------------------------------------------------------------------
     Chart drawing — line chart with hairline gridlines, 2px line,
     8px end marker, 10% area wash, hover crosshair + tooltip.
     Per dataviz marks-and-anatomy.md
     ------------------------------------------------------------------- */
  function css(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function drawLineChart(svgEl, points, opts) {
    // points: [{label, value}]
    svgEl.innerHTML = "";
    const wrap = svgEl.closest(".card-body");
    const emptyHint = wrap ? wrap.querySelector(".empty-hint") : null;
    if (!points || points.length === 0) {
      svgEl.style.display = "none";
      if (emptyHint) emptyHint.style.display = "block";
      return;
    }
    svgEl.style.display = "block";
    if (emptyHint) emptyHint.style.display = "none";

    const vb = svgEl.viewBox.baseVal;
    const W = vb.width || 320, H = vb.height || 120;
    const padL = 4, padR = 4, padT = 20, padB = 18;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const values = points.map(p => p.value);
    let min = Math.min(...values), max = Math.max(...values);
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;

    const x = i => padL + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
    const y = v => padT + innerH - ((v - min) / range) * innerH;

    const seriesColor = opts.color || css("--series-1");

    // gridlines (2 hairlines: top/baseline)
    const gl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gl.setAttribute("x1", padL); gl.setAttribute("x2", W - padR);
    gl.setAttribute("y1", padT + innerH); gl.setAttribute("y2", padT + innerH);
    gl.setAttribute("stroke", css("--baseline"));
    gl.setAttribute("stroke-width", "1");
    svgEl.appendChild(gl);

    // area wash
    if (points.length > 1) {
      let d = `M ${x(0)} ${y(values[0])}`;
      points.forEach((p, i) => { if (i > 0) d += ` L ${x(i)} ${y(p.value)}`; });
      d += ` L ${x(points.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
      const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
      area.setAttribute("d", d);
      area.setAttribute("fill", seriesColor);
      area.setAttribute("opacity", "0.1");
      svgEl.appendChild(area);
    }

    // line
    if (points.length > 1) {
      let d = `M ${x(0)} ${y(values[0])}`;
      points.forEach((p, i) => { if (i > 0) d += ` L ${x(i)} ${y(p.value)}`; });
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", d);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", seriesColor);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linejoin", "round");
      line.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(line);
    }

    // end marker (8px, ring in surface color)
    const lastIdx = points.length - 1;
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", x(lastIdx)); ring.setAttribute("cy", y(values[lastIdx]));
    ring.setAttribute("r", 6);
    ring.setAttribute("fill", css("--surface-card"));
    svgEl.appendChild(ring);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x(lastIdx)); dot.setAttribute("cy", y(values[lastIdx]));
    dot.setAttribute("r", 4);
    dot.setAttribute("fill", seriesColor);
    svgEl.appendChild(dot);

    // end label (value)
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", clamp(x(lastIdx), padL, W - padR - 2));
    label.setAttribute("y", clamp(y(values[lastIdx]) - 10, 10, H));
    label.setAttribute("text-anchor", x(lastIdx) > W - 40 ? "end" : "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", css("--text-primary"));
    label.textContent = opts.formatValue ? opts.formatValue(values[lastIdx]) : values[lastIdx];
    svgEl.appendChild(label);

    // x-axis first/last date labels
    [0, lastIdx].forEach((i, idx) => {
      if (points.length < 2 && idx === 0) return;
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", idx === 0 ? padL : W - padR);
      t.setAttribute("y", H - 4);
      t.setAttribute("text-anchor", idx === 0 ? "start" : "end");
      t.setAttribute("font-size", "10");
      t.setAttribute("fill", css("--text-muted"));
      t.textContent = points[i].label;
      svgEl.appendChild(t);
    });

    // hover crosshair + tooltip
    let tooltip = wrap ? wrap.querySelector(".chart-tooltip") : null;
    if (wrap && !tooltip) {
      wrap.style.position = "relative";
      wrap.classList.add("chart-wrap");
      tooltip = el("div", "chart-tooltip");
      wrap.appendChild(tooltip);
    }
    const hoverLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hoverLine.setAttribute("y1", padT); hoverLine.setAttribute("y2", padT + innerH);
    hoverLine.setAttribute("stroke", css("--text-muted"));
    hoverLine.setAttribute("stroke-width", "1");
    hoverLine.setAttribute("opacity", "0");
    svgEl.appendChild(hoverLine);

    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hitArea.setAttribute("x", 0); hitArea.setAttribute("y", 0);
    hitArea.setAttribute("width", W); hitArea.setAttribute("height", H);
    hitArea.setAttribute("fill", "transparent");
    svgEl.appendChild(hitArea);

    function onMove(evt) {
      const rect = svgEl.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const relX = ((clientX - rect.left) / rect.width) * W;
      let idx = 0, best = Infinity;
      points.forEach((p, i) => { const d = Math.abs(x(i) - relX); if (d < best) { best = d; idx = i; } });
      hoverLine.setAttribute("x1", x(idx)); hoverLine.setAttribute("x2", x(idx));
      hoverLine.setAttribute("opacity", "1");
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.left = ((x(idx) / W) * 100) + "%";
        tooltip.style.top = ((y(points[idx].value) / H) * 100) + "%";
        tooltip.textContent = `${points[idx].label}: ${opts.formatValue ? opts.formatValue(points[idx].value) : points[idx].value}`;
      }
    }
    function onLeave() {
      hoverLine.setAttribute("opacity", "0");
      if (tooltip) tooltip.style.opacity = "0";
    }
    hitArea.addEventListener("mousemove", onMove);
    hitArea.addEventListener("mouseleave", onLeave);
    hitArea.addEventListener("touchmove", onMove, { passive: true });
    hitArea.addEventListener("touchend", onLeave);
  }

  /* ---------------------------------------------------------------------
     Stat tile builder
     ------------------------------------------------------------------- */
  function statTile(label, value, delta, deltaGood) {
    const tile = el("div", "stat-tile");
    tile.appendChild(el("p", "stat-label", label));
    tile.appendChild(el("p", "stat-value", value));
    if (delta !== undefined && delta !== null) {
      const cls = (delta === 0 || deltaGood === null) ? "neutral" : (deltaGood ? "up-good" : "down-bad");
      const sign = delta > 0 ? "+" : "";
      tile.appendChild(el("p", "stat-delta " + cls, sign + delta));
    }
    return tile;
  }

  /* =======================================================================
     OVERVIEW / GOALS
     ======================================================================= */
  function renderOverview() {
    const goals = state.overview.goals;
    const list = document.getElementById("goalList");
    const empty = document.getElementById("goalEmpty");
    list.innerHTML = "";
    empty.style.display = goals.length ? "none" : "block";

    // a timeline is chronological by nature — sort strictly by target date.
    // undated goals sink to the end (no date to place them on the line);
    // pinning only breaks ties within the same date/undated group.
    const sorted = goals.slice().sort((a, b) => {
      const ad = a.targetDate || "9999-12-31";
      const bd = b.targetDate || "9999-12-31";
      if (ad !== bd) return ad.localeCompare(bd);
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    });

    sorted.forEach(g => {
      const li = el("li", "timeline-item" + (g.completed ? " completed" : ""));

      // the node itself is the checkbox — unchecked is an open ring on the
      // line, checked fills green with a checkmark
      const node = el("input", "timeline-node");
      node.type = "checkbox";
      node.checked = g.completed;
      node.title = g.completed ? "Mark incomplete" : "Mark complete";
      node.addEventListener("change", () => {
        g.completed = node.checked;
        saveStore();
        renderOverview();
      });
      li.appendChild(node);

      const card = el("div", "timeline-card");

      const topRow = el("div", "timeline-top-row");
      const dateInput = el("input", "timeline-date-input");
      dateInput.type = "date";
      if (g.targetDate) dateInput.value = g.targetDate;
      // commit (not every keystroke) so the timeline doesn't re-sort mid-pick
      dateInput.addEventListener("change", () => {
        g.targetDate = dateInput.value || null;
        saveStore();
        renderOverview();
      });
      topRow.appendChild(dateInput);

      const actions = el("div", "timeline-actions");
      const pinBtn = el("button", "goal-icon-btn" + (g.pinned ? " pinned" : ""));
      pinBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${g.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l1 6 3 3v2H5v-2l3-3Z"/></svg>`;
      pinBtn.title = "Pin";
      pinBtn.addEventListener("click", () => { g.pinned = !g.pinned; saveStore(); renderOverview(); });
      actions.appendChild(pinBtn);
      const delBtn = el("button", "goal-icon-btn del", "&times;");
      delBtn.title = "Delete goal";
      delBtn.addEventListener("click", () => {
        state.overview.goals = state.overview.goals.filter(x => x.id !== g.id);
        saveStore(); renderOverview();
      });
      actions.appendChild(delBtn);
      topRow.appendChild(actions);
      card.appendChild(topRow);

      const title = el("input", "goal-title");
      title.type = "text";
      title.value = g.title;
      title.placeholder = "Goal title";
      title.addEventListener("input", () => { g.title = title.value; saveStore(); });
      card.appendChild(title);

      const note = el("textarea", "goal-note");
      note.placeholder = "Notes…";
      note.value = g.note || "";
      note.rows = 1;
      const autoGrow = () => { note.style.height = "auto"; note.style.height = note.scrollHeight + "px"; };
      note.addEventListener("input", () => { g.note = note.value; saveStore(); autoGrow(); });
      card.appendChild(note);
      requestAnimationFrame(autoGrow);

      li.appendChild(card);
      list.appendChild(li);
    });
  }
  document.getElementById("addGoalBtn").addEventListener("click", () => {
    state.overview.goals.push({ id: uid(), title: "New goal", note: "", targetDate: null, completed: false, pinned: false });
    saveStore(); renderOverview();
    const inputs = document.querySelectorAll(".goal-title");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  /* =======================================================================
     HEALTH & FITNESS
     ======================================================================= */
  function renderHealth() {
    const h = state.health;

    // stat row: current weight / target weight (both directly editable, no
    // modal) / amount to go (computed live from the other two)
    const row = document.getElementById("healthStatRow");
    row.innerHTML = "";
    row.appendChild(weightInputTile("Current weight", h.weightGoal.current, (v) => {
      h.weightGoal.current = v; saveStore(); updateToGoTile();
    }));
    row.appendChild(weightInputTile("Target weight", h.weightGoal.target, (v) => {
      h.weightGoal.target = v; saveStore(); updateToGoTile();
    }));

    const toGoTile = el("div", "stat-tile");
    toGoTile.appendChild(el("p", "stat-label", "To go")).id = "toGoLabel";
    toGoTile.appendChild(el("p", "stat-value", "—")).id = "toGoValue";
    row.appendChild(toGoTile);
    updateToGoTile();

    // segmented view toggle
    document.querySelectorAll("#healthViewToggle button").forEach(b => {
      b.classList.toggle("active", b.dataset.view === h.activeView);
    });
    document.getElementById("workoutView").hidden = h.activeView !== "workout";
    document.getElementById("mealsView").hidden = h.activeView !== "meals";

    renderWorkoutTracker();
    renderMealPlan();
  }

  // A stat tile that IS the editor — no separate modal, just type into the
  // number directly (same pattern as the goal title/note fields).
  function weightInputTile(label, value, onChange, opts) {
    opts = opts || {};
    const tile = el("div", "stat-tile");
    tile.appendChild(el("p", "stat-label", label));
    const input = el("input", "stat-value-input");
    input.type = "number";
    input.step = opts.step || "0.1";
    input.inputMode = "decimal";
    input.placeholder = "—";
    if (value !== null && value !== undefined) input.value = value;
    input.addEventListener("input", () => {
      onChange(input.value === "" ? null : parseFloat(input.value));
    });
    tile.appendChild(input);
    return tile;
  }

  function updateToGoTile() {
    const { current, target } = state.health.weightGoal;
    const labelEl = document.getElementById("toGoLabel");
    const valueEl = document.getElementById("toGoValue");
    if (!labelEl || !valueEl) return;
    if (current !== null && current !== undefined && !isNaN(current) &&
        target !== null && target !== undefined && !isNaN(target)) {
      const diff = +(current - target).toFixed(1);
      const abs = Math.abs(diff);
      labelEl.textContent = diff === 0 ? "At goal" : (diff > 0 ? "To lose" : "To gain");
      valueEl.textContent = diff === 0 ? "🎯" : abs + " lb";
    } else {
      labelEl.textContent = "To go";
      valueEl.textContent = "—";
    }
  }

  document.getElementById("healthViewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    state.health.activeView = btn.dataset.view;
    saveStore();
    renderHealth();
  });

  const WEEKDAY_LABELS = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday" };

  function renderWorkoutTracker() {
    const grid = document.getElementById("workoutDaysGrid");
    grid.innerHTML = "";
    WEEKDAYS.forEach(day => {
      const card = el("div", "card");
      const head = el("div", "card-head");
      head.appendChild(el("h3", "", WEEKDAY_LABELS[day]));
      const addBtn = el("button", "btn-add", "+ Add exercise");
      addBtn.addEventListener("click", () => {
        // no modal — just add the row inline, ready to type into
        const ex = { id: uid(), name: "", sets: [null, null, null] };
        state.health.workouts[day].push(ex);
        saveStore();
        renderWorkoutTracker();
        const nameInput = document.getElementById("ex-name-" + ex.id);
        if (nameInput) nameInput.focus();
      });
      head.appendChild(addBtn);
      card.appendChild(head);

      const body = el("div", "card-body");
      const exercises = state.health.workouts[day];
      if (!exercises.length) {
        body.appendChild(el("p", "empty-hint", "No exercises yet."));
      } else {
        exercises.forEach(ex => body.appendChild(renderExerciseRow(day, ex)));
      }
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function renderExerciseRow(day, ex) {
    const row = el("div", "exercise-row");
    const rowHead = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.id = "ex-name-" + ex.id;
    nameInput.placeholder = "Exercise name";
    nameInput.value = ex.name || "";
    nameInput.addEventListener("input", () => { ex.name = nameInput.value; saveStore(); });
    rowHead.appendChild(nameInput);
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.health.workouts[day] = state.health.workouts[day].filter(x => x.id !== ex.id);
      saveStore(); renderWorkoutTracker();
    });
    rowHead.appendChild(del);
    row.appendChild(rowHead);

    const prev = ex.previousSets || null;

    const setsGrid = el("div", "exercise-sets-grid");
    const totalEl = el("div", "set-total", String(sumSets(ex.sets)));
    [0, 1, 2].forEach(i => {
      const col = el("div", "set-col");
      col.appendChild(el("label", "", "Set " + (i + 1)));
      const input = el("input");
      input.type = "number";
      input.min = "0";
      input.inputMode = "numeric";
      input.placeholder = "reps";
      if (ex.sets[i] !== null && ex.sets[i] !== undefined) input.value = ex.sets[i];
      input.addEventListener("input", () => {
        ex.sets[i] = input.value === "" ? null : parseInt(input.value, 10);
        saveStore();
        totalEl.textContent = String(sumSets(ex.sets));
      });
      col.appendChild(input);
      // ghost of last week's number for this set — the target to beat
      if (prev && prev[i] !== null && prev[i] !== undefined) {
        col.appendChild(el("span", "set-ghost", "was " + prev[i]));
      }
      setsGrid.appendChild(col);
    });
    const totalCol = el("div", "set-col");
    totalCol.appendChild(el("label", "", "Total"));
    totalCol.appendChild(totalEl);
    if (prev) {
      const prevTotal = sumSets(prev);
      if (prevTotal > 0) totalCol.appendChild(el("span", "set-ghost", "was " + prevTotal));
    }
    setsGrid.appendChild(totalCol);

    row.appendChild(setsGrid);
    return row;
  }

  function sumSets(sets) {
    return sets.reduce((s, v) => s + (typeof v === "number" && !isNaN(v) ? v : 0), 0);
  }

  document.getElementById("resetWeekBtn").addEventListener("click", () => {
    // keep every exercise (the rows themselves), but clear this week's reps
    // — last week's numbers move into "previousSets" so they still show as
    // a faint "was X" ghost target next to each input
    WEEKDAYS.forEach(day => {
      state.health.workouts[day].forEach(ex => {
        ex.previousSets = ex.sets.slice();
        ex.sets = [null, null, null];
      });
    });
    saveStore();
    renderWorkoutTracker();
  });

  function renderMealPlan() {
    const grid = document.getElementById("mealSlotsGrid");
    grid.innerHTML = "";
    MEAL_SLOTS.forEach(slot => {
      const meal = state.health.meals[slot.key];
      const card = el("div", "card");
      const head = el("div", "card-head");
      head.appendChild(el("h3", "", slot.label));
      card.appendChild(head);

      const body = el("div", "card-body");
      const titleInput = el("input", "meal-title");
      titleInput.type = "text";
      titleInput.placeholder = "Dish title";
      titleInput.value = meal.title || "";
      titleInput.addEventListener("input", () => { meal.title = titleInput.value; saveStore(); });
      body.appendChild(titleInput);

      const ingredients = el("textarea", "meal-ingredients");
      ingredients.placeholder = "Ingredients…";
      ingredients.value = meal.ingredients || "";
      ingredients.addEventListener("input", () => { meal.ingredients = ingredients.value; saveStore(); });
      body.appendChild(ingredients);

      // per-meal macros — reuses the same 4-column set-grid look as the
      // workout tracker's Set 1/2/3/Total row
      const macroGrid = el("div", "exercise-sets-grid");
      MACRO_FIELDS.forEach(mf => {
        const col = el("div", "set-col");
        col.appendChild(el("label", "", mf.label));
        const input = el("input");
        input.type = "number";
        input.min = "0";
        input.inputMode = "numeric";
        input.placeholder = "0";
        if (meal[mf.key] !== null && meal[mf.key] !== undefined) input.value = meal[mf.key];
        input.addEventListener("input", () => {
          meal[mf.key] = input.value === "" ? null : parseFloat(input.value);
          saveStore();
          updateMacroTotals();
        });
        col.appendChild(input);
        macroGrid.appendChild(col);
      });
      body.appendChild(macroGrid);

      card.appendChild(body);
      grid.appendChild(card);
    });

    // macro tracker summary — totals protein/carbs/fiber/calories across all 6 meals
    const summaryCard = el("div", "card card-wide");
    const summaryHead = el("div", "card-head");
    summaryHead.appendChild(el("h3", "", "Macro tracker"));
    summaryCard.appendChild(summaryHead);
    const summaryBody = el("div", "card-body");
    const summaryRow = el("div", "stat-row stat-row-4");
    summaryRow.id = "macroTotalsRow";
    summaryBody.appendChild(summaryRow);
    summaryCard.appendChild(summaryBody);
    grid.appendChild(summaryCard);

    updateMacroTotals();
  }

  const MACRO_FIELDS = [
    { key: "protein", label: "Protein" },
    { key: "carbs", label: "Carbs" },
    { key: "fiber", label: "Fiber" },
    { key: "calories", label: "Cal" }
  ];

  function updateMacroTotals() {
    const row = document.getElementById("macroTotalsRow");
    if (!row) return;
    const meals = MEAL_SLOTS.map(s => state.health.meals[s.key]);
    const sum = (key) => meals.reduce((s, m) => s + (typeof m[key] === "number" && !isNaN(m[key]) ? m[key] : 0), 0);
    row.innerHTML = "";
    row.appendChild(statTile("Protein", sum("protein") + " g"));
    row.appendChild(statTile("Carbs", sum("carbs") + " g"));
    row.appendChild(statTile("Fiber", sum("fiber") + " g"));
    row.appendChild(statTile("Calories", sum("calories").toLocaleString()));
  }

  /* =======================================================================
     FINANCES
     ======================================================================= */
  function renderFinance() {
    document.querySelectorAll("#financeViewToggle button").forEach(b => {
      b.classList.toggle("active", b.dataset.view === state.finance.activeView);
    });
    document.getElementById("budgetView").hidden = state.finance.activeView !== "budget";
    document.getElementById("savingsView").hidden = state.finance.activeView !== "savings";

    renderBudgetView();
    renderSavingsView();
  }

  document.getElementById("financeViewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    state.finance.activeView = btn.dataset.view;
    saveStore();
    renderFinance();
  });

  /* ---- Budget ---- */
  function sumBudgetItems(items) {
    return items.reduce((s, it) => s + (typeof it.amount === "number" && !isNaN(it.amount) ? it.amount : 0), 0);
  }

  function computeLeftover() {
    const b = state.finance.budget;
    const income = sumBudgetItems(b.income);
    const outflow = OUTFLOW_CATEGORIES.reduce((s, k) => s + sumBudgetItems(b[k]), 0);
    return income - outflow;
  }

  // one base accent per outflow category; individual line items within a
  // category get lighter shades of that same hue so slices read as grouped
  // without needing a distinct color per line item
  const CATEGORY_COLOR_VAR = {
    fixedExpenses: "--series-1",
    variableExpenses: "--accent-coral",
    funSpending: "--accent-gold",
    charitableDonations: "--accent-violet",
    savingsAllocations: "--series-3"
  };

  function shadeForIndex(baseVar, idx) {
    const pct = clamp(94 - idx * 13, 40, 100);
    return `color-mix(in srgb, ${css(baseVar)} ${pct}%, white ${100 - pct}%)`;
  }

  function donutSlicePath(cx, cy, rInner, rOuter, startAngle, endAngle) {
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
    const x1 = cx + rOuter * Math.cos(startAngle), y1 = cy + rOuter * Math.sin(startAngle);
    const x2 = cx + rOuter * Math.cos(endAngle), y2 = cy + rOuter * Math.sin(endAngle);
    const x3 = cx + rInner * Math.cos(endAngle), y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(startAngle), y4 = cy + rInner * Math.sin(startAngle);
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  function renderSpendingChart() {
    const svg = document.getElementById("spendingDonut");
    const legend = document.getElementById("spendingLegend");
    const emptyHint = document.getElementById("spendingChartEmpty");
    if (!svg) return;

    const b = state.finance.budget;
    const slices = [];
    OUTFLOW_CATEGORIES.forEach(catKey => {
      const items = b[catKey].filter(it => typeof it.amount === "number" && !isNaN(it.amount) && it.amount > 0);
      items.forEach((it, idx) => {
        slices.push({ name: it.name || "Untitled", amount: it.amount, catKey, color: shadeForIndex(CATEGORY_COLOR_VAR[catKey], idx) });
      });
    });
    const total = slices.reduce((s, sl) => s + sl.amount, 0);

    svg.innerHTML = "";
    legend.innerHTML = "";
    if (!slices.length || total <= 0) {
      svg.style.display = "none";
      emptyHint.style.display = "block";
      return;
    }
    svg.style.display = "block";
    emptyHint.style.display = "none";

    const vb = svg.viewBox.baseVal;
    const W = vb.width || 200, H = vb.height || 200;
    const cx = W / 2, cy = H / 2;
    const rOuter = Math.min(W, H) / 2 - 4;
    const rInner = rOuter * 0.62;

    let angle = -Math.PI / 2;
    slices.forEach(sl => {
      const frac = sl.amount / total;
      const epsilon = slices.length === 1 ? 0.999 : 1;
      const endAngle = angle + frac * Math.PI * 2 * epsilon;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", donutSlicePath(cx, cy, rInner, rOuter, angle, endAngle));
      path.setAttribute("fill", sl.color);
      path.setAttribute("stroke", css("--surface-card"));
      path.setAttribute("stroke-width", "1.5");
      svg.appendChild(path);
      angle = endAngle;
    });

    const centerAmt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerAmt.setAttribute("x", cx); centerAmt.setAttribute("y", cy - 3);
    centerAmt.setAttribute("text-anchor", "middle");
    centerAmt.setAttribute("font-size", "17");
    centerAmt.setAttribute("font-weight", "700");
    centerAmt.setAttribute("fill", css("--text-primary"));
    centerAmt.textContent = fmtMoneyExact(total);
    svg.appendChild(centerAmt);

    const centerLbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerLbl.setAttribute("x", cx); centerLbl.setAttribute("y", cy + 14);
    centerLbl.setAttribute("text-anchor", "middle");
    centerLbl.setAttribute("font-size", "10");
    centerLbl.setAttribute("fill", css("--text-meta"));
    centerLbl.textContent = "spending";
    svg.appendChild(centerLbl);

    BUDGET_CATEGORIES.filter(c => OUTFLOW_CATEGORIES.includes(c.key)).forEach(cat => {
      const catTotal = sumBudgetItems(b[cat.key].filter(it => typeof it.amount === "number" && it.amount > 0));
      if (catTotal <= 0) return;
      const row = el("div", "donut-legend-row");
      const swatch = el("span", "donut-swatch");
      swatch.style.background = css(CATEGORY_COLOR_VAR[cat.key]);
      row.appendChild(swatch);
      row.appendChild(el("span", "donut-legend-label", cat.label));
      row.appendChild(el("span", "donut-legend-value", fmtMoneyExact(catTotal)));
      legend.appendChild(row);
    });
  }

  function renderBudgetView() {
    renderSpendingChart();
    const grid = document.getElementById("budgetCategoriesGrid");
    grid.innerHTML = "";
    BUDGET_CATEGORIES.forEach(cat => grid.appendChild(renderBudgetCategoryCard(cat)));

    const leftoverCard = el("div", "card card-wide");
    const lHead = el("div", "card-head");
    lHead.appendChild(el("h3", "", "Leftover income"));
    leftoverCard.appendChild(lHead);
    const lBody = el("div", "card-body");
    const lValue = el("p", "hero-figure", "$0");
    lValue.id = "leftoverValue";
    lBody.appendChild(lValue);
    lBody.appendChild(el("p", "empty-hint", "Income minus fixed & variable expenses, fun spending, donations, and savings."));
    leftoverCard.appendChild(lBody);
    grid.appendChild(leftoverCard);

    updateLeftoverSummary();
  }

  function renderBudgetCategoryCard(cat) {
    const items = state.finance.budget[cat.key];
    const card = el("div", "card");
    const head = el("div", "card-head");
    head.appendChild(el("h3", "", cat.label));
    const addBtn = el("button", "btn-add", "+ Add line");
    addBtn.type = "button";
    addBtn.addEventListener("click", () => {
      const item = { id: uid(), name: "", amount: null };
      items.push(item);
      saveStore();
      renderBudgetView();
      const input = document.getElementById("bl-name-" + item.id);
      if (input) input.focus();
    });
    head.appendChild(addBtn);
    card.appendChild(head);

    const body = el("div", "card-body");
    if (!items.length) {
      body.appendChild(el("p", "empty-hint", "No line items yet."));
    } else {
      items.forEach(item => body.appendChild(renderBudgetLine(cat.key, item)));
    }
    const totalRow = el("div", "category-total-row");
    totalRow.appendChild(el("span", "ct-label", "Total"));
    const totalVal = el("span", "category-total-value", fmtMoneyExact(sumBudgetItems(items)));
    totalVal.id = "total-" + cat.key;
    totalRow.appendChild(totalVal);
    body.appendChild(totalRow);
    card.appendChild(body);
    return card;
  }

  function renderBudgetLine(catKey, item) {
    const row = el("div", "budget-line");
    const nameInput = el("input", "budget-line-name");
    nameInput.type = "text";
    nameInput.id = "bl-name-" + item.id;
    nameInput.placeholder = "Item name";
    nameInput.value = item.name || "";
    nameInput.addEventListener("input", () => { item.name = nameInput.value; saveStore(); });
    row.appendChild(nameInput);

    const amtInput = el("input", "budget-line-amount");
    amtInput.type = "number";
    amtInput.inputMode = "decimal";
    amtInput.step = "0.01";
    amtInput.placeholder = "$0";
    if (item.amount !== null && item.amount !== undefined) amtInput.value = item.amount;
    amtInput.addEventListener("input", () => {
      item.amount = amtInput.value === "" ? null : parseFloat(amtInput.value);
      saveStore();
      updateCategoryTotal(catKey);
    });
    row.appendChild(amtInput);

    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.finance.budget[catKey] = state.finance.budget[catKey].filter(x => x.id !== item.id);
      saveStore();
      renderBudgetView();
    });
    row.appendChild(del);
    return row;
  }

  function updateCategoryTotal(catKey) {
    const totalEl = document.getElementById("total-" + catKey);
    if (totalEl) totalEl.textContent = fmtMoneyExact(sumBudgetItems(state.finance.budget[catKey]));
    updateLeftoverSummary();
    if (OUTFLOW_CATEGORIES.includes(catKey)) renderSpendingChart();
  }

  function updateLeftoverSummary() {
    const valueEl = document.getElementById("leftoverValue");
    if (!valueEl) return;
    const leftover = computeLeftover();
    valueEl.textContent = fmtMoneyExact(leftover);
    valueEl.classList.remove("hero-good", "hero-bad", "hero-neutral");
    valueEl.classList.add(leftover > 0 ? "hero-good" : leftover < 0 ? "hero-bad" : "hero-neutral");
  }

  /* ---- Savings ---- */
  function renderSavingsView() {
    const list = document.getElementById("savingsAccountsList");
    const empty = document.getElementById("savingsAccountsEmpty");
    list.innerHTML = "";
    const accounts = state.finance.savingsAccounts;
    empty.style.display = accounts.length ? "none" : "block";
    accounts.forEach(acc => list.appendChild(renderSavingsAccountRow(acc)));
    updateSavingsStats();
  }

  function renderSavingsAccountRow(acc) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.id = "sa-name-" + acc.id;
    nameInput.placeholder = "Account name";
    nameInput.value = acc.name || "";
    nameInput.addEventListener("input", () => { acc.name = nameInput.value; saveStore(); });
    head.appendChild(nameInput);
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.finance.savingsAccounts = state.finance.savingsAccounts.filter(x => x.id !== acc.id);
      saveStore();
      renderSavingsView();
    });
    head.appendChild(del);
    row.appendChild(head);

    const fieldsGrid = el("div", "exercise-sets-grid cols-2");
    const balCol = el("div", "set-col");
    balCol.appendChild(el("label", "", "Balance"));
    const balInput = el("input");
    balInput.type = "number";
    balInput.inputMode = "decimal";
    balInput.step = "0.01";
    balInput.placeholder = "$0";
    if (acc.total !== null && acc.total !== undefined) balInput.value = acc.total;
    balInput.addEventListener("input", () => {
      acc.total = balInput.value === "" ? null : parseFloat(balInput.value);
      saveStore();
      updateSavingsStats();
    });
    balCol.appendChild(balInput);
    fieldsGrid.appendChild(balCol);

    const contribCol = el("div", "set-col");
    contribCol.appendChild(el("label", "", "Monthly +"));
    const contribInput = el("input");
    contribInput.type = "number";
    contribInput.inputMode = "decimal";
    contribInput.step = "0.01";
    contribInput.placeholder = "$0";
    if (acc.monthlyContribution !== null && acc.monthlyContribution !== undefined) contribInput.value = acc.monthlyContribution;
    contribInput.addEventListener("input", () => {
      acc.monthlyContribution = contribInput.value === "" ? null : parseFloat(contribInput.value);
      saveStore();
      updateSavingsStats();
    });
    contribCol.appendChild(contribInput);
    fieldsGrid.appendChild(contribCol);

    row.appendChild(fieldsGrid);
    return row;
  }

  function updateSavingsStats() {
    const row = document.getElementById("savingsStatRow");
    if (!row) return;
    const accounts = state.finance.savingsAccounts;
    const totalBalance = accounts.reduce((s, a) => s + (typeof a.total === "number" && !isNaN(a.total) ? a.total : 0), 0);
    const totalMonthly = accounts.reduce((s, a) => s + (typeof a.monthlyContribution === "number" && !isNaN(a.monthlyContribution) ? a.monthlyContribution : 0), 0);
    row.innerHTML = "";
    row.appendChild(statTile("Total saved", fmtMoneyExact(totalBalance)));
    row.appendChild(statTile("Adding / month", fmtMoneyExact(totalMonthly)));
  }

  document.getElementById("addSavingsAccountBtn").addEventListener("click", () => {
    const acc = { id: uid(), name: "", total: null, monthlyContribution: null };
    state.finance.savingsAccounts.push(acc);
    saveStore();
    renderSavingsView();
    const input = document.getElementById("sa-name-" + acc.id);
    if (input) input.focus();
  });

  /* =======================================================================
     LUXIO ADS (BUSINESS)
     ======================================================================= */
  const PROSPECT_STAGES = [
    { key: "prospecting", label: "Prospecting" },
    { key: "outreaching", label: "Outreaching" },
    { key: "communications", label: "Communications" },
    { key: "undercontract", label: "Under contract" }
  ];
  function prospectStageLabel(key) {
    const s = PROSPECT_STAGES.find(x => x.key === key);
    return s ? s.label : key;
  }

  let prospectFilter = "all";
  let bookFilter = "all";

  function renderBusiness() {
    const b = state.business;

    document.querySelectorAll("#businessViewToggle button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === b.activeView);
    });
    document.getElementById("businessTodoView").hidden = b.activeView !== "todo";
    document.getElementById("businessSalesView").hidden = b.activeView !== "sales";
    document.getElementById("businessMarketingView").hidden = b.activeView !== "marketing";
    document.getElementById("businessBookView").hidden = b.activeView !== "book";

    renderBusinessTodos();
    renderBusinessProspects();
    renderBusinessMarketing();
    renderBusinessBook();
  }

  document.getElementById("businessViewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    state.business.activeView = btn.dataset.view;
    saveStore();
    renderBusiness();
  });

  /* ---- To do (go-live checklist) ---- */
  function renderBusinessTodos() {
    const list = document.getElementById("businessTodoList");
    const empty = document.getElementById("businessTodoEmpty");
    list.innerHTML = "";
    const todos = state.business.todos;
    empty.style.display = todos.length ? "none" : "block";

    const sorted = todos.slice().sort((a, c) => (a.done ? 1 : 0) - (c.done ? 1 : 0));

    sorted.forEach(t => {
      const li = el("li", "goal-item" + (t.done ? " completed" : ""));
      const cb = el("input", "goal-checkbox");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.addEventListener("change", () => { t.done = cb.checked; saveStore(); renderBusinessTodos(); });
      li.appendChild(cb);

      const main = el("div", "goal-main");
      const title = el("textarea", "todo-title");
      title.rows = 1;
      title.value = t.text || "";
      title.placeholder = "Task";
      const autoGrow = () => { title.style.height = "auto"; title.style.height = title.scrollHeight + "px"; };
      title.addEventListener("input", () => { t.text = title.value; saveStore(); autoGrow(); });
      main.appendChild(title);
      li.appendChild(main);
      requestAnimationFrame(autoGrow);

      const actions = el("div", "goal-actions");
      const del = el("button", "goal-icon-btn del", "&times;");
      del.title = "Delete task";
      del.addEventListener("click", () => {
        state.business.todos = state.business.todos.filter(x => x.id !== t.id);
        saveStore(); renderBusinessTodos();
      });
      actions.appendChild(del);
      li.appendChild(actions);

      list.appendChild(li);
    });
  }
  document.getElementById("addBusinessTodoBtn").addEventListener("click", () => {
    state.business.todos.push({ id: uid(), text: "", done: false });
    saveStore(); renderBusinessTodos();
    const inputs = document.querySelectorAll("#businessTodoList .todo-title");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  /* ---- Sales (prospects) ---- */
  function renderProspectRow(p) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = "Business name";
    nameInput.value = p.name || "";
    nameInput.addEventListener("input", () => { p.name = nameInput.value; saveStore(); });
    head.appendChild(nameInput);
    head.appendChild(el("span", "stage-badge stage-" + (p.stage || "prospecting"), prospectStageLabel(p.stage)));
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.business.prospects = state.business.prospects.filter(x => x.id !== p.id);
      saveStore(); renderBusinessProspects();
    });
    head.appendChild(del);
    row.appendChild(head);

    const fieldsGrid = el("div", "exercise-sets-grid cols-2");
    const phoneCol = el("div", "set-col");
    phoneCol.appendChild(el("label", "", "Phone"));
    const phoneInput = el("input");
    phoneInput.type = "tel";
    phoneInput.placeholder = "Phone number";
    phoneInput.value = p.phone || "";
    phoneInput.addEventListener("input", () => { p.phone = phoneInput.value; saveStore(); });
    phoneCol.appendChild(phoneInput);
    fieldsGrid.appendChild(phoneCol);

    const stageCol = el("div", "set-col");
    stageCol.appendChild(el("label", "", "Stage"));
    const stageSelect = el("select");
    PROSPECT_STAGES.forEach(s => {
      const o = el("option", "", s.label);
      o.value = s.key;
      stageSelect.appendChild(o);
    });
    stageSelect.value = p.stage || "prospecting";
    stageSelect.addEventListener("change", () => { p.stage = stageSelect.value; saveStore(); renderBusinessProspects(); });
    stageCol.appendChild(stageSelect);
    fieldsGrid.appendChild(stageCol);
    row.appendChild(fieldsGrid);

    const notes = el("textarea", "notes-textarea");
    notes.placeholder = "Notes…";
    notes.value = p.notes || "";
    notes.addEventListener("input", () => { p.notes = notes.value; saveStore(); });
    row.appendChild(notes);

    return row;
  }

  function renderBusinessProspects() {
    const list = document.getElementById("prospectList");
    const empty = document.getElementById("prospectEmpty");
    list.innerHTML = "";
    const prospects = state.business.prospects;
    const filtered = prospectFilter === "all" ? prospects : prospects.filter(p => p.stage === prospectFilter);
    empty.style.display = filtered.length ? "none" : "block";
    filtered.forEach(p => list.appendChild(renderProspectRow(p)));
  }

  document.getElementById("addProspectBtn").addEventListener("click", () => {
    const p = { id: uid(), name: "", phone: "", notes: "", stage: "prospecting" };
    state.business.prospects.push(p);
    saveStore();
    prospectFilter = "all";
    document.querySelectorAll("#prospectFilters .pill").forEach(x => x.classList.toggle("active", x.dataset.stage === "all"));
    renderBusinessProspects();
    const inputs = document.querySelectorAll("#prospectList .exercise-name-input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  document.querySelectorAll("#prospectFilters .pill").forEach(p => {
    p.addEventListener("click", () => {
      document.querySelectorAll("#prospectFilters .pill").forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      prospectFilter = p.dataset.stage;
      renderBusinessProspects();
    });
  });

  /* ---- Marketing (social video ideas) ---- */
  function renderMarketingTaskRow(t) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = "Idea (e.g. Behind-the-scenes install)";
    nameInput.value = t.idea || "";
    nameInput.addEventListener("input", () => { t.idea = nameInput.value; saveStore(); });
    head.appendChild(nameInput);
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.business.marketingTasks = state.business.marketingTasks.filter(x => x.id !== t.id);
      saveStore(); renderBusinessMarketing();
    });
    head.appendChild(del);
    row.appendChild(head);

    const notes = el("textarea", "notes-textarea");
    notes.placeholder = "Note…";
    notes.value = t.note || "";
    notes.addEventListener("input", () => { t.note = notes.value; saveStore(); });
    row.appendChild(notes);

    const dateCol = el("div", "set-col");
    dateCol.style.maxWidth = "200px";
    dateCol.style.marginTop = "8px";
    dateCol.appendChild(el("label", "", "Date to post"));
    const dateInput = el("input");
    dateInput.type = "date";
    dateInput.value = t.postDate || "";
    // commit (not every keystroke) so the list doesn't re-sort mid-pick
    dateInput.addEventListener("change", () => {
      t.postDate = dateInput.value;
      saveStore();
      renderBusinessMarketing();
    });
    dateCol.appendChild(dateInput);
    row.appendChild(dateCol);

    return row;
  }

  function renderBusinessMarketing() {
    const list = document.getElementById("marketingTaskList");
    const empty = document.getElementById("marketingTaskEmpty");
    list.innerHTML = "";
    const tasks = state.business.marketingTasks;
    empty.style.display = tasks.length ? "none" : "block";
    // soonest post date first; ideas with no date yet sink to the bottom
    const sorted = tasks.slice().sort((a, c) => {
      if (!a.postDate && !c.postDate) return 0;
      if (!a.postDate) return 1;
      if (!c.postDate) return -1;
      return a.postDate < c.postDate ? -1 : a.postDate > c.postDate ? 1 : 0;
    });
    sorted.forEach(t => list.appendChild(renderMarketingTaskRow(t)));
  }

  document.getElementById("addMarketingTaskBtn").addEventListener("click", () => {
    state.business.marketingTasks.push({ id: uid(), idea: "", note: "", postDate: "" });
    saveStore();
    renderBusinessMarketing();
    const inputs = document.querySelectorAll("#marketingTaskList .exercise-name-input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  /* ---- Book of business (locations & advertisers) ---- */
  function renderBookEntryRow(entry) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = entry.type === "advertiser" ? "Advertiser name" : "Location name";
    nameInput.value = entry.name || "";
    nameInput.addEventListener("input", () => { entry.name = nameInput.value; saveStore(); });
    head.appendChild(nameInput);
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.business.bookEntries = state.business.bookEntries.filter(x => x.id !== entry.id);
      saveStore(); renderBusinessBook();
    });
    head.appendChild(del);
    row.appendChild(head);

    const fieldsGrid = el("div", "exercise-sets-grid cols-2");
    const typeCol = el("div", "set-col");
    typeCol.appendChild(el("label", "", "Type"));
    const typeSelect = el("select");
    [["location", "Location"], ["advertiser", "Advertiser"]].forEach(([v, l]) => {
      const o = el("option", "", l);
      o.value = v;
      typeSelect.appendChild(o);
    });
    typeSelect.value = entry.type || "location";
    typeSelect.addEventListener("change", () => { entry.type = typeSelect.value; saveStore(); renderBusinessBook(); });
    typeCol.appendChild(typeSelect);
    fieldsGrid.appendChild(typeCol);

    const revCol = el("div", "set-col");
    revCol.appendChild(el("label", "", "Monthly rev."));
    const revInput = el("input");
    revInput.type = "number";
    revInput.inputMode = "decimal";
    revInput.step = "0.01";
    revInput.placeholder = "$0";
    if (entry.monthlyRevenue !== null && entry.monthlyRevenue !== undefined) revInput.value = entry.monthlyRevenue;
    revInput.addEventListener("input", () => {
      entry.monthlyRevenue = revInput.value === "" ? null : parseFloat(revInput.value);
      saveStore();
      updateBookStats();
    });
    revCol.appendChild(revInput);
    fieldsGrid.appendChild(revCol);
    row.appendChild(fieldsGrid);

    return row;
  }

  function renderBusinessBook() {
    const list = document.getElementById("bookEntryList");
    const empty = document.getElementById("bookEntryEmpty");
    list.innerHTML = "";
    const entries = state.business.bookEntries;
    const filtered = bookFilter === "all" ? entries : entries.filter(e => e.type === bookFilter);
    empty.style.display = filtered.length ? "none" : "block";
    filtered.forEach(e => list.appendChild(renderBookEntryRow(e)));
    updateBookStats();
  }

  // Book of business is the source of truth for the top-level Luxio Ads
  // stats: monthly revenue is the sum of every entry's monthly revenue
  // (negative entries subtract naturally), host locations and active
  // advertisers are just counts of each entry type.
  function computeBookTotals() {
    const entries = state.business.bookEntries;
    const locations = entries.filter(e => e.type === "location").length;
    const advertisers = entries.filter(e => e.type === "advertiser").length;
    const totalMonthly = entries.reduce((s, e) => s + (typeof e.monthlyRevenue === "number" && !isNaN(e.monthlyRevenue) ? e.monthlyRevenue : 0), 0);
    return { locations, advertisers, totalMonthly };
  }

  function updateBusinessStatRow() {
    const row = document.getElementById("businessStatRow");
    if (!row) return;
    const { locations, advertisers, totalMonthly } = computeBookTotals();
    row.innerHTML = "";
    row.appendChild(statTile("Monthly revenue", fmtMoneyExact(totalMonthly)));
    row.appendChild(statTile("Host locations", String(locations)));
    row.appendChild(statTile("Active advertisers", String(advertisers)));
  }

  function updateBookStats() {
    // Book of business no longer has its own stat row — the top-level
    // Luxio Ads stat row (Monthly revenue / Host locations / Active
    // advertisers) already shows these same totals, so just refresh that.
    updateBusinessStatRow();
  }

  document.getElementById("addBookEntryBtn").addEventListener("click", () => {
    const entry = { id: uid(), name: "", type: "location", monthlyRevenue: null };
    state.business.bookEntries.push(entry);
    saveStore();
    bookFilter = "all";
    document.querySelectorAll("#bookFilters .pill").forEach(x => x.classList.toggle("active", x.dataset.type === "all"));
    renderBusinessBook();
    const inputs = document.querySelectorAll("#bookEntryList .exercise-name-input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  document.querySelectorAll("#bookFilters .pill").forEach(p => {
    p.addEventListener("click", () => {
      document.querySelectorAll("#bookFilters .pill").forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      bookFilter = p.dataset.type;
      renderBusinessBook();
    });
  });

  /* =======================================================================
     MAINTENANCE (home & vehicle)
     ======================================================================= */
  const HOME_FREQUENCIES = [
    { key: "1m", label: "Every month", months: 1 },
    { key: "3m", label: "Every 3 months", months: 3 },
    { key: "6m", label: "Every 6 months", months: 6 },
    { key: "1y", label: "Every year", months: 12 }
  ];

  function addMonths(dateKey, months) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setMonth(dt.getMonth() + months);
    return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
  }

  function homeTaskStatus(task) {
    if (!task.dueDate) return { cls: "status-neutral", label: "not started" };
    const due = task.dueDate;
    const today = todayKey();
    const in14 = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); })();
    if (due < today) return { cls: "status-critical", label: "overdue" };
    if (due <= in14) return { cls: "status-warning", label: "due soon" };
    return { cls: "status-good", label: "on track" };
  }

  function renderMaintenance() {
    const m = state.maintenance;

    document.querySelectorAll("#maintenanceViewToggle button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === m.activeView);
    });
    document.getElementById("maintenanceHomeView").hidden = m.activeView !== "home";
    document.getElementById("maintenanceVehicleView").hidden = m.activeView !== "vehicle";

    updateMaintenanceStatRow();
    renderMaintenanceHome();
    renderMaintenanceVehicles();
  }

  document.getElementById("maintenanceViewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    state.maintenance.activeView = btn.dataset.view;
    saveStore();
    renderMaintenance();
  });

  function updateMaintenanceStatRow() {
    const row = document.getElementById("maintenanceStatRow");
    if (!row) return;
    const homeTasks = state.maintenance.home.tasks;
    let overdue = homeTasks.filter(t => homeTaskStatus(t).label === "overdue").length;
    let soon = homeTasks.filter(t => homeTaskStatus(t).label === "due soon").length;
    state.maintenance.vehicles.forEach(v => {
      v.tasks.forEach(t => {
        const label = vehicleTaskStatus(v, t).label;
        if (label === "due now") overdue++;
        else if (label === "due soon") soon++;
      });
    });
    row.innerHTML = "";
    row.appendChild(statTile("Due soon", String(soon)));
    row.appendChild(statTile("Overdue", String(overdue)));
  }

  /* ---- Home upkeep (recurring, date-based) ---- */
  function renderMaintenanceHome() {
    const list = document.getElementById("homeTaskList");
    const empty = document.getElementById("homeTaskEmpty");
    list.innerHTML = "";
    const tasks = state.maintenance.home.tasks;
    empty.style.display = tasks.length ? "none" : "block";
    const sorted = tasks.slice().sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    sorted.forEach(t => list.appendChild(renderHomeTaskRow(t)));
  }

  function renderHomeTaskRow(t) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = "Task name (e.g. Replace HVAC filter)";
    nameInput.value = t.name || "";
    nameInput.addEventListener("input", () => { t.name = nameInput.value; saveStore(); });
    head.appendChild(nameInput);
    const st = homeTaskStatus(t);
    head.appendChild(el("span", "status-badge " + st.cls, st.label));
    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      state.maintenance.home.tasks = state.maintenance.home.tasks.filter(x => x.id !== t.id);
      saveStore(); renderMaintenanceHome(); updateMaintenanceStatRow();
    });
    head.appendChild(del);
    row.appendChild(head);

    const notes = el("textarea", "notes-textarea");
    notes.placeholder = "Notes…";
    notes.value = t.notes || "";
    notes.addEventListener("input", () => { t.notes = notes.value; saveStore(); });
    row.appendChild(notes);

    const fieldsGrid = el("div", "exercise-sets-grid cols-2");
    const freqCol = el("div", "set-col");
    freqCol.appendChild(el("label", "", "Frequency"));
    const freqSelect = el("select");
    HOME_FREQUENCIES.forEach(f => {
      const o = el("option", "", f.label);
      o.value = f.key;
      freqSelect.appendChild(o);
    });
    freqSelect.value = t.frequency || "3m";
    freqSelect.addEventListener("change", () => {
      t.frequency = freqSelect.value;
      // already on a schedule — recompute the due date against the new cadence
      if (t.lastCompleted) {
        const f = HOME_FREQUENCIES.find(x => x.key === t.frequency) || HOME_FREQUENCIES[1];
        t.dueDate = addMonths(t.lastCompleted, f.months);
      }
      saveStore(); renderMaintenanceHome(); updateMaintenanceStatRow();
    });
    freqCol.appendChild(freqSelect);
    fieldsGrid.appendChild(freqCol);

    const doneCol = el("div", "set-col");
    doneCol.appendChild(el("label", "", "Mark"));
    const doneBtn = el("button", "btn-done", "✓ Done");
    doneBtn.type = "button";
    doneBtn.addEventListener("click", () => {
      t.lastCompleted = todayKey();
      const f = HOME_FREQUENCIES.find(x => x.key === t.frequency) || HOME_FREQUENCIES[1];
      t.dueDate = addMonths(t.lastCompleted, f.months);
      saveStore(); renderMaintenanceHome(); updateMaintenanceStatRow();
    });
    doneCol.appendChild(doneBtn);
    fieldsGrid.appendChild(doneCol);
    row.appendChild(fieldsGrid);

    const metaParts = [];
    if (t.dueDate) metaParts.push("Next due " + fmtDate(t.dueDate));
    if (t.lastCompleted) metaParts.push("Last done " + fmtDate(t.lastCompleted));
    if (metaParts.length) {
      const meta = el("p", "log-item-sub", metaParts.join(" · "));
      meta.style.marginTop = "8px";
      row.appendChild(meta);
    }

    return row;
  }

  document.getElementById("addHomeTaskBtn").addEventListener("click", () => {
    const t = { id: uid(), name: "", notes: "", frequency: "3m", lastCompleted: null, dueDate: null };
    state.maintenance.home.tasks.push(t);
    saveStore();
    renderMaintenanceHome();
    updateMaintenanceStatRow();
    const inputs = document.querySelectorAll("#homeTaskList .exercise-name-input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  /* ---- Vehicles (mileage-based, manual) ---- */
  function renderMaintenanceVehicles() {
    const vehicles = state.maintenance.vehicles;
    const empty = document.getElementById("vehicleEmpty");
    empty.style.display = vehicles.length ? "none" : "block";

    // keep the active selection valid (vehicle may have just been deleted)
    if (!vehicles.find(v => v.id === state.maintenance.activeVehicleId)) {
      state.maintenance.activeVehicleId = vehicles.length ? vehicles[0].id : null;
      saveStore();
    }

    renderVehicleTabs();
    renderVehicleDetail();
  }

  // pill selector — switches which single vehicle's detail is shown below
  function renderVehicleTabs() {
    const tabs = document.getElementById("vehicleTabs");
    tabs.innerHTML = "";
    state.maintenance.vehicles.forEach(v => {
      const pill = el("button", "pill" + (v.id === state.maintenance.activeVehicleId ? " active" : ""), v.name || "Unnamed");
      pill.type = "button";
      pill.addEventListener("click", () => {
        state.maintenance.activeVehicleId = v.id;
        saveStore();
        renderVehicleTabs();
        renderVehicleDetail();
      });
      tabs.appendChild(pill);
    });
  }

  function renderVehicleDetail() {
    const container = document.getElementById("vehicleDetail");
    container.innerHTML = "";
    const v = state.maintenance.vehicles.find(x => x.id === state.maintenance.activeVehicleId);
    if (!v) return;
    container.appendChild(renderVehicleCard(v));
  }

  function renderVehicleCard(v) {
    const card = el("div", "card card-wide");

    const head = el("div", "card-head");
    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = "Vehicle name";
    nameInput.style.flex = "1";
    nameInput.value = v.name || "";
    // renaming updates the pill label live, but only the pills re-render —
    // the detail card (and this focused input) is left alone
    nameInput.addEventListener("input", () => { v.name = nameInput.value; saveStore(); renderVehicleTabs(); });
    head.appendChild(nameInput);
    const delVehicle = el("button", "log-item-del", "&times;");
    delVehicle.title = "Remove vehicle";
    delVehicle.addEventListener("click", () => {
      state.maintenance.vehicles = state.maintenance.vehicles.filter(x => x.id !== v.id);
      if (state.maintenance.activeVehicleId === v.id) {
        state.maintenance.activeVehicleId = state.maintenance.vehicles.length ? state.maintenance.vehicles[0].id : null;
      }
      saveStore(); renderMaintenanceVehicles();
    });
    head.appendChild(delVehicle);
    card.appendChild(head);

    const body = el("div", "card-body");

    // current mileage — top of the card, right below the vehicle picker.
    // This is meant to be the ONE thing updated day-to-day, so typing here
    // only refreshes the task list below (checkboxes/status/sort order) —
    // never rebuilds this input itself, so focus/cursor position survives.
    const mileageCol = el("div", "set-col");
    mileageCol.style.maxWidth = "200px";
    mileageCol.appendChild(el("label", "", "Current mileage"));
    const mileageInput = el("input");
    mileageInput.type = "number";
    mileageInput.inputMode = "numeric";
    mileageInput.placeholder = "e.g. 34500";
    if (v.mileage !== null && v.mileage !== undefined) mileageInput.value = v.mileage;
    mileageInput.addEventListener("input", () => {
      v.mileage = mileageInput.value === "" ? null : parseFloat(mileageInput.value);
      saveStore();
      const container = document.getElementById("vehicleTaskListInner");
      if (container) renderVehicleTaskList(v, container);
      updateMaintenanceStatRow();
    });
    mileageCol.appendChild(mileageInput);
    body.appendChild(mileageCol);

    // tasks — right below the mileage section
    const taskHead = el("div", "card-head");
    taskHead.style.padding = "14px 0 4px";
    taskHead.appendChild(el("h3", "", "Maintenance tasks"));
    const addTaskBtn = el("button", "btn-add", "+ Add task");
    addTaskBtn.type = "button";
    addTaskBtn.addEventListener("click", () => {
      v.tasks.push({ id: uid(), name: "", notes: "", frequency: "5000", dueMileage: null });
      saveStore();
      const container = document.getElementById("vehicleTaskListInner");
      if (container) renderVehicleTaskList(v, container);
      const inputs = document.querySelectorAll("#vehicleDetail .exercise-row .exercise-name-input");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    taskHead.appendChild(addTaskBtn);
    body.appendChild(taskHead);

    const taskListEl = el("div");
    taskListEl.id = "vehicleTaskListInner";
    body.appendChild(taskListEl);
    renderVehicleTaskList(v, taskListEl);

    card.appendChild(body);
    return card;
  }

  // status of a single mileage-based task, relative to the vehicle's
  // current mileage
  function vehicleTaskStatus(vehicle, t) {
    if (t.dueMileage === null || t.dueMileage === undefined) return { cls: "status-neutral", label: "not started" };
    if (vehicle.mileage === null || vehicle.mileage === undefined) return { cls: "status-neutral", label: "on track" };
    const remaining = t.dueMileage - vehicle.mileage;
    if (remaining <= 0) return { cls: "status-critical", label: "due now" };
    if (remaining <= 500) return { cls: "status-warning", label: "due soon" };
    return { cls: "status-good", label: "on track" };
  }

  function vehicleTaskMetaText(vehicle, t) {
    if (t.dueMileage === null || t.dueMileage === undefined) return "";
    const due = t.dueMileage.toLocaleString();
    if (vehicle.mileage === null || vehicle.mileage === undefined) return "Due at " + due + " mi";
    const remaining = t.dueMileage - vehicle.mileage;
    if (remaining <= 0) return "Overdue — passed " + due + " mi by " + Math.abs(remaining).toLocaleString() + " mi";
    return "Due at " + due + " mi · " + remaining.toLocaleString() + " mi to go";
  }

  // rebuilds just the task rows for a vehicle — sorted so whatever's coming
  // up soonest (or already due) floats to the top, the "priority list"
  function renderVehicleTaskList(v, container) {
    container.innerHTML = "";
    if (!v.tasks.length) {
      container.appendChild(el("p", "empty-hint", "No maintenance tasks yet."));
      return;
    }
    const sorted = v.tasks.slice().sort((a, b) => {
      const ra = (a.dueMileage === null || a.dueMileage === undefined) ? Infinity : (a.dueMileage - (v.mileage || 0));
      const rb = (b.dueMileage === null || b.dueMileage === undefined) ? Infinity : (b.dueMileage - (v.mileage || 0));
      return ra - rb;
    });
    sorted.forEach(t => container.appendChild(renderVehicleTaskRow(v, t)));
  }

  function renderVehicleTaskRow(vehicle, t) {
    const row = el("div", "exercise-row");
    const head = el("div", "exercise-row-head");

    // checked = currently on-track (a due mileage is set and current
    // mileage hasn't reached it yet). Once mileage catches up, this
    // computes back to unchecked on its own — no manual reset needed —
    // and the status badge + sort position flag it as due.
    const isChecked = t.dueMileage !== null && t.dueMileage !== undefined &&
      vehicle.mileage !== null && vehicle.mileage !== undefined && vehicle.mileage < t.dueMileage;
    const noMileage = vehicle.mileage === null || vehicle.mileage === undefined;

    const nameInput = el("input", "exercise-name-input");
    nameInput.type = "text";
    nameInput.placeholder = "Task name (e.g. Oil change)";
    nameInput.value = t.name || "";
    nameInput.addEventListener("input", () => { t.name = nameInput.value; saveStore(); });
    head.appendChild(nameInput);

    const status = vehicleTaskStatus(vehicle, t);
    head.appendChild(el("span", "status-badge " + status.cls, status.label));

    const del = el("button", "log-item-del", "&times;");
    del.addEventListener("click", () => {
      vehicle.tasks = vehicle.tasks.filter(x => x.id !== t.id);
      saveStore();
      const container = document.getElementById("vehicleTaskListInner");
      if (container) renderVehicleTaskList(vehicle, container);
      updateMaintenanceStatRow();
    });
    head.appendChild(del);
    row.appendChild(head);

    const notes = el("textarea", "notes-textarea");
    notes.placeholder = "Notes…";
    notes.value = t.notes || "";
    notes.addEventListener("input", () => { t.notes = notes.value; saveStore(); });
    row.appendChild(notes);

    // bottom fields grid — mirrors the Home task layout (Frequency next to
    // its "Mark done" control), so the two task types read as siblings even
    // though vehicle's Mark control is a toggle (checked/unchecked) rather
    // than a one-way button like Home's.
    const fieldsGrid = el("div", "exercise-sets-grid cols-2");

    const freqCol = el("div", "set-col");
    freqCol.appendChild(el("label", "", "Frequency"));
    const freqSelect = el("select");
    VEHICLE_FREQUENCIES.forEach(f => {
      const o = el("option", "", f.label);
      o.value = f.key;
      freqSelect.appendChild(o);
    });
    freqSelect.value = t.frequency || "5000";
    freqSelect.addEventListener("change", () => {
      t.frequency = freqSelect.value;
      // already tracking a cycle — recompute the due mileage against the new interval
      if (t.dueMileage !== null && t.dueMileage !== undefined && vehicle.mileage !== null && vehicle.mileage !== undefined) {
        const f = VEHICLE_FREQUENCIES.find(x => x.key === t.frequency);
        t.dueMileage = vehicle.mileage + f.miles;
      }
      saveStore();
      const container = document.getElementById("vehicleTaskListInner");
      if (container) renderVehicleTaskList(vehicle, container);
      updateMaintenanceStatRow();
    });
    freqCol.appendChild(freqSelect);
    fieldsGrid.appendChild(freqCol);

    const doneCol = el("div", "set-col");
    doneCol.appendChild(el("label", "", "Mark"));
    const doneToggle = el("label", "vehicle-done-toggle" + (isChecked ? "" : " is-unchecked") + (noMileage ? " is-disabled" : ""));
    const checkbox = el("input", "vehicle-task-checkbox");
    checkbox.type = "checkbox";
    checkbox.checked = isChecked;
    checkbox.disabled = noMileage;
    checkbox.title = noMileage ? "Set current mileage first" : (isChecked ? "Click to reset" : "Mark done");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        const f = VEHICLE_FREQUENCIES.find(x => x.key === t.frequency) || VEHICLE_FREQUENCIES[0];
        t.dueMileage = vehicle.mileage + f.miles;
      } else {
        t.dueMileage = null;
      }
      saveStore();
      const container = document.getElementById("vehicleTaskListInner");
      if (container) renderVehicleTaskList(vehicle, container);
      updateMaintenanceStatRow();
    });
    doneToggle.appendChild(checkbox);
    doneToggle.appendChild(el("span", "", noMileage ? "Set mileage" : (isChecked ? "✓ Done" : "Mark done")));
    doneCol.appendChild(doneToggle);
    fieldsGrid.appendChild(doneCol);

    row.appendChild(fieldsGrid);

    const metaText = vehicleTaskMetaText(vehicle, t);
    if (metaText) {
      const meta = el("p", "log-item-sub", metaText);
      meta.style.marginTop = "8px";
      row.appendChild(meta);
    }

    return row;
  }

  document.getElementById("addVehicleBtn").addEventListener("click", () => {
    const v = { id: uid(), name: "", mileage: null, tasks: [] };
    state.maintenance.vehicles.push(v);
    state.maintenance.activeVehicleId = v.id; // jump straight to the new vehicle
    saveStore();
    renderMaintenanceVehicles();
    const input = document.querySelector("#vehicleDetail .card-head .exercise-name-input");
    if (input) input.focus();
  });

  /* ---------------------------------------------------------------------
     Modal / form system
     ------------------------------------------------------------------- */
  const backdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");

  function openModal(title, fields, onSubmit) {
    modalTitle.textContent = title;
    modalForm.innerHTML = "";
    fields.forEach(f => {
      const wrap = el("div", "field");
      const label = el("label", "", f.label);
      label.setAttribute("for", "f_" + f.name);
      wrap.appendChild(label);
      let input;
      if (f.type === "select") {
        input = el("select");
        (f.options || []).forEach(opt => {
          const o = el("option", "", opt.label);
          o.value = opt.value;
          input.appendChild(o);
        });
      } else {
        input = el("input");
        input.type = f.type || "text";
        if (f.step) input.step = f.step;
        if (f.placeholder) input.placeholder = f.placeholder;
      }
      input.id = "f_" + f.name;
      input.name = f.name;
      if (f.value !== undefined && f.value !== null) input.value = f.value;
      if (f.required) input.required = true;
      input.addEventListener("input", () => input.classList.remove("field-invalid"));
      wrap.appendChild(input);
      modalForm.appendChild(wrap);
    });
    const submit = el("button", "modal-submit", fields.submitLabel || "Save");
    submit.type = "submit";
    modalForm.appendChild(submit);

    modalForm.onsubmit = (e) => {
      e.preventDefault();

      // Manual validation instead of native HTML5 constraint validation:
      // the native "please fill this in" bubble does not render inside an
      // embedded/iframed preview, so a blocked submit looked like a dead
      // button. Here a missing required field gets a visible red outline
      // and focus instead of silently doing nothing.
      let firstInvalid = null;
      fields.forEach(f => {
        const input = modalForm.elements[f.name];
        input.classList.remove("field-invalid");
        if (f.required && !String(input.value || "").trim()) {
          input.classList.add("field-invalid");
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      const data = {};
      fields.forEach(f => { data[f.name] = modalForm.elements[f.name].value; });
      onSubmit(data);
      closeModal();
    };

    backdrop.hidden = false;
  }
  function closeModal() { backdrop.hidden = true; }
  document.getElementById("modalClose").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });

  /* ---------------------------------------------------------------------
     Action wiring
     ------------------------------------------------------------------- */
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    handleAction(action);
  });
  function handleAction(action) {
    const today = todayKey();
    switch (action) {
      // no cases left — everything (Business, Maintenance) now uses inline
      // editing instead of the modal system. Left in place in case a future
      // feature needs it again.
    }
  }

  /* ---------------------------------------------------------------------
     Init
     ------------------------------------------------------------------- */
  function renderAll() {
    renderOverview();
    renderHealth();
    renderFinance();
    renderBusiness();
    renderMaintenance();
  }

  function init() {
    applyTheme();
    document.getElementById("todayLabel").textContent =
      new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    renderAll();

    // switchTab must run after renderAll() — its auto-grow resize pass
    // needs the panel's textareas to already exist in the DOM
    const startTab = TAB_NAMES.includes(location.hash.replace("#", ""))
      ? location.hash.replace("#", "") : "overview";
    switchTab(startTab);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {});
      });
    }
  }

  init();
})();
