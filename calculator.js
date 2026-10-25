(function () {
  var root = document.getElementById("calc-app");
  if (!root) return;

  var CURRENT_KEY = "atelier-noir-calculator";
  var SAVED_KEY = "atelier-noir-calculator-saved";
  var AREA_MIN = 20;
  var AREA_MAX = 500;
  var PACKAGE_RATES = { essential: 3500, signature: 5500, bespoke: 8000 };
  var PROPERTY_COEFF = { apartment: 1, house: 1.15 };
  var EXTRA_DEFS = {
    visualization: { kind: "area", rate: 1200 },
    supervision: { kind: "area", rate: 1500 },
    furniture: { kind: "flat", rate: 65000 }
  };
  var PACKAGES = ["essential", "signature", "bespoke"];
  var PROPERTIES = ["apartment", "house"];
  var EXTRAS = ["visualization", "supervision", "furniture"];
  var FALLBACK = {
    property: "apartment",
    area: 80,
    package: "signature",
    extras: { visualization: false, supervision: false, furniture: false }
  };

  var state = clone(FALLBACK);
  var statusTimer = 0;

  function clone(value) {
    return {
      property: value.property,
      area: value.area,
      package: value.package,
      extras: {
        visualization: !!value.extras.visualization,
        supervision: !!value.extras.supervision,
        furniture: !!value.extras.furniture
      }
    };
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* storage unavailable */
    }
  }

  function text(key) {
    return window.t ? window.t(key) : key;
  }

  function clampArea(value) {
    var number = typeof value === "number" ? value : parseInt(value, 10);
    if (!isFinite(number)) return AREA_MIN;
    if (number < AREA_MIN) return AREA_MIN;
    if (number > AREA_MAX) return AREA_MAX;
    return Math.round(number);
  }

  function calculate(input) {
    var area = clampArea(input.area);
    var property = PROPERTIES.indexOf(input.property) === -1 ? "apartment" : input.property;
    var pack = PACKAGES.indexOf(input.package) === -1 ? "signature" : input.package;
    var coeff = PROPERTY_COEFF[property];
    var rate = PACKAGE_RATES[pack];
    var base = area * rate * coeff;
    var extras = {};
    var extrasTotal = 0;

    EXTRAS.forEach(function (id) {
      var def = EXTRA_DEFS[id];
      var amount = 0;
      if (input.extras && input.extras[id]) {
        amount = def.kind === "area" ? area * def.rate : def.rate;
      }
      extras[id] = amount;
      extrasTotal += amount;
    });

    return {
      area: area,
      property: property,
      package: pack,
      rate: rate,
      coeff: coeff,
      base: base,
      extras: extras,
      extrasTotal: extrasTotal,
      total: base + extrasTotal
    };
  }

  function formatMoney(value) {
    var locale = (window.getLanguage && window.getLanguage() === "en") ? "en-US" : "ru-RU";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "RUB",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatRate(rate) {
    return formatMoney(rate) + "/" + text("calc.unit");
  }

  function formatArea(area) {
    return area + " " + text("calc.unit");
  }

  function normalize(raw) {
    var next = clone(FALLBACK);
    if (!raw || typeof raw !== "object") return next;
    if (PROPERTIES.indexOf(raw.property) !== -1) next.property = raw.property;
    if (PACKAGES.indexOf(raw.package) !== -1) next.package = raw.package;
    next.area = clampArea(raw.area);
    if (raw.extras && typeof raw.extras === "object") {
      EXTRAS.forEach(function (id) {
        next.extras[id] = !!raw.extras[id];
      });
    }
    return next;
  }

  function setStatus(key) {
    var node = document.getElementById("calc-status");
    if (!node) return;
    node.textContent = text(key);
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(function () {
      node.textContent = "";
    }, 2600);
  }

  function syncRestore() {
    var button = document.getElementById("calc-restore");
    if (button) button.disabled = !readJSON(SAVED_KEY);
  }

  function fillRates() {
    document.querySelectorAll("[data-package-rate]").forEach(function (node) {
      var id = node.getAttribute("data-package-rate");
      node.textContent = formatRate(PACKAGE_RATES[id]);
    });
    document.querySelectorAll("[data-extra-rate]").forEach(function (node) {
      var id = node.getAttribute("data-extra-rate");
      var def = EXTRA_DEFS[id];
      node.textContent = def.kind === "area" ? formatRate(def.rate) : formatMoney(def.rate);
    });
  }

  function render(persist) {
    var estimate = calculate(state);
    var range = document.getElementById("calc-range");
    var number = document.getElementById("calc-area");
    var fill = document.getElementById("calc-range-fill");
    var error = document.getElementById("calc-area-error");

    if (document.activeElement !== number) number.value = String(estimate.area);
    range.value = String(estimate.area);
    fill.style.width = ((estimate.area - AREA_MIN) / (AREA_MAX - AREA_MIN) * 100) + "%";
    range.setAttribute("aria-valuenow", String(estimate.area));
    range.setAttribute("aria-valuetext", formatArea(estimate.area));

    var raw = parseInt(number.value, 10);
    var invalid = number.value !== "" && (!isFinite(raw) || raw < AREA_MIN || raw > AREA_MAX);
    error.hidden = !invalid;
    number.setAttribute("aria-invalid", invalid ? "true" : "false");

    document.querySelectorAll("[data-calc='property']").forEach(function (button) {
      var on = button.getAttribute("data-value") === estimate.property;
      button.setAttribute("aria-checked", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-calc='package']").forEach(function (button) {
      var on = button.getAttribute("data-value") === estimate.package;
      button.setAttribute("aria-checked", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-calc='extra']").forEach(function (button) {
      var on = !!state.extras[button.getAttribute("data-value")];
      button.setAttribute("aria-checked", on ? "true" : "false");
    });

    document.getElementById("out-area").textContent = formatArea(estimate.area);
    document.getElementById("out-property").setAttribute("data-i18n", "calc.property." + estimate.property);
    document.getElementById("out-package").setAttribute("data-i18n", "calc.package." + estimate.package);
    document.getElementById("out-base").textContent = formatMoney(estimate.base);
    document.getElementById("out-total").textContent = formatMoney(estimate.total);
    document.getElementById("calc-total").textContent = formatMoney(estimate.total);

    EXTRAS.forEach(function (id) {
      var cell = document.getElementById("out-" + id);
      var row = document.getElementById("row-" + id);
      if (!cell) return;
      if (state.extras[id]) {
        cell.removeAttribute("data-i18n");
        cell.textContent = formatMoney(estimate.extras[id]);
        if (row) row.hidden = false;
      } else {
        cell.setAttribute("data-i18n", "calc.none");
        if (row) row.hidden = false;
      }
    });

    fillRates();
    if (window.translatePage) window.translatePage();
    if (persist !== false) writeJSON(CURRENT_KEY, state);
  }

  function apply(next, persist) {
    state = clone(next);
    render(persist);
  }

  function bindRadios(selector, key) {
    var group = document.querySelector(selector);
    if (!group) return;

    group.addEventListener("click", function (event) {
      var button = event.target.closest("[data-calc='" + key + "']");
      if (!button || !group.contains(button)) return;
      state[key] = button.getAttribute("data-value");
      render();
    });

    group.addEventListener("keydown", function (event) {
      var button = event.target.closest("[data-calc='" + key + "']");
      if (!button || !group.contains(button)) return;
      var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-calc='" + key + "']"));
      var index = buttons.indexOf(button);
      var delta = 0;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") delta = 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") delta = -1;
      if (delta !== 0) {
        event.preventDefault();
        var next = buttons[(index + delta + buttons.length) % buttons.length];
        state[key] = next.getAttribute("data-value");
        render();
        next.focus();
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        state[key] = button.getAttribute("data-value");
        render();
      }
    });
  }

  bindRadios("[data-group='property']", "property");
  bindRadios("[data-group='package']", "package");

  document.querySelector("[data-group='extras']").addEventListener("click", function (event) {
    var button = event.target.closest("[data-calc='extra']");
    if (!button) return;
    var id = button.getAttribute("data-value");
    state.extras[id] = !state.extras[id];
    render();
  });

  document.querySelector("[data-group='extras']").addEventListener("keydown", function (event) {
    var button = event.target.closest("[data-calc='extra']");
    if (!button) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      var id = button.getAttribute("data-value");
      state.extras[id] = !state.extras[id];
      render();
    }
  });

  var range = document.getElementById("calc-range");
  var number = document.getElementById("calc-area");

  range.addEventListener("input", function () {
    state.area = clampArea(range.value);
    number.value = String(state.area);
    render();
  });

  number.addEventListener("input", function () {
    var raw = parseInt(number.value, 10);
    if (!isFinite(raw)) {
      render(false);
      return;
    }
    state.area = clampArea(raw);
    render();
  });

  number.addEventListener("blur", function () {
    state.area = clampArea(number.value);
    number.value = String(state.area);
    render();
  });

  document.getElementById("calc-reset").addEventListener("click", function () {
    apply(FALLBACK);
    number.value = String(state.area);
    setStatus("calc.reset.done");
  });

  document.getElementById("calc-save").addEventListener("click", function () {
    writeJSON(SAVED_KEY, state);
    syncRestore();
    setStatus("calc.saved");
  });

  document.getElementById("calc-restore").addEventListener("click", function () {
    var saved = readJSON(SAVED_KEY);
    if (!saved) return;
    apply(normalize(saved));
    number.value = String(state.area);
    setStatus("calc.restored");
  });

  if (window.onLanguageChange) {
    window.onLanguageChange(function () {
      var node = document.getElementById("calc-status");
      if (node) node.textContent = "";
      render(false);
    });
  }

  window.atelierCalculate = calculate;

  syncRestore();
  apply(normalize(readJSON(CURRENT_KEY)));
})();
