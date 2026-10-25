(function () {
  var scene = document.getElementById("cfg-scene");
  if (!scene) return;

  var CURRENT_KEY = "atelier-noir-config";
  var SAVED_KEY = "atelier-noir-config-saved";
  var QUIZ_KEY = "atelier-noir-quiz";
  var KEYS = ["walls", "flooring", "sofa", "lighting", "decor"];
  var ATTR = {
    walls: "data-wall",
    flooring: "data-flooring",
    sofa: "data-sofa",
    lighting: "data-lighting",
    decor: "data-decor"
  };
  var OPTIONS = {
    walls: ["ivory", "sand", "graphite"],
    flooring: ["light-oak", "walnut", "natural-stone"],
    sofa: ["cream", "caramel", "grey"],
    lighting: ["soft-ambient", "architectural", "decorative"],
    decor: ["minimal", "contemporary", "artistic"]
  };
  var SUGGESTIONS = {
    "warm-minimalism": { walls: "sand", flooring: "light-oak", sofa: "cream", lighting: "soft-ambient", decor: "minimal" },
    japandi: { walls: "ivory", flooring: "natural-stone", sofa: "grey", lighting: "architectural", decor: "minimal" },
    "contemporary-luxury": { walls: "graphite", flooring: "walnut", sofa: "caramel", lighting: "decorative", decor: "contemporary" },
    "modern-classic": { walls: "ivory", flooring: "walnut", sofa: "cream", lighting: "decorative", decor: "artistic" }
  };
  var FALLBACK = SUGGESTIONS["warm-minimalism"];

  var state = FALLBACK;
  var statusTimer = 0;

  function clone(config) {
    var next = {};
    KEYS.forEach(function (key) {
      next[key] = config[key];
    });
    return next;
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

  function quizStyleId() {
    var quiz = readJSON(QUIZ_KEY);
    var id = quiz && quiz.styleId;
    return id && SUGGESTIONS[id] ? id : null;
  }

  function suggested() {
    var id = quizStyleId();
    return clone(id ? SUGGESTIONS[id] : FALLBACK);
  }

  function normalize(raw) {
    var next = suggested();
    if (!raw || typeof raw !== "object") return next;
    KEYS.forEach(function (key) {
      if (OPTIONS[key].indexOf(raw[key]) !== -1) next[key] = raw[key];
    });
    return next;
  }

  function text(key) {
    return window.t ? window.t(key) : key;
  }

  function setStatus(key) {
    var node = document.getElementById("cfg-status");
    if (!node) return;
    node.textContent = text(key);
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(function () {
      node.textContent = "";
    }, 2600);
  }

  function syncRestore() {
    var button = document.getElementById("cfg-restore");
    if (button) button.disabled = !readJSON(SAVED_KEY);
  }

  function apply(next, persist) {
    state = clone(next);
    KEYS.forEach(function (key) {
      scene.setAttribute(ATTR[key], state[key]);
    });

    document.querySelectorAll(".cfg-opt").forEach(function (button) {
      var key = button.getAttribute("data-cfg");
      var on = state[key] === button.getAttribute("data-value");
      button.setAttribute("aria-checked", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });

    KEYS.forEach(function (key) {
      var cell = document.getElementById("sum-" + key);
      if (cell) cell.setAttribute("data-i18n", "cfg." + key + "." + state[key]);
    });

    if (window.translatePage) window.translatePage();
    if (persist !== false) writeJSON(CURRENT_KEY, state);
  }

  function choose(key, value) {
    if (OPTIONS[key].indexOf(value) === -1) return;
    var next = clone(state);
    next[key] = value;
    apply(next);
  }

  function showStyle() {
    var box = document.getElementById("cfg-style");
    var name = document.getElementById("cfg-style-name");
    var id = quizStyleId();
    if (!box || !name) return;
    if (!id) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    name.setAttribute("data-i18n", "quiz.style." + id + ".name");
  }

  document.querySelectorAll(".cfg-options").forEach(function (group) {
    group.addEventListener("click", function (event) {
      var button = event.target.closest(".cfg-opt");
      if (!button || !group.contains(button)) return;
      choose(button.getAttribute("data-cfg"), button.getAttribute("data-value"));
    });

    group.addEventListener("keydown", function (event) {
      var button = event.target.closest(".cfg-opt");
      if (!button || !group.contains(button)) return;

      var buttons = Array.prototype.slice.call(group.querySelectorAll(".cfg-opt"));
      var index = buttons.indexOf(button);
      var delta = 0;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") delta = 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") delta = -1;

      if (delta !== 0) {
        event.preventDefault();
        var next = buttons[(index + delta + buttons.length) % buttons.length];
        choose(next.getAttribute("data-cfg"), next.getAttribute("data-value"));
        next.focus();
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        choose(button.getAttribute("data-cfg"), button.getAttribute("data-value"));
      }
    });
  });

  document.getElementById("cfg-reset").addEventListener("click", function () {
    apply(suggested());
    setStatus("cfg.reset.done");
  });

  document.getElementById("cfg-save").addEventListener("click", function () {
    writeJSON(SAVED_KEY, state);
    syncRestore();
    setStatus("cfg.saved");
  });

  document.getElementById("cfg-restore").addEventListener("click", function () {
    var saved = readJSON(SAVED_KEY);
    if (!saved) return;
    apply(normalize(saved));
    setStatus("cfg.restored");
  });

  if (window.onLanguageChange) {
    window.onLanguageChange(function () {
      var node = document.getElementById("cfg-status");
      if (node) node.textContent = "";
    });
  }

  showStyle();
  syncRestore();
  apply(normalize(readJSON(CURRENT_KEY)));
})();
