

(function () {
    "use strict";

    // Helper: Roman Numeral Generator
    function toRoman(num) {
        const romanMap = [
            { val: 10, sym: "X" },
            { val: 9, sym: "IX" },
            { val: 5, sym: "V" },
            { val: 4, sym: "IV" },
            { val: 1, sym: "I" }
        ];
        let res = "";
        for (const item of romanMap) {
            while (num >= item.val) {
                res += item.sym;
                num -= item.val;
            }
        }
        return res;
    }
    // Helper: only allow http(s) URLs (blocks javascript: etc.)
    function safeUrl(url) {
        if (!url || typeof url !== "string") return null;
        try {
            const u = new URL(url, window.location.href);
            return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null;
        } catch (e) {
            return null;
        }
    }

    // Calculate age from YYYY-MM-DD
    function calculateAge(birthDateStr) {
        if (!birthDateStr) return 23;
        const parts = birthDateStr.split("-");
        const birthDate = new Date(parseInt(parts[0]), parseInt(parts) - 1, parseInt(parts));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    // Theme Management
    const root = document.documentElement;
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const themeLabel = document.getElementById("theme-label");
    const themeIcon = document.getElementById("theme-icon");

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        localStorage.setItem("paper_gruvbox_theme", theme);
        if (themeLabel) {
            themeLabel.textContent = theme === "dark" ? "Gruvbox Light" : "Gruvbox Dark";
        }
        if (themeIcon) {
            themeIcon.className = theme === "dark" ? "fa-solid fa-sun me-1" : "fa-solid fa-moon me-1";
        }
    }

    function triggerThemeTransition(event, nextTheme) {
        if (document.startViewTransition) {
            const x = event ? event.clientX : window.innerWidth / 2;
            const y = event ? event.clientY : 0;
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            const transition = document.startViewTransition(() => {
                applyTheme(nextTheme);
            });

            transition.ready.then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`
                        ]
                    },
                    {
                        duration: 500,
                        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                        pseudoElement: "::view-transition-new(root)"
                    }
                );
            });
        } else {
            document.body.classList.add("theme-transitioning");
            applyTheme(nextTheme);
            setTimeout(() => {
                document.body.classList.remove("theme-transitioning");
            }, 500);
        }
    }

    // Live Clock
    function updateClock() {
        const clockElem = document.getElementById("live-clock");

        if (clockElem) {
            const now = new Date();

            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");

            const period = hours >= 12 ? "PM" : "AM";

            hours = hours % 12 || 12;
            hours = String(hours).padStart(2, "0");

            clockElem.textContent = `${hours}:${minutes}:${seconds}${period} IST`;
        }
    }

    // Render Paper from JSON Data
    function renderPaper(data) {
        const paper = data.paper;

        // 1. Running Head
        const runningHead = document.getElementById("running-head");
        if (runningHead && paper.runningHead) {
            runningHead.innerHTML = `
        <span>${paper.runningHead.left || ""}</span>
        <span>${paper.runningHead.center || ""}</span>
        <span>${paper.runningHead.right || ""}</span>
      `;
        }

        // 2. Main Title
        const titleElem = document.getElementById("paper-main-title");
        if (titleElem) {
            titleElem.textContent = paper.title;
        }

        // 3. Authors Block
        const authorBlock = document.getElementById("paper-author-block");
        if (authorBlock && paper.author) {
            const affiliationsHtml = paper.author.affiliations
                .map(aff => `<div>${aff}</div>`)
                .join("");

            const contactsHtml = paper.author.contacts
                .map(c => `<span><i class="${c.icon} me-1"></i><a href="${c.url}" target="_blank">${c.label}</a></span>`)
                .join(` <span class="text-muted mx-1">&bull;</span> `);

            authorBlock.innerHTML = `
        <span class="paper-author-name">${paper.author.name} <span style="font-size: 1rem; color: var(--accent-purple); font-weight: normal;">(${paper.author.handle})</span></span>
        <div class="paper-author-affiliations my-1">${affiliationsHtml}</div>
        <div class="paper-author-contact mt-2">${contactsHtml}</div>
      `;
        }

        // 4. Abstract & Index Terms (with dynamic age calculation)
        const abstractBox = document.getElementById("paper-abstract-box");
        if (abstractBox) {
            const calculatedAge = 25;//calculateAge(paper.author.birthDate);
            let abstractText = paper.abstract;
            abstractText = abstractText.replace(
                "Sourav Gope.",
                `Sourav Gope (Age: ${calculatedAge}, born December 15, 2000).`
            );

            const termsHtml = paper.indexTerms.join(", ");
            abstractBox.innerHTML = `
        <span class="paper-abstract-label">Abstract</span>—${abstractText}
        <div class="paper-keywords mt-2">
         <!-- <span class="paper-keywords-label">Index Terms</span>—${termsHtml}. -->
        </div>
      `;
        }

        // 5. Render Modular Sections into Columns
        const leftCol = document.getElementById("paper-col-left");
        const rightCol = document.getElementById("paper-col-right");
        if (!leftCol || !rightCol) return;

        leftCol.innerHTML = "";
        rightCol.innerHTML = "";

        data.sections.forEach((section, index) => {
            const romanNumeral = toRoman(index + 1);
            const targetCol = section.column === "right" ? rightCol : leftCol;

            const sectionWrapper = document.createElement("section");
            sectionWrapper.className = "mb-4 paper-section-node";
            sectionWrapper.id = `sec-${section.id}`;

            // Section Header
            const headerHtml = `
        <h2 class="paper-section-title">
          <span class="sec-roman">${romanNumeral}.</span> ${section.title}
        </h2>
      `;

            let contentHtml = "";

            switch (section.type) {
                case "education":
                    contentHtml = section.entries.map(e => `
            <div class="paper-entry">
              <div class="paper-entry-header">
                <span class="paper-entry-name">${e.institution}</span>
                <span class="paper-entry-date">${e.period} &bull; ${e.location}</span>
              </div>
              <div class="paper-entry-sub">${e.degree}</div>
              <p class="paper-entry-desc mb-2">${e.description} <strong>Academic Score: ${e.performance}</strong>.</p>
              ${e.coursework ? `
                <div class="paper-formula-box mt-2 mb-3">
                  <div class="paper-formula-label">Curricular Foundation Modules:</div>
                  <ul class="mb-0 ps-3" style="font-size: 0.92rem;">
                    ${e.coursework.map(c => `<li>${c}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
            </div>
          `).join("");
                    break;

                case "experience":
                    contentHtml = section.entries.map(e => `
            <div class="paper-entry">
              <div class="paper-entry-header">
                <span class="paper-entry-name">${e.company}</span>
                <span class="paper-entry-date">${e.period} &bull; ${e.location}</span>
              </div>
              <div class="paper-entry-sub">${e.role}</div>
              <p class="paper-entry-desc mb-2">${e.summary}</p>
              <ul class="ps-3 mb-2" style="font-size: 0.94rem;">
                ${e.highlights.map(h => `<li class="mb-2">${h}</li>`).join("")}
              </ul>
              ${e.badges ? `
                <div class="d-flex flex-wrap gap-1 mt-2">
                  ${e.badges.map(b => `<span class="badge-pill">${b}</span>`).join("")}
                </div>
              ` : ""}
            </div>
          `).join("");
                    break;

                case "projects":
                    contentHtml = section.entries.map((p, pIdx) => {
                        const href = safeUrl(p.url);
                        const titleHtml = href
                            ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${pIdx + 1}. ${p.title}</a>`
                            : `${pIdx + 1}. ${p.title}`;
                        const linkHtml = href
                            ? `<div class="mt-1" style="font-size: 0.9rem;">
                 <i class="fa-solid fa-arrow-up-right-from-square me-1"></i>
                 <a href="${href}" target="_blank" rel="noopener noreferrer">${p.urlLabel || "View project"}</a>
               </div>`
                            : "";
                        return `
            <div class="paper-entry">
              <div class="paper-entry-header">
                <span class="paper-entry-name">${titleHtml}</span>
                <span class="paper-entry-date font-mono" style="color: var(--accent-aqua);">${p.tag}</span>
              </div>
              <div class="paper-entry-sub">Tech Stack: ${p.tech}</div>
              <p class="paper-entry-desc">${p.description}</p>
              ${linkHtml}
            </div>
        `;
                    }).join("");
                    break;

                case "honors":
                    contentHtml = section.entries.map(h => `
            <div class="paper-entry">
              <div class="paper-entry-header">
                <span class="paper-entry-name">${h.title}</span>
                <span class="paper-entry-date">${h.meta}</span>
              </div>
              <p class="paper-entry-desc">${h.description}</p>
            </div>
          `).join("");
                    break;

                case "table":
                    contentHtml = `
            ${section.tableIntro ? `<p class="paper-entry-desc">${section.tableIntro}</p>` : ""}
            <table class="table-booktabs">
              <thead>
                <tr>
                  <th style="width: 32%;">Domain</th>
                  <th>Technologies & Operational Tools</th>
                </tr>
              </thead>
              <tbody>
                ${section.tableRows.map(r => `
                  <tr>
                    <td><strong>${r.domain}</strong></td>
                    <td>${r.items}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
                    break;

                default:
                    if (Array.isArray(section.entries)) {
                        contentHtml = section.entries.map(item => `
              <div class="paper-entry">
                <div class="paper-entry-header">
                  <span class="paper-entry-name">${item.title || item.name || ""}</span>
                  <span class="paper-entry-date">${item.period || item.meta || ""}</span>
                </div>
                ${item.description ? `<p class="paper-entry-desc">${item.description}</p>` : ""}
              </div>
            `).join("");
                    } else if (typeof section.content === "string") {
                        contentHtml = `<p class="paper-entry-desc">${section.content}</p>`;
                    }
                    break;
            }

            sectionWrapper.innerHTML = headerHtml + contentHtml;
            targetCol.appendChild(sectionWrapper);
        });
    }

    // Load JSON (with inline embedded fallback for local file:// protocol access)

    // ==========================================================================
    // 24 FPS PROJECTION SORCERY CONTROLLER (NAOYA ZENIN ALGORITHM)
    // ==========================================================================
    function initFpsAlgorithm() {
        const fpsWidget = document.getElementById("fps-floating-widget");
        const fpsModal = document.getElementById("fps-modal-overlay");
        const fpsVideoView = document.getElementById("fps-video-view");
        const fpsLoreView = document.getElementById("fps-lore-view");
        const naoyaVideo = document.getElementById("naoya-video");
        const skipVideoBtn = document.getElementById("fps-skip-video-btn");
        const replayAmvBtn = document.getElementById("fps-replay-amv-btn");
        const fpsCloseBtn = document.getElementById("fps-modal-close-btn");
        const fpsDismissBtn = document.getElementById("fps-modal-dismiss-btn");
        const fpsGrid = document.getElementById("fps-cells-grid");
        const fpsCounter = document.getElementById("fps-current-frame");
        const timeStat = document.getElementById("fps-video-time-stat");
        const frameStat = document.getElementById("fps-video-frame-stat");

        if (!fpsWidget || !fpsModal) return;

        // Render 24 discrete frame cells on the right widget
        if (fpsGrid) {
            fpsGrid.innerHTML = "";
            for (let i = 0; i < 24; i++) {
                const cell = document.createElement("div");
                cell.className = "fps-cell" + (i === 0 ? " active" : "");
                cell.setAttribute("data-frame", i + 1);
                fpsGrid.appendChild(cell);
            }
        }

        const cells = fpsGrid ? fpsGrid.querySelectorAll(".fps-cell") : [];

        // 24 FPS Real-Time Clock Loop (Exact 1000 / 24 = 41.67 ms interval)
        let currentFrame = 1;
        const frameIntervalMs = 1000 / 24;

        setInterval(() => {
            currentFrame = (currentFrame % 24) + 1;
            if (fpsCounter) {
                fpsCounter.textContent = String(currentFrame).padStart(2, "0");
            }
            if (cells.length === 24) {
                for (let j = 0; j < 24; j++) {
                    if (j === currentFrame - 1) {
                        cells[j].classList.add("active");
                    } else {
                        cells[j].classList.remove("active");
                    }
                }
            }
        }, frameIntervalMs);

        // Helper: Transition to Lore View (after video finishes or user skips)
        function showLoreView() {
            if (naoyaVideo) {
                naoyaVideo.pause();
            }
            if (fpsVideoView) {
                fpsVideoView.style.display = "none";
            }
            if (fpsLoreView) {
                fpsLoreView.style.display = "block";
            }
        }

        // Helper: Transition to Video View (on start or replay)
        function showVideoView() {
            if (fpsLoreView) {
                fpsLoreView.style.display = "none";
            }
            if (fpsVideoView) {
                fpsVideoView.style.display = "block";
            }
            if (naoyaVideo) {
                naoyaVideo.currentTime = 0;
                const playPromise = naoyaVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.warn("Autoplay with audio blocked by browser, falling back to muted playback:", err);
                        naoyaVideo.muted = true;
                        naoyaVideo.play();
                    });
                }
            }
        }

        // Open Modal from Widget -> Always starts with the AMV
        function openFpsSequence() {
            fpsModal.classList.add("active");
            document.body.style.overflow = "hidden";
            showVideoView();
        }

        // Close entire modal and stop playback
        function closeFpsModal() {
            fpsModal.classList.remove("active");
            document.body.style.overflow = "";
            if (naoyaVideo) {
                naoyaVideo.pause();
                naoyaVideo.currentTime = 0;
            }
        }

        // When the AMV finishes, close the video view and let them read about it!
        if (naoyaVideo) {
            naoyaVideo.addEventListener("ended", () => {
                showLoreView();
            });

            // Update real-time frame/time indicator during AMV playback
            naoyaVideo.addEventListener("timeupdate", () => {
                const cur = naoyaVideo.currentTime || 0;
                const dur = naoyaVideo.duration || 17.3;
                const curM = String(Math.floor(cur / 60)).padStart(2, "0");
                const curS = String(Math.floor(cur % 60)).padStart(2, "0");
                const durM = String(Math.floor(dur / 60)).padStart(2, "0");
                const durS = String(Math.floor(dur % 60)).padStart(2, "0");

                const totalFrames = Math.max(1, Math.floor(dur * 24));
                const currentFrameCount = Math.min(Math.floor(cur * 24) + 1, totalFrames);

                if (timeStat) {
                    timeStat.textContent = `${curM}:${curS} / ${durM}:${durS}`;
                }
                if (frameStat) {
                    frameStat.textContent = `FRAME ${String(currentFrameCount).padStart(3, "0")} / ${totalFrames}`;
                }
            });
        }

        fpsWidget.addEventListener("click", openFpsSequence);

        if (skipVideoBtn) {
            skipVideoBtn.addEventListener("click", showLoreView);
        }

        if (replayAmvBtn) {
            replayAmvBtn.addEventListener("click", showVideoView);
        }

        if (fpsCloseBtn) {
            fpsCloseBtn.addEventListener("click", closeFpsModal);
        }

        if (fpsDismissBtn) {
            fpsDismissBtn.addEventListener("click", closeFpsModal);
        }

        fpsModal.addEventListener("click", function (e) {
            if (e.target === fpsModal) {
                closeFpsModal();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && fpsModal.classList.contains("active")) {
                closeFpsModal();
            }
        });
    }

    async function init() {
        initFpsAlgorithm();
        const savedTheme = localStorage.getItem("paper_gruvbox_theme") || "dark";
        applyTheme(savedTheme);

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener("click", function (e) {
                const currentTheme = root.getAttribute("data-theme") || "dark";
                const nextTheme = currentTheme === "dark" ? "light" : "dark";
                triggerThemeTransition(e, nextTheme);
            });
        }

        setInterval(updateClock, 1000);
        updateClock();

        try {
            const response = await fetch("./data.json");
            if (!response.ok) throw new Error("HTTP error " + response.status);
            const data = await response.json();
            renderPaper(data);
        } catch (err) {
            console.warn("Could not fetch data.json via network (likely file:// protocol). Attempting fallback data.", err);
            if (window.FALLBACK_DATA) {
                renderPaper(window.FALLBACK_DATA);
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
