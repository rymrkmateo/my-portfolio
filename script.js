(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.documentElement;

    /* ---------- Dark / light theme ---------- */
    var themeBtn = document.getElementById("themeToggle");

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
        themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }

    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    themeBtn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem("theme", next); } catch (e) {}
    });

    /* ---------- Mobile menu ---------- */
    var menu = document.getElementById("menu");
    var menuBtn = document.getElementById("menuToggle");

    function setMenu(open) {
        menu.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.textContent = open ? "✕" : "☰";
        menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    menuBtn.addEventListener("click", function () {
        setMenu(!menu.classList.contains("open"));
    });

    menu.addEventListener("click", function (e) {
        if (e.target.tagName === "A") setMenu(false);
    });

    /* ---------- Typing role text ---------- */
    var typed = document.getElementById("typed");
    var roles = ["web developer", "mobile app builder", "UI designer", "problem solver"];

    if (!reduceMotion) {
        var r = 0, c = roles[0].length, deleting = true;
        (function tick() {
            var word = roles[r];
            typed.textContent = word.slice(0, c);
            var delay = deleting ? 45 : 85;

            if (!deleting && c === word.length) {
                deleting = true;
                delay = 1600;
            } else if (deleting && c === 0) {
                deleting = false;
                r = (r + 1) % roles.length;
                delay = 300;
            } else {
                c += deleting ? -1 : 1;
            }
            setTimeout(tick, delay);
        })();
    }

    /* ---------- Scroll progress, back-to-top ---------- */
    var progress = document.getElementById("progress");
    var toTop = document.getElementById("toTop");

    function onScroll() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        progress.style.width = pct + "%";
        toTop.classList.toggle("show", window.scrollY > 600);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    /* ---------- Highlight current section in nav ---------- */
    var links = document.querySelectorAll("nav ul a");
    var sections = [];
    links.forEach(function (a) {
        var s = document.querySelector(a.getAttribute("href"));
        if (s) sections.push({ link: a, el: s });
    });

    if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    links.forEach(function (a) { a.classList.remove("active"); });
                    sections.forEach(function (s) {
                        if (s.el === entry.target) s.link.classList.add("active");
                    });
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        sections.forEach(function (s) { spy.observe(s.el); });
    }

    /* ---------- Project filters ---------- */
    var filters = document.querySelectorAll(".filter");
    var cards = document.querySelectorAll(".project");

    filters.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var f = btn.getAttribute("data-filter");
            filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
            cards.forEach(function (card) {
                card.hidden = !(f === "all" || card.getAttribute("data-category") === f);
            });
        });
    });

    /* ---------- Project details dialog ---------- */
    // Edit these details so they match your real projects.
    var details = {
        "fun-run": {
            title: "Fun Run System",
            type: "System project",
            text: "A system for managing a fun run event, from participant registration to organizing event information.",
            points: ["Participant registration", "Event information management", "Built as a school system project"],
            tools: ["System design", "Registration"]
        },
        "kodular": {
            title: "Kodular App",
            type: "Mobile app",
            text: "An Android mobile app built with Kodular, using visual blocks to design the screens and program how the app works.",
            points: ["Screens designed in the Kodular designer", "Logic built with blocks", "Tested on an Android device"],
            tools: ["Kodular", "Android"]
        },
        "figma": {
            title: "Figma Prototype",
            type: "UI/UX design",
            text: "A clickable app design made in Figma, showing the screens, layout and user flow before development.",
            points: ["Screen layouts and components", "Clickable user flow", "Designed before development"],
            tools: ["Figma", "Prototyping"]
        },
        "website": {
            title: "Personal Website",
            type: "Web development",
            text: "This responsive portfolio, built with HTML, CSS and JavaScript to present my skills, education and projects.",
            points: ["Responsive on phones and desktops", "Light and dark themes", "Filterable projects"],
            tools: ["HTML", "CSS", "JavaScript"]
        }
    };

    var dialog = document.getElementById("projectDialog");
    var body = document.getElementById("dialogBody");
    var lastTrigger = null;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }

    function openDetails(key, trigger) {
        var d = details[key];
        if (!d) return;
        lastTrigger = trigger;
        body.textContent = "";

        var h3 = el("h3", null, d.title);
        h3.id = "dialogTitle";
        body.appendChild(h3);
        body.appendChild(el("p", "project-type", d.type));
        body.appendChild(el("p", null, d.text));
        body.appendChild(el("h4", null, "Highlights"));

        var ul = el("ul", "points");
        d.points.forEach(function (p) { ul.appendChild(el("li", null, p)); });
        body.appendChild(ul);

        body.appendChild(el("h4", null, "Tools"));
        var tags = el("ul", "tags");
        d.tools.forEach(function (t) { tags.appendChild(el("li", null, t)); });
        body.appendChild(tags);

        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
    }

    document.querySelectorAll(".project").forEach(function (card) {
        card.querySelector(".project-btn").addEventListener("click", function (e) {
            openDetails(card.getAttribute("data-key"), e.currentTarget);
        });
    });

    document.getElementById("dialogClose").addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("click", function (e) {
        if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", function () {
        if (lastTrigger) lastTrigger.focus();
    });

    /* ---------- Contact: copy email + mailto form ---------- */
    var email = "raymarksatingasin09@gmail.com";
    var note = document.getElementById("formNote");
    var copyBtn = document.getElementById("copyEmail");

    copyBtn.addEventListener("click", function () {
        function done(ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy email"; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
        } else {
            done(false);
        }
    });

    document.getElementById("contactForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var name = document.getElementById("name").value.trim();
        var msg = document.getElementById("message").value.trim();

        if (!name || !msg) {
            note.textContent = "Please enter your name and a message.";
            return;
        }

        var subject = encodeURIComponent("Portfolio message from " + name);
        var bodyText = encodeURIComponent(msg + "\n\n— " + name);
        note.textContent = "Opening your email app…";
        window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + bodyText;
    });
})();