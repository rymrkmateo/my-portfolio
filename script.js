(function () {
    "use strict";

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var mk = function (tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    };
    var root = document.documentElement;
    var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hoverOK = matchMedia("(hover: hover)").matches;

    /* ---------- Theme: dark by default, remembered, smooth switch ---------- */
    var themeBtn = $("#themeToggle");

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
        themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }

    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    applyTheme(saved === "light" ? "light" : "dark");

    themeBtn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.classList.add("theme-anim");
        applyTheme(next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        setTimeout(function () { root.classList.remove("theme-anim"); }, 500);
    });

    /* ---------- Hide links that still contain "YOUR-" (add real LinkedIn / YouTube links in index.html) ---------- */
    $$('a[href*="YOUR-"]').forEach(function (a) {
        (a.closest("li, .contact-item") || a).hidden = true;
    });

    /* ---------- Screenshot missing: fall back to the card icon ---------- */
    $$(".project-top img").forEach(function (img) {
        function drop() { img.remove(); }
        img.addEventListener("error", drop);
        if (img.complete && img.naturalWidth === 0) drop();
    });

    /* ---------- Mobile menu ---------- */
    var menu = $("#menu"), menuBtn = $("#menuToggle");

    function setMenu(open) {
        menu.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.textContent = open ? "✕" : "☰";
        menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    menuBtn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

    /* ---------- Scroll progress, back to top, current section ---------- */
    var progress = $("#progress"), toTop = $("#toTop");

    function onScroll() {
        var max = root.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
        toTop.classList.toggle("show", window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    var links = $$("nav ul a");
    if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        $$("main section[id]").forEach(function (s) { spy.observe(s); });

        /* scroll-triggered fade-in */
        if (!reduceMotion) {
            var reveal = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { en.target.classList.add("in"); reveal.unobserve(en.target); }
                });
            }, { threshold: 0.12 });
            $$(".section-title, .about-grid, .skills-container, .education-card, .filters, .projects, .contact-wrap").forEach(function (el) {
                el.classList.add("reveal");
                reveal.observe(el);
            });
        }
    }

    /* ---------- Hero: gold ring follows the pointer; project cards tilt ---------- */
    var hero = $(".hero");
    if (!reduceMotion && hoverOK) {
        hero.addEventListener("pointermove", function (e) {
            var b = hero.getBoundingClientRect();
            hero.style.setProperty("--px", ((e.clientX - b.left) / b.width - 0.5) * 2);
            hero.style.setProperty("--py", ((e.clientY - b.top) / b.height - 0.5) * 2);
        });
        hero.addEventListener("pointerleave", function () {
            hero.style.setProperty("--px", 0);
            hero.style.setProperty("--py", 0);
        });
        $$(".project").forEach(function (card) {
            card.addEventListener("pointermove", function (e) {
                var b = card.getBoundingClientRect();
                card.style.setProperty("--ry", ((e.clientX - b.left) / b.width - 0.5) * 6 + "deg");
                card.style.setProperty("--rx", (0.5 - (e.clientY - b.top) / b.height) * 6 + "deg");
            });
            card.addEventListener("pointerleave", function () {
                card.style.removeProperty("--rx");
                card.style.removeProperty("--ry");
            });
        });
    }

    /* ---------- About: Learn More ---------- */
    var moreBtn = $("#moreBtn"), moreText = $("#moreText");
    moreBtn.addEventListener("click", function () {
        var open = moreText.hidden;
        moreText.hidden = !open;
        moreBtn.setAttribute("aria-expanded", String(open));
        moreBtn.textContent = open ? "Show Less" : "Learn More";
    });

    /* ---------- Project filters: by category, or by clicking a skill ---------- */
    var filters = $$(".filter"), cards = $$(".project");
    var cat = "all", tool = null;
    var toolNote = mk("p", "note");
    toolNote.hidden = true;
    $(".filters").after(toolNote);

    function applyFilters() {
        var shown = 0;
        cards.forEach(function (card) {
            var tags = $$(".tags li", card).map(function (t) { return t.textContent; });
            var ok = (cat === "all" || card.getAttribute("data-category") === cat) && (!tool || tags.indexOf(tool) > -1);
            card.hidden = !ok;
            if (ok) shown++;
        });
        filters.forEach(function (b) {
            b.setAttribute("aria-pressed", String(!tool && b.getAttribute("data-filter") === cat));
        });
        toolNote.hidden = !tool;
        if (tool) {
            var clear = mk("button", "link", "Show all projects");
            clear.type = "button";
            clear.addEventListener("click", function () { tool = null; applyFilters(); });
            toolNote.textContent = shown
                ? "Showing " + shown + " project" + (shown > 1 ? "s" : "") + " that use " + tool + ". "
                : "No project here is tagged " + tool + " yet. ";
            toolNote.appendChild(clear);
        }
    }

    filters.forEach(function (btn) {
        btn.addEventListener("click", function () {
            cat = btn.getAttribute("data-filter");
            tool = null;
            applyFilters();
        });
    });

    $$(".skill-card").forEach(function (btn) {
        btn.addEventListener("click", function () {
            tool = btn.getAttribute("data-skill");
            cat = "all";
            applyFilters();
            $("#projects").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        });
    });

    /* ---------- Project details dialog ---------- */
    var details = {
        funrun: {
            title: "FUNRUN Registration System",
            type: "Web app, group project",
            text: "A web app for registering fun run participants, with a password-protected admin dashboard for managing them.",
            points: [
                "Registration form that saves participants to a Supabase database",
                "Admin dashboard with a participant table, processing queue, activity history and name lookup",
                "Uses data structures and algorithms such as a queue, stack, BST, searching and sorting",
                "Built and presented with a group of four"
            ],
            tools: ["React", "JavaScript", "Supabase", "Data structures"]
        },
        quiz: {
            title: "Quiz Competition",
            type: "Mobile app",
            text: "A quiz app where players pick a subject, answer ten questions and see how they ranked.",
            points: [
                "Three subjects with ten questions each: English, Math and Filipino",
                "Score messages from Excellent! to Keep Practicing!",
                "Leaderboard saved with TinyDB, with a button to clear it"
            ],
            tools: ["Kodular", "TinyDB"]
        },
        dashboard: {
            title: "CRUD Dashboard",
            type: "Web app, backend",
            text: "A dashboard for creating, viewing, editing and deleting records, running on an Express server with a Supabase database.",
            points: [
                "Express backend connected to a Supabase database",
                "Full create, read, update and delete (CRUD) for records",
                "Based on the admin dashboard from the FUNRUN project"
            ],
            tools: ["Express", "JavaScript", "Supabase", "CRUD"]
        },
        figma: {
            title: "Figma Prototype",
            type: "UI/UX design",
            text: "A clickable app design made in Figma, showing the screens, layout and user flow before development.",
            points: ["Screen layouts and components", "Clickable user flow", "Designed before development"],
            tools: ["Figma", "Prototyping"]
        }
    };

    var dialog = $("#projectDialog"), body = $("#dialogBody"), lastTrigger = null;

    function openDetails(key, trigger, card) {
        var d = details[key];
        if (!d) return;
        lastTrigger = trigger;
        body.textContent = "";

        var shot = $(".project-top img", card);
        if (shot) { var im = mk("img"); im.src = shot.src; im.alt = shot.alt; body.appendChild(im); }

        var t = mk("div", "dialog-text");
        var h3 = mk("h3", null, d.title);
        h3.id = "dialogTitle";
        t.appendChild(h3);
        t.appendChild(mk("p", "project-type", d.type));
        t.appendChild(mk("p", null, d.text));
        t.appendChild(mk("h4", null, "Highlights"));
        var ul = mk("ul", "points");
        d.points.forEach(function (p) { ul.appendChild(mk("li", null, p)); });
        t.appendChild(ul);
        t.appendChild(mk("h4", null, "Technologies"));
        var tags = mk("ul", "tags");
        d.tools.forEach(function (x) { tags.appendChild(mk("li", null, x)); });
        t.appendChild(tags);

        var actions = mk("div", "project-actions");
        actions.style.marginTop = "1.4rem";
        $$(".project-link", card).forEach(function (a) { actions.appendChild(a.cloneNode(true)); });
        t.appendChild(actions);

        body.appendChild(t);
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
    }

    cards.forEach(function (card) {
        $(".project-btn", card).addEventListener("click", function (e) {
            openDetails(card.getAttribute("data-key"), e.currentTarget, card);
        });
    });
    $("#dialogClose").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });

    /* ---------- Contact: copy email + validated mailto form ---------- */
    var email = $("#emailLink").textContent.trim();
    var copyBtn = $("#copyEmail");

    copyBtn.addEventListener("click", function () {
        function done(ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy email"; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
        } else { done(false); }
    });

    var form = $("#contactForm"), note = $("#formNote");
    var fields = { name: $("#name"), email: $("#email"), subject: $("#subject"), message: $("#message") };

    function setError(key, msg) {
        $("#err-" + key).textContent = msg || "";
        fields[key].setAttribute("aria-invalid", msg ? "true" : "false");
        return !msg;
    }
    function val(k) { return fields[k].value.trim(); }

    function validate() {
        var ok = true;
        ok = setError("name", val("name") ? "" : "Please enter your name.") && ok;
        ok = setError("email", !val("email") ? "Please enter your email address."
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email")) ? "" : "Enter a valid email, like name@example.com.") && ok;
        ok = setError("subject", val("subject") ? "" : "Please add a subject.") && ok;
        ok = setError("message", val("message").length >= 10 ? "" : "Write at least 10 characters.") && ok;
        return ok;
    }

    Object.keys(fields).forEach(function (k) {
        fields[k].addEventListener("input", function () { if (fields[k].getAttribute("aria-invalid") === "true") validate(); });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        note.className = "form-note";
        if (!validate()) {
            note.classList.add("bad");
            note.textContent = "Please fix the highlighted fields and try again.";
            var first = $('[aria-invalid="true"]', form);
            if (first) first.focus();
            return;
        }
        var text = val("message") + "\n\nFrom: " + val("name") + " (" + val("email") + ")";
        note.classList.add("ok");
        note.textContent = "Thanks, " + val("name") + "! Your email app is opening with your message.";
        window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(val("subject")) + "&body=" + encodeURIComponent(text);
    });
})();