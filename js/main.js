(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var desktop = window.matchMedia("(min-width: 981px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function markFrame(img) {
    var frame = img && img.closest ? img.closest(".frame") : null;
    if (!frame || frame.classList.contains("is-fallback")) return;
    frame.classList.add("is-fallback");
    var key = img.getAttribute("data-i18n-alt");
    if (key) frame.setAttribute("data-i18n-aria-label", key);
    var label = key && window.t ? window.t(key) : img.alt;
    if (label) frame.setAttribute("aria-label", label);
    img.remove();
  }

  window.markFrame = markFrame;

  document.querySelectorAll(".frame img").forEach(function (img) {
    var frame = img.closest(".frame");
    if (!frame) return;

    var show = function () {
      frame.classList.add("is-loaded");
    };

    if (img.complete) {
      if (img.naturalWidth > 0) {
        frame.classList.add("is-instant");
        show();
      } else {
        markFrame(img);
      }
      return;
    }

    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", function () {
      markFrame(img);
    }, { once: true });
  });

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? t("nav.close") : t("nav.open"));
      document.body.classList.toggle("nav-open", open);

      if (desktop.matches) {
        nav.inert = false;
      } else {
        nav.inert = !open;
      }

      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      }
    };

    var close = function () {
      setOpen(false);
    };

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!desktop.matches) close();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!nav.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        close();
        toggle.focus({ preventScroll: true });
        return;
      }

      if (event.key !== "Tab") return;

      var items = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    var menuLabel = function () {
      var open = nav.classList.contains("is-open");
      toggle.setAttribute("aria-label", open ? t("nav.close") : t("nav.open"));
    };

    var syncNav = function () {
      if (desktop.matches) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
        nav.inert = false;
      } else if (!nav.classList.contains("is-open")) {
        nav.inert = true;
      }
      menuLabel();
    };

    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", syncNav);
    }

    syncNav();

    if (window.onLanguageChange) {
      window.onLanguageChange(menuLabel);
    }
  }

  var revealNodes = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach(function (node) {
      node.classList.add("is-visible");
    });
  } else if (revealNodes.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    });

    revealNodes.forEach(function (node) {
      revealObserver.observe(node);
    });
  }

  var spySections = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var spyFrame = false;

  function updateSpy() {
    spyFrame = false;
    if (!spySections.length || !spyLinks.length) return;

    var marker = 120;
    var current = spySections[0].id;

    spySections.forEach(function (section) {
      var top = section.getBoundingClientRect().top;
      if (top <= marker) current = section.id;
    });

    var root = document.documentElement;
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
      current = spySections[spySections.length - 1].id;
    }

    spyLinks.forEach(function (link) {
      if (link.getAttribute("data-nav") === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("scroll", function () {
    if (spyFrame) return;
    spyFrame = true;
    window.requestAnimationFrame(updateSpy);
  }, { passive: true });

  updateSpy();
})();
