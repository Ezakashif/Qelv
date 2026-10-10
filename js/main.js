/**
 * Satellite Data Labs — interaction layer.
 * Dependency-free, progressive enhancement only: every feature degrades to
 * readable static content when JavaScript is unavailable (see .no-js in main.css).
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  root.classList.remove("no-js");

  /* ----------------------------------------------------------
     Theme / direction switcher — persisted across pages
     ---------------------------------------------------------- */

  var THEME_KEY = "sdl:direction";
  var VALID_THEMES = ["a", "b", "c"];

  function readStoredTheme() {
    try {
      var stored = window.localStorage.getItem(THEME_KEY);
      return VALID_THEMES.indexOf(stored) > -1 ? stored : null;
    } catch {
      return null;
    }
  }

  function storeTheme(id) {
    try {
      window.localStorage.setItem(THEME_KEY, id);
    } catch {
      /* Private mode or blocked storage — the switcher still works for this page. */
    }
  }

  function initThemeSwitch() {
    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("[data-set-direction]")
    );
    if (!buttons.length) return;

    var status = document.getElementById("theme-status");

    function apply(id, announce) {
      root.setAttribute("data-direction", id);
      buttons.forEach(function (btn) {
        btn.setAttribute(
          "aria-pressed",
          btn.getAttribute("data-set-direction") === id ? "true" : "false"
        );
      });
      if (announce && status) {
        status.textContent = "Visual direction " + id.toUpperCase() + " applied.";
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-set-direction");
        apply(id, true);
        storeTheme(id);
      });
    });

    apply(readStoredTheme() || root.getAttribute("data-direction") || "a", false);
  }

  /* ----------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    var desktop = window.matchMedia("(min-width: 55rem)");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.setAttribute("data-open", open ? "true" : "false");
    }

    function syncToViewport() {
      setOpen(desktop.matches);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && !desktop.matches) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || desktop.matches) return;
      if (toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    if (desktop.addEventListener) {
      desktop.addEventListener("change", syncToViewport);
    } else if (desktop.addListener) {
      desktop.addListener(syncToViewport);
    }

    syncToViewport();
  }

  /* ----------------------------------------------------------
     Sticky header state + scroll progress
     ---------------------------------------------------------- */

  function initScrollChrome() {
    var header = document.querySelector(".site-header");
    var progress = document.querySelector(".scroll-progress");
    if (!header && !progress) return;

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;

      if (header) {
        header.setAttribute("data-stuck", y > 8 ? "true" : "false");
      }

      if (progress) {
        var scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        var ratio = scrollable > 0 ? Math.min(y / scrollable, 1) : 0;
        progress.style.setProperty("--progress", ratio.toFixed(4));
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------- */

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------
     Animated counters
     ---------------------------------------------------------- */

  function initCounters() {
    var counters = Array.prototype.slice.call(
      document.querySelectorAll("[data-count-to]")
    );
    if (!counters.length) return;

    function format(el, value) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      return prefix + value.toFixed(decimals) + suffix;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      if (isNaN(target)) return;

      if (reduceMotion.matches) {
        el.textContent = format(el, target);
        return;
      }

      var duration = 1100;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(el, target * eased);
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------
     Approach stepper — ARIA tabs with roving focus
     ---------------------------------------------------------- */

  function initStepper() {
    var list = document.querySelector("[data-stepper]");
    if (!list) return;

    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function select(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      if (moveFocus) tabs[index].focus();
      var nav = tabs[index].parentNode;
      if (nav && nav.scrollWidth > nav.clientWidth) {
        nav.scrollLeft = tabs[index].offsetLeft - nav.offsetLeft - 16;
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i, false);
      });

      tab.addEventListener("keydown", function (event) {
        var last = tabs.length - 1;
        var next;

        switch (event.key) {
          case "ArrowDown":
          case "ArrowRight":
            next = i === last ? 0 : i + 1;
            break;
          case "ArrowUp":
          case "ArrowLeft":
            next = i === 0 ? last : i - 1;
            break;
          case "Home":
            next = 0;
            break;
          case "End":
            next = last;
            break;
          default:
            return;
        }

        event.preventDefault();
        select(next, true);
      });
    });

    select(0, false);
  }

  /* ----------------------------------------------------------
     Interactive compset demo
     ---------------------------------------------------------- */

  var MARKETS = {
    "city-centre": {
      label: "City centre",
      base: 214,
      currency: "$",
      comps: [
        { name: "Harbour View", index: 1.12, phase: 0.4 },
        { name: "The Meridian", index: 1.04, phase: 1.9 },
        { name: "Station Grand", index: 0.93, phase: 3.1 },
        { name: "Wellington House", index: 0.87, phase: 4.6 }
      ]
    },
    airport: {
      label: "Airport",
      base: 148,
      currency: "$",
      comps: [
        { name: "Runway Suites", index: 1.06, phase: 1.2 },
        { name: "Terminal Lodge", index: 0.98, phase: 2.4 },
        { name: "Skyline Inn", index: 0.91, phase: 3.8 },
        { name: "Transit Court", index: 0.84, phase: 5.2 }
      ]
    },
    resort: {
      label: "Resort / leisure",
      base: 289,
      currency: "$",
      comps: [
        { name: "Bayfront Resort", index: 1.18, phase: 0.9 },
        { name: "Palm Terrace", index: 1.07, phase: 2.1 },
        { name: "Dunes Retreat", index: 0.95, phase: 3.4 },
        { name: "Coral Lodge", index: 0.88, phase: 4.9 }
      ]
    }
  };

  function initRateDemo() {
    var demo = document.querySelector("[data-rate-demo]");
    if (!demo) return;

    var marketSelect = demo.querySelector("[data-market]");
    var leadInput = demo.querySelector("[data-lead]");
    var leadOutput = demo.querySelector("[data-lead-output]");
    var chart = demo.querySelector("[data-chart]");
    var outRate = demo.querySelector("[data-out-rate]");
    var outMedian = demo.querySelector("[data-out-median]");
    var outPosition = demo.querySelector("[data-out-position]");

    if (!marketSelect || !leadInput || !chart) return;

    /* Deterministic demand curve: rates firm up as the arrival date approaches. */
    function demandFactor(lead, phase) {
      var urgency = 1 + 0.22 * Math.exp(-lead / 18);
      var weekly = 1 + 0.06 * Math.sin((lead / 7) * Math.PI + phase);
      var drift = 1 - lead / 900;
      return urgency * weekly * drift;
    }

    function median(values) {
      var sorted = values.slice().sort(function (a, b) {
        return a - b;
      });
      var mid = Math.floor(sorted.length / 2);
      return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function money(currency, value) {
      return currency + Math.round(value).toLocaleString("en-US");
    }

    function render() {
      var market = MARKETS[marketSelect.value] || MARKETS["city-centre"];
      var lead = parseInt(leadInput.value, 10) || 1;

      var yourRate = market.base * demandFactor(lead, 0);
      var rows = market.comps.map(function (comp) {
        return {
          name: comp.name,
          rate: market.base * comp.index * demandFactor(lead, comp.phase),
          self: false
        };
      });

      rows.unshift({ name: "Your property", rate: yourRate, self: true });

      var max = Math.max.apply(
        null,
        rows.map(function (row) {
          return row.rate;
        })
      );

      var marketMedian = median(
        rows
          .filter(function (row) {
            return !row.self;
          })
          .map(function (row) {
            return row.rate;
          })
      );

      var position = (yourRate / marketMedian) * 100;

      chart.textContent = "";
      rows.forEach(function (row) {
        var el = document.createElement("div");
        el.className = "bar-row";
        el.setAttribute("data-self", row.self ? "true" : "false");

        var name = document.createElement("span");
        name.className = "bar-row__name";
        name.textContent = row.name;

        var track = document.createElement("span");
        track.className = "bar-row__track";

        var fill = document.createElement("span");
        fill.className = "bar-row__fill";
        fill.style.setProperty("--w", ((row.rate / max) * 100).toFixed(1) + "%");
        track.appendChild(fill);

        var value = document.createElement("span");
        value.className = "bar-row__value";
        value.textContent = money(market.currency, row.rate);

        el.appendChild(name);
        el.appendChild(track);
        el.appendChild(value);
        chart.appendChild(el);
      });

      if (leadOutput) {
        leadOutput.textContent = lead + (lead === 1 ? " day out" : " days out");
      }
      if (outRate) outRate.textContent = money(market.currency, yourRate);
      if (outMedian) outMedian.textContent = money(market.currency, marketMedian);
      if (outPosition) {
        outPosition.textContent = Math.round(position) + " idx";
        outPosition.setAttribute(
          "data-tone",
          position >= 103 ? "warning" : position <= 97 ? "positive" : ""
        );
      }
    }

    marketSelect.addEventListener("change", render);
    leadInput.addEventListener("input", render);
    render();
  }

  /* ----------------------------------------------------------
     Scrollspy for primary navigation
     ---------------------------------------------------------- */

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll(".site-nav__link[href^='#']")
    );
    if (!links.length) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });

    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = map[entry.target.id];
          if (!link || !entry.isIntersecting) return;
          links.forEach(function (other) {
            other.removeAttribute("aria-current");
          });
          link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */

  initThemeSwitch();
  initNav();
  initScrollChrome();
  initReveal();
  initCounters();
  initStepper();
  initRateDemo();
  initScrollSpy();
})();
