(function () {
  var flow = document.getElementById("quiz-flow");
  if (!flow) return;

  var STORAGE_KEY = "atelier-noir-quiz";

  /* Earlier styles win a tie. */
  var STYLE_ORDER = ["warm-minimalism", "japandi", "contemporary-luxury", "modern-classic"];

  var QUESTIONS = [
    {
      id: "atmosphere",
      options: [
        { id: "quiet-warm", image: "assets/images/project-01.webp", position: "center 40%", scores: { "warm-minimalism": 3, japandi: 1 } },
        { id: "calm-exact", image: "assets/images/quiz-chair.webp", position: "center 70%", scores: { japandi: 3, "warm-minimalism": 1 } },
        { id: "composed", image: "assets/images/hero.webp", position: "center 46%", scores: { "contemporary-luxury": 3, "modern-classic": 1 } },
        { id: "familiar", image: "assets/images/quiz-curtains.webp", position: "center 58%", scores: { "modern-classic": 3, "warm-minimalism": 1 } }
      ]
    },
    {
      id: "colour",
      options: [
        { id: "sand", image: "assets/images/quiz-bed.webp", position: "center 45%", scores: { "warm-minimalism": 3 } },
        { id: "stone", image: "assets/images/quiz-stone.webp", position: "center 42%", scores: { japandi: 3 } },
        { id: "bronze", image: "assets/images/quiz-dark.webp", position: "center 55%", scores: { "contemporary-luxury": 3 } },
        { id: "ivory", image: "assets/images/quiz-arches.webp", position: "center 48%", scores: { "modern-classic": 3 } }
      ]
    },
    {
      id: "material",
      options: [
        { id: "oak", image: "assets/images/quiz-oak.webp", position: "center 62%", scores: { "warm-minimalism": 3, "modern-classic": 1 } },
        { id: "ash", image: "assets/images/quiz-fire.webp", position: "center 58%", scores: { japandi: 3 } },
        { id: "marble", image: "assets/images/calculator-preview.webp", position: "center 45%", scores: { "contemporary-luxury": 3 } },
        { id: "walnut", image: "assets/images/quiz-woodbed.webp", position: "center 42%", scores: { "modern-classic": 3, "warm-minimalism": 1 } }
      ]
    },
    {
      id: "space",
      options: [
        { id: "living", image: "assets/images/project-02.webp", position: "center 48%", scores: { "warm-minimalism": 2, "contemporary-luxury": 1 } },
        { id: "quiet", image: "assets/images/quiz-curve.webp", position: "center 50%", scores: { japandi: 3 } },
        { id: "salon", image: "assets/images/quiz-preview.webp", position: "center 50%", scores: { "contemporary-luxury": 2, "modern-classic": 1 } },
        { id: "lasting", image: "assets/images/studio.webp", position: "center 42%", scores: { "modern-classic": 2, "warm-minimalism": 1 } }
      ]
    },
    {
      id: "priority",
      options: [
        { id: "light", image: "assets/images/project-03.webp", position: "center 55%", scores: { "warm-minimalism": 2, japandi: 2 } },
        { id: "proportion", image: "assets/images/quiz-slit.webp", position: "center 48%", scores: { japandi: 2, "modern-classic": 1 } },
        { id: "texture", image: "assets/images/quiz-linen.webp", position: "center 62%", scores: { "contemporary-luxury": 3 } },
        { id: "lasting", image: "assets/images/configurator-preview.webp", position: "center 50%", scores: { "modern-classic": 3 } }
      ]
    },
    {
      id: "life",
      options: [
        { id: "refuge", image: "assets/images/quiz-bed.webp", position: "center 28%", scores: { "warm-minimalism": 2, japandi: 1 } },
        { id: "ritual", image: "assets/images/quiz-stone.webp", position: "left center", scores: { japandi: 2, "warm-minimalism": 1 } },
        { id: "hosting", image: "assets/images/hero.webp", position: "center 72%", scores: { "contemporary-luxury": 2, "modern-classic": 1 } },
        { id: "family", image: "assets/images/quiz-oak.webp", position: "center 28%", scores: { "modern-classic": 2, "warm-minimalism": 1 } }
      ]
    }
  ];

  var STYLES = {
    "warm-minimalism": {
      image: "assets/images/project-01.webp",
      colors: ["#E4CDB4", "#C4A484", "#F4EFE6", "#8C7360"]
    },
    japandi: {
      image: "assets/images/quiz-stone.webp",
      colors: ["#D9D3C8", "#8E8A84", "#5E5A55", "#E7E1D6"]
    },
    "contemporary-luxury": {
      image: "assets/images/hero.webp",
      colors: ["#E6D3C0", "#B08968", "#6B5344", "#C8B7A4"]
    },
    "modern-classic": {
      image: "assets/images/quiz-arches.webp",
      colors: ["#F3E6D2", "#C2B48A", "#8A7A4E", "#E7D7C3"]
    }
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var moving = false;
  var state = emptyState();

  function emptyState() {
    return { answers: {}, step: 0, result: null, styleId: null, done: false };
  }

  function optionById(question, optionId) {
    var found = null;
    question.options.forEach(function (option) {
      if (option.id === optionId) found = option;
    });
    return found;
  }

  function scoreAnswers(answers) {
    var scores = {};
    STYLE_ORDER.forEach(function (id) {
      scores[id] = 0;
    });

    QUESTIONS.forEach(function (question) {
      var chosen = optionById(question, answers[question.id]);
      if (!chosen) return;
      STYLE_ORDER.forEach(function (id) {
        if (chosen.scores[id]) scores[id] += chosen.scores[id];
      });
    });

    var winner = STYLE_ORDER[0];
    STYLE_ORDER.forEach(function (id) {
      if (scores[id] > scores[winner]) winner = id;
    });

    return { styleId: winner, scores: scores };
  }

  function loadState() {
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      saved = null;
    }

    var next = emptyState();
    if (!saved || typeof saved.answers !== "object" || !saved.answers) return next;

    QUESTIONS.forEach(function (question) {
      if (optionById(question, saved.answers[question.id])) {
        next.answers[question.id] = saved.answers[question.id];
      }
    });

    var complete = QUESTIONS.every(function (question) {
      return next.answers[question.id];
    });

    if (complete) {
      var scored = scoreAnswers(next.answers);
      next.result = scored;
      next.styleId = scored.styleId;
      next.step = QUESTIONS.length - 1;
      next.done = true;
      return next;
    }

    var step = parseInt(saved.step, 10);
    if (step >= 0 && step < QUESTIONS.length) next.step = step;
    return next;
  }

  function saveState() {
    var payload = {
      answers: state.answers,
      result: state.done ? state.result : null,
      styleId: state.done ? state.styleId : null,
      step: state.step
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      /* storage unavailable */
    }
  }

  function pad(number) {
    return (number < 10 ? "0" : "") + number;
  }

  function text(key) {
    return window.t ? window.t(key) : key;
  }

  function renderProgress() {
    var current = state.step + 1;
    var currentNode = document.getElementById("quiz-current");
    var track = document.getElementById("quiz-track");
    var fill = document.getElementById("quiz-fill");
    if (currentNode) currentNode.textContent = pad(current);
    if (fill) fill.style.width = (current / QUESTIONS.length * 100) + "%";
    if (!track) return;
    track.setAttribute("aria-valuenow", String(current));
    track.setAttribute("aria-valuetext", text("quiz.progress") + " " + current + " / " + QUESTIONS.length);
  }

  function watchImage(img) {
    var frame = img.closest(".frame");
    if (!frame) return;

    var show = function () {
      frame.classList.add("is-loaded");
    };

    if (img.complete) {
      if (img.naturalWidth > 0) {
        frame.classList.add("is-instant");
        show();
      } else if (img.getAttribute("src") && window.markFrame) {
        window.markFrame(img);
      }
      return;
    }

    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", function () {
      if (window.markFrame) window.markFrame(img);
    }, { once: true });
  }

  function hideError() {
    document.getElementById("quiz-error").hidden = true;
  }

  function showError() {
    document.getElementById("quiz-error").hidden = false;
  }

  function renderQuestion(animate, focus) {
    var question = QUESTIONS[state.step];
    var stage = document.getElementById("quiz-stage");

    var apply = function () {
      var heading = document.getElementById("quiz-question");
      heading.setAttribute("data-i18n", "quiz.q." + question.id);

      var group = document.getElementById("quiz-options");
      group.replaceChildren();

      question.options.forEach(function (option, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.setAttribute("data-option", option.id);
        button.setAttribute("aria-pressed", state.answers[question.id] === option.id ? "true" : "false");

        var media = document.createElement("span");
        media.className = "choice__media frame frame--choice";

        var img = document.createElement("img");
        img.alt = "";
        img.width = 1200;
        img.height = 800;
        img.decoding = "async";
        img.style.objectPosition = option.position;
        img.setAttribute("data-i18n-alt", "quiz.q." + question.id + "." + option.id);
        img.src = option.image;

        var note = document.createElement("p");
        note.className = "frame__note";
        note.setAttribute("aria-hidden", "true");
        note.textContent = option.image.split("/").pop();

        media.appendChild(img);
        media.appendChild(note);

        var body = document.createElement("span");
        body.className = "choice__body";

        var marker = document.createElement("span");
        marker.className = "choice__index";
        marker.textContent = pad(index + 1);

        var label = document.createElement("span");
        label.className = "choice__label";
        label.setAttribute("data-i18n", "quiz.q." + question.id + "." + option.id);

        body.appendChild(marker);
        body.appendChild(label);
        button.appendChild(media);
        button.appendChild(body);

        button.addEventListener("click", function () {
          select(option.id);
        });

        group.appendChild(button);
        watchImage(img);
      });

      document.getElementById("quiz-next-label").setAttribute(
        "data-i18n",
        state.step === QUESTIONS.length - 1 ? "quiz.finish" : "quiz.next"
      );
      document.getElementById("quiz-back").disabled = state.step === 0;
      if (window.translatePage) window.translatePage();
      renderProgress();

      if (focus) heading.focus({ preventScroll: true });
    };

    if (!animate || reduceMotion) {
      apply();
      return;
    }

    moving = true;
    stage.classList.add("is-leaving");
    window.setTimeout(function () {
      apply();
      stage.classList.remove("is-leaving");
      moving = false;
    }, 280);
  }

  function select(optionId) {
    if (moving) return;
    state.answers[QUESTIONS[state.step].id] = optionId;
    state.done = false;
    state.result = null;
    state.styleId = null;
    saveState();
    hideError();

    document.querySelectorAll(".choice").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-option") === optionId ? "true" : "false");
    });
  }

  function scrollToFlow() {
    flow.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function next() {
    if (moving) return;
    if (!state.answers[QUESTIONS[state.step].id]) {
      showError();
      return;
    }

    hideError();

    if (state.step === QUESTIONS.length - 1) {
      finish();
      return;
    }

    state.step += 1;
    saveState();
    scrollToFlow();
    renderQuestion(true, true);
  }

  function back() {
    if (moving || state.step === 0) return;
    hideError();
    state.step -= 1;
    saveState();
    scrollToFlow();
    renderQuestion(true, true);
  }

  function setResultImage(src, altKey) {
    var frame = document.getElementById("result-frame");
    var note = frame.querySelector(".frame__note");
    var img = frame.querySelector("img");
    frame.classList.remove("is-loaded", "is-instant", "is-fallback");

    if (!img) {
      img = document.createElement("img");
      img.width = 1280;
      img.height = 853;
      img.decoding = "async";
      frame.insertBefore(img, note);
    }

    img.alt = "";
    img.setAttribute("data-i18n-alt", altKey);
    img.src = src;
    if (note) note.textContent = src.split("/").pop();
    watchImage(img);
  }

  function fillList(list, count, className, keyFor) {
    list.replaceChildren();
    var index;
    for (index = 1; index <= count; index += 1) {
      var item = document.createElement("li");
      item.className = className;
      var name = document.createElement("span");
      name.setAttribute("data-i18n", keyFor(index));
      item.appendChild(name);
      list.appendChild(item);
    }
  }

  function showResult() {
    var id = state.styleId;
    var style = STYLES[id];
    if (!style) return;

    document.getElementById("quiz").hidden = true;
    var result = document.getElementById("result");
    result.hidden = false;

    document.getElementById("result-title").setAttribute("data-i18n", "quiz.style." + id + ".name");
    document.getElementById("result-text").setAttribute("data-i18n", "quiz.style." + id + ".text");

    var palette = document.getElementById("result-palette");
    palette.replaceChildren();
    style.colors.forEach(function (color, index) {
      var item = document.createElement("li");
      item.className = "swatch";
      var chip = document.createElement("span");
      chip.className = "swatch__chip";
      chip.style.backgroundColor = color;
      var name = document.createElement("span");
      name.className = "swatch__name";
      name.setAttribute("data-i18n", "quiz.style." + id + ".c" + (index + 1));
      item.appendChild(chip);
      item.appendChild(name);
      palette.appendChild(item);
    });

    fillList(document.getElementById("result-materials"), 3, "materials__item", function (index) {
      return "quiz.style." + id + ".m" + index;
    });

    setResultImage(style.image, "quiz.style." + id + ".alt");
    if (window.translatePage) window.translatePage();
    document.documentElement.classList.remove("quiz-result-pending");
    window.scrollTo(0, 0);
    document.getElementById("result-title").focus({ preventScroll: true });
  }

  function finish() {
    var complete = QUESTIONS.every(function (question) {
      return state.answers[question.id];
    });
    if (!complete) {
      QUESTIONS.some(function (question, index) {
        if (state.answers[question.id]) return false;
        state.step = index;
        return true;
      });
      saveState();
      showError();
      renderQuestion(false, true);
      return;
    }

    var scored = scoreAnswers(state.answers);
    state.result = scored;
    state.styleId = scored.styleId;
    state.done = true;
    state.step = QUESTIONS.length - 1;
    saveState();
    showResult();
  }

  function restart() {
    state = emptyState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* storage unavailable */
    }

    document.getElementById("result").hidden = true;
    document.getElementById("quiz").hidden = false;
    document.documentElement.classList.remove("quiz-result-pending");
    hideError();
    renderQuestion(false, false);
    window.scrollTo(0, 0);
    document.getElementById("quiz-title").focus({ preventScroll: true });
  }

  document.getElementById("quiz-back").addEventListener("click", back);
  document.getElementById("quiz-next").addEventListener("click", next);
  document.getElementById("quiz-restart").addEventListener("click", restart);

  if (window.onLanguageChange) {
    window.onLanguageChange(function () {
      renderProgress();
    });
  }

  state = loadState();
  if (state.done) {
    saveState();
    showResult();
  } else {
    document.documentElement.classList.remove("quiz-result-pending");
    renderQuestion(false, false);
  }

  window.atelierQuiz = {
    scoreAnswers: scoreAnswers,
    order: STYLE_ORDER.slice()
  };
})();
