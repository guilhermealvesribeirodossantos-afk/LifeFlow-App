
/* ============================================================
   LIFEFLOW 6.7 — PWA + BACKUP / RESTORE FINAL
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-pwa", "6.7");

  const LF67_BACKUP_VERSION = "6.7";
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButtons();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showSiteMessage?.("LifeFlow instalado com sucesso.", "success");
    updateInstallButtons();
  });

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
  }

  function updateInstallButtons() {
    document.querySelectorAll("[data-lf67-install]").forEach(btn => {
      if (isStandalone()) {
        btn.disabled = true;
        btn.innerHTML = "<span>✓</span><div><strong>LifeFlow instalado</strong><small>Executando como aplicativo</small></div>";
      } else if (deferredInstallPrompt) {
        btn.disabled = false;
        btn.innerHTML = "<span>↓</span><div><strong>Instalar LifeFlow</strong><small>Adicionar como aplicativo neste dispositivo</small></div>";
      } else {
        btn.disabled = false;
        btn.innerHTML = "<span>＋</span><div><strong>Instalar LifeFlow</strong><small>Use a opção “Adicionar à tela inicial” do navegador</small></div>";
      }
    });
  }

  async function installLifeFlow() {
    if (isStandalone()) {
      showSiteMessage?.("O LifeFlow já está instalado neste dispositivo.", "success");
      return;
    }

    if (!deferredInstallPrompt) {
      showSiteMessage?.(
        "No navegador, abra o menu e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.",
        "info"
      );
      return;
    }

    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch (_) {}
    deferredInstallPrompt = null;
    updateInstallButtons();
  }

  function buildBackup() {
    const storage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (/^lifeflow-/i.test(key)) {
        storage[key] = localStorage.getItem(key);
      }
    }

    return {
      app: "LifeFlow",
      backupVersion: LF67_BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      origin: location.origin,
      storage
    };
  }

  function downloadBackup() {
    const backup = buildBackup();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LifeFlow-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showSiteMessage?.("Backup do LifeFlow criado.", "success");
  }

  function restoreBackupFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));
        if (
          data?.app !== "LifeFlow" ||
          !data.storage ||
          typeof data.storage !== "object"
        ) {
          throw new Error("backup inválido");
        }

        const entries = Object.entries(data.storage)
          .filter(([key, value]) =>
            /^lifeflow-/i.test(key) &&
            typeof value === "string"
          );

        if (!entries.length) throw new Error("backup vazio");

        showSiteConfirm?.(
          `Restaurar ${entries.length} registros do backup? Os dados atuais do LifeFlow serão substituídos quando houver a mesma chave.`,
          () => {
            entries.forEach(([key, value]) => localStorage.setItem(key, value));
            showSiteMessage?.("Backup restaurado. Recarregando o LifeFlow...", "success");
            setTimeout(() => location.reload(), 900);
          },
          { confirmText: "Restaurar", danger: false }
        );
      } catch (_) {
        showSiteMessage?.("Este arquivo não é um backup válido do LifeFlow.", "error");
      }
    };
    reader.readAsText(file);
  }

  function openRestorePicker() {
    let input = document.getElementById("lf67RestoreInput");
    if (!input) {
      input = document.createElement("input");
      input.id = "lf67RestoreInput";
      input.type = "file";
      input.accept = ".json,application/json";
      input.hidden = true;
      input.addEventListener("change", () => {
        restoreBackupFile(input.files?.[0]);
        input.value = "";
      });
      document.body.appendChild(input);
    }
    input.click();
  }

  function openDataCenter() {
    document.getElementById("lf67DataCenter")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "lf67DataCenter";
    overlay.className = "lf67-overlay";
    overlay.innerHTML = `
      <div class="lf67-card" role="dialog" aria-modal="true" aria-label="Backup e instalação">
        <div class="lf67-head">
          <div>
            <span>DATA CENTER // 06.7</span>
            <strong>Proteção do LifeFlow</strong>
            <small>Instalação, backup e recuperação dos seus dados.</small>
          </div>
          <button type="button" data-lf67-close aria-label="Fechar">×</button>
        </div>

        <div class="lf67-grid">
          <button type="button" class="lf67-action" data-lf67-install>
            <span>＋</span>
            <div><strong>Instalar LifeFlow</strong><small>Adicionar como aplicativo neste dispositivo</small></div>
          </button>

          <button type="button" class="lf67-action" data-lf67-backup>
            <span>⇩</span>
            <div><strong>Criar backup</strong><small>Salvar seus dados em um arquivo JSON</small></div>
          </button>

          <button type="button" class="lf67-action" data-lf67-restore>
            <span>⇧</span>
            <div><strong>Restaurar backup</strong><small>Recuperar dados salvos anteriormente</small></div>
          </button>
        </div>

        <div class="lf67-security">
          <i></i>
          <div>
            <strong>Seus dados continuam locais</strong>
            <span>O backup inclui somente chaves LifeFlow salvas neste navegador. Guarde o arquivo em local seguro.</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("[data-lf67-close]")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", event => {
      if (event.target === overlay) overlay.remove();
    });
    overlay.querySelector("[data-lf67-install]")?.addEventListener("click", installLifeFlow);
    overlay.querySelector("[data-lf67-backup]")?.addEventListener("click", downloadBackup);
    overlay.querySelector("[data-lf67-restore]")?.addEventListener("click", openRestorePicker);
    updateInstallButtons();
  }

  function bindProfileDataCenter() {
    const drawer = document.getElementById("lifeflowDrawer");
    if (!drawer || drawer.querySelector("#lf67DataCenterButton")) return;

    const motivation = drawer.querySelector(".lf63-motivation");
    const btn = document.createElement("button");
    btn.id = "lf67DataCenterButton";
    btn.className = "lf67-drawer-button";
    btn.type = "button";
    btn.innerHTML = `
      <span>⌁</span>
      <div>
        <strong>Backup & App</strong>
        <small>Instalação e proteção dos dados</small>
      </div>
      <b>›</b>
    `;
    btn.addEventListener("click", () => {
      window.closeLifeFlowDrawer?.();
      openDataCenter();
    });

    if (motivation) motivation.insertAdjacentElement("beforebegin", btn);
    else drawer.appendChild(btn);
  }

  bindProfileDataCenter();
  [200, 600, 1400].forEach(ms => setTimeout(bindProfileDataCenter, ms));

  const observer = new MutationObserver(() => {
    clearTimeout(window.__lf67BindTimer);
    window.__lf67BindTimer = setTimeout(bindProfileDataCenter, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.openLifeFlowDataCenter = openDataCenter;
});



/* ============================================================
   LIFEFLOW 6.6 — FINAL MODULE REVIEW
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-modules", "6.6");

  const moduleMeta = {
    agendaScreen:   ["PLANEJAMENTO", "Agenda", "Organize seus compromissos e enxergue os próximos dias."],
    studyScreen:    ["MISSÃO PMMG", "Estudos", "Continue sua preparação com foco, sequência e evolução."],
    progressScreen: ["INTELLIGENCE", "Progresso", "Acompanhe consistência, resultados e tendências reais."],
    sleepScreen:    ["RECUPERAÇÃO", "Sono", "Proteja sua recuperação para sustentar sua performance."]
  };

  function polishModule(screen, meta) {
    if (!screen || screen.dataset.lf66Reviewed === "1") return;
    screen.dataset.lf66Reviewed = "1";
    screen.classList.add("lf66-reviewed-screen");

    const header = screen.querySelector(".page-header");
    if (header) {
      header.classList.add("lf66-page-header");
      const label = header.querySelector(".section-label");
      const title = header.querySelector("h2");
      const text = header.querySelector("p");

      if (label && !label.textContent.trim()) label.textContent = meta[0];
      if (title && !title.textContent.trim()) title.textContent = meta[1];
      if (text && !text.textContent.trim()) text.textContent = meta[2];
    }

    if (!screen.querySelector(".lf66-module-status")) {
      const status = document.createElement("div");
      status.className = "lf66-module-status";
      status.innerHTML = `
        <i></i>
        <span>${meta[1]} sincronizado com LifeFlow</span>
        <b>06.6</b>
      `;
      screen.appendChild(status);
    }
  }

  function reviewAllModules() {
    Object.entries(moduleMeta).forEach(([id, meta]) => {
      polishModule(document.getElementById(id), meta);
    });

    document.querySelectorAll(
      ".lf-simple-gym-screen, .lifeflow-gym-screen, [data-lifeflow-gym]"
    ).forEach(screen => {
      screen.classList.add("lf66-reviewed-screen", "lf66-gym-reviewed");
    });

    document.querySelectorAll(
      ".lifeflow-sleep-screen, .lf-sleep-card, .sleep-card"
    ).forEach(el => el.classList.add("lf66-sleep-reviewed"));

    document.querySelectorAll(
      ".lf40-modal-card, .site-modal-card, .modal-card"
    ).forEach(el => el.classList.add("lf66-modal-reviewed"));
  }

  reviewAllModules();
  [100, 350, 900, 1800].forEach(ms => setTimeout(reviewAllModules, ms));

  const observer = new MutationObserver(() => {
    clearTimeout(window.__lf66ReviewTimer);
    window.__lf66ReviewTimer = setTimeout(reviewAllModules, 100);
  });

  observer.observe(document.body, { childList: true, subtree: true });
});



/* ============================================================
   LIFEFLOW 6.5 — WEEKLY INTELLIGENCE
   Relatório real baseado no histórico local do LifeFlow.
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-weekly", "6.5");

  const HISTORY_KEY = "lifeflow-history-v23";
  const EVOLUTION_KEY = "lifeflow-evolution-v2";
  const SLEEP_KEY = "lifeflow-sleep-v24";

  const clamp = (n, min = 0, max = 100) =>
    Math.max(min, Math.min(max, Number(n) || 0));

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (_) {
      return fallback;
    }
  };

  const dateKey = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const shortDay = date =>
    date.toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "")
      .slice(0, 3)
      .toUpperCase();

  const range = (history, days = 7, offset = 0) => {
    const items = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i - offset);
      const key = dateKey(date);
      const saved = history[key] || null;
      items.push({
        key,
        date,
        hasData: Boolean(saved),
        routine: clamp(saved?.routinePercent),
        water: clamp(saved?.waterPercent),
        xp: Number(saved?.xp || 0),
        completed: Number(saved?.completed || 0),
        total: Number(saved?.total || 0)
      });
    }
    return items;
  };

  const avg = (items, field) => {
    const valid = items.filter(item => item.hasData);
    if (!valid.length) return 0;
    return Math.round(
      valid.reduce((sum, item) => sum + Number(item[field] || 0), 0) /
      valid.length
    );
  };

  const sum = (items, field) =>
    items.reduce((total, item) => total + Number(item[field] || 0), 0);

  const sleepScoreFor = (sleepHistory, key) => {
    const item = sleepHistory[key];
    if (!item) return null;

    if (Number.isFinite(Number(item.score))) {
      return clamp(item.score);
    }

    const duration =
      Number(item.durationMinutes || item.minutes || item.totalMinutes || 0);

    if (!duration) return null;

    const hours = duration / 60;
    if (hours >= 7 && hours <= 9) return 100;
    if (hours >= 6 && hours < 7) return 78;
    if (hours > 9 && hours <= 10) return 82;
    if (hours >= 5) return 58;
    return 38;
  };

  const weeklySnapshot = () => {
    const history = readJson(HISTORY_KEY, {});
    const evolution = readJson(EVOLUTION_KEY, {});
    const sleep = readJson(SLEEP_KEY, {});

    const current = range(history, 7, 0);
    const previous = range(history, 7, 7);

    const routine = avg(current, "routine");
    const water = avg(current, "water");
    const prevRoutine = avg(previous, "routine");
    const xp = sum(current, "xp");
    const completed = sum(current, "completed");
    const activeDays = current.filter(x => x.hasData).length;

    const sleepValues = current
      .map(item => sleepScoreFor(sleep, item.key))
      .filter(value => value !== null);

    const sleepAvg = sleepValues.length
      ? Math.round(sleepValues.reduce((a,b) => a+b, 0) / sleepValues.length)
      : null;

    const dayScores = current.map(item => ({
      ...item,
      score: item.hasData
        ? Math.round(item.routine * .68 + item.water * .22 + (item.xp > 0 ? 10 : 0))
        : 0
    }));

    const best = [...dayScores]
      .filter(item => item.hasData)
      .sort((a,b) => b.score - a.score)[0] || null;

    const trend = routine - prevRoutine;

    let recommendation = "Registre sua rotina durante a semana para liberar uma análise mais precisa.";
    let focus = "CRIAR BASE";

    if (activeDays >= 2) {
      if (routine < 60) {
        focus = "CONSISTÊNCIA";
        recommendation = "Seu maior ganho agora vem da rotina. Foque em concluir as prioridades antes de adicionar novas metas.";
      } else if (water < 65) {
        focus = "HIDRATAÇÃO";
        recommendation = "Sua rotina está respondendo bem. O ponto mais fácil de elevar nesta semana é a hidratação diária.";
      } else if (sleepAvg !== null && sleepAvg < 65) {
        focus = "RECUPERAÇÃO";
        recommendation = "O desempenho está avançando, mas a recuperação pode limitar sua constância. Priorize uma janela regular de sono.";
      } else if (trend < -8) {
        focus = "RETOMADA";
        recommendation = "A semana caiu em relação à anterior. Reduza o volume e proteja as tarefas essenciais até recuperar o ritmo.";
      } else {
        focus = "MANTER RITMO";
        recommendation = "Você está construindo consistência. Mantenha a rotina atual e tente melhorar apenas um indicador por vez.";
      }
    }

    const totalXp = Number(evolution.totalXp || 0);

    return {
      current, routine, water, xp, completed, activeDays,
      sleepAvg, best, trend, recommendation, focus, totalXp
    };
  };

  function renderWeeklyIntelligence() {
    const progress = document.getElementById("progressScreen");
    if (!progress) return;

    let host = document.getElementById("lf65WeeklyIntelligence");
    if (!host) {
      host = document.createElement("section");
      host.id = "lf65WeeklyIntelligence";
      host.className = "lf65-weekly";

      const header = progress.querySelector(".page-header");
      if (header) header.insertAdjacentElement("afterend", host);
      else progress.prepend(host);
    }

    const data = weeklySnapshot();
    const trendText =
      data.trend > 0 ? `+${data.trend}%` :
      data.trend < 0 ? `${data.trend}%` : "0%";

    const trendClass =
      data.trend > 0 ? "up" :
      data.trend < 0 ? "down" : "stable";

    const bars = data.current.map(item => `
      <div class="lf65-day ${item.hasData ? "has-data" : ""}">
        <div class="lf65-bar">
          <i style="height:${Math.max(item.hasData ? 8 : 3, item.score)}%"></i>
        </div>
        <strong>${item.hasData ? item.score : "—"}</strong>
        <span>${shortDay(item.date)}</span>
      </div>
    `).join("");

    host.innerHTML = `
      <div class="lf65-top">
        <div>
          <span class="lf65-kicker">WEEKLY INTELLIGENCE // 7 DIAS</span>
          <h3>Seu relatório semanal</h3>
          <p>${data.activeDays}/7 dias com dados registrados</p>
        </div>
        <div class="lf65-trend ${trendClass}">
          <small>VS. SEMANA ANTERIOR</small>
          <strong>${trendText}</strong>
        </div>
      </div>

      <div class="lf65-score-grid">
        <article>
          <small>ROTINA</small>
          <strong>${data.routine}%</strong>
          <i><em style="width:${data.routine}%"></em></i>
        </article>
        <article>
          <small>HIDRATAÇÃO</small>
          <strong>${data.water}%</strong>
          <i><em style="width:${data.water}%"></em></i>
        </article>
        <article>
          <small>ATIVIDADES</small>
          <strong>${data.completed}</strong>
          <span>concluídas</span>
        </article>
        <article>
          <small>XP DA SEMANA</small>
          <strong>${data.xp}</strong>
          <span>${data.totalXp} XP total</span>
        </article>
      </div>

      <div class="lf65-chart-card">
        <div class="lf65-chart-head">
          <div>
            <small>RITMO DA SEMANA</small>
            <strong>Performance diária</strong>
          </div>
          <span>${data.best ? `Melhor: ${shortDay(data.best.date)} · ${data.best.score}` : "Aguardando dados"}</span>
        </div>
        <div class="lf65-chart">${bars}</div>
      </div>

      <div class="lf65-insight">
        <div class="lf65-ai-icon">LF</div>
        <div>
          <small>FOCO RECOMENDADO // ${data.focus}</small>
          <strong>${data.recommendation}</strong>
          <span>${data.sleepAvg === null ? "Sono: registre dados para incluir recuperação no relatório." : `Recuperação do sono: ${data.sleepAvg}%`}</span>
        </div>
      </div>

      <div class="lf65-note">
        <i></i>
        <span>O relatório usa apenas dados realmente salvos no LifeFlow. PMMG e Academia entrarão no score semanal quando houver histórico diário compatível.</span>
      </div>
    `;
  }

  renderWeeklyIntelligence();
  [150, 500, 1200].forEach(ms => setTimeout(renderWeeklyIntelligence, ms));

  window.addEventListener("storage", renderWeeklyIntelligence);
  document.addEventListener("click", event => {
    if (event.target.closest('[data-screen="progress"], #progressScreen')) {
      setTimeout(renderWeeklyIntelligence, 80);
    }
  });
});



/* ============================================================
   LIFEFLOW 6.4 — HOME FINAL
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-home", "6.4");

  function lf64CompactHome() {
    const home = document.getElementById("homeScreen");
    if (!home) return;

    home.classList.add("lf64-home");

    // Hide redundant legacy blocks on Home only.
    [
      ".next-card",
      ".dashboard-grid",
      ".daily-card",
      ".water-card",
      ".study-card",
      ".life-grid"
    ].forEach(selector => {
      home.querySelectorAll(selector).forEach(el => el.classList.add("lf64-legacy-hidden"));
    });

    // Add a section heading before the routine if absent.
    const taskList = home.querySelector("#taskList");
    const routineSection = taskList?.closest(".content-section");
    if (routineSection && !routineSection.querySelector(".lf64-section-tag")) {
      const tag = document.createElement("div");
      tag.className = "lf64-section-tag";
      tag.innerHTML = `
        <span>EXECUÇÃO</span>
        <strong>Rotina de hoje</strong>
        <small>O que ainda precisa da sua atenção.</small>
      `;
      routineSection.prepend(tag);
    }

    // Add quick access row under cockpit/intelligence.
    if (!home.querySelector("#lf64QuickHub")) {
      const cockpit = document.getElementById("lf611Cockpit") || document.getElementById("lf61Cockpit");
      const intelligence = document.getElementById("lf6Intelligence");

      const hub = document.createElement("section");
      hub.id = "lf64QuickHub";
      hub.className = "lf64-quick-hub";
      hub.innerHTML = `
        <button type="button" data-lf64-go="gym">
          <span>◫</span><div><small>ACADEMIA</small><strong>Treino</strong></div><b>›</b>
        </button>
        <button type="button" data-lf64-go="study">
          <span>▣</span><div><small>PMMG</small><strong>Estudos</strong></div><b>›</b>
        </button>
        <button type="button" data-lf64-go="agenda">
          <span>▦</span><div><small>AGENDA</small><strong>Planejar</strong></div><b>›</b>
        </button>
        <button type="button" data-lf64-go="progress">
          <span>↗</span><div><small>EVOLUÇÃO</small><strong>Progresso</strong></div><b>›</b>
        </button>
      `;

      if (intelligence) intelligence.insertAdjacentElement("afterend", hub);
      else if (cockpit) cockpit.insertAdjacentElement("afterend", hub);
      else home.prepend(hub);

      hub.querySelectorAll("[data-lf64-go]").forEach(btn => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.lf64Go;

          if (target === "gym" && typeof showGymRoot === "function") {
            showGymRoot();
            return;
          }

          const selectors = {
            study: '.nav-item[data-screen="studies"], .nav-item[data-screen="study"]',
            agenda: '.nav-item[data-screen="agenda"]',
            progress: '.nav-item[data-screen="progress"]'
          };

          document.querySelector(selectors[target] || "")?.click();
        });
      });
    }

    // Add minimalist footer status.
    if (!home.querySelector(".lf64-home-status")) {
      const status = document.createElement("div");
      status.className = "lf64-home-status";
      status.innerHTML = `
        <i></i>
        <span>LifeFlow Intelligence acompanhando seu dia</span>
        <b>06.4</b>
      `;
      home.appendChild(status);
    }
  }

  lf64CompactHome();
  [100,300,800,1600].forEach(ms => setTimeout(lf64CompactHome, ms));

  const home = document.getElementById("homeScreen");
  if (home) {
    const observer = new MutationObserver(() => {
      clearTimeout(window.__lf64HomeTimer);
      window.__lf64HomeTimer = setTimeout(lf64CompactHome, 100);
    });
    observer.observe(home, {childList:true,subtree:true});
  }
});


/* ============================================================
   LIFEFLOW 6.1.1 — SMART COCKPIT BOOTSTRAP
   Independent bootstrap: guaranteed to render before legacy app.
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-version", "6.1.1");
  document.body?.setAttribute("data-lf-system", "online");

  const esc = value => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const timeToMinutes = value => {
    const m = String(value || "").match(/(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 99999;
  };

  function readTasks() {
    const selectors = [
      "#homeScreen .task",
      "#homeScreen .routine-item",
      "#homeScreen [data-task]",
      "#homeScreen .daily-task"
    ];
    const nodes = [...document.querySelectorAll(selectors.join(","))];

    const seen = new Set();
    return nodes.map((node, index) => {
      const title =
        node.querySelector(".task-title")?.textContent?.trim() ||
        node.querySelector(".routine-title")?.textContent?.trim() ||
        node.querySelector("strong")?.textContent?.trim() ||
        node.dataset.title ||
        "";
      const time =
        node.querySelector(".task-time")?.textContent?.trim() ||
        node.querySelector(".routine-time")?.textContent?.trim() ||
        node.dataset.time ||
        "";
      const done =
        node.classList.contains("done") ||
        node.classList.contains("completed") ||
        Boolean(node.querySelector('input[type="checkbox"]:checked'));

      const key = `${time}|${title}`;
      if (!title || seen.has(key)) return null;
      seen.add(key);
      return { title, time, done, minutes: timeToMinutes(time), index };
    }).filter(Boolean).sort((a,b) => a.minutes - b.minutes);
  }

  function readPercentage(selectors, fallback = null) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const m = el.textContent.match(/(\d{1,3})\s*%/);
      if (m) return Math.min(100, Number(m[1]));
    }
    return fallback;
  }

  function readWater() {
    const root = document.getElementById("homeScreen") || document;
    const text = root.textContent || "";
    const l = text.match(/(\d+(?:[.,]\d+)?)\s*L\b/i);
    const ml = text.match(/(\d{2,5})\s*ml\b/i);
    let current = l ? Number(l[1].replace(",",".")) : ml ? Number(ml[1]) / 1000 : 0;
    const goalMatch = text.match(/(?:meta|objetivo)[^\d]{0,15}(\d+(?:[.,]\d+)?)\s*L/i);
    const goal = goalMatch ? Number(goalMatch[1].replace(",",".")) : 2.5;
    return { current, goal };
  }

  function dayMode(tasks) {
    const text = tasks.map(t => t.title).join(" ").toLocaleLowerCase("pt-BR");
    const work = ["trabalho","empresa","expediente","plantão","plantao"].some(w => text.includes(w));
    return {
      type: work ? "work" : "off",
      label: work ? "DIA DE TRABALHO" : "DIA DE FOLGA",
      icon: work ? "◫" : "◇"
    };
  }

  function score(tasks) {
    const done = tasks.filter(t => t.done).length;
    const routine = tasks.length ? Math.round((done / tasks.length) * 60) : 24;
    const study = readPercentage([
      "#studyProgressText",
      "#studiesScreen .progress-text",
      "#homeScreen .study-card"
    ], 35);
    const water = readWater();
    const waterPct = water.goal > 0 ? Math.min(100, Math.round(water.current / water.goal * 100)) : 0;
    return Math.max(0, Math.min(100,
      routine +
      Math.round(study * .18) +
      Math.round(waterPct * .12) +
      10
    ));
  }

  function scoreLabel(value) {
    if (value >= 90) return "DIA EXCELENTE";
    if (value >= 75) return "DIA SOB CONTROLE";
    if (value >= 55) return "BOM RITMO";
    if (value >= 35) return "ATENÇÃO ÀS PRIORIDADES";
    return "HORA DE RETOMAR";
  }

  function getPriority(tasks) {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return tasks.find(t => !t.done && t.minutes >= minutes) ||
           tasks.find(t => !t.done) ||
           {title:"Dia organizado", time:"Sem pendências"};
  }

  function ensureCockpit() {
    const home = document.getElementById("homeScreen");
    if (!home) return false;

    let host = document.getElementById("lf611Cockpit");
    if (!host) {
      host = document.createElement("section");
      host.id = "lf611Cockpit";
      host.className = "lf61-cockpit lf611-cockpit";

      const hero = home.querySelector(".hero-section");
      if (hero) hero.insertAdjacentElement("afterend", host);
      else home.prepend(host);
    }

    const tasks = readTasks();
    const done = tasks.filter(t => t.done).length;
    const mode = dayMode(tasks);
    const value = score(tasks);
    const priority = getPriority(tasks);
    const water = readWater();
    const study = readPercentage([
      "#studyProgressText",
      "#studiesScreen .progress-text",
      "#homeScreen .study-card"
    ], null);

    host.innerHTML = `
      <section class="lf61-cockpit-hero">
        <div class="lf61-cockpit-top">
          <div>
            <span class="lf61-system-label">LIFEFLOW // SMART COCKPIT 6.1.1</span>
            <div class="lf61-day-mode ${mode.type}">
              <i>${mode.icon}</i>
              <strong>${mode.label}</strong>
            </div>
          </div>
          <div class="lf61-live-status"><i></i><span>LIVE</span></div>
        </div>

        <div class="lf61-score-zone">
          <div class="lf61-score-ring" style="--score:${value}">
            <div><strong>${value}</strong><small>/100</small></div>
          </div>
          <div class="lf61-score-copy">
            <span>SCORE DO DIA</span>
            <h3>${scoreLabel(value)}</h3>
            <p>${done} de ${tasks.length || 0} atividades concluídas • atualização automática</p>
          </div>
        </div>

        <div class="lf61-priority">
          <div class="lf61-priority-number">01</div>
          <div class="lf61-priority-copy">
            <span>PRIORIDADE AGORA</span>
            <strong>${esc(priority.title)}</strong>
            <small>${esc(priority.time || "Sem horário")}</small>
          </div>
          <button id="lf611PriorityAction" type="button" aria-label="Ver rotina">→</button>
        </div>
      </section>

      <section class="lf61-vitals">
        <article>
          <span class="lf61-vital-icon">◉</span>
          <div><small>ROTINA</small><strong>${done}/${tasks.length || 0}</strong></div>
          <i style="--v:${tasks.length ? Math.round(done/tasks.length*100) : 0}%"></i>
        </article>
        <article>
          <span class="lf61-vital-icon">⌁</span>
          <div><small>ACADEMIA</small><strong>HOJE</strong></div>
          <i style="--v:35%"></i>
        </article>
        <article>
          <span class="lf61-vital-icon">◈</span>
          <div><small>PMMG</small><strong>${study == null ? "ATIVO" : study + "%"}</strong></div>
          <i style="--v:${study == null ? 35 : study}%"></i>
        </article>
        <article>
          <span class="lf61-vital-icon">◌</span>
          <div><small>ÁGUA</small><strong>${water.current.toFixed(1)}L</strong></div>
          <i style="--v:${water.goal ? Math.min(100,Math.round(water.current/water.goal*100)) : 0}%"></i>
        </article>
      </section>
    `;

    host.querySelector("#lf611PriorityAction")?.addEventListener("click", () => {
      const target =
        document.querySelector("#homeScreen .daily-card") ||
        document.querySelector("#homeScreen .routine-card") ||
        document.querySelector("#homeScreen .task");
      target?.scrollIntoView({behavior:"smooth", block:"center"});
    });

    return true;
  }

  // Run immediately and retry because LifeFlow renders parts of Home dynamically.
  ensureCockpit();
  [80, 250, 700, 1400, 2500].forEach(ms => setTimeout(ensureCockpit, ms));

  const home = document.getElementById("homeScreen");
  if (home) {
    const observer = new MutationObserver(() => {
      clearTimeout(window.__lf611Refresh);
      window.__lf611Refresh = setTimeout(ensureCockpit, 120);
    });
    observer.observe(home, {childList:true, subtree:true, characterData:true});
  }

  setInterval(ensureCockpit, 60000);
});



document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-lifeflow-version", "5.0");
  document.body?.setAttribute("data-lf-system", "online");


  // =====================================================
  // LIFEFLOW
  // ROTINA + AGENDA + ESTUDOS + PROGRESSO
  // =====================================================

  const WORK_ANCHOR = new Date(2026, 7, 24);
  const today = new Date();


  // =====================================================
  // LIFEFLOW 3.0 — MENSAGENS DENTRO DO SITE
  // =====================================================

  function ensureLifeFlowMessageUI() {
    if (!document.getElementById("lifeflowMessageStyles")) {
      const style = document.createElement("style");
      style.id = "lifeflowMessageStyles";
      style.textContent = `
        #lfToastArea {
          position: fixed;
          left: 50%;
          bottom: calc(92px + env(safe-area-inset-bottom));
          transform: translateX(-50%);
          width: min(92vw, 430px);
          z-index: 99998;
          display: grid;
          gap: 9px;
          pointer-events: none;
        }
        .lf-site-toast {
          display: flex; align-items: center; gap: 11px;
          padding: 13px 15px; border-radius: 17px;
          border: 1px solid rgba(93,229,160,.20);
          background: rgba(10,14,12,.96); color: #f4f4f4;
          box-shadow: 0 18px 55px rgba(0,0,0,.55);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          font-size: 12px; font-weight: 750; line-height: 1.4;
          animation: lfToastIn .22s ease both;
        }
        .lf-site-toast.info { border-color: rgba(106,167,255,.22); }
        .lf-site-toast.warning { border-color: rgba(231,182,95,.24); }
        .lf-site-toast.error { border-color: rgba(255,105,105,.24); }
        .lf-site-toast .lf-toast-icon { font-size: 18px; flex: 0 0 auto; }
        .lf-site-toast.leaving { animation: lfToastOut .2s ease both; }
        @keyframes lfToastIn { from { opacity:0; transform:translateY(12px) scale(.98); } to { opacity:1; transform:none; } }
        @keyframes lfToastOut { to { opacity:0; transform:translateY(8px) scale(.98); } }

        #lfSiteModal {
          position: fixed; inset: 0; z-index: 99999;
          display: none; align-items: center; justify-content: center;
          padding: 22px; background: rgba(0,0,0,.72);
          backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px);
        }
        #lfSiteModal.open { display: flex; }
        .lf-modal-card {
          width: min(100%, 390px); border-radius: 25px; padding: 20px;
          border: 1px solid rgba(255,255,255,.09);
          background: radial-gradient(circle at 90% 0%, rgba(85,227,154,.09), transparent 32%), #0b0c0c;
          box-shadow: 0 28px 90px rgba(0,0,0,.72);
        }
        .lf-modal-icon { width:46px; height:46px; display:grid; place-items:center; border-radius:15px; background:rgba(85,227,154,.08); font-size:22px; }
        .lf-modal-card h3 { margin:14px 0 6px; color:#f4f4f4; font-size:19px; }
        .lf-modal-card p { margin:0; color:#929796; font-size:12px; line-height:1.55; }
        .lf-modal-input { box-sizing:border-box; width:100%; margin-top:15px; padding:13px 14px; border-radius:14px; border:1px solid rgba(255,255,255,.10); outline:none; background:#111313; color:#f5f5f5; font:inherit; font-size:13px; }
        .lf-modal-input:focus { border-color:rgba(85,227,154,.45); box-shadow:0 0 0 3px rgba(85,227,154,.07); }
        .lf-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:18px; }
        .lf-modal-actions button { min-height:46px; border-radius:14px; border:1px solid rgba(255,255,255,.08); background:#121414; color:#c9cccb; font:inherit; font-size:11px; font-weight:900; }
        .lf-modal-actions .primary { border-color:rgba(85,227,154,.25); background:rgba(85,227,154,.10); color:#74ebb0; }
        @media (max-width:520px) { #lfToastArea { bottom: calc(84px + env(safe-area-inset-bottom)); } .lf-modal-card { padding:18px; } }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("lfToastArea")) {
      const area = document.createElement("div");
      area.id = "lfToastArea";
      document.body.appendChild(area);
    }

    if (!document.getElementById("lfSiteModal")) {
      const modal = document.createElement("div");
      modal.id = "lfSiteModal";
      modal.innerHTML = `<div class="lf-modal-card" role="dialog" aria-modal="true">
        <div class="lf-modal-icon" id="lfModalIcon">✨</div>
        <h3 id="lfModalTitle">LifeFlow</h3>
        <p id="lfModalMessage"></p>
        <div id="lfModalInputWrap"></div>
        <div class="lf-modal-actions">
          <button type="button" id="lfModalCancel">Cancelar</button>
          <button type="button" class="primary" id="lfModalConfirm">Confirmar</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
    }
  }

  function showSiteMessage(message, type = "success") {
    ensureLifeFlowMessageUI();
    const icons = { success:"✓", info:"ℹ️", warning:"⚠️", error:"✕" };
    const toast = document.createElement("div");
    toast.className = `lf-site-toast ${type}`;
    toast.innerHTML = `<span class="lf-toast-icon">${icons[type] || "✓"}</span><span></span>`;
    toast.lastElementChild.textContent = message;
    document.getElementById("lfToastArea")?.appendChild(toast);
    setTimeout(() => { toast.classList.add("leaving"); setTimeout(() => toast.remove(), 220); }, 3200);
  }

  function showSiteConfirm(message, onConfirm, options = {}) {
    ensureLifeFlowMessageUI();
    const modal = document.getElementById("lfSiteModal");
    const title = document.getElementById("lfModalTitle");
    const text = document.getElementById("lfModalMessage");
    const icon = document.getElementById("lfModalIcon");
    const inputWrap = document.getElementById("lfModalInputWrap");
    const cancel = document.getElementById("lfModalCancel");
    const confirmButton = document.getElementById("lfModalConfirm");
    if (!modal || !title || !text || !inputWrap || !cancel || !confirmButton) return;

    title.textContent = options.title || "Confirmar ação";
    text.textContent = message;
    if (icon) icon.textContent = options.icon || "⚠️";
    inputWrap.innerHTML = "";
    cancel.textContent = options.cancelText || "Cancelar";
    confirmButton.textContent = options.confirmText || "Confirmar";
    modal.classList.add("open");

    const close = () => modal.classList.remove("open");
    cancel.onclick = close;
    confirmButton.onclick = () => { close(); if (typeof onConfirm === "function") onConfirm(); };
    modal.onclick = event => { if (event.target === modal) close(); };
  }

  function showSitePrompt(message, defaultValue, onConfirm) {
    ensureLifeFlowMessageUI();
    const modal = document.getElementById("lfSiteModal");
    const title = document.getElementById("lfModalTitle");
    const text = document.getElementById("lfModalMessage");
    const icon = document.getElementById("lfModalIcon");
    const inputWrap = document.getElementById("lfModalInputWrap");
    const cancel = document.getElementById("lfModalCancel");
    const confirmButton = document.getElementById("lfModalConfirm");
    if (!modal || !title || !text || !inputWrap || !cancel || !confirmButton) return;

    title.textContent = "Novo treino"; text.textContent = message; if (icon) icon.textContent = "🏋️";
    inputWrap.innerHTML = `<input id="lfModalInput" class="lf-modal-input" maxlength="40" autocomplete="off">`;
    const input = document.getElementById("lfModalInput");
    if (input) input.value = defaultValue || "";
    cancel.textContent = "Cancelar"; confirmButton.textContent = "Criar treino"; modal.classList.add("open");
    setTimeout(() => { input?.focus(); input?.select(); }, 40);

    const close = () => modal.classList.remove("open");
    const submit = () => { const value = input?.value.trim(); if (!value) { showSiteMessage("Digite um nome para o treino.", "warning"); input?.focus(); return; } close(); onConfirm?.(value); };
    cancel.onclick = close; confirmButton.onclick = submit;
    if (input) input.onkeydown = event => { if (event.key === "Enter") submit(); };
    modal.onclick = event => { if (event.target === modal) close(); };
  }

  ensureLifeFlowMessageUI();


  // =====================================================
  // DATAS
  // =====================================================

  function startOfDay(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }


  function getDateKey(date) {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function isSameDay(a, b) {

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }


  function isWorkDay(date) {

    const anchor =
      startOfDay(
        WORK_ANCHOR
      );

    const current =
      startOfDay(
        date
      );

    const difference =
      Math.round(
        (current - anchor) /
        86400000
      );

    return (
      ((difference % 2) + 2) % 2
    ) === 0;
  }


  function getGreeting() {

    const hour =
      new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Bom dia! 🌅";
    }

    if (hour >= 12 && hour < 18) {
      return "Boa tarde! ☀️";
    }

    return "Boa noite! 🌙";
  }


  // =====================================================
  // ROTINA - TRABALHO
  // =====================================================

  const workTasks = [

    {
      time: "05:30",
      title: "Acordar",
      description:
        "Água, higiene, banho e se arrumar."
    },

    {
      time: "05:45",
      title: "Sair para academia",
      description:
        "Moto • aproximadamente 10–15 min."
    },

    {
      time: "06:00",
      title: "Academia",
      description:
        "Treino de aproximadamente 1 hora."
    },

    {
      time: "07:05",
      title: "Voltar para casa",
      description:
        "Trocar roupa e fazer higiene rápida."
    },

    {
      time: "07:40",
      title: "Sair para o trabalho",
      description:
        "Chegar antes das 08:00."
    },

    {
      time: "08:00",
      title: "Início do trabalho",
      description:
        "Começar o expediente."
    },

    {
      time: "11:30",
      title: "Almoço",
      description:
        "Marmita na empresa."
    },

    {
      time: "12:30",
      title: "Voltar ao trabalho",
      description:
        "Retomar o expediente."
    },

    {
      time: "20:00",
      title: "Fim do trabalho",
      description:
        "Voltar para casa."
    },

    {
      time: "20:20",
      title: "Jantar e banho",
      description:
        "Alimentação e recuperação."
    },

    {
      time: "21:30",
      title: "Organizar amanhã",
      description:
        "Roupas, água e compromissos."
    },

    {
      time: "22:30",
      title: "Dormir",
      description:
        "Prioridade para recuperação."
    }

  ];


  // =====================================================
  // ROTINA - FOLGA
  // =====================================================

  const offTasks = [

    {
      time: "05:30",
      title: "Acordar",
      description:
        "Água, higiene, banho e se arrumar."
    },

    {
      time: "05:45",
      title: "Sair para academia",
      description:
        "Moto • aproximadamente 10–15 min."
    },

    {
      time: "06:00",
      title: "Academia",
      description:
        "Musculação + aproximadamente 1h de esteira."
    },

    {
      time: "08:15",
      title: "Voltar para casa",
      description:
        "Banho e café da manhã."
    },

    {
      time: "09:15",
      title: "Estudo PMMG",
      description:
        "Bloco principal de teoria."
    },

    {
      time: "11:30",
      title: "Almoço",
      description:
        "Refeição completa."
    },

    {
      time: "12:30",
      title: "Descanso",
      description:
        "Recuperar corpo e mente."
    },

    {
      time: "13:15",
      title: "Projeto da moto",
      description:
        "Tempo reservado para o projeto."
    },

    {
      time: "14:15",
      title: "Revisão PMMG",
      description:
        "Questões e revisão dos erros."
    },

    {
      time: "15:15",
      title: "Se preparar",
      description:
        "Organizar tudo antes de sair."
    },

    {
      time: "15:40",
      title: "Sair para escola",
      description:
        "Chegar antes das 16:00."
    },

    {
      time: "16:00",
      title: "Buscar sua filha",
      description:
        "Chegar pontualmente."
    },

    {
      time: "16:15",
      title: "Tempo com sua filha",
      description:
        "Período reservado para vocês."
    },

    {
      time: "20:15",
      title: "Levar sua filha",
      description:
        "Entrega entre 20:30 e 21:00."
    },

    {
      time: "21:15",
      title: "Organizar amanhã",
      description:
        "Se trabalhar amanhã, preparar marmita e roupas."
    },

    {
      time: "22:30",
      title: "Dormir",
      description:
        "Preparar para o próximo dia."
    }

  ];







  // =====================================================
  // LIFEFLOW 6.2 — MENU PRO
  // Conta única / proteção client-side
  // =====================================================

  const lfAuthUserHash = "0c6d1680e36252c187807883bfacce2875a99fef50a097e7488951599c0632e4";
  const lfAuthPasswordHash = "89f55f7dcdca14d89e2f59795861fdd08692ba0e8bfd5110dda69119f9597507";
  const lfAuthSessionKey = "lifeflow-auth-session-v41";
  const lfProfileStorageKey = "lifeflow-profile-v41";

  let lfProfile = {
    name: "",
    photo: "",
    subtitle: "Minha evolução, minha rotina."
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem(lfProfileStorageKey) || "null"
    );

    if (saved) {
      lfProfile = {
        ...lfProfile,
        ...saved
      };
    }
  } catch (error) {
    console.log("Erro ao carregar perfil:", error);
  }

  function saveLfProfile() {
    localStorage.setItem(
      lfProfileStorageKey,
      JSON.stringify(lfProfile)
    );
  }

  async function lfSha256(value) {
    const data =
      new TextEncoder().encode(String(value));

    const digest =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return Array
      .from(new Uint8Array(digest))
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(2, "0")
      )
      .join("");
  }

  function isLifeFlowAuthenticated() {
    return (
      sessionStorage.getItem(
        lfAuthSessionKey
      ) === "authenticated"
    );
  }

  function setLifeFlowAuthenticated() {
    sessionStorage.setItem(
      lfAuthSessionKey,
      "authenticated"
    );
  }

  function ensureLifeFlowLogin() {
    if (document.getElementById("lfLoginScreen")) return;

    const screen =
      document.createElement("div");

    screen.id = "lfLoginScreen";
    screen.className = "lf-login-screen";

    screen.innerHTML = `
      <div class="lf-login-shell">
        <div class="lf-login-brand">
          <div class="lf-login-logo">LF</div>
          <div>
            <span>ACESSO EXCLUSIVO</span>
            <h1>LifeFlow</h1>
            <p>Entre para acessar sua rotina e evolução.</p>
          </div>
        </div>

        <div class="lf-login-card">
          <label>
            <span>Login</span>
            <input
              id="lfLoginUser"
              type="text"
              inputmode="numeric"
              autocomplete="username"
              placeholder="Digite seu login"
            >
          </label>

          <label>
            <span>Senha</span>
            <div class="lf-password-field">
              <input
                id="lfLoginPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Digite sua senha"
              >
              <button
                id="lfTogglePassword"
                type="button"
                aria-label="Mostrar senha"
              >◉</button>
            </div>
          </label>

          <button
            id="lfLoginSubmit"
            class="lf-login-submit"
            type="button"
          >Entrar</button>

          <p
            id="lfLoginError"
            class="lf-login-error"
          ></p>
        </div>

        <small class="lf-login-private">
          🔒 Área pessoal
        </small>
      </div>
    `;

    document.body.appendChild(screen);

    const submit = async () => {
      const user =
        document.getElementById("lfLoginUser")
          ?.value.trim() || "";

      const pass =
        document.getElementById("lfLoginPassword")
          ?.value || "";

      const error =
        document.getElementById("lfLoginError");

      if (error) error.textContent = "Verificando...";

      try {
        const [userHash, passHash] =
          await Promise.all([
            lfSha256(user),
            lfSha256(pass)
          ]);

        if (
          userHash === lfAuthUserHash &&
          passHash === lfAuthPasswordHash
        ) {
          setLifeFlowAuthenticated();

          screen.classList.remove("visible");
          document.body.classList.remove("lf-auth-locked");

          if (error) error.textContent = "";

          const passwordInput =
            document.getElementById("lfLoginPassword");

          if (passwordInput) passwordInput.value = "";

          renderLifeProfileChip();

          showSiteMessage(
            "Acesso liberado.",
            "success"
          );

          return;
        }

        if (error) {
          error.textContent =
            "Login ou senha incorretos.";
        }
      } catch (authError) {
        console.log("Erro no login:", authError);

        if (error) {
          error.textContent =
            "Não foi possível validar o acesso.";
        }
      }
    };

    document
      .getElementById("lfLoginSubmit")
      ?.addEventListener("click", submit);

    ["lfLoginUser","lfLoginPassword"]
      .forEach(id => {
        document
          .getElementById(id)
          ?.addEventListener(
            "keydown",
            event => {
              if (event.key === "Enter") {
                submit();
              }
            }
          );
      });

    document
      .getElementById("lfTogglePassword")
      ?.addEventListener(
        "click",
        () => {
          const input =
            document.getElementById("lfLoginPassword");

          if (!input) return;

          input.type =
            input.type === "password"
              ? "text"
              : "password";
        }
      );
  }

  function showLifeFlowLogin() {
    ensureLifeFlowLogin();

    const screen =
      document.getElementById("lfLoginScreen");

    if (!screen) return;

    screen.classList.add("visible");
    document.body.classList.add("lf-auth-locked");
  }

  function enforceLifeFlowAuth() {
    ensureLifeFlowLogin();

    if (!isLifeFlowAuthenticated()) {
      showLifeFlowLogin();
    }
  }

  function logoutLifeFlow() {
    sessionStorage.removeItem(lfAuthSessionKey);
    showLifeFlowLogin();
  }

  function resizeProfileImage(file, maxSize = 512) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          let width = image.width;
          let height = image.height;

          const scale =
            Math.min(
              1,
              maxSize /
                Math.max(
                  width,
                  height
                )
            );

          width =
            Math.max(
              1,
              Math.round(width * scale)
            );

          height =
            Math.max(
              1,
              Math.round(height * scale)
            );

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.84
            )
          );
        };

        image.onerror = reject;
        image.src = reader.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getLifeProfileAvatarHtml(className) {
    if (lfProfile.photo) {
      return `
        <div class="${className}">
          <img
            src="${lf40Esc(lfProfile.photo)}"
            alt="Foto do perfil"
          >
        </div>
      `;
    }

    const initial =
      (
        lfProfile.name?.trim()?.charAt(0) ||
        "L"
      ).toUpperCase();

    return `
      <div class="${className}">
        <span>${initial}</span>
      </div>
    `;
  }

  function renderLifeProfileChip() {
    const drawer =
      document.getElementById("lifeflowDrawer");

    if (!drawer) return;

    // LifeFlow 6.3.2:
    // O perfil premium do menu é agora o ÚNICO perfil do drawer.
    // O antigo #lfProfileChip não é mais criado.
    document.getElementById("lfProfileChip")?.remove();

    const premium =
      document.getElementById("lf63Profile");

    if (!premium) return;

    const avatar =
      premium.querySelector(".lf63-avatar");

    const title =
      premium.querySelector(".lf63-profile-copy strong");

    const subtitle =
      premium.querySelector(".lf63-profile-copy span");

    if (avatar) {
      if (lfProfile.photo) {
        avatar.innerHTML = `
          <img
            src="${lf40Esc(lfProfile.photo)}"
            alt="Foto do perfil"
          >
        `;
      } else {
        const initial =
          (
            lfProfile.name?.trim()?.charAt(0) ||
            "L"
          ).toUpperCase();

        avatar.innerHTML =
          `<span>${lf40Esc(initial)}</span>`;
      }
    }

    if (title) {
      title.textContent =
        lfProfile.name ||
        "Meu perfil";
    }

    if (subtitle) {
      subtitle.textContent =
        lfProfile.subtitle ||
        "Minha evolução, minha rotina.";
    }
  }

  function chooseLifeProfilePhoto() {
    let input =
      document.getElementById(
        "lfProfilePhotoInput"
      );

    if (!input) {
      input =
        document.createElement("input");

      input.id =
        "lfProfilePhotoInput";

      input.type = "file";
      input.accept = "image/*";
      input.hidden = true;

      document.body.appendChild(input);

      input.addEventListener(
        "change",
        async () => {
          const file =
            input.files?.[0];

          if (!file) return;

          try {
            lfProfile.photo =
              await resizeProfileImage(file);

            saveLfProfile();
            renderLifeProfileChip();
            showLifeSettings();

            showSiteMessage(
              "Foto do perfil atualizada.",
              "success"
            );
          } catch (error) {
            console.log(
              "Erro ao salvar foto:",
              error
            );

            showSiteMessage(
              "Não foi possível salvar essa foto.",
              "warning"
            );
          } finally {
            input.value = "";
          }
        }
      );
    }

    input.click();
  }

  function openLifeProfileEditor() {
    lf40Modal(
      "Editar perfil",
      [
        {
          id:"lfProfileNameInput",
          label:"Nome",
          value:lfProfile.name || "",
          wide:true
        },
        {
          id:"lfProfileSubtitleInput",
          label:"Frase do perfil",
          value:lfProfile.subtitle || "",
          wide:true
        }
      ],
      (values, close) => {
        lfProfile.name =
          values.lfProfileNameInput.trim();

        lfProfile.subtitle =
          values.lfProfileSubtitleInput.trim() ||
          "Minha evolução, minha rotina.";

        saveLfProfile();
        close();

        renderLifeProfileChip();
        showLifeSettings();

        showSiteMessage(
          "Perfil atualizado.",
          "success"
        );
      }
    );
  }

  // =====================================================
  // LIFEFLOW 4.1 — PERFIL + ACESSO EXCLUSIVO
  // PMMG/ESTUDOS PRESERVADOS SEM ALTERAÇÕES
  // =====================================================

  const lifeHubStorageKey = "lifeflow-life-hub-v40";

  let lifeHub = {
    sleep: [],
    meals: [],
    agenda: [],
    care: [],
    motorcycle: {
      odometer: 0,
      fuel: [],
      maintenance: []
    },
    family: [],
    exerciseHistory: {},
    settings: {
      name: "",
      compactHome: true
    }
  };

  try {
    const saved = JSON.parse(localStorage.getItem(lifeHubStorageKey) || "null");
    if (saved) {
      lifeHub = {
        ...lifeHub,
        ...saved,
        motorcycle: {
          ...lifeHub.motorcycle,
          ...(saved.motorcycle || {})
        },
        settings: {
          ...lifeHub.settings,
          ...(saved.settings || {})
        }
      };
    }
  } catch (error) {
    console.log("Erro ao carregar Life Hub:", error);
  }

  function saveLifeHub() {
    localStorage.setItem(lifeHubStorageKey, JSON.stringify(lifeHub));
  }

  function lf40Esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function lf40DateLabel(key) {
    try {
      return dateKeyToDate(key).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return key;
    }
  }

  function lf40Modal(title, fields, onSave, saveText = "Salvar") {
    let modal = document.getElementById("lf40Modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "lf40Modal";
      modal.className = "lf40-modal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="lf40-modal-card">
        <div class="lf40-modal-head">
          <div>
            <span>LIFEFLOW</span>
            <h3>${lf40Esc(title)}</h3>
          </div>
          <button id="lf40ModalClose" type="button">×</button>
        </div>
        <div class="lf40-form">
          ${fields.map(field => `
            <label class="${field.wide ? "wide" : ""}">
              <span>${lf40Esc(field.label)}</span>
              ${
                field.type === "textarea"
                  ? `<textarea id="${field.id}" rows="3" placeholder="${lf40Esc(field.placeholder || "")}">${lf40Esc(field.value || "")}</textarea>`
                  : `<input id="${field.id}" type="${field.type || "text"}" value="${lf40Esc(field.value || "")}" placeholder="${lf40Esc(field.placeholder || "")}" ${field.step ? `step="${field.step}"` : ""}>`
              }
            </label>
          `).join("")}
        </div>
        <button id="lf40ModalSave" class="lf40-primary" type="button">${lf40Esc(saveText)}</button>
      </div>
    `;

    modal.classList.add("open");

    const close = () => modal.classList.remove("open");
    document.getElementById("lf40ModalClose")?.addEventListener("click", close);

    document.getElementById("lf40ModalSave")?.addEventListener("click", () => {
      const values = {};
      fields.forEach(field => {
        values[field.id] = document.getElementById(field.id)?.value ?? "";
      });
      onSave(values, close);
    });

    modal.onclick = event => {
      if (event.target === modal) close();
    };
  }

  function showLifeModule(title, subtitle, content, afterRender) {
    showScreen("gymScreen");
    clearNav();

    const screen = document.getElementById("gymScreen");
    if (!screen) return;

    screen.innerHTML = `
      <div class="lf-detail-header">
        <button type="button" class="lf-back-btn" id="lf40Back">‹</button>
        <div>
          <h2>${lf40Esc(title)}</h2>
          <span>${lf40Esc(subtitle)}</span>
        </div>
        <button type="button" class="lf-more-btn" id="lf40Menu">☰</button>
      </div>
      <div class="lf40-module">${content}</div>
    `;

    document.getElementById("lf40Back")?.addEventListener("click", showHome);
    document.getElementById("lf40Menu")?.addEventListener("click", () => window.openLifeFlowDrawer?.());
    afterRender?.();
    window.scrollTo(0, 0);
  }

  // ---------- SONO ----------
  function showLifeSleep() {
    const entries = [...lifeHub.sleep].sort((a,b) => b.date.localeCompare(a.date));
    const last7 = entries.slice(0, 7);
    const avg = last7.length
      ? Math.round(last7.reduce((s,x) => s + Number(x.hours || 0), 0) / last7.length * 10) / 10
      : 0;

    showLifeModule("Sono Inteligente", "Histórico e consistência", `
      <div class="lf40-actions">
        <button id="lf40AddSleep">＋ Registrar sono</button>
      </div>
      <div class="lf40-kpis">
        <article><span>MÉDIA</span><strong>${avg || "—"}${avg ? "h" : ""}</strong><small>últimos registros</small></article>
        <article><span>REGISTROS</span><strong>${entries.length}</strong><small>no histórico</small></article>
      </div>
      <section class="lf40-card">
        <span class="lf40-kicker">ÚLTIMOS DIAS</span>
        <div class="lf40-bars">
          ${last7.slice().reverse().map(x => `
            <div><i style="height:${Math.min(100, Math.max(8, Number(x.hours || 0) / 10 * 100))}%"></i><b>${Number(x.hours || 0)}h</b><span>${lf40Esc(x.date.slice(5))}</span></div>
          `).join("") || `<p class="lf40-empty">Registre seu sono para gerar o gráfico.</p>`}
        </div>
      </section>
      <div class="lf40-list">
        ${entries.map((x,i) => `<article><div><strong>${lf40DateLabel(x.date)}</strong><span>${lf40Esc(x.quality || "Sem avaliação")}</span></div><b>${Number(x.hours || 0)}h</b><button data-del-sleep="${i}">×</button></article>`).join("")}
      </div>
    `, () => {
      document.getElementById("lf40AddSleep")?.addEventListener("click", () => {
        lf40Modal("Registrar sono", [
          {id:"sdate", label:"Data", type:"date", value:todayKey},
          {id:"shours", label:"Horas dormidas", type:"number", step:"0.1", placeholder:"7.5"},
          {id:"squality", label:"Qualidade", placeholder:"Boa, ótima, cansado..."}
        ], (v, close) => {
          if (!v.sdate || !Number(v.shours)) return showSiteMessage("Informe data e horas.", "warning");
          lifeHub.sleep.push({date:v.sdate, hours:Number(v.shours), quality:v.squality});
          saveLifeHub(); close(); showSiteMessage("Sono registrado.", "success"); showLifeSleep();
        });
      });
      document.querySelectorAll("[data-del-sleep]").forEach(btn => btn.onclick = () => {
        const sorted = [...lifeHub.sleep].sort((a,b)=>b.date.localeCompare(a.date));
        const item = sorted[Number(btn.dataset.delSleep)];
        lifeHub.sleep = lifeHub.sleep.filter(x => x !== item);
        saveLifeHub(); showLifeSleep();
      });
    });
  }

  // ---------- ALIMENTAÇÃO ----------
  function showLifeFood() {
    const todayMeals = lifeHub.meals.filter(x => x.date === todayKey);
    showLifeModule("Alimentação", "Refeições e organização diária", `
      <div class="lf40-actions"><button id="lf40AddMeal">＋ Nova refeição</button></div>
      <div class="lf40-kpis">
        <article><span>HOJE</span><strong>${todayMeals.length}</strong><small>refeições</small></article>
        <article><span>TOTAL</span><strong>${lifeHub.meals.length}</strong><small>registros</small></article>
      </div>
      <div class="lf40-list">
        ${[...lifeHub.meals].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).map((x,i)=>`
          <article><div><strong>${lf40Esc(x.name)}</strong><span>${lf40Esc(x.date)} • ${lf40Esc(x.time)}${x.notes ? " • "+lf40Esc(x.notes) : ""}</span></div><b>🥘</b><button data-del-meal="${i}">×</button></article>
        `).join("") || `<p class="lf40-empty">Nenhuma refeição registrada.</p>`}
      </div>
    `, () => {
      document.getElementById("lf40AddMeal")?.addEventListener("click", () => lf40Modal("Nova refeição", [
        {id:"mdate",label:"Data",type:"date",value:todayKey},
        {id:"mtime",label:"Horário",type:"time",value:"12:00"},
        {id:"mname",label:"Refeição",placeholder:"Almoço"},
        {id:"mnotes",label:"Observações",type:"textarea",wide:true,placeholder:"Marmita, alimentos, observações..."}
      ], (v,close)=>{
        if(!v.mname) return showSiteMessage("Informe a refeição.","warning");
        lifeHub.meals.push({date:v.mdate,time:v.mtime,name:v.mname,notes:v.mnotes});
        saveLifeHub(); close(); showLifeFood();
      }));
      document.querySelectorAll("[data-del-meal]").forEach(btn=>btn.onclick=()=>{
        const sorted=[...lifeHub.meals].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
        const item=sorted[Number(btn.dataset.delMeal)];
        lifeHub.meals=lifeHub.meals.filter(x=>x!==item); saveLifeHub(); showLifeFood();
      });
    });
  }

  // ---------- AGENDA ----------
  function showLifeAgenda() {
    const sorted=[...lifeHub.agenda].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    showLifeModule("Agenda", "Compromissos e planejamento", `
      <div class="lf40-actions"><button id="lf40AddAgenda">＋ Novo compromisso</button></div>
      <div class="lf40-list">
        ${sorted.map((x,i)=>`<article class="${x.done?"done":""}"><div><strong>${lf40Esc(x.title)}</strong><span>${lf40Esc(x.date)} • ${lf40Esc(x.time)}${x.repeat?" • "+lf40Esc(x.repeat):""}</span></div><button data-done-agenda="${i}">${x.done?"✓":"○"}</button><button data-del-agenda="${i}">×</button></article>`).join("") || `<p class="lf40-empty">Sua agenda está vazia.</p>`}
      </div>
    `,()=>{
      document.getElementById("lf40AddAgenda")?.addEventListener("click",()=>lf40Modal("Novo compromisso",[
        {id:"adate",label:"Data",type:"date",value:todayKey},
        {id:"atime",label:"Horário",type:"time",value:"08:00"},
        {id:"atitle",label:"Compromisso",wide:true},
        {id:"arepeat",label:"Recorrência",placeholder:"Ex.: semanal",wide:true}
      ],(v,close)=>{
        if(!v.atitle)return showSiteMessage("Informe o compromisso.","warning");
        lifeHub.agenda.push({date:v.adate,time:v.atime,title:v.atitle,repeat:v.arepeat,done:false});
        saveLifeHub();close();showLifeAgenda();
      }));
      document.querySelectorAll("[data-done-agenda]").forEach(btn=>btn.onclick=()=>{
        const item=sorted[Number(btn.dataset.doneAgenda)]; item.done=!item.done; saveLifeHub();showLifeAgenda();
      });
      document.querySelectorAll("[data-del-agenda]").forEach(btn=>btn.onclick=()=>{
        const item=sorted[Number(btn.dataset.delAgenda)]; lifeHub.agenda=lifeHub.agenda.filter(x=>x!==item);saveLifeHub();showLifeAgenda();
      });
    });
  }

  // ---------- CUIDADOS ----------
  function showLifeCare() {
    showLifeModule("Cuidados", "Hábitos e autocuidado", `
      <div class="lf40-actions"><button id="lf40AddCare">＋ Novo cuidado</button></div>
      <div class="lf40-list">
        ${lifeHub.care.map((x,i)=>`<article class="${x.doneDate===todayKey?"done":""}"><div><strong>${lf40Esc(x.name)}</strong><span>${lf40Esc(x.frequency || "Quando necessário")}</span></div><button data-done-care="${i}">${x.doneDate===todayKey?"✓":"○"}</button><button data-del-care="${i}">×</button></article>`).join("") || `<p class="lf40-empty">Adicione seus cuidados pessoais.</p>`}
      </div>
    `,()=>{
      document.getElementById("lf40AddCare")?.addEventListener("click",()=>lf40Modal("Novo cuidado",[
        {id:"cname",label:"Cuidado",placeholder:"Ex.: Skincare noturno"},
        {id:"cfreq",label:"Frequência",placeholder:"Ex.: Todos os dias"}
      ],(v,close)=>{
        if(!v.cname)return showSiteMessage("Informe o cuidado.","warning");
        lifeHub.care.push({name:v.cname,frequency:v.cfreq,doneDate:""});saveLifeHub();close();showLifeCare();
      }));
      document.querySelectorAll("[data-done-care]").forEach(btn=>btn.onclick=()=>{
        const x=lifeHub.care[Number(btn.dataset.doneCare)];x.doneDate=x.doneDate===todayKey?"":todayKey;saveLifeHub();showLifeCare();
      });
      document.querySelectorAll("[data-del-care]").forEach(btn=>btn.onclick=()=>{
        lifeHub.care.splice(Number(btn.dataset.delCare),1);saveLifeHub();showLifeCare();
      });
    });
  }

  // ---------- MOTO ----------
  function showLifeMotorcycle() {
    const fuel=[...lifeHub.motorcycle.fuel].sort((a,b)=>b.date.localeCompare(a.date));
    const maintenance=[...lifeHub.motorcycle.maintenance].sort((a,b)=>b.date.localeCompare(a.date));
    showLifeModule("Moto", "Quilometragem, combustível e manutenção", `
      <div class="lf40-actions two">
        <button id="lf40AddFuel">＋ Abastecimento</button>
        <button id="lf40AddMaintenance">＋ Manutenção</button>
      </div>
      <div class="lf40-kpis">
        <article><span>ODÔMETRO</span><strong>${Number(lifeHub.motorcycle.odometer||0).toLocaleString("pt-BR")}</strong><small>km</small></article>
        <article><span>ABASTEC.</span><strong>${fuel.length}</strong><small>registros</small></article>
      </div>
      <section class="lf40-card"><span class="lf40-kicker">MANUTENÇÕES</span>
        <div class="lf40-list compact">${maintenance.map(x=>`<article><div><strong>${lf40Esc(x.service)}</strong><span>${lf40Esc(x.date)} • ${Number(x.km||0).toLocaleString("pt-BR")} km</span></div><b>🔧</b></article>`).join("") || `<p class="lf40-empty">Sem manutenções registradas.</p>`}</div>
      </section>
      <section class="lf40-card"><span class="lf40-kicker">ABASTECIMENTOS</span>
        <div class="lf40-list compact">${fuel.map(x=>`<article><div><strong>${Number(x.liters||0).toLocaleString("pt-BR")} L</strong><span>${lf40Esc(x.date)} • ${Number(x.km||0).toLocaleString("pt-BR")} km</span></div><b>⛽</b></article>`).join("") || `<p class="lf40-empty">Sem abastecimentos.</p>`}</div>
      </section>
    `,()=>{
      document.getElementById("lf40AddFuel")?.addEventListener("click",()=>lf40Modal("Registrar abastecimento",[
        {id:"fdate",label:"Data",type:"date",value:todayKey},
        {id:"fkm",label:"Odômetro (km)",type:"number",value:lifeHub.motorcycle.odometer||""},
        {id:"fliters",label:"Litros",type:"number",step:"0.01"},
        {id:"fvalue",label:"Valor",type:"number",step:"0.01"}
      ],(v,close)=>{
        lifeHub.motorcycle.odometer=Math.max(Number(lifeHub.motorcycle.odometer||0),Number(v.fkm||0));
        lifeHub.motorcycle.fuel.push({date:v.fdate,km:Number(v.fkm||0),liters:Number(v.fliters||0),value:Number(v.fvalue||0)});
        saveLifeHub();close();showLifeMotorcycle();
      }));
      document.getElementById("lf40AddMaintenance")?.addEventListener("click",()=>lf40Modal("Registrar manutenção",[
        {id:"mtdate",label:"Data",type:"date",value:todayKey},
        {id:"mtkm",label:"Odômetro (km)",type:"number",value:lifeHub.motorcycle.odometer||""},
        {id:"mtservice",label:"Serviço",wide:true,placeholder:"Ex.: Troca de óleo"}
      ],(v,close)=>{
        if(!v.mtservice)return showSiteMessage("Informe o serviço.","warning");
        lifeHub.motorcycle.odometer=Math.max(Number(lifeHub.motorcycle.odometer||0),Number(v.mtkm||0));
        lifeHub.motorcycle.maintenance.push({date:v.mtdate,km:Number(v.mtkm||0),service:v.mtservice});
        saveLifeHub();close();showLifeMotorcycle();
      }));
    });
  }

  // ---------- FAMÍLIA ----------
  function showLifeFamily() {
    const sorted=[...lifeHub.family].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    showLifeModule("Família", "Compromissos importantes", `
      <div class="lf40-actions"><button id="lf40AddFamily">＋ Novo compromisso</button></div>
      <div class="lf40-list">
        ${sorted.map((x,i)=>`<article><div><strong>${lf40Esc(x.title)}</strong><span>${lf40Esc(x.date)} • ${lf40Esc(x.time)}${x.notes?" • "+lf40Esc(x.notes):""}</span></div><b>👧</b><button data-del-family="${i}">×</button></article>`).join("") || `<p class="lf40-empty">Nenhum compromisso familiar registrado.</p>`}
      </div>
    `,()=>{
      document.getElementById("lf40AddFamily")?.addEventListener("click",()=>lf40Modal("Compromisso familiar",[
        {id:"fmdate",label:"Data",type:"date",value:todayKey},
        {id:"fmtime",label:"Horário",type:"time",value:"16:00"},
        {id:"fmtitle",label:"Compromisso",wide:true},
        {id:"fmnotes",label:"Observações",type:"textarea",wide:true}
      ],(v,close)=>{
        if(!v.fmtitle)return showSiteMessage("Informe o compromisso.","warning");
        lifeHub.family.push({date:v.fmdate,time:v.fmtime,title:v.fmtitle,notes:v.fmnotes});saveLifeHub();close();showLifeFamily();
      }));
      document.querySelectorAll("[data-del-family]").forEach(btn=>btn.onclick=()=>{
        const item=sorted[Number(btn.dataset.delFamily)];lifeHub.family=lifeHub.family.filter(x=>x!==item);saveLifeHub();showLifeFamily();
      });
    });
  }

  // ---------- PERFIL / BACKUP ----------
  function downloadLifeFlowBackup() {
    const payload = {
      version: "4.0",
      exportedAt: new Date().toISOString(),
      lifeHub,
      gymPrograms,
      gymAnalytics
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeflow-backup-${todayKey}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showSiteMessage("Backup gerado.", "success");
  }


  function showLifeSettings() {
    const trainingDays =
      typeof gymAnalytics !== "undefined"
        ? gymAnalytics.trainingDays.length
        : 0;

    const streak =
      typeof getGymTrainingStreak === "function"
        ? getGymTrainingStreak()
        : 0;

    showLifeModule(
      "Perfil e dados",
      "Sua conta pessoal no LifeFlow",
      `
        <section class="lf-profile-hero">
          ${getLifeProfileAvatarHtml("lf-profile-main-avatar")}

          <div class="lf-profile-main-copy">
            <span>PERFIL</span>
            <h3>${lf40Esc(lfProfile.name || "Meu LifeFlow")}</h3>
            <p>${lf40Esc(lfProfile.subtitle || "Minha evolução, minha rotina.")}</p>
          </div>

          <button
            id="lfProfileChangePhoto"
            type="button"
          >📷</button>
        </section>

        <div class="lf-profile-stats">
          <article>
            <span>TREINOS</span>
            <strong>${trainingDays}</strong>
            <small>registrados</small>
          </article>

          <article>
            <span>SEQUÊNCIA</span>
            <strong>${streak}</strong>
            <small>dias</small>
          </article>

          <article>
            <span>XP</span>
            <strong>${typeof evolution !== "undefined" ? evolution.totalXp : 0}</strong>
            <small>total</small>
          </article>
        </div>

        <section class="lf40-card">
          <span class="lf40-kicker">PERFIL</span>

          <div class="lf-profile-action-list">
            <button id="lfProfileEdit" type="button">
              <span>✎</span>
              <div>
                <strong>Editar perfil</strong>
                <small>Nome e frase pessoal</small>
              </div>
              <b>›</b>
            </button>

            <button id="lfProfilePhoto" type="button">
              <span>📷</span>
              <div>
                <strong>Alterar foto</strong>
                <small>Escolher imagem do aparelho</small>
              </div>
              <b>›</b>
            </button>
          </div>
        </section>

        <section class="lf40-card">
          <span class="lf40-kicker">CONTA</span>

          <div class="lf-profile-action-list">
            <div class="lf-profile-static-row">
              <span>🔒</span>
              <div>
                <strong>Acesso exclusivo</strong>
                <small>Conta única ativada</small>
              </div>
              <b class="lf-account-active">ATIVO</b>
            </div>

            <button id="lfProfileLogout" type="button">
              <span>↪</span>
              <div>
                <strong>Sair do LifeFlow</strong>
                <small>Voltar para a tela de login</small>
              </div>
              <b>›</b>
            </button>
          </div>
        </section>

        <section class="lf40-card">
          <span class="lf40-kicker">BACKUP</span>
          <p class="lf40-copy">
            Exporte seus dados do LifeFlow para guardar uma cópia.
          </p>
          <button
            id="lf40Backup"
            class="lf40-primary"
            type="button"
          >Gerar backup</button>
        </section>

        <p class="lf-security-note">
          Esta versão usa proteção no navegador. Uma autenticação realmente forte exigirá backend no futuro.
        </p>
      `,
      () => {
        document.getElementById("lfProfileEdit")?.addEventListener("click", openLifeProfileEditor);
        document.getElementById("lfProfilePhoto")?.addEventListener("click", chooseLifeProfilePhoto);
        document.getElementById("lfProfileChangePhoto")?.addEventListener("click", chooseLifeProfilePhoto);
        document.getElementById("lfProfileLogout")?.addEventListener("click", logoutLifeFlow);
        document.getElementById("lf40Backup")?.addEventListener("click", downloadLifeFlowBackup);
      }
    );
  }

  // ---------- ACADEMIA: HISTÓRICO POR EXERCÍCIO ----------
  function recordExercisePerformance(exerciseId, completedSets) {
    const exercise = getGymExerciseById(exerciseId);
    if (!exercise) return;

    if (!lifeHub.exerciseHistory[exerciseId]) {
      lifeHub.exerciseHistory[exerciseId] = [];
    }

    const list = lifeHub.exerciseHistory[exerciseId];
    let entry = list.find(x => x.date === todayKey);

    if (!entry) {
      entry = {date:todayKey, load:Number(exercise.load||0), sets:0, reps:exercise.reps||""};
      list.push(entry);
    }

    entry.load = Number(exercise.load || 0);
    entry.sets = Math.max(Number(entry.sets||0), Number(completedSets||0));
    entry.reps = exercise.reps || "";
    saveLifeHub();
  }

  function renderExercisePerformanceHtml(exerciseId) {
    const history = [...(lifeHub.exerciseHistory[exerciseId] || [])].sort((a,b)=>a.date.localeCompare(b.date));
    if (!history.length) return `<div class="lf40-empty">Conclua séries para criar o histórico deste exercício.</div>`;

    const maxLoad = Math.max(1, ...history.map(x=>Number(x.load||0)));

    return `
      <section class="lf40-card lf40-exercise-progress">
        <span class="lf40-kicker">EVOLUÇÃO DE CARGA</span>
        <div class="lf40-bars">
          ${history.slice(-7).map(x=>`<div><i style="height:${Math.max(8,Number(x.load||0)/maxLoad*100)}%"></i><b>${Number(x.load||0)}kg</b><span>${x.date.slice(5)}</span></div>`).join("")}
        </div>
        <div class="lf40-record">
          <span>RECORDE PESSOAL</span>
          <strong>${Math.max(...history.map(x=>Number(x.load||0)))} kg</strong>
        </div>
      </section>
    `;
  }

  // Replace placeholder drawer actions with real modules, without touching Study/PMMG.
  function wireLifeHubDrawer() {
    document.querySelectorAll("[data-life-area]").forEach(button => {
      const area = button.dataset.lifeArea;
      if (!["food","family","motorcycle","care"].includes(area)) return;

      button.replaceWith(button.cloneNode(true));
    });

    const map = {
      food: showLifeFood,
      family: showLifeFamily,
      motorcycle: showLifeMotorcycle,
      care: showLifeCare
    };

    document.querySelectorAll("[data-life-area]").forEach(button => {
      const fn = map[button.dataset.lifeArea];
      if (!fn) return;
      button.addEventListener("click", () => {
        fn();
        window.closeLifeFlowDrawer?.();
      });
    });

    const nav = document.querySelector("#lifeflowDrawer .lf-drawer-nav");
    if (!nav || document.getElementById("lf40ExtraDrawer")) return;

    const extra = document.createElement("div");
    extra.id = "lf40ExtraDrawer";
    extra.className = "lf-drawer-group";
    extra.innerHTML = `
      <button class="lf-drawer-item" id="lf40SleepDrawer"><span>☾</span><strong>Sono Inteligente</strong><b>›</b></button>
      <button class="lf-drawer-item" id="lf40AgendaDrawer"><span>▣</span><strong>Agenda</strong><b>›</b></button>
    `;
    nav.appendChild(extra);

    document.getElementById("lf40SleepDrawer")?.addEventListener("click",()=>{showLifeSleep();window.closeLifeFlowDrawer?.();});
    document.getElementById("lf40AgendaDrawer")?.addEventListener("click",()=>{showLifeAgenda();window.closeLifeFlowDrawer?.();});
  }



  function injectGymPremiumThemeStyles() {
    if (
      document.getElementById(
        "lifeflowGymPremiumThemeStyles"
      )
    ) return;

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "lifeflowGymPremiumThemeStyles";

    style.textContent = `
      .lifeflow-gym-screen {
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(100,231,155,.055),
            transparent 30%
          ),
          #0b0d0e;
      }

      .lf-gym-premium-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 8px 2px 17px;
      }

      .lf-gym-premium-greeting > span {
        color: #e7e8e8;
        font-size: 24px;
        font-weight: 400;
      }

      .lf-gym-premium-greeting > strong {
        margin-left: 5px;
        color: #f7f7f7;
        font-size: 24px;
        font-weight: 950;
      }

      .lf-gym-premium-greeting p {
        margin: 6px 0 0;
        color: #777b7f;
        font-size: 11px;
      }

      .lf-gym-avatar-button {
        flex: 0 0 auto;
        border: 0;
        background: transparent;
        padding: 0;
      }

      .lf-gym-premium-avatar {
        width: 52px;
        height: 52px;
        overflow: hidden;
        display: grid;
        place-items: center;
        border: 2px solid rgba(100,231,155,.45);
        border-radius: 50%;
        background:
          linear-gradient(
            145deg,
            rgba(100,231,155,.18),
            rgba(100,231,155,.06)
          );
        color: #7bedb0;
        font-size: 18px;
        font-weight: 950;
      }

      .lf-gym-premium-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .lf-gym-calendar-strip {
        display: grid;
        grid-template-columns: 82px 1fr;
        align-items: stretch;
        margin: 0 -14px 25px;
        border-top: 1px solid rgba(255,255,255,.035);
        border-bottom: 1px solid rgba(255,255,255,.04);
        background: #101213;
      }

      .lf-gym-month {
        display: grid;
        place-items: center;
        border-radius: 0 28px 28px 0;
        background:
          linear-gradient(
            135deg,
            #2c9d69,
            #67e8a0
          );
        color: #07110b;
        font-size: 17px;
        font-weight: 950;
      }

      .lf-gym-days {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 60px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 8px 7px;
      }

      .lf-gym-days::-webkit-scrollbar {
        display: none;
      }

      .lf-gym-days button {
        display: grid;
        place-items: center;
        gap: 2px;
        min-height: 74px;
        border: 0;
        background: transparent;
        color: #707478;
      }

      .lf-gym-days button i {
        width: 27px;
        height: 4px;
        border-radius: 999px;
        background: transparent;
      }

      .lf-gym-days button strong {
        color: #d8dadb;
        font-size: 16px;
      }

      .lf-gym-days button span {
        font-size: 10px;
      }

      .lf-gym-days button.today i {
        background: #69e8a3;
      }

      .lf-gym-days button.today strong,
      .lf-gym-days button.today span {
        color: #78eaaa;
      }

      .lf-gym-premium-section {
        margin: 0 0 25px;
      }

      .lf-gym-premium-title {
        margin: 0 2px 12px;
      }

      .lf-gym-premium-title h3 {
        margin: 0;
        color: #f1f2f2;
        font-size: 18px;
      }

      .lf-gym-premium-title p {
        margin: 4px 0 0;
        color: #72767a;
        font-size: 10px;
      }

      .lf-gym-featured-card {
        position: relative;
        width: 100%;
        min-height: 185px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1.25fr .75fr;
        align-items: stretch;
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 19px;
        background:
          radial-gradient(
            circle at 85% 50%,
            rgba(100,231,155,.10),
            transparent 40%
          ),
          linear-gradient(
            145deg,
            #16191a,
            #101213
          );
        color: inherit;
        padding: 19px;
        text-align: left;
        box-shadow:
          0 18px 50px rgba(0,0,0,.26);
      }

      .lf-gym-featured-card > em {
        position: absolute;
        top: 11px;
        right: 13px;
        color: #929699;
        font-style: normal;
        font-size: 21px;
      }

      .lf-gym-featured-copy {
        z-index: 1;
        display: flex;
        flex-direction: column;
      }

      .lf-gym-featured-copy > span {
        color: #76e9aa;
        font-size: 14px;
        font-weight: 950;
      }

      .lf-gym-featured-copy > strong {
        margin-top: 12px;
        color: #eeeeef;
        font-size: 18px;
      }

      .lf-gym-featured-copy > small {
        margin-top: 4px;
        color: #818589;
        font-size: 9px;
      }

      .lf-gym-featured-progress {
        margin-top: auto;
      }

      .lf-gym-featured-progress b {
        color: #75eaaa;
        font-size: 10px;
      }

      .lf-gym-featured-progress > div {
        width: 100%;
        height: 6px;
        overflow: hidden;
        margin-top: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }

      .lf-gym-featured-progress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            #3ea26f,
            #72e8a8
          );
      }

      .lf-gym-featured-art {
        display: grid;
        place-items: end center;
        font-size: 70px;
        filter:
          drop-shadow(
            0 18px 25px
            rgba(0,0,0,.4)
          );
        transform:
          rotate(-10deg);
      }

      .lf-gym-program-carousel {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(190px, 72%);
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 3px;
        scrollbar-width: none;
      }

      .lf-gym-program-carousel::-webkit-scrollbar {
        display: none;
      }

      .lf-gym-program-card {
        min-height: 175px;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 18px;
        background:
          radial-gradient(
            circle at 80% 15%,
            rgba(100,231,155,.07),
            transparent 32%
          ),
          #141617;
        color: inherit;
        padding: 15px;
        text-align: left;
      }

      .lf-gym-program-card-top {
        min-height: 57px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .lf-gym-program-card-top span {
        font-size: 39px;
      }

      .lf-gym-program-card-top b {
        color: #898d90;
        font-size: 20px;
      }

      .lf-gym-program-card > strong {
        margin-top: 12px;
        color: #74e9a9;
        font-size: 14px;
      }

      .lf-gym-program-card > small {
        margin-top: 5px;
        color: #777b7f;
        font-size: 9px;
      }

      .lf-gym-program-card > em {
        margin-top: auto;
        color: #5f6367;
        font-style: normal;
        font-size: 8px;
      }

      .lf-gym-program-new {
        border-style: dashed;
      }

      .lf-gym-immediate-card {
        width: 100%;
        min-height: 95px;
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 14px;
        border: 1px solid rgba(100,231,155,.13);
        border-radius: 18px;
        background:
          linear-gradient(
            135deg,
            rgba(100,231,155,.08),
            rgba(255,255,255,.018)
          ),
          #111314;
        color: inherit;
        padding: 16px;
        text-align: left;
      }

      .lf-gym-immediate-card span {
        display: block;
        color: #75eaaa;
        font-size: 12px;
        font-weight: 950;
      }

      .lf-gym-immediate-card strong {
        display: block;
        margin-top: 5px;
        color: #b5b8ba;
        font-size: 11px;
        font-variant-numeric:
          tabular-nums;
      }

      .lf-gym-immediate-card > b {
        color: #75eaaa;
        font-size: 31px;
      }

      .lf-gym-immediate-card > em {
        color: #8b8f92;
        font-style: normal;
        font-size: 28px;
      }

      .lf-gym-internal-nav {
        position: sticky;
        bottom: 8px;
        z-index: 20;
        display: grid;
        grid-template-columns:
          repeat(5,1fr);
        gap: 2px;
        margin: 22px 0 0;
        padding: 8px 5px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 22px;
        background: rgba(15,17,18,.94);
        backdrop-filter:
          blur(15px);
        -webkit-backdrop-filter:
          blur(15px);
        box-shadow:
          0 16px 45px rgba(0,0,0,.4);
      }

      .lf-gym-internal-nav button {
        min-width: 0;
        min-height: 54px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 3px;
        border: 0;
        border-radius: 14px;
        background: transparent;
        color: #6c7074;
      }

      .lf-gym-internal-nav button span {
        font-size: 18px;
      }

      .lf-gym-internal-nav button strong {
        font-size: 7px;
      }

      .lf-gym-internal-nav button.active {
        background:
          rgba(100,231,155,.10);
        color: #76e9aa;
      }

      @media (max-width:520px) {
        .lf-gym-premium-greeting > span,
        .lf-gym-premium-greeting > strong {
          font-size: 22px;
        }

        .lf-gym-calendar-strip {
          grid-template-columns:
            76px 1fr;
        }

        .lf-gym-program-carousel {
          grid-auto-columns:
            minmax(185px, 76%);
        }

        .lf-gym-featured-card {
          min-height: 178px;
          padding: 16px;
        }

        .lf-gym-featured-art {
          font-size: 60px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function injectLifeFlow41Styles() {
    if (document.getElementById("lifeflow41Styles")) return;

    const style =
      document.createElement("style");

    style.id = "lifeflow41Styles";

    style.textContent = `
      .lf-login-screen{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;padding:18px;box-sizing:border-box;background:radial-gradient(circle at 50% 0%,rgba(100,231,155,.10),transparent 34%),#08090a;opacity:0;visibility:hidden;transition:.22s}
      .lf-login-screen.visible{opacity:1;visibility:visible}
      body.lf-auth-locked{overflow:hidden!important}
      body.lf-auth-locked>*:not(#lfLoginScreen){filter:blur(10px);pointer-events:none!important;user-select:none!important}
      .lf-login-shell{width:min(100%,390px)}
      .lf-login-brand{display:flex;align-items:center;gap:13px;margin-bottom:18px}
      .lf-login-logo{width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(100,231,155,.18);border-radius:18px;background:rgba(100,231,155,.065);color:#75eaaa;font-size:19px;font-weight:950}
      .lf-login-brand span{display:block;color:#75eaaa;font-size:8px;font-weight:950;letter-spacing:1.1px}
      .lf-login-brand h1{margin:3px 0 2px;color:#f4f4f5;font-size:28px}
      .lf-login-brand p{margin:0;color:#74787c;font-size:9px}
      .lf-login-card{padding:17px;border:1px solid rgba(255,255,255,.075);border-radius:22px;background:#0e1011}
      .lf-login-card label{display:block;margin-bottom:11px}
      .lf-login-card label>span{display:block;margin-bottom:6px;color:#73777b;font-size:7px;font-weight:900;text-transform:uppercase}
      .lf-login-card input{box-sizing:border-box;width:100%;min-height:49px;border:1px solid rgba(255,255,255,.08);border-radius:13px;outline:none;background:#131516;color:#eee;padding:0 12px;font:inherit;font-size:16px}
      .lf-password-field{position:relative}.lf-password-field input{padding-right:50px}
      .lf-password-field button{position:absolute;top:5px;right:5px;width:39px;height:39px;border:0;border-radius:10px;background:rgba(255,255,255,.035);color:#8d9195}
      .lf-login-submit{width:100%;min-height:51px;border:1px solid rgba(100,231,155,.20);border-radius:14px;background:rgba(100,231,155,.10);color:#81edb3;font:inherit;font-size:10px;font-weight:950}
      .lf-login-error{min-height:15px;margin:9px 0 0;color:#da8585;font-size:8px;text-align:center}
      .lf-login-private{display:block;margin-top:14px;color:#54585c;font-size:8px;text-align:center}
      .lf-profile-chip{width:100%;min-height:68px;display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:10px;margin:11px 0 5px;border:1px solid rgba(255,255,255,.06);border-radius:15px;background:rgba(255,255,255,.02);color:inherit;padding:9px;text-align:left}
      .lf-profile-chip-avatar,.lf-profile-main-avatar{overflow:hidden;display:grid;place-items:center;border:1px solid rgba(100,231,155,.16);border-radius:50%;background:rgba(100,231,155,.065);color:#79eaae;font-weight:950}
      .lf-profile-chip-avatar{width:46px;height:46px}.lf-profile-main-avatar{width:92px;height:92px;font-size:31px}
      .lf-profile-chip-avatar img,.lf-profile-main-avatar img{width:100%;height:100%;object-fit:cover}
      .lf-profile-chip strong,.lf-profile-chip span{display:block}.lf-profile-chip strong{color:#e8e9ea;font-size:11px}.lf-profile-chip span{margin-top:3px;color:#686c70;font-size:7px}
      .lf-profile-hero{display:grid;grid-template-columns:92px 1fr 42px;align-items:center;gap:13px;padding:15px;border:1px solid rgba(255,255,255,.07);border-radius:19px;background:#0e0f11}
      .lf-profile-main-copy>span{display:block;color:#75eaaa;font-size:7px;font-weight:950}.lf-profile-main-copy h3{margin:4px 0 2px;color:#f0f1f2;font-size:19px}.lf-profile-main-copy p{margin:0;color:#6f7377;font-size:8px}
      .lf-profile-hero>button{width:42px;height:42px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:#151718;color:#aaa}
      .lf-profile-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.lf-profile-stats article{padding:10px;border:1px solid rgba(255,255,255,.055);border-radius:13px;background:#0e0f11}
      .lf-profile-stats span,.lf-profile-stats strong,.lf-profile-stats small{display:block}.lf-profile-stats span{color:#65696e;font-size:6px}.lf-profile-stats strong{margin-top:4px;color:#e7e8e9;font-size:18px}.lf-profile-stats small{color:#5e6267;font-size:6px}
      .lf-profile-action-list{display:grid;gap:7px;margin-top:10px}
      .lf-profile-action-list>button,.lf-profile-static-row{min-height:58px;display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.05);border-radius:12px;background:rgba(255,255,255,.015);color:inherit;padding:8px 10px;text-align:left}
      .lf-profile-action-list strong,.lf-profile-static-row strong{display:block;color:#dbddde;font-size:9px}.lf-profile-action-list small,.lf-profile-static-row small{display:block;margin-top:2px;color:#606469;font-size:7px}
      .lf-account-active{color:#75eaaa;font-size:7px}.lf-security-note{margin:2px 4px 0;color:#595d61;font-size:7px;line-height:1.55;text-align:center}
      @media(max-width:520px){.lf-login-screen{padding:14px}.lf-profile-main-avatar{width:78px;height:78px}.lf-profile-hero{grid-template-columns:78px 1fr 40px;padding:12px}}
    `;

    document.head.appendChild(style);
  }

  function injectLifeFlow40Styles() {
    if (document.getElementById("lifeflow40Styles")) return;
    const style = document.createElement("style");
    style.id = "lifeflow40Styles";
    style.textContent = `
      .lf40-module{display:grid;gap:10px;padding-bottom:100px}
      .lf40-actions{display:grid;grid-template-columns:1fr;gap:8px}
      .lf40-actions.two{grid-template-columns:1fr 1fr}
      .lf40-actions button,.lf40-primary{min-height:46px;border:1px solid rgba(100,231,155,.17);border-radius:13px;background:rgba(100,231,155,.065);color:#76e9aa;font:inherit;font-size:9px;font-weight:950}
      .lf40-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .lf40-kpis article,.lf40-card{border:1px solid rgba(255,255,255,.065);border-radius:16px;background:#0e0f11;padding:13px}
      .lf40-kpis span,.lf40-kicker{display:block;color:#6c7075;font-size:7px;font-weight:950;letter-spacing:.8px}
      .lf40-kpis strong{display:block;margin-top:4px;color:#eceeef;font-size:22px}
      .lf40-kpis small{display:block;margin-top:2px;color:#62666b;font-size:7px}
      .lf40-list{display:grid;gap:7px}
      .lf40-list.compact{margin-top:9px}
      .lf40-list article{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;min-height:58px;padding:10px;border:1px solid rgba(255,255,255,.055);border-radius:13px;background:#0e0f11}
      .lf40-list article.done{opacity:.55}
      .lf40-list strong{display:block;color:#e2e4e5;font-size:10px}
      .lf40-list span{display:block;margin-top:3px;color:#666a6f;font-size:7px}
      .lf40-list article>b{color:#83eab1;font-size:9px}
      .lf40-list article>button{width:31px;height:31px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:#141617;color:#8b8f93}
      .lf40-empty{grid-column:1/-1;margin:0;padding:25px 12px;color:#666a6f;font-size:8px;text-align:center}
      .lf40-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;height:145px;margin-top:12px}
      .lf40-bars>div{display:grid;grid-template-rows:1fr auto auto;gap:4px;text-align:center}
      .lf40-bars>div:before{content:"";grid-row:1;grid-column:1;display:block;border-radius:8px;background:rgba(255,255,255,.025)}
      .lf40-bars i{grid-row:1;grid-column:1;align-self:end;display:block;min-height:5px;border-radius:8px;background:linear-gradient(180deg,#75eaaa,#2d8f61)}
      .lf40-bars b{color:#aeb1b4;font-size:7px}.lf40-bars span{color:#5f6368;font-size:6px}
      .lf40-copy{color:#73777c;font-size:9px;line-height:1.6}
      .lf40-settings-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;margin-top:10px}
      .lf40-settings-row span{color:#73777c;font-size:8px}.lf40-settings-row strong{color:#e3e5e6;font-size:10px}.lf40-settings-row button{border:1px solid rgba(255,255,255,.07);border-radius:9px;background:#151718;color:#9ebfff;padding:8px;font-size:8px}
      .lf40-modal{position:fixed;inset:0;z-index:15000;display:grid;place-items:end center;padding:8px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);opacity:0;visibility:hidden;transition:.2s}
      .lf40-modal.open{opacity:1;visibility:visible}
      .lf40-modal-card{box-sizing:border-box;width:min(100%,520px);max-height:92dvh;overflow:auto;padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:22px 22px 14px 14px;background:#0d0f10}
      .lf40-modal-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}
      .lf40-modal-head span{color:#75eaaa;font-size:8px;font-weight:950}.lf40-modal-head h3{margin:4px 0 0;color:#eee;font-size:18px}
      .lf40-modal-head button{width:42px;height:42px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:#141617;color:#ccc;font-size:22px}
      .lf40-form{display:grid;grid-template-columns:1fr 1fr;gap:9px}.lf40-form label.wide{grid-column:1/-1}
      .lf40-form span{display:block;color:#72767a;font-size:7px;font-weight:900;text-transform:uppercase}
      .lf40-form input,.lf40-form textarea{box-sizing:border-box;width:100%;margin-top:5px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:12px;outline:0;background:#121415;color:#eee;font:inherit;font-size:16px}
      .lf40-form textarea{resize:vertical}
      .lf40-record{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05)}
      .lf40-record span{color:#686c71;font-size:7px;font-weight:900}.lf40-record strong{color:#75eaaa;font-size:14px}
      @media(max-width:520px){.lf40-form{grid-template-columns:1fr}.lf40-form label.wide{grid-column:auto}.lf40-actions.two{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  // =====================================================
  // LIFEFLOW 4.0 — LIFE HUB COMPLETO
  // =====================================================

  let gymStatsStandalone = false;

  function moveLifeAreasToDrawer() {
    const lifeGrid =
      document.querySelector(
        "#homeScreen .life-grid"
      );

    if (!lifeGrid) return;

    const section =
      lifeGrid.closest(
        ".content-section"
      );

    if (section) {
      section.style.display =
        "none";
      section.setAttribute(
        "data-lf-hidden-home",
        "true"
      );
    }

    const studySection =
      document.getElementById(
        "studySection"
      );

    if (studySection) {
      studySection.style.display =
        "none";
      studySection.setAttribute(
        "data-lf-hidden-home",
        "true"
      );
    }
  }

  function addLifeAreasToDrawer() {
    const drawerNav =
      document.querySelector(
        "#lifeflowDrawer .lf-drawer-nav"
      );

    if (
      !drawerNav ||
      document.getElementById(
        "lfLifeAreasDrawerGroup"
      )
    ) return;

    const wrapper =
      document.createElement("div");

    wrapper.id =
      "lfLifeAreasDrawerGroup";

    wrapper.className =
      "lf-drawer-group lf-life-areas-group";

    wrapper.innerHTML = `
      <button
        class="lf-drawer-item lf-drawer-parent"
        id="lfLifeAreasButton"
        type="button"
      >
        <span>▦</span>
        <strong>Áreas da sua vida</strong>
        <b>⌄</b>
      </button>

      <div
        id="lfLifeAreasSubmenu"
        class="lf-drawer-submenu collapsed"
      >
        <button
          type="button"
          data-life-area="gym"
        >
          🏋️ Academia
        </button>

        <button
          type="button"
          data-life-area="study"
        >
          📚 Estudos
        </button>

        <button
          type="button"
          data-life-area="food"
        >
          🥘 Alimentação
        </button>

        <button
          type="button"
          data-life-area="family"
        >
          👧 Família
        </button>

        <button
          type="button"
          data-life-area="motorcycle"
        >
          🏍️ Moto
        </button>

        <button
          type="button"
          data-life-area="care"
        >
          ✨ Cuidados
        </button>
      </div>
    `;

    const statsItem =
      [...drawerNav.children]
        .find(element =>
          element
            .textContent
            .includes(
              "Estatísticas"
            )
        );

    if (
      statsItem &&
      statsItem.parentNode === drawerNav
    ) {
      drawerNav.insertBefore(
        wrapper,
        statsItem
      );
    } else {
      drawerNav.appendChild(
        wrapper
      );
    }

    document
      .getElementById(
        "lfLifeAreasButton"
      )
      ?.addEventListener(
        "click",
        () => {
          document
            .getElementById(
              "lfLifeAreasSubmenu"
            )
            ?.classList
            .toggle(
              "collapsed"
            );
        }
      );

    document
      .querySelectorAll(
        "[data-life-area]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const area =
              button.dataset
                .lifeArea;

            if (area === "gym") {
              showGymRoot();
            }

            if (
              area === "study"
            ) {
              showStudy();
            }

            if (
              area === "food"
            ) {
              showSiteMessage(
                "A área Alimentação será adicionada em breve.",
                "info"
              );
            }

            if (
              area === "family"
            ) {
              showSiteMessage(
                "A área Família será adicionada em breve.",
                "info"
              );
            }

            if (
              area === "motorcycle"
            ) {
              showSiteMessage(
                "A área Moto será adicionada em breve.",
                "info"
              );
            }

            if (
              area === "care"
            ) {
              showSiteMessage(
                "A área Cuidados será adicionada em breve.",
                "info"
              );
            }

            window
              .closeLifeFlowDrawer
              ?.();
          }
        );
      });
  }

  function addGymEvolutionToDrawer() {
    const gymSubmenu =
      document.getElementById(
        "lfGymSubmenu"
      );

    if (
      !gymSubmenu ||
      document.getElementById(
        "lfGymEvolutionDrawerButton"
      )
    ) return;

    const button =
      document.createElement(
        "button"
      );

    button.id =
      "lfGymEvolutionDrawerButton";

    button.type = "button";
    button.textContent =
      "📈 Evolução de treino";

    gymSubmenu.appendChild(
      button
    );

    button.addEventListener(
      "click",
      () => {
        showGymEvolution();
        window
          .closeLifeFlowDrawer
          ?.();
      }
    );
  }

  function showGymEvolution() {
    gymStatsStandalone = true;

    showScreen(
      "gymScreen"
    );

    clearNav();

    renderGymEvolutionScreen();

    window.scrollTo(
      0,
      0
    );
  }


  function getGymExerciseRecords() {
    const records = [];

    gymPrograms.plans.forEach(plan => {
      plan.exercises.forEach(exercise => {
        records.push({
          plan: plan.name,
          name: exercise.name,
          load: Number(exercise.load || 0),
          sets: Number(exercise.sets || 0),
          reps: exercise.reps || "—",
          rest: Number(exercise.rest || 0)
        });
      });
    });

    return records
      .sort((a, b) => b.load - a.load);
  }

  function getGymMonthlyTrainingDays() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return gymAnalytics.trainingDays.filter(key => {
      const date = dateKeyToDate(key);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    }).length;
  }

  function getGymRecentTrainingHistory(limit = 12) {
    return [...gymAnalytics.trainingDays]
      .sort()
      .reverse()
      .slice(0, limit)
      .map(key => {
        const date = dateKeyToDate(key);

        return {
          key,
          date,
          sets: Number(gymAnalytics.setsByDay[key] || 0),
          perfect: gymAnalytics.perfectDays.includes(key)
        };
      });
  }

  function renderGymEvolutionScreen() {
    const screen =
      document.getElementById(
        "gymScreen"
      );

    if (!screen) return;

    const week =
      getGymDateRange(7);

    const weekCount =
      getGymWeekCount();

    const previous =
      getGymWeekCount(7);

    const weeklyGoal =
      Number(
        gymAnalytics.weeklyGoal ||
        4
      );

    const goalPct =
      Math.min(
        100,
        Math.round(
          (
            weekCount /
            weeklyGoal
          ) * 100
        )
      );

    const streak =
      getGymTrainingStreak();

    const totalSets =
      getTotalGymSets();

    const weight =
      getWeightGoalData();

    const setValues =
      week.map(item =>
        item.sets || 0
      );

    const maxSets =
      Math.max(
        1,
        ...setValues
      );

    const records =
      getGymExerciseRecords();

    const history =
      getGymRecentTrainingHistory();

    const monthlyDays =
      getGymMonthlyTrainingDays();

    const perfectDays =
      gymAnalytics.perfectDays.length;

    screen.innerHTML = `
      <div class="lf-detail-header">
        <button
          type="button"
          class="lf-back-btn"
          id="lfBackFromGymEvolution"
        >‹</button>

        <div>
          <h2>Evolução de treino</h2>
          <span>
            Metas, peso, histórico e recordes
          </span>
        </div>

        <button
          id="lfEvolutionMenuButton"
          type="button"
          class="lf-more-btn"
        >☰</button>
      </div>

      <div class="lf-evolution-section-tabs">
        <button class="active" data-evolution-section="overview" type="button">Visão geral</button>
        <button data-evolution-section="goals" type="button">Metas</button>
        <button data-evolution-section="weight" type="button">Peso</button>
        <button data-evolution-section="records" type="button">Recordes</button>
        <button data-evolution-section="history" type="button">Histórico</button>
        <button data-evolution-section="charts" type="button">Gráficos</button>
        <button data-evolution-section="achievements" type="button">Conquistas</button>
      </div>

      <div id="lfEvolutionSections">

        <section class="lf-evolution-section active" data-evolution-panel="overview">
          <section class="lf-evolution-hero-pro">
            <div>
              <span>META SEMANAL</span>
              <strong>
                ${weekCount}/${weeklyGoal}
              </strong>
              <small>
                treinos realizados
              </small>
            </div>

            <div class="lf-evolution-ring">
              <strong>
                ${goalPct}%
              </strong>
            </div>
          </section>

          <div class="lf-evolution-track">
            <i
              style="width:${goalPct}%"
            ></i>
          </div>

          <section class="lf-evolution-top-stats">
            <article>
              <span>🔥 SEQUÊNCIA</span>
              <strong>${streak}</strong>
              <small>dias</small>
            </article>

            <article>
              <span>🏋️ TREINOS</span>
              <strong>
                ${gymAnalytics.trainingDays.length}
              </strong>
              <small>total</small>
            </article>

            <article>
              <span>✓ SÉRIES</span>
              <strong>${totalSets}</strong>
              <small>feitas</small>
            </article>
          </section>

          <section class="lf-evolution-quick-grid">
            <button data-jump-evolution="goals" type="button">
              <span>🎯</span>
              <strong>Metas</strong>
              <small>${weeklyGoal} treinos/semana</small>
            </button>

            <button data-jump-evolution="weight" type="button">
              <span>⚖️</span>
              <strong>Peso</strong>
              <small>${weight.latest ? `${Number(weight.latest.weight).toLocaleString("pt-BR")} kg` : "Sem registro"}</small>
            </button>

            <button data-jump-evolution="records" type="button">
              <span>🏆</span>
              <strong>Recordes</strong>
              <small>${records.filter(item => item.load > 0).length} com carga</small>
            </button>

            <button data-jump-evolution="history" type="button">
              <span>📅</span>
              <strong>Histórico</strong>
              <small>${monthlyDays} treinos no mês</small>
            </button>

            <button data-jump-evolution="charts" type="button">
              <span>📈</span>
              <strong>Gráficos</strong>
              <small>Últimos 7 dias</small>
            </button>

            <button data-jump-evolution="achievements" type="button">
              <span>💎</span>
              <strong>Conquistas</strong>
              <small>${perfectDays} treinos 100%</small>
            </button>
          </section>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="goals">
          <div class="lf-evolution-panel-head">
            <div>
              <span>🎯 METAS</span>
              <h3>Objetivos de treino</h3>
            </div>
            <button id="lfEvolutionGoalsButton" type="button">Editar</button>
          </div>

          <div class="lf-evolution-goal-cards">
            <article>
              <span>Meta semanal</span>
              <strong>${weekCount}/${weeklyGoal}</strong>
              <small>${Math.max(0, weeklyGoal - weekCount)} treino(s) restantes</small>
              <div><i style="width:${goalPct}%"></i></div>
            </article>

            <article>
              <span>Treinos no mês</span>
              <strong>${monthlyDays}</strong>
              <small>dias registrados</small>
            </article>

            <article>
              <span>Treinos 100%</span>
              <strong>${perfectDays}</strong>
              <small>planos concluídos por completo</small>
            </article>

            <article>
              <span>Sequência atual</span>
              <strong>${streak}</strong>
              <small>dias seguidos treinando</small>
            </article>
          </div>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="weight">
          <div class="lf-evolution-panel-head">
            <div>
              <span>⚖️ PESO</span>
              <h3>Evolução corporal</h3>
            </div>
            <button id="lfWeightEditButton" type="button">Registrar</button>
          </div>

          <div class="lf-evolution-weight-main">
            <article>
              <span>Atual</span>
              <strong>${weight.latest ? `${Number(weight.latest.weight).toLocaleString("pt-BR")} kg` : "—"}</strong>
            </article>

            <article>
              <span>Meta</span>
              <strong>${weight.target ? `${Number(weight.target).toLocaleString("pt-BR")} kg` : "—"}</strong>
            </article>

            <article>
              <span>Progresso</span>
              <strong>${weight.target ? `${weight.progress}%` : "—"}</strong>
            </article>
          </div>

          <div class="lf-weight-chart lf-evolution-weight-chart">
            ${weightChartSvg(weight.entries)}
          </div>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="records">
          <div class="lf-evolution-panel-head">
            <div>
              <span>🏆 RECORDES</span>
              <h3>Maiores cargas</h3>
            </div>
          </div>

          <div class="lf-records-list">
            ${
              records.length
                ? records.slice(0, 20).map((item, index) => `
                    <article>
                      <b>${index + 1}</b>
                      <div>
                        <strong>${escapeGymHtml(item.name)}</strong>
                        <span>${escapeGymHtml(item.plan)} • ${item.sets} séries • ${escapeGymHtml(item.reps)} reps</span>
                      </div>
                      <em>${Number(item.load).toLocaleString("pt-BR")} kg</em>
                    </article>
                  `).join("")
                : `<div class="lf-evolution-empty">Adicione cargas aos exercícios para começar seus recordes.</div>`
            }
          </div>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="history">
          <div class="lf-evolution-panel-head">
            <div>
              <span>📅 HISTÓRICO</span>
              <h3>Treinos recentes</h3>
            </div>
          </div>

          <div class="lf-training-history-list">
            ${
              history.length
                ? history.map(item => `
                    <article>
                      <div>
                        <strong>
                          ${item.date.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </strong>
                        <span>${item.perfect ? "🏆 Treino 100%" : "Treino registrado"}</span>
                      </div>
                      <b>${item.sets} séries</b>
                    </article>
                  `).join("")
                : `<div class="lf-evolution-empty">Seu histórico aparecerá aqui conforme você treinar.</div>`
            }
          </div>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="charts">
          <div class="lf-evolution-panel-head">
            <div>
              <span>📈 GRÁFICOS</span>
              <h3>Últimos 7 dias</h3>
            </div>
          </div>

          <section class="lf-evolution-chart-pro standalone">
            <div class="lf-evolution-chart-head">
              <div>
                <span>VOLUME</span>
                <strong>Séries por dia</strong>
              </div>

              <b>
                ${
                  weekCount - previous > 0
                    ? "+"
                    : ""
                }${weekCount - previous}
              </b>
            </div>

            <div class="lf-evolution-bars">
              ${week.map(
                item => `
                  <div>
                    <div class="lf-evolution-bar-track">
                      <i
                        class="${
                          item.perfect
                            ? "perfect"
                            : item.trained
                              ? "trained"
                              : ""
                        }"
                        style="
                          height:${
                            item.trained
                              ? Math.max(
                                  14,
                                  Math.round(
                                    (
                                      item.sets /
                                      maxSets
                                    ) * 100
                                  )
                                )
                              : 5
                          }%
                        "
                      ></i>
                    </div>

                    <strong>${item.sets || "—"}</strong>
                    <span>
                      ${
                        item.date
                          .toLocaleDateString(
                            "pt-BR",
                            { weekday: "short" }
                          )
                          .replace(".", "")
                          .slice(0, 3)
                      }
                    </span>
                  </div>
                `
              ).join("")}
            </div>
          </section>

          <section class="lf-evolution-chart-pro standalone">
            <div class="lf-evolution-chart-head">
              <div>
                <span>PESO</span>
                <strong>Linha de evolução</strong>
              </div>
            </div>

            <div class="lf-weight-chart lf-evolution-weight-chart">
              ${weightChartSvg(weight.entries)}
            </div>
          </section>
        </section>

        <section class="lf-evolution-section" data-evolution-panel="achievements">
          <div class="lf-evolution-panel-head">
            <div>
              <span>💎 CONQUISTAS</span>
              <h3>Metas batidas</h3>
            </div>
          </div>

          <section class="lf-evolution-achievements-pro standalone">
            <div>
              <article class="${gymAnalytics.trainingDays.length >= 1 ? "unlocked" : ""}">
                <i>🏋️</i>
                <strong>Primeiro treino</strong>
                <small>Complete 1 treino</small>
              </article>

              <article class="${weekCount >= weeklyGoal ? "unlocked" : ""}">
                <i>🏆</i>
                <strong>Meta semanal</strong>
                <small>Bata sua meta de treinos</small>
              </article>

              <article class="${streak >= 3 ? "unlocked" : ""}">
                <i>🔥</i>
                <strong>Ritmo forte</strong>
                <small>3 dias de sequência</small>
              </article>

              <article class="${perfectDays >= 5 ? "unlocked" : ""}">
                <i>💎</i>
                <strong>5 treinos 100%</strong>
                <small>Finalize 5 treinos por completo</small>
              </article>

              <article class="${gymAnalytics.trainingDays.length >= 10 ? "unlocked" : ""}">
                <i>⚡</i>
                <strong>10 treinos</strong>
                <small>Registre 10 dias de treino</small>
              </article>

              <article class="${totalSets >= 100 ? "unlocked" : ""}">
                <i>💪</i>
                <strong>100 séries</strong>
                <small>Complete 100 séries</small>
              </article>
            </div>
          </section>
        </section>
      </div>
    `;

    function activateEvolutionSection(section) {
      document
        .querySelectorAll("[data-evolution-section]")
        .forEach(button => {
          button.classList.toggle(
            "active",
            button.dataset.evolutionSection === section
          );
        });

      document
        .querySelectorAll("[data-evolution-panel]")
        .forEach(panel => {
          panel.classList.toggle(
            "active",
            panel.dataset.evolutionPanel === section
          );
        });
    }

    document
      .querySelectorAll("[data-evolution-section]")
      .forEach(button => {
        button.addEventListener("click", () => {
          activateEvolutionSection(
            button.dataset.evolutionSection
          );
        });
      });

    document
      .querySelectorAll("[data-jump-evolution]")
      .forEach(button => {
        button.addEventListener("click", () => {
          activateEvolutionSection(
            button.dataset.jumpEvolution
          );

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        });
      });

    document
      .getElementById(
        "lfBackFromGymEvolution"
      )
      ?.addEventListener(
        "click",
        () => {
          gymStatsStandalone =
            false;
          showGymRoot();
        }
      );

    document
      .getElementById(
        "lfEvolutionGoalsButton"
      )
      ?.addEventListener(
        "click",
        openGymGoalsModal
      );

    document
      .getElementById(
        "lfWeightEditButton"
      )
      ?.addEventListener(
        "click",
        openGymGoalsModal
      );

    document
      .getElementById(
        "lfEvolutionMenuButton"
      )
      ?.addEventListener(
        "click",
        () => {
          window
            .openLifeFlowDrawer
            ?.();
        }
      );
  }


  function injectLifeFlow34Styles() {
    if (
      document.getElementById(
        "lifeflow34Styles"
      )
    ) return;

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "lifeflow34Styles";

    style.textContent = `
      #lfProfessionalStatsHandle {
        display: none !important;
      }

      #homeScreen [data-lf-hidden-home="true"] {
        display: none !important;
      }

      .lf-life-areas-group {
        margin-top: 3px;
        padding-top: 4px;
        border-top:
          1px solid rgba(255,255,255,.045);
      }

      #lfLifeAreasSubmenu button,
      #lfGymEvolutionDrawerButton {
        display: block;
        width: 100%;
      }

      .lf-evolution-hero-pro {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 16px;
        border:
          1px solid rgba(100,231,155,.10);
        border-radius: 19px;
        background:
          radial-gradient(
            circle at 90% 0%,
            rgba(100,231,155,.07),
            transparent 35%
          ),
          #0e0f11;
      }

      .lf-evolution-hero-pro span,
      .lf-evolution-top-stats span,
      .lf-evolution-chart-head span,
      .lf-evolution-achievements-pro > span {
        display: block;
        color: #6c7075;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .9px;
      }

      .lf-evolution-hero-pro > div:first-child > strong {
        display: block;
        margin-top: 5px;
        color: #f1f2f2;
        font-size: 31px;
      }

      .lf-evolution-hero-pro small {
        display: block;
        margin-top: 2px;
        color: #71757a;
        font-size: 8px;
      }

      .lf-evolution-ring {
        width: 74px;
        height: 74px;
        display: grid;
        place-items: center;
        border:
          5px solid rgba(100,231,155,.18);
        border-radius: 50%;
        box-shadow:
          inset 0 0 25px rgba(100,231,155,.04);
      }

      .lf-evolution-ring strong {
        color: #79eaae;
        font-size: 18px;
      }

      .lf-evolution-track {
        height: 7px;
        overflow: hidden;
        margin: 9px 3px 14px;
        border-radius: 999px;
        background:
          rgba(255,255,255,.045);
      }

      .lf-evolution-track i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            #299565,
            #79eaae
          );
      }

      .lf-evolution-top-stats {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap: 7px;
      }

      .lf-evolution-top-stats article {
        min-width: 0;
        padding: 11px;
        border:
          1px solid rgba(255,255,255,.06);
        border-radius: 14px;
        background:
          #0e0f11;
      }

      .lf-evolution-top-stats strong {
        display: block;
        margin-top: 5px;
        color: #eceeef;
        font-size: 19px;
      }

      .lf-evolution-top-stats small {
        display: block;
        margin-top: 2px;
        color: #62666b;
        font-size: 7px;
      }

      .lf-evolution-chart-pro,
      .lf-evolution-achievements-pro {
        margin-top: 11px;
        padding: 14px;
        border:
          1px solid rgba(255,255,255,.07);
        border-radius: 18px;
        background:
          radial-gradient(
            circle at 90% 0%,
            rgba(106,167,255,.04),
            transparent 34%
          ),
          #0e0f11;
      }

      .lf-evolution-chart-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .lf-evolution-chart-head strong {
        display: block;
        margin-top: 4px;
        color: #e2e4e5;
        font-size: 13px;
      }

      .lf-evolution-chart-head b {
        color: #90baff;
        font-size: 13px;
      }

      .lf-evolution-bars {
        display: grid;
        grid-template-columns:
          repeat(7, 1fr);
        gap: 5px;
        height: 165px;
        margin-top: 14px;
      }

      .lf-evolution-bars > div {
        min-width: 0;
        display: grid;
        grid-template-rows:
          1fr auto auto;
        gap: 5px;
        text-align: center;
      }

      .lf-evolution-bar-track {
        position: relative;
        min-height: 110px;
        overflow: hidden;
        border-radius: 9px;
        background:
          rgba(255,255,255,.03);
      }

      .lf-evolution-bar-track i {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 9px;
        background:
          rgba(255,255,255,.06);
      }

      .lf-evolution-bar-track i.trained {
        background:
          linear-gradient(
            180deg,
            #73e9a9,
            #2c8d60
          );
      }

      .lf-evolution-bar-track i.perfect {
        background:
          linear-gradient(
            180deg,
            #f0d080,
            #b88c35
          );
      }

      .lf-evolution-bars strong {
        color: #afb2b5;
        font-size: 8px;
      }

      .lf-evolution-bars span {
        color: #60646a;
        font-size: 7px;
        text-transform: uppercase;
      }

      .lf-evolution-weight-chart {
        height: 135px;
        margin-top: 13px;
      }

      .lf-evolution-weight-meta {
        display: grid;
        grid-template-columns:
          auto 1fr auto;
        gap: 8px;
        align-items: center;
        margin-top: 9px;
        padding-top: 9px;
        border-top:
          1px solid rgba(255,255,255,.05);
      }

      .lf-evolution-weight-meta span {
        color: #676b70;
        font-size: 8px;
      }

      .lf-evolution-weight-meta strong {
        color: #d8dadc;
        font-size: 10px;
      }

      .lf-evolution-weight-meta b {
        color: #73e9a9;
        font-size: 10px;
      }

      .lf-evolution-achievements-pro > div {
        display: grid;
        grid-template-columns:
          repeat(2, 1fr);
        gap: 7px;
        margin-top: 10px;
      }

      .lf-evolution-achievements-pro article {
        padding: 11px;
        border:
          1px solid rgba(255,255,255,.05);
        border-radius: 13px;
        background:
          rgba(255,255,255,.015);
        opacity: .38;
      }

      .lf-evolution-achievements-pro article.unlocked {
        opacity: 1;
        border-color:
          rgba(100,231,155,.14);
        background:
          rgba(100,231,155,.04);
      }

      .lf-evolution-achievements-pro i {
        font-style: normal;
        font-size: 20px;
      }

      .lf-evolution-achievements-pro strong {
        display: block;
        margin-top: 5px;
        color: #dcdddf;
        font-size: 9px;
      }


      .lf-evolution-section-tabs {
        display: flex;
        gap: 7px;
        overflow-x: auto;
        margin: 4px 0 12px;
        padding-bottom: 4px;
        scrollbar-width: none;
      }

      .lf-evolution-section-tabs::-webkit-scrollbar {
        display: none;
      }

      .lf-evolution-section-tabs button {
        flex: 0 0 auto;
        min-height: 40px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 12px;
        background: #0e0f11;
        color: #767a7f;
        padding: 0 12px;
        font-size: 8px;
        font-weight: 900;
      }

      .lf-evolution-section-tabs button.active {
        border-color: rgba(100,231,155,.18);
        background: rgba(100,231,155,.07);
        color: #75eaaa;
      }

      .lf-evolution-section {
        display: none;
      }

      .lf-evolution-section.active {
        display: block;
      }

      .lf-evolution-quick-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-top: 11px;
      }

      .lf-evolution-quick-grid button {
        min-height: 84px;
        display: grid;
        align-content: center;
        gap: 3px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 15px;
        background: #0e0f11;
        color: inherit;
        text-align: left;
        padding: 12px;
      }

      .lf-evolution-quick-grid button > span {
        font-size: 20px;
      }

      .lf-evolution-quick-grid button > strong {
        color: #e3e4e5;
        font-size: 11px;
      }

      .lf-evolution-quick-grid button > small {
        color: #64686d;
        font-size: 7px;
      }

      .lf-evolution-panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      .lf-evolution-panel-head span {
        color: #75eaaa;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .9px;
      }

      .lf-evolution-panel-head h3 {
        margin: 4px 0 0;
        color: #eceeef;
        font-size: 17px;
      }

      .lf-evolution-panel-head button {
        min-height: 38px;
        border: 1px solid rgba(100,231,155,.15);
        border-radius: 11px;
        background: rgba(100,231,155,.055);
        color: #75eaaa;
        padding: 0 11px;
        font-size: 8px;
        font-weight: 900;
      }

      .lf-evolution-goal-cards,
      .lf-evolution-weight-main {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .lf-evolution-goal-cards article,
      .lf-evolution-weight-main article {
        padding: 12px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 14px;
        background: #0e0f11;
      }

      .lf-evolution-goal-cards span,
      .lf-evolution-weight-main span {
        display: block;
        color: #686c71;
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .lf-evolution-goal-cards strong,
      .lf-evolution-weight-main strong {
        display: block;
        margin-top: 5px;
        color: #eceeef;
        font-size: 20px;
      }

      .lf-evolution-goal-cards small {
        display: block;
        margin-top: 3px;
        color: #62666b;
        font-size: 7px;
      }

      .lf-evolution-goal-cards article > div {
        height: 5px;
        overflow: hidden;
        margin-top: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,.04);
      }

      .lf-evolution-goal-cards article > div i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #319967, #75eaaa);
      }

      .lf-records-list,
      .lf-training-history-list {
        display: grid;
        gap: 8px;
      }

      .lf-records-list article,
      .lf-training-history-list article {
        display: grid;
        align-items: center;
        gap: 10px;
        min-height: 64px;
        padding: 10px;
        border: 1px solid rgba(255,255,255,.055);
        border-radius: 13px;
        background: #0e0f11;
      }

      .lf-records-list article {
        grid-template-columns: 28px 1fr auto;
      }

      .lf-records-list article > b {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 9px;
        background: rgba(100,231,155,.06);
        color: #75eaaa;
        font-size: 9px;
      }

      .lf-records-list strong,
      .lf-training-history-list strong {
        display: block;
        color: #e2e4e5;
        font-size: 10px;
      }

      .lf-records-list span,
      .lf-training-history-list span {
        display: block;
        margin-top: 3px;
        color: #62666b;
        font-size: 7px;
      }

      .lf-records-list em {
        color: #75eaaa;
        font-style: normal;
        font-size: 10px;
        font-weight: 900;
      }

      .lf-training-history-list article {
        grid-template-columns: 1fr auto;
      }

      .lf-training-history-list article > b {
        color: #9fbfff;
        font-size: 9px;
      }

      .lf-evolution-empty {
        min-height: 130px;
        display: grid;
        place-items: center;
        padding: 15px;
        border: 1px dashed rgba(255,255,255,.07);
        border-radius: 14px;
        color: #65696e;
        font-size: 8px;
        text-align: center;
      }

      .lf-evolution-chart-pro.standalone,
      .lf-evolution-achievements-pro.standalone {
        margin-top: 0;
      }

      @media (max-width: 520px) {
        .lf-evolution-hero-pro {
          padding: 14px;
        }

        .lf-evolution-ring {
          width: 68px;
          height: 68px;
        }

        .lf-evolution-top-stats {
          gap: 5px;
        }

        .lf-evolution-top-stats article {
          padding: 9px 7px;
        }

        .lf-evolution-bars {
          gap: 4px;
          height: 155px;
        }

        .lf-evolution-section-tabs button {
          min-height: 42px;
          padding: 0 11px;
        }

        .lf-evolution-quick-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .lf-evolution-goal-cards,
        .lf-evolution-weight-main {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  // =====================================================
  // LIFEFLOW 3.3 — INTERFACE ORGANIZADA + PAINEL GRÁFICO
  // =====================================================

  function getProfessionalOverviewData() {
    const routineWeek =
      typeof getHistoryRange === "function"
        ? getHistoryRange(7)
        : [];

    const gymWeek =
      typeof getGymDateRange === "function"
        ? getGymDateRange(7)
        : [];

    const routineAvg =
      routineWeek.length
        ? Math.round(
            routineWeek.reduce(
              (sum, item) =>
                sum + Number(item.routinePercent || 0),
              0
            ) / routineWeek.length
          )
        : 0;

    const gymDays =
      gymWeek.filter(item => item.trained).length;

    const sleepWeek =
      typeof getSleepRange === "function"
        ? getSleepRange(7)
        : [];

    const sleepRegistered =
      sleepWeek.filter(item => item.hasData);

    const sleepAvg =
      sleepRegistered.length
        ? Math.round(
            sleepRegistered.reduce(
              (sum, item) => sum + Number(item.minutes || 0),
              0
            ) / sleepRegistered.length
          )
        : 0;

    return {
      routineWeek,
      gymWeek,
      sleepWeek,
      routineAvg,
      gymDays,
      sleepAvg
    };
  }

  function makeMiniLineSvg(values, maxValue = 100) {
    const clean =
      values.map(value =>
        Math.max(0, Number(value || 0))
      );

    if (!clean.length) {
      return "";
    }

    const ceiling =
      Math.max(
        1,
        maxValue || Math.max(...clean, 1)
      );

    const points =
      clean.map((value, index) => {
        const x =
          clean.length === 1
            ? 50
            : (index / (clean.length - 1)) * 100;

        const y =
          88 - Math.min(
            78,
            (value / ceiling) * 78
          );

        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(" ");

    return `
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        class="lf-pro-chart-svg"
      >
        <polyline
          points="${points}"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          vector-effect="non-scaling-stroke"
        ></polyline>
      </svg>
    `;
  }

  function setupProfessionalStatsDrawer() {
    if (
      document.getElementById(
        "lfProfessionalStatsDrawer"
      )
    ) return;

    const overlay =
      document.createElement("div");

    overlay.id =
      "lfProfessionalStatsOverlay";

    overlay.className =
      "lf-professional-stats-overlay";

    const drawer =
      document.createElement("aside");

    drawer.id =
      "lfProfessionalStatsDrawer";

    drawer.className =
      "lf-professional-stats-drawer";

    const handle =
      document.createElement("button");

    handle.id =
      "lfProfessionalStatsHandle";

    handle.className =
      "lf-professional-stats-handle";

    handle.type = "button";
    handle.setAttribute(
      "aria-label",
      "Abrir gráficos"
    );

    handle.innerHTML = "📊";

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(handle);

    const open = () => {
      renderProfessionalStatsDrawer();
      drawer.classList.add("open");
      overlay.classList.add("open");
      handle.classList.add("hidden");
      document.body.classList.add(
        "lf-stats-open"
      );
    };

    const close = () => {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
      handle.classList.remove("hidden");
      document.body.classList.remove(
        "lf-stats-open"
      );
    };

    window.openProfessionalStats = open;
    window.closeProfessionalStats = close;

    handle.addEventListener("click", open);
    overlay.addEventListener("click", close);

    let touchStartX = null;
    let touchStartY = null;

    document.addEventListener(
      "touchstart",
      event => {
        const touch =
          event.touches?.[0];

        if (!touch) return;

        touchStartX =
          touch.clientX;

        touchStartY =
          touch.clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      event => {
        if (touchStartX === null) {
          return;
        }

        const touch =
          event.changedTouches?.[0];

        if (!touch) return;

        const dx =
          touch.clientX - touchStartX;

        const dy =
          touch.clientY - touchStartY;

        if (
          Math.abs(dx) > 55 &&
          Math.abs(dx) > Math.abs(dy)
        ) {
          if (
            touchStartX < 65 &&
            dx > 55
          ) {
            open();
          }

          if (
            drawer.classList.contains("open") &&
            dx < -55
          ) {
            close();
          }
        }

        touchStartX = null;
        touchStartY = null;
      },
      { passive: true }
    );
  }

  function renderProfessionalStatsDrawer() {
    const drawer =
      document.getElementById(
        "lfProfessionalStatsDrawer"
      );

    if (!drawer) return;

    const data =
      getProfessionalOverviewData();

    const routineValues =
      data.routineWeek.map(
        item => Number(item.routinePercent || 0)
      );

    const gymValues =
      data.gymWeek.map(
        item => Number(item.sets || 0)
      );

    const maxGymSets =
      Math.max(
        1,
        ...gymValues
      );

    const sleepHours =
      data.sleepWeek.map(
        item =>
          item.hasData
            ? Number(item.minutes || 0) / 60
            : 0
      );

    const dayLabels =
      data.routineWeek.map(
        item =>
          item.date
            .toLocaleDateString(
              "pt-BR",
              { weekday: "short" }
            )
            .replace(".", "")
            .slice(0, 3)
      );

    drawer.innerHTML = `
      <div class="lf-stats-head">
        <div>
          <span>PAINEL RÁPIDO</span>
          <h2>Seu progresso</h2>
          <p>Visão simples dos últimos 7 dias.</p>
        </div>

        <button
          id="lfStatsClose"
          type="button"
        >×</button>
      </div>

      <div class="lf-stats-summary">
        <article>
          <span>ROTINA</span>
          <strong>${data.routineAvg}%</strong>
          <small>média semanal</small>
        </article>

        <article>
          <span>ACADEMIA</span>
          <strong>${data.gymDays}</strong>
          <small>dias treinados</small>
        </article>

        <article>
          <span>SONO</span>
          <strong>${
            data.sleepAvg
              ? formatSleepDuration(
                  data.sleepAvg
                )
              : "—"
          }</strong>
          <small>média registrada</small>
        </article>
      </div>

      <section class="lf-stats-chart-card">
        <div class="lf-stats-chart-head">
          <div>
            <span>ROTINA</span>
            <strong>Consistência</strong>
          </div>
          <b>${data.routineAvg}%</b>
        </div>

        <div class="lf-prof-chart">
          ${makeMiniLineSvg(
            routineValues,
            100
          )}
        </div>

        <div class="lf-prof-labels">
          ${dayLabels.map(
            label =>
              `<span>${label}</span>`
          ).join("")}
        </div>
      </section>

      <section class="lf-stats-chart-card">
        <div class="lf-stats-chart-head">
          <div>
            <span>ACADEMIA</span>
            <strong>Séries realizadas</strong>
          </div>
          <b>${gymValues.reduce(
            (sum, value) =>
              sum + value,
            0
          )}</b>
        </div>

        <div class="lf-prof-chart gym">
          ${makeMiniLineSvg(
            gymValues,
            maxGymSets
          )}
        </div>

        <div class="lf-prof-labels">
          ${dayLabels.map(
            label =>
              `<span>${label}</span>`
          ).join("")}
        </div>
      </section>

      <section class="lf-stats-chart-card">
        <div class="lf-stats-chart-head">
          <div>
            <span>SONO</span>
            <strong>Horas dormidas</strong>
          </div>
          <b>${
            data.sleepAvg
              ? formatSleepDuration(
                  data.sleepAvg
                )
              : "—"
          }</b>
        </div>

        <div class="lf-prof-chart sleep">
          ${makeMiniLineSvg(
            sleepHours,
            9
          )}
        </div>

        <div class="lf-prof-labels">
          ${dayLabels.map(
            label =>
              `<span>${label}</span>`
          ).join("")}
        </div>
      </section>

      <button
        id="lfOpenFullProgress"
        class="lf-open-full-progress"
        type="button"
      >
        Abrir Progresso completo →
      </button>
    `;

    document
      .getElementById(
        "lfStatsClose"
      )
      ?.addEventListener(
        "click",
        window.closeProfessionalStats
      );

    document
      .getElementById(
        "lfOpenFullProgress"
      )
      ?.addEventListener(
        "click",
        () => {
          window.closeProfessionalStats?.();
          showProgress();
        }
      );
  }

  function injectSimplifiedInterfaceStyles() {
    if (
      document.getElementById(
        "lifeflowSimplifiedStyles"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id =
      "lifeflowSimplifiedStyles";

    style.textContent = `
      /*
       * Tela Hoje mais limpa.
       * Estudos e "Áreas da sua vida" continuam disponíveis
       * pelo menu lateral e não precisam ocupar a Home.
       */
      #homeScreen #studySection,
      #homeScreen .life-grid,
      #homeScreen .life-grid + *,
      #homeScreen .content-section:has(.life-grid) {
        display: none !important;
      }

      #homeScreen {
        padding-bottom: 105px;
      }

      .lf-professional-stats-overlay {
        position: fixed;
        inset: 0;
        z-index: 10990;
        background: rgba(0,0,0,.62);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        opacity: 0;
        visibility: hidden;
        transition: .24s ease;
      }

      .lf-professional-stats-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      .lf-professional-stats-drawer {
        position: fixed;
        z-index: 10991;
        top: 0;
        left: 0;
        width: min(88vw, 390px);
        height: 100dvh;
        box-sizing: border-box;
        padding:
          max(18px, env(safe-area-inset-top))
          14px
          max(18px, env(safe-area-inset-bottom));
        border-right: 1px solid rgba(255,255,255,.08);
        background:
          radial-gradient(
            circle at 10% 0%,
            rgba(106,167,255,.08),
            transparent 26%
          ),
          #0b0d0f;
        box-shadow:
          30px 0 90px rgba(0,0,0,.62);
        transform:
          translateX(-103%);
        transition:
          transform .30s cubic-bezier(.22,.9,.3,1);
        overflow-y: auto;
      }

      .lf-professional-stats-drawer.open {
        transform:
          translateX(0);
      }

      .lf-professional-stats-handle {
        position: fixed;
        z-index: 9997;
        top: 59%;
        left: 0;
        width: 25px;
        height: 68px;
        border:
          1px solid rgba(106,167,255,.25);
        border-left: 0;
        border-radius:
          0 16px 16px 0;
        background:
          rgba(45,84,145,.68);
        color: #a9c8ff;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow:
          8px 0 28px rgba(0,0,0,.34);
        font-size: 14px;
        cursor: pointer;
        touch-action: manipulation;
        transition: opacity .2s ease;
      }

      .lf-professional-stats-handle.hidden {
        opacity: 0;
        pointer-events: none;
      }

      body.lf-stats-open {
        overflow: hidden;
      }

      .lf-stats-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 13px;
        border-bottom:
          1px solid rgba(255,255,255,.06);
      }

      .lf-stats-head span {
        display: block;
        color: #8fb7f8;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1.1px;
      }

      .lf-stats-head h2 {
        margin: 4px 0 2px;
        color: #f2f3f4;
        font-size: 21px;
      }

      .lf-stats-head p {
        margin: 0;
        color: #73777c;
        font-size: 9px;
      }

      .lf-stats-head button {
        width: 42px;
        height: 42px;
        border:
          1px solid rgba(255,255,255,.07);
        border-radius: 12px;
        background: #131517;
        color: #c8cacc;
        font-size: 22px;
      }

      .lf-stats-summary {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap: 7px;
        margin-top: 13px;
      }

      .lf-stats-summary article {
        min-width: 0;
        padding: 10px 8px;
        border:
          1px solid rgba(255,255,255,.06);
        border-radius: 13px;
        background:
          rgba(255,255,255,.018);
      }

      .lf-stats-summary span,
      .lf-stats-summary strong,
      .lf-stats-summary small {
        display: block;
      }

      .lf-stats-summary span {
        color: #686c71;
        font-size: 6px;
        font-weight: 950;
      }

      .lf-stats-summary strong {
        margin-top: 4px;
        color: #eceeef;
        font-size: 16px;
      }

      .lf-stats-summary small {
        margin-top: 2px;
        color: #606469;
        font-size: 6px;
      }

      .lf-stats-chart-card {
        margin-top: 10px;
        padding: 12px;
        border:
          1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        background:
          radial-gradient(
            circle at 90% 0%,
            rgba(106,167,255,.045),
            transparent 34%
          ),
          #0e1012;
      }

      .lf-stats-chart-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .lf-stats-chart-head span {
        display: block;
        color: #6f7479;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .7px;
      }

      .lf-stats-chart-head strong {
        display: block;
        margin-top: 3px;
        color: #dfe1e2;
        font-size: 12px;
      }

      .lf-stats-chart-head b {
        color: #9ec2ff;
        font-size: 14px;
      }

      .lf-prof-chart {
        position: relative;
        height: 105px;
        margin-top: 9px;
        overflow: hidden;
        border-radius: 10px;
        background:
          linear-gradient(
            rgba(255,255,255,.028) 1px,
            transparent 1px
          );
        background-size:
          100% 25%;
        color: #75a9ff;
      }

      .lf-prof-chart.gym {
        color: #72e8a8;
      }

      .lf-prof-chart.sleep {
        color: #b19cff;
      }

      .lf-pro-chart-svg {
        width: 100%;
        height: 100%;
      }

      .lf-prof-labels {
        display: grid;
        grid-template-columns:
          repeat(7, 1fr);
        gap: 2px;
        margin-top: 4px;
      }

      .lf-prof-labels span {
        color: #5f6368;
        font-size: 6px;
        text-align: center;
        text-transform: uppercase;
      }

      .lf-open-full-progress {
        width: 100%;
        min-height: 47px;
        margin-top: 11px;
        border:
          1px solid rgba(106,167,255,.17);
        border-radius: 13px;
        background:
          rgba(106,167,255,.065);
        color: #a4c6ff;
        font-size: 9px;
        font-weight: 900;
      }

      /*
       * Menu inferior mais leve:
       * quatro atalhos principais.
       * Academia/Sono já ficam no menu lateral.
       */
      .bottom-nav {
        grid-template-columns:
          repeat(4, 1fr) !important;
      }

      @media (max-width: 520px) {
        .lf-professional-stats-drawer {
          width: min(91vw, 380px);
        }

        .lf-professional-stats-handle {
          height: 64px;
        }

        .lf-stats-summary {
          gap: 5px;
        }

        .lf-stats-summary article {
          padding: 9px 6px;
        }

        .lf-prof-chart {
          height: 100px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // =====================================================
  // LIFEFLOW 3.2 — ROTINA EDITÁVEL
  // =====================================================

  const routineStorageKey =
    "lifeflow-custom-routines-v32";

  const defaultWorkTasks =
    JSON.parse(JSON.stringify(workTasks));

  const defaultOffTasks =
    JSON.parse(JSON.stringify(offTasks));

  function normalizeRoutineTask(task) {
    return {
      time:
        typeof task?.time === "string"
          ? task.time
          : "08:00",
      title:
        typeof task?.title === "string"
          ? task.title
          : "Nova atividade",
      description:
        typeof task?.description === "string"
          ? task.description
          : ""
    };
  }

  function loadCustomRoutines() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            routineStorageKey
          ) || "null"
        );

      if (Array.isArray(saved?.work)) {
        workTasks.splice(
          0,
          workTasks.length,
          ...saved.work.map(normalizeRoutineTask)
        );
      }

      if (Array.isArray(saved?.off)) {
        offTasks.splice(
          0,
          offTasks.length,
          ...saved.off.map(normalizeRoutineTask)
        );
      }
    } catch (error) {
      console.log(
        "Erro ao carregar rotina personalizada:",
        error
      );
    }
  }

  function saveCustomRoutines() {
    localStorage.setItem(
      routineStorageKey,
      JSON.stringify({
        work: workTasks,
        off: offTasks
      })
    );
  }

  function sortRoutineTasks(list) {
    list.sort(
      (a, b) =>
        String(a.time).localeCompare(
          String(b.time)
        )
    );
  }

  function escapeRoutineHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getCurrentRoutineLabel() {
    return workDay
      ? "Rotina de trabalho"
      : "Rotina de folga";
  }

  function ensureRoutineEditor() {
    if (
      document.getElementById(
        "lfRoutineEditor"
      )
    ) return;

    const modal =
      document.createElement("div");

    modal.id = "lfRoutineEditor";
    modal.className =
      "lf-routine-editor";

    modal.innerHTML = `
      <div class="lf-routine-editor-card">
        <div class="lf-routine-editor-head">
          <div>
            <span>ROTINA</span>
            <h3 id="lfRoutineEditorTitle">
              Editar atividade
            </h3>
          </div>

          <button
            id="lfRoutineEditorClose"
            type="button"
            aria-label="Fechar"
          >×</button>
        </div>

        <div class="lf-routine-editor-grid">
          <label>
            <span>Horário</span>
            <input
              id="lfRoutineTime"
              type="time"
            >
          </label>

          <label>
            <span>Atividade</span>
            <input
              id="lfRoutineTitle"
              type="text"
              maxlength="70"
              placeholder="Ex.: Café da manhã"
            >
          </label>

          <label class="wide">
            <span>Descrição</span>
            <textarea
              id="lfRoutineDescription"
              rows="3"
              maxlength="220"
              placeholder="Detalhes da atividade..."
            ></textarea>
          </label>
        </div>

        <button
          id="lfRoutineSave"
          class="lf-routine-save"
          type="button"
        >
          Salvar atividade
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () =>
      modal.classList.remove("open");

    document
      .getElementById(
        "lfRoutineEditorClose"
      )
      ?.addEventListener(
        "click",
        close
      );

    modal.addEventListener(
      "click",
      event => {
        if (event.target === modal) {
          close();
        }
      }
    );
  }

  function openRoutineEditor(index = null) {
    ensureRoutineEditor();

    const modal =
      document.getElementById(
        "lfRoutineEditor"
      );

    const titleElement =
      document.getElementById(
        "lfRoutineEditorTitle"
      );

    const timeInput =
      document.getElementById(
        "lfRoutineTime"
      );

    const titleInput =
      document.getElementById(
        "lfRoutineTitle"
      );

    const descriptionInput =
      document.getElementById(
        "lfRoutineDescription"
      );

    const saveButton =
      document.getElementById(
        "lfRoutineSave"
      );

    if (
      !modal ||
      !timeInput ||
      !titleInput ||
      !descriptionInput ||
      !saveButton
    ) return;

    const editing =
      Number.isInteger(index);

    const task =
      editing
        ? tasks[index]
        : {
            time: "08:00",
            title: "",
            description: ""
          };

    if (!task) return;

    if (titleElement) {
      titleElement.textContent =
        editing
          ? "Editar atividade"
          : "Nova atividade";
    }

    timeInput.value =
      task.time || "08:00";

    titleInput.value =
      task.title || "";

    descriptionInput.value =
      task.description || "";

    modal.classList.add("open");

    setTimeout(
      () => titleInput.focus(),
      40
    );

    saveButton.onclick = () => {
      const time =
        timeInput.value || "08:00";

      const title =
        titleInput.value.trim();

      const description =
        descriptionInput.value.trim();

      if (!title) {
        showSiteMessage(
          "Digite o nome da atividade.",
          "warning"
        );
        titleInput.focus();
        return;
      }

      if (editing) {
        tasks[index] = {
          time,
          title,
          description
        };

        showSiteMessage(
          "Atividade atualizada.",
          "success"
        );
      } else {
        tasks.push({
          time,
          title,
          description
        });

        showSiteMessage(
          "Nova atividade adicionada.",
          "success"
        );
      }

      sortRoutineTasks(tasks);
      saveCustomRoutines();

      modal.classList.remove("open");

      renderHome();
      renderProgressScreen();
    };
  }

  function deleteRoutineTask(index) {
    const task = tasks[index];

    if (!task) return;

    showSiteConfirm(
      `Excluir "${task.title}" da ${getCurrentRoutineLabel().toLowerCase()}?`,
      () => {
        const wasCompleted =
          state.completed.includes(index);

        tasks.splice(index, 1);

        state.completed =
          state.completed
            .filter(item => item !== index)
            .map(item =>
              item > index
                ? item - 1
                : item
            );

        if (wasCompleted) {
          state.xp =
            Math.max(
              0,
              state.xp - 10
            );

          addEvolutionXp(-10);
        }

        saveCustomRoutines();
        saveState();
        syncDailyEvolution();

        showSiteMessage(
          "Atividade excluída da rotina.",
          "success"
        );

        renderHome();
        renderProgressScreen();
      },
      {
        title: "Excluir atividade",
        icon: "🗑️",
        confirmText: "Excluir"
      }
    );
  }

  function restoreCurrentRoutine() {
    showSiteConfirm(
      `Restaurar a ${getCurrentRoutineLabel().toLowerCase()} original? As alterações feitas nessa rotina serão perdidas.`,
      () => {
        const defaults =
          workDay
            ? defaultWorkTasks
            : defaultOffTasks;

        const completedCount =
          state.completed.length;

        tasks.splice(
          0,
          tasks.length,
          ...JSON.parse(
            JSON.stringify(defaults)
          )
        );

        state.completed = [];

        if (completedCount > 0) {
          const removedXp =
            completedCount * 10;

          state.xp =
            Math.max(
              0,
              state.xp - removedXp
            );

          addEvolutionXp(
            -removedXp
          );
        }

        saveCustomRoutines();
        saveState();
        syncDailyEvolution();

        showSiteMessage(
          "Rotina padrão restaurada.",
          "success"
        );

        renderHome();
        renderProgressScreen();
      },
      {
        title: "Restaurar rotina",
        icon: "↻",
        confirmText: "Restaurar"
      }
    );
  }

  function injectRoutineEditorStyles() {
    if (
      document.getElementById(
        "lifeflowRoutineEditorStyles"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id =
      "lifeflowRoutineEditorStyles";

    style.textContent = `
      .routine-manage-bar {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        margin: 0 0 11px;
      }

      .routine-manage-bar button {
        min-height: 44px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 13px;
        background: rgba(255,255,255,.025);
        color: #a7aaad;
        padding: 0 12px;
        font: inherit;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .routine-manage-bar .routine-add-button {
        border-color: rgba(100,231,155,.18);
        background: rgba(100,231,155,.065);
        color: #78eaae;
      }

      .task {
        position: relative;
      }

      .task-body {
        min-width: 0;
      }

      .routine-task-actions {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 8px;
      }

      .routine-task-actions button {
        min-height: 30px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 9px;
        background: rgba(255,255,255,.018);
        color: #777b80;
        padding: 0 8px;
        font: inherit;
        font-size: 7px;
        font-weight: 850;
        cursor: pointer;
        touch-action: manipulation;
      }

      .routine-task-actions button:first-child {
        color: #9ebfff;
        border-color: rgba(106,167,255,.10);
      }

      .routine-task-actions button:last-child {
        color: #d58d8d;
        border-color: rgba(255,105,105,.09);
      }

      .lf-routine-editor {
        position: fixed;
        inset: 0;
        z-index: 13000;
        display: grid;
        place-items: end center;
        padding: 14px;
        box-sizing: border-box;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: .22s ease;
      }

      .lf-routine-editor.open {
        opacity: 1;
        visibility: visible;
      }

      .lf-routine-editor-card {
        width: min(100%, 500px);
        max-height: 88dvh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 23px;
        background:
          radial-gradient(circle at 90% 0%, rgba(100,231,155,.07), transparent 34%),
          #0d0f10;
        box-shadow: 0 28px 90px rgba(0,0,0,.65);
        padding: 16px;
      }

      .lf-routine-editor-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 14px;
      }

      .lf-routine-editor-head span {
        display: block;
        color: #72e8a8;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .lf-routine-editor-head h3 {
        margin: 4px 0 0;
        color: #f1f1f2;
        font-size: 19px;
      }

      .lf-routine-editor-head button {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 12px;
        background: #141617;
        color: #c8cacc;
        font-size: 23px;
      }

      .lf-routine-editor-grid {
        display: grid;
        grid-template-columns: .7fr 1.3fr;
        gap: 9px;
      }

      .lf-routine-editor-grid label {
        display: block;
      }

      .lf-routine-editor-grid label.wide {
        grid-column: 1 / -1;
      }

      .lf-routine-editor-grid label > span {
        display: block;
        color: #72767a;
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .lf-routine-editor-grid input,
      .lf-routine-editor-grid textarea {
        box-sizing: border-box;
        width: 100%;
        margin-top: 6px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        outline: none;
        background: #121415;
        color: #ededee;
        padding: 11px;
        font: inherit;
        font-size: 12px;
      }

      .lf-routine-editor-grid textarea {
        resize: vertical;
      }

      .lf-routine-save {
        width: 100%;
        min-height: 49px;
        margin-top: 12px;
        border: 1px solid rgba(100,231,155,.21);
        border-radius: 13px;
        background: rgba(100,231,155,.09);
        color: #75eaaa;
        font: inherit;
        font-size: 10px;
        font-weight: 950;
      }

      @media (max-width: 520px) {
        .routine-manage-bar {
          grid-template-columns: 1fr 1fr;
        }

        .routine-manage-bar button {
          min-height: 47px;
        }

        .routine-task-actions button {
          min-height: 34px;
          font-size: 8px;
        }

        .lf-routine-editor {
          padding: 8px;
        }

        .lf-routine-editor-card {
          width: 100%;
          max-height: 92dvh;
          border-radius: 22px 22px 14px 14px;
        }

        .lf-routine-editor-grid {
          grid-template-columns: 1fr;
        }

        .lf-routine-editor-grid label.wide {
          grid-column: auto;
        }

        .lf-routine-editor-grid input,
        .lf-routine-editor-grid textarea {
          font-size: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  loadCustomRoutines();

  // =====================================================
  // ESTADO DE HOJE
  // =====================================================

  const todayKey =
    getDateKey(today);

  const workDay =
    isWorkDay(today);

  const tasks =
    workDay
      ? workTasks
      : offTasks;

  const storageKey =
    `lifeflow-${todayKey}`;


  let state = {

    completed: [],

    water: 0,

    xp: 0

  };


  try {

    const saved =
      localStorage.getItem(
        storageKey
      );

    if (saved) {

      state = {
        ...state,
        ...JSON.parse(saved)
      };
    }

  } catch (error) {

    console.log(
      "Erro ao carregar LifeFlow:",
      error
    );
  }


  if (
    state.done &&
    !state.completed
  ) {

    state.completed =
      state.done;
  }


  if (
    !Array.isArray(
      state.completed
    )
  ) {

    state.completed = [];
  }


  if (
    typeof state.water !==
    "number"
  ) {

    state.water = 0;
  }


  if (
    typeof state.xp !==
    "number"
  ) {

    state.xp = 0;
  }


  // =====================================================
  // SALVAR
  // =====================================================

  function saveState() {

    localStorage.setItem(
      storageKey,
      JSON.stringify(state)
    );

    if (typeof syncTodayHistory === "function") {
      syncTodayHistory();
    }
  }

  // =====================================================
  // LIFEFLOW 2.2 — SISTEMA DE EVOLUÇÃO
  // =====================================================

  const evolutionStorageKey = "lifeflow-evolution-v2";

  const evolutionLevels = [
    { name: "Iniciante", min: 0, icon: "🌱" },
    { name: "Disciplinado", min: 300, icon: "⚡" },
    { name: "Consistente", min: 900, icon: "🔥" },
    { name: "Elite", min: 2000, icon: "🏆" }
  ];

  let evolution = {
    totalXp: 0,
    completedDays: [],
    bestStreak: 0,
    achievements: [],
    bonusDays: []
  };

  try {
    const savedEvolution =
      localStorage.getItem(evolutionStorageKey);

    if (savedEvolution) {
      evolution = {
        ...evolution,
        ...JSON.parse(savedEvolution)
      };
    }
  } catch (error) {
    console.log("Erro ao carregar evolução:", error);
  }

  if (!Array.isArray(evolution.completedDays)) evolution.completedDays = [];
  if (!Array.isArray(evolution.achievements)) evolution.achievements = [];
  if (!Array.isArray(evolution.bonusDays)) evolution.bonusDays = [];
  if (typeof evolution.totalXp !== "number") evolution.totalXp = 0;
  if (typeof evolution.bestStreak !== "number") evolution.bestStreak = 0;

  function saveEvolution() {
    localStorage.setItem(
      evolutionStorageKey,
      JSON.stringify(evolution)
    );
  }

  function addEvolutionXp(amount) {
    evolution.totalXp =
      Math.max(0, evolution.totalXp + amount);

    saveEvolution();
  }

  function dateKeyToDate(key) {
    const [year, month, day] =
      key.split("-").map(Number);

    return new Date(year, month - 1, day);
  }

  function calculateCurrentStreak() {
    const uniqueDays =
      [...new Set(evolution.completedDays)]
        .sort();

    if (uniqueDays.length === 0) {
      return 0;
    }

    const todayStart = startOfDay(new Date());
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastDate =
      dateKeyToDate(uniqueDays[uniqueDays.length - 1]);

    const lastIsToday =
      isSameDay(lastDate, todayStart);

    const lastIsYesterday =
      isSameDay(lastDate, yesterday);

    if (!lastIsToday && !lastIsYesterday) {
      return 0;
    }

    let streak = 1;

    for (
      let i = uniqueDays.length - 1;
      i > 0;
      i--
    ) {
      const current =
        dateKeyToDate(uniqueDays[i]);

      const previous =
        dateKeyToDate(uniqueDays[i - 1]);

      const difference =
        Math.round(
          (startOfDay(current) - startOfDay(previous)) /
          86400000
        );

      if (difference === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  function syncDailyEvolution() {
    const routineComplete =
      tasks.length > 0 &&
      state.completed.length >= tasks.length;

    const hasCompletedDay =
      evolution.completedDays.includes(todayKey);

    const hasBonus =
      evolution.bonusDays.includes(todayKey);

    if (routineComplete && !hasCompletedDay) {
      evolution.completedDays.push(todayKey);
    }

    if (routineComplete && !hasBonus) {
      evolution.bonusDays.push(todayKey);
      evolution.totalXp += 100;
    }

    if (!routineComplete && hasCompletedDay) {
      evolution.completedDays =
        evolution.completedDays.filter(
          key => key !== todayKey
        );
    }

    if (!routineComplete && hasBonus) {
      evolution.bonusDays =
        evolution.bonusDays.filter(
          key => key !== todayKey
        );

      evolution.totalXp =
        Math.max(0, evolution.totalXp - 100);
    }

    const streak =
      calculateCurrentStreak();

    evolution.bestStreak =
      Math.max(
        evolution.bestStreak,
        streak
      );

    updateAchievements();
    saveEvolution();
  }

  function getEvolutionLevel() {
    let current =
      evolutionLevels[0];

    evolutionLevels.forEach(level => {
      if (evolution.totalXp >= level.min) {
        current = level;
      }
    });

    const currentIndex =
      evolutionLevels.indexOf(current);

    const next =
      evolutionLevels[currentIndex + 1] || null;

    return {
      current,
      next,
      currentIndex
    };
  }

  function updateAchievements() {
    const unlocked = new Set(
      evolution.achievements
    );

    const streak =
      calculateCurrentStreak();

    if (evolution.totalXp >= 100) {
      unlocked.add("primeiros-passos");
    }

    if (streak >= 3) {
      unlocked.add("ritmo-forte");
    }

    if (streak >= 7) {
      unlocked.add("semana-perfeita");
    }

    if (evolution.completedDays.length >= 10) {
      unlocked.add("dez-dias");
    }

    if (evolution.totalXp >= 1000) {
      unlocked.add("mil-xp");
    }

    evolution.achievements =
      [...unlocked];
  }

  function getAchievementData() {
    return [
      {
        id: "primeiros-passos",
        icon: "⚡",
        title: "Primeiros Passos",
        description: "Alcance 100 XP."
      },
      {
        id: "ritmo-forte",
        icon: "🔥",
        title: "Ritmo Forte",
        description: "Complete 3 dias seguidos."
      },
      {
        id: "semana-perfeita",
        icon: "🏆",
        title: "Semana Perfeita",
        description: "Complete 7 dias seguidos."
      },
      {
        id: "dez-dias",
        icon: "📅",
        title: "Consistência",
        description: "Feche 10 dias completos."
      },
      {
        id: "mil-xp",
        icon: "💎",
        title: "1.000 XP",
        description: "Acumule 1.000 XP."
      }
    ];
  }

  function renderEvolutionPanel() {
    const progressScreen =
      document.getElementById("progressScreen");

    if (!progressScreen) {
      return;
    }

    let panel =
      document.getElementById("evolutionPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "evolutionPanel";
      panel.className = "evolution-panel";

      const firstCard =
        progressScreen.querySelector(".progress-hero, .progress-card, .card");

      if (firstCard && firstCard.parentNode) {
        firstCard.parentNode.insertBefore(
          panel,
          firstCard.nextSibling
        );
      } else {
        progressScreen.appendChild(panel);
      }
    }

    const streak =
      calculateCurrentStreak();

    const level =
      getEvolutionLevel();

    let levelProgress = 100;
    let levelText = "Nível máximo";

    if (level.next) {
      const range =
        level.next.min - level.current.min;

      const gained =
        evolution.totalXp - level.current.min;

      levelProgress =
        Math.max(
          0,
          Math.min(
            100,
            Math.round((gained / range) * 100)
          )
        );

      levelText =
        `${evolution.totalXp} / ${level.next.min} XP`;
    }

    const achievements =
      getAchievementData();

    panel.innerHTML = `
      <div class="evolution-hero">
        <div class="evolution-topline">
          <span class="evolution-kicker">SUA EVOLUÇÃO</span>
          <span class="evolution-level-badge">
            ${level.current.icon} ${level.current.name}
          </span>
        </div>

        <div class="evolution-main">
          <div>
            <span class="evolution-label">XP TOTAL</span>
            <strong class="evolution-xp">
              ${evolution.totalXp.toLocaleString("pt-BR")} XP
            </strong>
          </div>

          <div class="evolution-streak">
            <span>🔥</span>
            <strong>${streak}</strong>
            <small>dias</small>
          </div>
        </div>

        <div class="evolution-progress-head">
          <span>Próximo nível</span>
          <strong>${levelText}</strong>
        </div>

        <div class="evolution-progress-track">
          <div
            class="evolution-progress-fill"
            style="width:${levelProgress}%"
          ></div>
        </div>

        <div class="evolution-stats">
          <div>
            <span>Recorde</span>
            <strong>${evolution.bestStreak} dias</strong>
          </div>

          <div>
            <span>Dias completos</span>
            <strong>${evolution.completedDays.length}</strong>
          </div>

          <div>
            <span>Bônus diário</span>
            <strong>+100 XP</strong>
          </div>
        </div>
      </div>

      <div class="achievement-section">
        <div class="achievement-heading">
          <div>
            <span class="evolution-kicker">CONQUISTAS</span>
            <h3>Marcos da jornada</h3>
          </div>

          <strong>
            ${evolution.achievements.length}/${achievements.length}
          </strong>
        </div>

        <div class="achievement-grid">
          ${achievements.map(item => {
            const unlocked =
              evolution.achievements.includes(item.id);

            return `
              <div class="achievement-card ${unlocked ? "unlocked" : "locked"}">
                <div class="achievement-icon">
                  ${unlocked ? item.icon : "🔒"}
                </div>
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.description}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }




  // =====================================================
  // LIFEFLOW 2.3 — HISTÓRICO + PROGRESSO INTELIGENTE
  // =====================================================

  const historyStorageKey = "lifeflow-history-v23";

  let lifeHistory = {};

  try {
    const savedHistory =
      localStorage.getItem(historyStorageKey);

    if (savedHistory) {
      lifeHistory = JSON.parse(savedHistory) || {};
    }
  } catch (error) {
    console.log("Erro ao carregar histórico:", error);
    lifeHistory = {};
  }

  function saveHistory() {
    localStorage.setItem(
      historyStorageKey,
      JSON.stringify(lifeHistory)
    );
  }

  function syncTodayHistory() {
    lifeHistory[todayKey] = {
      date: todayKey,
      type: workDay ? "Trabalho" : "Folga",
      completed: state.completed.length,
      total: tasks.length,
      routinePercent: getRoutinePercent(),
      water: state.water,
      waterPercent: Math.min(
        100,
        Math.round((state.water / 4000) * 100)
      ),
      xp: state.xp,
      updatedAt: new Date().toISOString()
    };

    saveHistory();
  }

  function getHistoryDateKey(date) {
    return getDateKey(date);
  }

  function getHistoryRange(days, offsetDays = 0) {
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(
        date.getDate() - i - offsetDays
      );

      const key = getHistoryDateKey(date);
      const saved = lifeHistory[key];

      result.push({
        key,
        date,
        routinePercent:
          saved?.routinePercent || 0,
        waterPercent:
          saved?.waterPercent || 0,
        completed:
          saved?.completed || 0,
        total:
          saved?.total || 0,
        xp:
          saved?.xp || 0,
        hasData: Boolean(saved)
      });
    }

    return result;
  }

  function averageHistory(items, field) {
    const withData =
      items.filter(item => item.hasData);

    if (!withData.length) {
      return 0;
    }

    return Math.round(
      withData.reduce(
        (sum, item) => sum + (item[field] || 0),
        0
      ) / withData.length
    );
  }

  function sumHistory(items, field) {
    return items.reduce(
      (sum, item) => sum + (item[field] || 0),
      0
    );
  }

  function getMonthHistory() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay =
      new Date(year, month + 1, 0).getDate();

    const result = [];

    for (let day = 1; day <= lastDay; day++) {
      const date =
        new Date(year, month, day, 12);

      if (date > now) {
        break;
      }

      const key = getDateKey(date);
      const saved = lifeHistory[key];

      result.push({
        key,
        date,
        routinePercent:
          saved?.routinePercent || 0,
        waterPercent:
          saved?.waterPercent || 0,
        completed:
          saved?.completed || 0,
        total:
          saved?.total || 0,
        xp:
          saved?.xp || 0,
        hasData: Boolean(saved)
      });
    }

    return result;
  }

  function renderHistoryProgressPanel() {
    const progressScreen =
      document.getElementById("progressScreen");

    if (!progressScreen) return;

    let panel =
      document.getElementById("historyProgressPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "historyProgressPanel";
      panel.className = "history-progress-panel";

      const evolutionPanel =
        document.getElementById("evolutionPanel");

      if (
        evolutionPanel &&
        evolutionPanel.parentNode
      ) {
        evolutionPanel.parentNode.insertBefore(
          panel,
          evolutionPanel.nextSibling
        );
      } else {
        progressScreen.appendChild(panel);
      }
    }

    const week = getHistoryRange(7);
    const previousWeek = getHistoryRange(7, 7);
    const month = getMonthHistory();

    const weekAverage =
      averageHistory(week, "routinePercent");

    const previousAverage =
      averageHistory(
        previousWeek,
        "routinePercent"
      );

    const comparison =
      weekAverage - previousAverage;

    const waterAverage =
      averageHistory(week, "waterPercent");

    const perfectDays =
      week.filter(
        item =>
          item.hasData &&
          item.routinePercent >= 100
      ).length;

    const completedTasks =
      sumHistory(week, "completed");

    const weekXp =
      sumHistory(week, "xp");

    const monthAverage =
      averageHistory(
        month,
        "routinePercent"
      );

    const monthPerfect =
      month.filter(
        item =>
          item.hasData &&
          item.routinePercent >= 100
      ).length;

    let summary =
      "Continue registrando sua rotina para construir seu histórico.";

    if (week.some(item => item.hasData)) {
      if (weekAverage >= 85) {
        summary =
          `Excelente consistência: sua média dos últimos 7 dias está em ${weekAverage}%.`;
      } else if (weekAverage >= 60) {
        summary =
          `Você está construindo um bom ritmo: média de ${weekAverage}% nos últimos 7 dias.`;
      } else {
        summary =
          `Sua média atual é ${weekAverage}%. Foque em pequenas vitórias para subir essa consistência.`;
      }
    }

    const comparisonText =
      comparison > 0
        ? `+${comparison}%`
        : comparison < 0
          ? `${comparison}%`
          : "0%";

    const comparisonClass =
      comparison > 0
        ? "positive"
        : comparison < 0
          ? "negative"
          : "neutral";

    panel.innerHTML = `
      <div class="history-card">
        <div class="history-heading">
          <div>
            <span class="history-kicker">PROGRESSO INTELIGENTE</span>
            <h3>Últimos 7 dias</h3>
          </div>

          <span class="history-comparison ${comparisonClass}">
            ${comparisonText}
          </span>
        </div>

        <div class="history-chart">
          ${week.map(item => {
            const day =
              item.date
                .toLocaleDateString(
                  "pt-BR",
                  { weekday: "short" }
                )
                .replace(".", "")
                .slice(0, 3);

            const height =
              item.hasData
                ? Math.max(6, item.routinePercent)
                : 4;

            return `
              <div class="history-bar-column">
                <div class="history-bar-track">
                  <div
                    class="history-bar-fill ${item.routinePercent >= 100 ? "perfect" : ""}"
                    style="height:${height}%"
                    title="${item.routinePercent}%"
                  ></div>
                </div>
                <strong>${item.hasData ? item.routinePercent + "%" : "—"}</strong>
                <span>${day}</span>
              </div>
            `;
          }).join("")}
        </div>

        <div class="history-metrics">
          <div>
            <span>Média semanal</span>
            <strong>${weekAverage}%</strong>
          </div>
          <div>
            <span>Dias 100%</span>
            <strong>${perfectDays}</strong>
          </div>
          <div>
            <span>Tarefas</span>
            <strong>${completedTasks}</strong>
          </div>
          <div>
            <span>Hidratação</span>
            <strong>${waterAverage}%</strong>
          </div>
        </div>

        <div class="history-summary">
          <span>✨</span>
          <div>
            <strong>Resumo da semana</strong>
            <p>${summary}</p>
          </div>
        </div>
      </div>

      <div class="history-card month-card">
        <div class="history-heading">
          <div>
            <span class="history-kicker">VISÃO MENSAL</span>
            <h3>${monthNames[new Date().getMonth()]}</h3>
          </div>
          <span class="month-badge">
            ${month.filter(item => item.hasData).length} dias registrados
          </span>
        </div>

        <div class="month-metrics">
          <div>
            <span>Média</span>
            <strong>${monthAverage}%</strong>
          </div>
          <div>
            <span>Dias perfeitos</span>
            <strong>${monthPerfect}</strong>
          </div>
          <div>
            <span>XP da semana</span>
            <strong>${weekXp}</strong>
          </div>
        </div>

        <p class="history-note">
          O LifeFlow começa a guardar seu histórico a partir desta versão.
          Quanto mais você usar, mais preciso ficará seu painel.
        </p>
      </div>
    `;
  }

  function injectHistoryStyles() {
    if (
      document.getElementById(
        "lifeflowHistoryStyles"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id =
      "lifeflowHistoryStyles";

    style.textContent = `
      .history-progress-panel {
        display: grid;
        gap: 14px;
        margin: 14px 0;
      }

      .history-card {
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 24px;
        padding: 18px;
        background:
          radial-gradient(circle at 92% 0%, rgba(106,167,255,.09), transparent 30%),
          linear-gradient(145deg, rgba(20,20,20,.98), rgba(7,7,7,.98));
        box-shadow: 0 22px 60px rgba(0,0,0,.38);
      }

      .history-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .history-kicker {
        display: block;
        color: #777;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.1px;
      }

      .history-heading h3 {
        margin: 5px 0 0;
        font-size: 18px;
        color: #f2f2f2;
      }

      .history-comparison,
      .month-badge {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 9px;
        font-weight: 900;
      }

      .history-comparison.positive {
        color: #70edb1;
        border-color: rgba(85,227,154,.20);
        background: rgba(85,227,154,.07);
      }

      .history-comparison.negative {
        color: #ff8585;
        border-color: rgba(255,92,92,.18);
        background: rgba(255,92,92,.06);
      }

      .history-comparison.neutral,
      .month-badge {
        color: #aaa;
        background: rgba(255,255,255,.03);
      }

      .history-chart {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 7px;
        height: 190px;
        margin-top: 20px;
        padding-top: 8px;
      }

      .history-bar-column {
        min-width: 0;
        display: grid;
        grid-template-rows: 1fr auto auto;
        gap: 5px;
        text-align: center;
      }

      .history-bar-track {
        position: relative;
        overflow: hidden;
        min-height: 120px;
        border-radius: 10px;
        background: rgba(255,255,255,.035);
      }

      .history-bar-fill {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 10px;
        background: linear-gradient(180deg, #6aa7ff, #396fc7);
        box-shadow: 0 0 18px rgba(106,167,255,.12);
        transition: height .35s ease;
      }

      .history-bar-fill.perfect {
        background: linear-gradient(180deg, #75efb5, #42c982);
        box-shadow: 0 0 18px rgba(85,227,154,.16);
      }

      .history-bar-column strong {
        color: #bdbdbd;
        font-size: 8px;
      }

      .history-bar-column span {
        color: #666;
        font-size: 8px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .history-metrics,
      .month-metrics {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .history-metrics {
        grid-template-columns: repeat(4, 1fr);
      }

      .month-metrics {
        grid-template-columns: repeat(3, 1fr);
      }

      .history-metrics > div,
      .month-metrics > div {
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 15px;
        padding: 10px;
        background: rgba(255,255,255,.022);
      }

      .history-metrics span,
      .month-metrics span {
        display: block;
        color: #6f6f6f;
        font-size: 8px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .history-metrics strong,
      .month-metrics strong {
        display: block;
        margin-top: 4px;
        color: #ededed;
        font-size: 15px;
      }

      .history-summary {
        display: flex;
        gap: 10px;
        margin-top: 14px;
        padding: 13px;
        border: 1px solid rgba(231,182,95,.13);
        border-radius: 16px;
        background: rgba(231,182,95,.045);
      }

      .history-summary strong {
        color: #e9e9e9;
        font-size: 10px;
      }

      .history-summary p,
      .history-note {
        margin: 4px 0 0;
        color: #858585;
        font-size: 9px;
        line-height: 1.55;
      }

      .history-note {
        margin-top: 14px;
      }

      @media (max-width: 520px) {
        .history-card {
          padding: 15px;
        }

        .history-chart {
          gap: 4px;
          height: 175px;
        }

        .history-metrics {
          grid-template-columns: repeat(2, 1fr);
        }

        .month-metrics {
          grid-template-columns: 1fr;
        }

        .history-heading {
          align-items: center;
        }

        .month-badge {
          max-width: 115px;
          text-align: center;
        }
      }
    `;

    document.head.appendChild(style);
  }


  // =====================================================
  // LIFEFLOW 2.5 — SONO INTELIGENTE + SLEEP HUB
  // =====================================================

  const sleepStorageKey = "lifeflow-sleep-v24";

  let sleepHistory = {};

  try {
    const savedSleep =
      localStorage.getItem(sleepStorageKey);

    if (savedSleep) {
      sleepHistory = JSON.parse(savedSleep) || {};
    }
  } catch (error) {
    console.log("Erro ao carregar sono:", error);
    sleepHistory = {};
  }

  function saveSleepHistory() {
    localStorage.setItem(
      sleepStorageKey,
      JSON.stringify(sleepHistory)
    );
  }

  function timeStringToMinutes(value) {
    if (!value || !value.includes(":")) return null;

    const [hours, minutes] =
      value.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) return null;

    return (hours * 60) + minutes;
  }

  function calculateSleepMinutes(bedtime, wakeTime) {
    const bed =
      timeStringToMinutes(bedtime);

    const wake =
      timeStringToMinutes(wakeTime);

    if (bed === null || wake === null) {
      return 0;
    }

    let difference = wake - bed;

    if (difference <= 0) {
      difference += 24 * 60;
    }

    return difference;
  }

  function formatSleepDuration(minutes) {
    if (!minutes) return "—";

    const hours =
      Math.floor(minutes / 60);

    const mins =
      minutes % 60;

    return mins
      ? `${hours}h ${mins}min`
      : `${hours}h`;
  }

  function getSleepGoalMinutes() {
    return 7 * 60;
  }

  function getSleepScore(minutes, quality) {
    if (!minutes) return 0;

    const goal = getSleepGoalMinutes();

    const durationScore =
      Math.min(100, Math.round((minutes / goal) * 100));

    const qualityScores = {
      ruim: 55,
      regular: 72,
      boa: 88,
      excelente: 100
    };

    const qualityScore =
      qualityScores[quality] || 72;

    return Math.round(
      (durationScore * 0.7) +
      (qualityScore * 0.3)
    );
  }

  function getSleepStatus(score) {
    if (score >= 90) {
      return {
        label: "Excelente recuperação",
        icon: "✨"
      };
    }

    if (score >= 75) {
      return {
        label: "Boa recuperação",
        icon: "🌙"
      };
    }

    if (score >= 55) {
      return {
        label: "Recuperação moderada",
        icon: "😴"
      };
    }

    return {
      label: "Sono abaixo da meta",
      icon: "⚠️"
    };
  }

  function getTodaySleep() {
    return sleepHistory[todayKey] || null;
  }


  function normalizeTimeInput(value) {
    const raw =
      String(value || "")
        .replace(/\D/g, "")
        .slice(0, 4);

    if (raw.length <= 2) {
      return raw;
    }

    return `${raw.slice(0, 2)}:${raw.slice(2)}`;
  }

  function isValidTimeInput(value) {
    const match =
      /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

    return Boolean(match);
  }

  function saveTodaySleep(bedtime, wakeTime, quality) {
    const minutes =
      calculateSleepMinutes(
        bedtime,
        wakeTime
      );

    const score =
      getSleepScore(minutes, quality);

    sleepHistory[todayKey] = {
      date: todayKey,
      bedtime,
      wakeTime,
      quality,
      minutes,
      score,
      dayType: workDay ? "Trabalho" : "Folga",
      updatedAt: new Date().toISOString()
    };

    saveSleepHistory();

    if (lifeHistory[todayKey]) {
      lifeHistory[todayKey].sleepMinutes = minutes;
      lifeHistory[todayKey].sleepScore = score;
      saveHistory();
    }
  }

  function getSleepRange(days = 7) {
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = getDateKey(date);
      const saved = sleepHistory[key];

      result.push({
        key,
        date,
        hasData: Boolean(saved),
        minutes: saved?.minutes || 0,
        score: saved?.score || 0,
        bedtime: saved?.bedtime || "",
        wakeTime: saved?.wakeTime || "",
        quality: saved?.quality || ""
      });
    }

    return result;
  }

  function averageSleepMinutes(items) {
    const registered =
      items.filter(item => item.hasData);

    if (!registered.length) return 0;

    return Math.round(
      registered.reduce(
        (sum, item) => sum + item.minutes,
        0
      ) / registered.length
    );
  }

  function averageSleepScore(items) {
    const registered =
      items.filter(item => item.hasData);

    if (!registered.length) return 0;

    return Math.round(
      registered.reduce(
        (sum, item) => sum + item.score,
        0
      ) / registered.length
    );
  }

  function renderSleepPanel() {
    const sleepScreen =
      document.getElementById("sleepScreen");

    if (!sleepScreen) return;

    let panel =
      document.getElementById("sleepPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "sleepPanel";
      panel.className = "sleep-panel";

      sleepScreen.appendChild(panel);
    }

    const todaySleep =
      getTodaySleep();

    const week =
      getSleepRange(7);

    const averageMinutes =
      averageSleepMinutes(week);

    const averageScore =
      averageSleepScore(week);

    const registeredDays =
      week.filter(item => item.hasData).length;

    const goalMinutes =
      getSleepGoalMinutes();

    const goalHours =
      formatSleepDuration(goalMinutes);

    const bedtime =
      todaySleep?.bedtime || "22:30";

    const wakeTime =
      todaySleep?.wakeTime || "05:30";

    const quality =
      todaySleep?.quality || "boa";

    const todayStatus =
      getSleepStatus(todaySleep?.score || 0);

    panel.innerHTML = `
      <div class="sleep-card">
        <div class="sleep-heading">
          <div>
            <span class="sleep-kicker">SONO INTELIGENTE</span>
            <h3>Recuperação diária</h3>
          </div>

          <span class="sleep-badge">
            🌙 Meta ${goalHours}
          </span>
        </div>

        <div class="sleep-today-grid">
          <div class="sleep-score-box">
            <span>HOJE</span>
            <strong>
              ${todaySleep ? formatSleepDuration(todaySleep.minutes) : "—"}
            </strong>
            <small>
              ${todaySleep ? `${todayStatus.icon} ${todayStatus.label}` : "Registre seu sono"}
            </small>
          </div>

          <div class="sleep-score-box">
            <span>SCORE</span>
            <strong>
              ${todaySleep ? todaySleep.score : 0}
            </strong>
            <small>de 100</small>
          </div>
        </div>

        <div id="sleepControls" class="sleep-controls">

          <div class="sleep-time-control">
            <span class="sleep-control-label">Hora que dormiu</span>

            <div class="sleep-stepper">
              <button
                type="button"
                class="sleep-step-button"
                data-sleep-target="bedtime"
                data-sleep-delta="-15"
              >−15</button>

              <strong
                id="sleepBedtimeDisplay"
                data-value="${bedtime}"
              >${bedtime}</strong>

              <button
                type="button"
                class="sleep-step-button"
                data-sleep-target="bedtime"
                data-sleep-delta="15"
              >+15</button>
            </div>
          </div>

          <div class="sleep-time-control">
            <span class="sleep-control-label">Hora que acordou</span>

            <div class="sleep-stepper">
              <button
                type="button"
                class="sleep-step-button"
                data-sleep-target="wake"
                data-sleep-delta="-15"
              >−15</button>

              <strong
                id="sleepWakeDisplay"
                data-value="${wakeTime}"
              >${wakeTime}</strong>

              <button
                type="button"
                class="sleep-step-button"
                data-sleep-target="wake"
                data-sleep-delta="15"
              >+15</button>
            </div>
          </div>

          <div class="sleep-quality-control">
            <span class="sleep-control-label">Qualidade do sono</span>

            <div class="sleep-quality-buttons">
              ${[
                ["ruim", "Ruim"],
                ["regular", "Regular"],
                ["boa", "Boa"],
                ["excelente", "Excelente"]
              ].map(([value, label]) => `
                <button
                  type="button"
                  class="sleep-quality-button ${quality === value ? "active" : ""}"
                  data-sleep-quality="${value}"
                >
                  ${label}
                </button>
              `).join("")}
            </div>
          </div>

          <button
            id="sleepSaveButton"
            class="sleep-save-button"
            type="button"
          >
            Salvar sono de hoje
          </button>

        </div>

        <div class="sleep-week-heading">
          <div>
            <span class="sleep-kicker">ÚLTIMOS 7 DIAS</span>
            <h4>Histórico de sono</h4>
          </div>
          <span>${registeredDays}/7 registrados</span>
        </div>

        <div class="sleep-chart">
          ${week.map(item => {
            const day =
              item.date
                .toLocaleDateString(
                  "pt-BR",
                  { weekday: "short" }
                )
                .replace(".", "")
                .slice(0, 3);

            const percentage =
              item.hasData
                ? Math.max(
                    8,
                    Math.min(
                      100,
                      Math.round(
                        (item.minutes / goalMinutes) * 100
                      )
                    )
                  )
                : 4;

            return `
              <div class="sleep-chart-column">
                <div class="sleep-chart-track">
                  <div
                    class="sleep-chart-fill ${item.minutes >= goalMinutes ? "goal" : ""}"
                    style="height:${percentage}%"
                    title="${item.hasData ? formatSleepDuration(item.minutes) : "Sem registro"}"
                  ></div>
                </div>
                <strong>
                  ${item.hasData ? formatSleepDuration(item.minutes) : "—"}
                </strong>
                <span>${day}</span>
              </div>
            `;
          }).join("")}
        </div>

        <div class="sleep-week-metrics">
          <div>
            <span>Média</span>
            <strong>${formatSleepDuration(averageMinutes)}</strong>
          </div>
          <div>
            <span>Score médio</span>
            <strong>${averageScore || "—"}</strong>
          </div>
          <div>
            <span>Meta</span>
            <strong>${goalHours}</strong>
          </div>
        </div>

        <p class="sleep-note">
          Seu horário planejado continua sendo 22:30–05:30.
          Registre o horário real para o LifeFlow acompanhar sua recuperação.
        </p>
      </div>
    `;

    function addMinutesToTime(value, delta) {
      const current =
        timeStringToMinutes(value);

      if (current === null) {
        return value;
      }

      let adjusted =
        (current + delta) % (24 * 60);

      if (adjusted < 0) {
        adjusted += 24 * 60;
      }

      const hours =
        Math.floor(adjusted / 60);

      const minutes =
        adjusted % 60;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    let selectedQuality = quality;

    document
      .querySelectorAll("[data-sleep-target]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const target =
              button.dataset.sleepTarget;

            const delta =
              Number(button.dataset.sleepDelta);

            const display =
              target === "bedtime"
                ? document.getElementById("sleepBedtimeDisplay")
                : document.getElementById("sleepWakeDisplay");

            if (!display) return;

            const current =
              display.dataset.value ||
              display.textContent.trim();

            const next =
              addMinutesToTime(current, delta);

            display.dataset.value = next;
            display.textContent = next;
          }
        );
      });

    document
      .querySelectorAll("[data-sleep-quality]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectedQuality =
              button.dataset.sleepQuality;

            document
              .querySelectorAll("[data-sleep-quality]")
              .forEach(item =>
                item.classList.remove("active")
              );

            button.classList.add("active");
          }
        );
      });

    document
      .getElementById("sleepSaveButton")
      ?.addEventListener(
        "click",
        () => {
          const bedtimeValue =
            document
              .getElementById("sleepBedtimeDisplay")
              ?.dataset.value;

          const wakeValue =
            document
              .getElementById("sleepWakeDisplay")
              ?.dataset.value;

          if (!bedtimeValue || !wakeValue) {
            return;
          }

          saveTodaySleep(
            bedtimeValue,
            wakeValue,
            selectedQuality || "regular"
          );

          renderSleepPanel();
          renderHistoryProgressPanel();
        }
      );
  }

  function injectSleepStyles() {
    if (
      document.getElementById(
        "lifeflowSleepStyles"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id = "lifeflowSleepStyles";

    style.textContent = `
      .sleep-panel {
        margin: 14px 0;
      }

      .sleep-card {
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 24px;
        padding: 18px;
        background:
          radial-gradient(circle at 92% 0%, rgba(129,107,255,.10), transparent 30%),
          linear-gradient(145deg, rgba(20,20,22,.98), rgba(7,7,8,.98));
        box-shadow: 0 22px 60px rgba(0,0,0,.40);
      }

      .sleep-heading,
      .sleep-week-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .sleep-kicker {
        display: block;
        color: #7d7d86;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.1px;
      }

      .sleep-heading h3,
      .sleep-week-heading h4 {
        margin: 5px 0 0;
        color: #f2f2f4;
      }

      .sleep-heading h3 {
        font-size: 18px;
      }

      .sleep-week-heading h4 {
        font-size: 15px;
      }

      .sleep-badge {
        border: 1px solid rgba(145,124,255,.20);
        border-radius: 999px;
        background: rgba(145,124,255,.07);
        color: #b8aaff;
        padding: 7px 10px;
        font-size: 9px;
        font-weight: 900;
      }

      .sleep-today-grid {
        display: grid;
        grid-template-columns: 1.4fr .8fr;
        gap: 9px;
        margin-top: 16px;
      }

      .sleep-score-box {
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 17px;
        padding: 13px;
        background: rgba(255,255,255,.025);
      }

      .sleep-score-box span,
      .sleep-form label > span,
      .sleep-week-metrics span {
        display: block;
        color: #73737b;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .5px;
        text-transform: uppercase;
      }

      .sleep-score-box strong {
        display: block;
        margin-top: 5px;
        color: #f1f1f3;
        font-size: 22px;
      }

      .sleep-score-box small {
        display: block;
        margin-top: 3px;
        color: #8b8b93;
        font-size: 8px;
      }

      .sleep-form {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 9px;
        margin-top: 12px;
      }

      .sleep-form label {
        display: block;
      }

      .sleep-form input,
      .sleep-form select {
        box-sizing: border-box;
        pointer-events: auto !important;
        user-select: text !important;
        -webkit-user-select: text !important;
        cursor: text;
        width: 100%;
        margin-top: 6px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 13px;
        outline: none;
        background: #0d0d0f;
        color: #e8e8eb;
        padding: 11px;
        font: inherit;
        font-size: 11px;
      }

      .sleep-quality-label {
        grid-column: 1 / -1;
      }

      .sleep-form select {
        cursor: pointer;
      }

      .sleep-save-button {
        grid-column: 1 / -1;
        border: 1px solid rgba(145,124,255,.22);
        border-radius: 14px;
        background:
          linear-gradient(135deg, rgba(129,107,255,.22), rgba(94,78,185,.15));
        color: #dcd6ff;
        padding: 12px;
        font-weight: 900;
        font-size: 10px;
        cursor: pointer;
      }

      .sleep-week-heading {
        align-items: center;
        margin-top: 22px;
      }

      .sleep-week-heading > span {
        color: #777780;
        font-size: 9px;
        font-weight: 850;
      }

      .sleep-chart {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        height: 180px;
        margin-top: 15px;
      }

      .sleep-chart-column {
        min-width: 0;
        display: grid;
        grid-template-rows: 1fr auto auto;
        gap: 5px;
        text-align: center;
      }

      .sleep-chart-track {
        position: relative;
        min-height: 112px;
        overflow: hidden;
        border-radius: 10px;
        background: rgba(255,255,255,.035);
      }

      .sleep-chart-fill {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 10px;
        background:
          linear-gradient(180deg, #9c8cff, #5e4eb9);
        transition: height .35s ease;
      }

      .sleep-chart-fill.goal {
        background:
          linear-gradient(180deg, #75efb5, #42c982);
      }

      .sleep-chart-column strong {
        color: #b8b8bf;
        font-size: 8px;
        white-space: nowrap;
      }

      .sleep-chart-column span {
        color: #66666e;
        font-size: 8px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .sleep-week-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 15px;
      }

      .sleep-week-metrics > div {
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 14px;
        padding: 10px;
        background: rgba(255,255,255,.022);
      }

      .sleep-week-metrics strong {
        display: block;
        margin-top: 4px;
        color: #ededf0;
        font-size: 13px;
      }

      .sleep-note {
        margin: 13px 0 0;
        color: #7c7c84;
        font-size: 9px;
        line-height: 1.55;
      }

      .sleep-controls {
        display: grid;
        gap: 10px;
        margin-top: 13px;
      }

      .sleep-time-control,
      .sleep-quality-control {
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 16px;
        background: rgba(255,255,255,.022);
        padding: 11px;
      }

      .sleep-control-label {
        display: block;
        margin-bottom: 8px;
        color: #73737b;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .5px;
        text-transform: uppercase;
      }

      .sleep-stepper {
        display: grid;
        grid-template-columns: 1fr 1.2fr 1fr;
        align-items: center;
        gap: 8px;
      }

      .sleep-stepper strong {
        min-height: 44px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(145,124,255,.16);
        border-radius: 13px;
        background: rgba(145,124,255,.055);
        color: #eeeaff;
        font-size: 18px;
        letter-spacing: .5px;
      }

      .sleep-step-button,
      .sleep-quality-button {
        min-height: 44px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 13px;
        background: #0d0d0f;
        color: #b9b9c0;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .sleep-step-button:active,
      .sleep-quality-button:active {
        transform: scale(.97);
      }

      .sleep-quality-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
      }

      .sleep-quality-button.active {
        border-color: rgba(145,124,255,.30);
        background: rgba(145,124,255,.12);
        color: #d9d1ff;
        box-shadow: inset 0 0 0 1px rgba(145,124,255,.04);
      }

      @media (max-width: 520px) {
        .sleep-card {
          padding: 15px;
        }

        .sleep-today-grid {
          grid-template-columns: 1fr 1fr;
        }

        .sleep-form {
          grid-template-columns: 1fr;
        }

        .sleep-quality-label,
        .sleep-save-button {
          grid-column: auto;
        }

        .sleep-chart {
          gap: 4px;
          height: 170px;
        }

        .sleep-week-metrics {
          grid-template-columns: 1fr;
        }

        .sleep-quality-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .sleep-step-button {
          min-height: 48px;
          font-size: 11px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // =====================================================
  // HOME
  // =====================================================

  function renderHeader() {

    const todayText =
      document.getElementById(
        "todayText"
      );

    if (todayText) {

      todayText.textContent =
        today.toLocaleDateString(
          "pt-BR",
          {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        );
    }


    const welcomeTitle =
      document.getElementById(
        "welcomeTitle"
      );

    if (welcomeTitle) {

      welcomeTitle.textContent =
        getGreeting();
    }


    const welcomeSubtitle =
      document.getElementById(
        "welcomeSubtitle"
      );

    if (welcomeSubtitle) {

      welcomeSubtitle.textContent =
        workDay
          ? "Hoje é dia de trabalho. Vamos manter o ritmo sem exagerar."
          : "Hoje é dia de folga. Um bom dia para cuidar de você e avançar nos seus objetivos.";
    }


    const dayBadge =
      document.getElementById(
        "dayBadge"
      );

    if (dayBadge) {

      dayBadge.textContent =
        workDay
          ? "TRABALHO"
          : "FOLGA";
    }


    const dayTitle =
      document.getElementById(
        "dayTitle"
      );

    if (dayTitle) {

      dayTitle.textContent =
        workDay
          ? "Trabalho • 08:00–20:00"
          : "Dia de folga";
    }


    const routineHeading =
      document.getElementById(
        "routineHeading"
      );

    if (routineHeading) {

      routineHeading.textContent =
        workDay
          ? "Rotina de trabalho"
          : "Rotina de folga";
    }
  }


  // =====================================================
  // TAREFAS
  // =====================================================

  function renderTasks() {

    const list =
      document.getElementById(
        "taskList"
      );

    if (!list) {
      return;
    }


    list.innerHTML = `
      <div class="routine-manage-bar">
        <button
          class="routine-add-button"
          id="routineAddTask"
          type="button"
        >
          ＋ Nova atividade
        </button>

        <button
          id="routineRestoreDefault"
          type="button"
        >
          ↻ Restaurar padrão
        </button>
      </div>
    `;

    document
      .getElementById("routineAddTask")
      ?.addEventListener(
        "click",
        () => openRoutineEditor()
      );

    document
      .getElementById("routineRestoreDefault")
      ?.addEventListener(
        "click",
        restoreCurrentRoutine
      );


    tasks.forEach(
      (
        task,
        index
      ) => {

        const completed =
          state.completed.includes(
            index
          );


        const item =
          document.createElement(
            "article"
          );


        item.className =
          completed
            ? "task done"
            : "task";


        item.innerHTML = `

          <div class="task-time">
            ${task.time}
          </div>

          <div class="task-body">

            <div class="task-title">
              ${task.title}
            </div>

            <div class="task-sub">
              ${task.description}
            </div>

            <div class="routine-task-actions">
              <button
                class="routine-edit-task"
                type="button"
              >
                ✎ Editar
              </button>

              <button
                class="routine-delete-task"
                type="button"
              >
                🗑 Excluir
              </button>
            </div>

          </div>

          <button
            class="check"
            type="button"
          >
            ${
              completed
                ? "✓"
                : "○"
            }
          </button>

        `;


        const editButton =
          item.querySelector(
            ".routine-edit-task"
          );

        const deleteButton =
          item.querySelector(
            ".routine-delete-task"
          );

        editButton?.addEventListener(
          "click",
          event => {
            event.stopPropagation();
            openRoutineEditor(index);
          }
        );

        deleteButton?.addEventListener(
          "click",
          event => {
            event.stopPropagation();
            deleteRoutineTask(index);
          }
        );


        const button =
          item.querySelector(
            ".check"
          );


        button.addEventListener(
          "click",
          () => {

            if (
              state.completed.includes(
                index
              )
            ) {

              state.completed =
                state.completed.filter(
                  item =>
                    item !== index
                );


              state.xp =
                Math.max(
                  0,
                  state.xp - 10
                );

              addEvolutionXp(-10);

            } else {

              state.completed.push(
                index
              );


              state.xp += 10;

              addEvolutionXp(10);
            }


            saveState();

            syncDailyEvolution();

            renderHome();

            renderProgressScreen();

          }
        );


        list.appendChild(
          item
        );
      }
    );
  }


  // =====================================================
  // HOJE INTELIGENTE / PRÓXIMA ATIVIDADE
  // =====================================================

  function timeToMinutes(time) {

    const [hours, minutes] =
      time
        .split(":")
        .map(Number);

    return (hours * 60) + minutes;
  }


  function getCurrentMinutes() {

    const now =
      new Date();

    return (
      now.getHours() * 60 +
      now.getMinutes()
    );
  }


  function formatMinutesDistance(minutes) {

    const absolute =
      Math.abs(minutes);

    const hours =
      Math.floor(absolute / 60);

    const mins =
      absolute % 60;


    if (hours === 0) {
      return `${mins} min`;
    }


    if (mins === 0) {
      return `${hours}h`;
    }


    return `${hours}h ${mins}min`;
  }


  function getSmartTask() {

    const currentMinutes =
      getCurrentMinutes();


    const pending =
      tasks
        .map((task, index) => ({
          task,
          index,
          minutes: timeToMinutes(task.time)
        }))
        .filter(item =>
          !state.completed.includes(
            item.index
          )
        );


    if (pending.length === 0) {
      return null;
    }


    const future =
      pending.find(item =>
        item.minutes >= currentMinutes
      );


    if (future) {

      return {
        ...future,
        status: "future",
        distance: future.minutes - currentMinutes
      };
    }


    const overdue =
      pending[pending.length - 1];


    return {
      ...overdue,
      status: "overdue",
      distance: currentMinutes - overdue.minutes
    };
  }


  function renderNextTask() {

    const smart =
      getSmartTask();


    const title =
      document.getElementById(
        "nextTaskTitle"
      );

    const time =
      document.getElementById(
        "nextTaskTime"
      );

    const description =
      document.getElementById(
        "nextTaskDescription"
      );

    const nextCard =
      document.querySelector(
        ".next-card"
      );


    if (
      !title ||
      !time ||
      !description
    ) {
      return;
    }


    if (nextCard) {
      nextCard.classList.remove(
        "urgent",
        "overdue",
        "completed-day"
      );
    }


    if (!smart) {

      title.textContent =
        "Rotina concluída";

      time.textContent =
        "✓";

      description.textContent =
        "Todas as missões de hoje foram concluídas.";


      if (nextCard) {
        nextCard.classList.add(
          "completed-day"
        );
      }

      return;
    }


    title.textContent =
      smart.task.title;

    time.textContent =
      smart.task.time;


    if (smart.status === "overdue") {

      description.textContent =
        `ATRASADA HÁ ${formatMinutesDistance(smart.distance)} • ${smart.task.description}`;


      if (nextCard) {
        nextCard.classList.add(
          "overdue"
        );
      }

      return;
    }


    if (smart.distance === 0) {

      description.textContent =
        `AGORA • ${smart.task.description}`;


      if (nextCard) {
        nextCard.classList.add(
          "urgent"
        );
      }

      return;
    }


    if (smart.distance <= 30) {

      description.textContent =
        `FALTAM ${formatMinutesDistance(smart.distance)} • ${smart.task.description}`;


      if (nextCard) {
        nextCard.classList.add(
          "urgent"
        );
      }

      return;
    }


    description.textContent =
      `Faltam ${formatMinutesDistance(smart.distance)} • ${smart.task.description}`;
  }


  function renderSmartSummary() {

    const welcomeSubtitle =
      document.getElementById(
        "welcomeSubtitle"
      );


    if (!welcomeSubtitle) {
      return;
    }


    const completed =
      state.completed.length;

    const total =
      tasks.length;

    const percentage =
      getRoutinePercent();

    const dayType =
      workDay
        ? "dia de trabalho"
        : "dia de folga";


    const hour = new Date().getHours();

    let momentMessage =
      "Vamos manter o ritmo.";

    if (hour >= 18 || hour < 5) {
      momentMessage =
        "Finalize o dia no seu ritmo.";
    } else if (hour >= 12) {
      momentMessage =
        "Continue firme no restante do dia.";
    } else {
      momentMessage =
        "Vamos começar bem o dia.";
    }

    welcomeSubtitle.textContent =
      `${momentMessage} • ${completed} de ${total} missões • ${percentage}% • ${dayType}.`;
  }


  function refreshSmartNow() {
    renderHeader();
    renderNextTask();
    renderSmartSummary();
  }


  // =====================================================
  // PROGRESSO HOME
  // =====================================================

  function getRoutinePercent() {

    const total =
      tasks.length;

    if (!total) {
      return 0;
    }

    return Math.round(
      (
        state.completed.length /
        total
      ) *
      100
    );
  }


  function renderProgress() {

    const completed =
      state.completed.length;

    const total =
      tasks.length;

    const percentage =
      getRoutinePercent();


    const progressPct =
      document.getElementById(
        "progressPct"
      );

    const progressText =
      document.getElementById(
        "progressText"
      );

    const doneCount =
      document.getElementById(
        "doneCount"
      );

    const progressBar =
      document.getElementById(
        "progressBar"
      );

    const xp =
      document.getElementById(
        "xp"
      );


    if (progressPct) {

      progressPct.textContent =
        `${percentage}%`;
    }


    if (progressText) {

      progressText.textContent =
        `${percentage}%`;
    }


    if (doneCount) {

      doneCount.textContent =
        `${completed} de ${total} concluídas`;
    }


    if (progressBar) {

      progressBar.style.width =
        `${percentage}%`;
    }


    if (xp) {

      xp.textContent =
        `${state.xp} XP`;
    }
  }


  // =====================================================
  // ÁGUA
  // =====================================================

  function renderWater() {

    const liters =
      (
        state.water /
        1000
      )
        .toFixed(1)
        .replace(".", ",");


    const waterText =
      document.getElementById(
        "waterText"
      );

    const waterGoalText =
      document.getElementById(
        "waterGoalText"
      );

    const waterFill =
      document.getElementById(
        "waterFill"
      );


    if (waterText) {

      waterText.textContent =
        `${liters} L`;
    }


    if (waterGoalText) {

      waterGoalText.textContent =
        `${liters} / 4 L`;
    }


    if (waterFill) {

      const percentage =
        Math.min(
          100,
          (
            state.water /
            4000
          ) *
          100
        );


      waterFill.style.width =
        `${percentage}%`;
    }
  }


  // =====================================================
  // ESTUDOS
  // =====================================================

  function renderStudyHome() {

    const studyText =
      document.getElementById(
        "studyText"
      );

    const status =
      document.getElementById(
        "studyTodayStatus"
      );

    const goal =
      document.getElementById(
        "studyDailyGoal"
      );

    const type =
      document.getElementById(
        "studyDayType"
      );


    if (workDay) {

      if (studyText) {

        studyText.textContent =
          "Hoje é dia de trabalho. Se estiver bem, faça apenas uma revisão leve. Sono e recuperação têm prioridade.";
      }


      if (status) {

        status.textContent =
          "Leve";
      }


      if (goal) {

        goal.textContent =
          "0–30 min";
      }


      if (type) {

        type.textContent =
          "Revisão";
      }

    } else {

      if (studyText) {

        studyText.textContent =
          "Hoje é dia de folga. Este é o principal momento para avançar nos estudos da PMMG.";
      }


      if (status) {

        status.textContent =
          "Planejado";
      }


      if (goal) {

        goal.textContent =
          "2h45";
      }


      if (type) {

        type.textContent =
          "Teoria + questões";
      }
    }
  }


  function renderStudyPlan() {

    const title =
      document.getElementById(
        "studyPlanTitle"
      );

    const badge =
      document.getElementById(
        "studyPlanBadge"
      );

    const icon =
      document.getElementById(
        "studyPlanIcon"
      );

    const mainTitle =
      document.getElementById(
        "studyPlanMainTitle"
      );

    const description =
      document.getElementById(
        "studyPlanDescription"
      );

    const list =
      document.getElementById(
        "studyScheduleList"
      );


    if (
      !title ||
      !badge ||
      !icon ||
      !mainTitle ||
      !description ||
      !list
    ) {

      return;
    }


    list.innerHTML = "";


    if (workDay) {

      title.textContent =
        "Dia de trabalho";

      badge.textContent =
        "TRABALHO";

      icon.textContent =
        "🧠";

      mainTitle.textContent =
        "Revisão opcional";

      description.textContent =
        "Depois da academia e de 12 horas de trabalho, o descanso continua sendo prioridade.";


      const schedule = [

        {
          time: "21:00",
          title: "Revisão leve",
          description:
            "Somente se estiver disposto. Questões ou revisão curta."
        },

        {
          time: "22:00",
          title: "Desacelerar",
          description:
            "Reduzir estímulos para dormir melhor."
        },

        {
          time: "22:30",
          title: "Dormir",
          description:
            "Recuperação para o próximo dia."
        }

      ];


      schedule.forEach(
        item =>
          addStudyScheduleItem(
            list,
            item
          )
      );

    } else {

      title.textContent =
        "Dia de folga";

      badge.textContent =
        "FOLGA";

      icon.textContent =
        "📚";

      mainTitle.textContent =
        "Dia principal de estudos";

      description.textContent =
        "Use a manhã para teoria e a tarde para questões e revisão.";


      const schedule = [

        {
          time: "09:15",
          title: "Bloco principal",
          description:
            "50 min de teoria + 10 min de intervalo + 50 min de teoria."
        },

        {
          time: "11:05",
          title: "Fechamento",
          description:
            "Anotar pontos importantes e erros."
        },

        {
          time: "14:15",
          title: "Questões e revisão",
          description:
            "Resolver exercícios no site PMMG e revisar os erros."
        },

        {
          time: "15:00",
          title: "Encerrar estudos",
          description:
            "Finalizar antes de se preparar para buscar sua filha."
        }

      ];


      schedule.forEach(
        item =>
          addStudyScheduleItem(
            list,
            item
          )
      );
    }
  }


  function addStudyScheduleItem(
    list,
    item
  ) {

    const element =
      document.createElement(
        "div"
      );


    element.className =
      "study-schedule-item";


    element.innerHTML = `

      <div class="study-schedule-time">
        ${item.time}
      </div>

      <div class="study-schedule-content">

        <strong>
          ${item.title}
        </strong>

        <span>
          ${item.description}
        </span>

      </div>

    `;


    list.appendChild(
      element
    );
  }


  // =====================================================
  // NOVA TELA DE PROGRESSO
  // =====================================================

  function renderProgressScreen() {

    const routinePercent =
      getRoutinePercent();


    const totalTasks =
      tasks.length;


    const completedTasks =
      state.completed.length;


    const waterPercent =
      Math.min(
        100,
        Math.round(
          (
            state.water /
            4000
          ) *
          100
        )
      );


    const liters =
      (
        state.water /
        1000
      )
        .toFixed(1)
        .replace(".", ",");


    const screenPercent =
      document.getElementById(
        "progressScreenPercent"
      );


    const screenBar =
      document.getElementById(
        "progressScreenBar"
      );


    const tasksValue =
      document.getElementById(
        "progressTasksValue"
      );


    const waterValue =
      document.getElementById(
        "progressWaterValue"
      );


    const xpValue =
      document.getElementById(
        "progressXpValue"
      );


    const dayType =
      document.getElementById(
        "progressDayType"
      );


    const waterPercentText =
      document.getElementById(
        "progressWaterPercent"
      );


    const waterBar =
      document.getElementById(
        "progressWaterBar"
      );


    const waterMessage =
      document.getElementById(
        "progressWaterMessage"
      );


    const disciplineMessage =
      document.getElementById(
        "progressDisciplineMessage"
      );


    if (screenPercent) {

      screenPercent.textContent =
        `${routinePercent}%`;
    }


    if (screenBar) {

      screenBar.style.width =
        `${routinePercent}%`;
    }


    if (tasksValue) {

      tasksValue.textContent =
        `${completedTasks}/${totalTasks}`;
    }


    if (waterValue) {

      waterValue.textContent =
        `${liters} L`;
    }


    if (xpValue) {

      xpValue.textContent =
        state.xp;
    }


    if (dayType) {

      dayType.textContent =
        workDay
          ? "Trabalho"
          : "Folga";
    }


    if (waterPercentText) {

      waterPercentText.textContent =
        `${waterPercent}%`;
    }


    if (waterBar) {

      waterBar.style.width =
        `${waterPercent}%`;
    }


    if (waterMessage) {

      if (state.water === 0) {

        waterMessage.textContent =
          "Você ainda não registrou água hoje.";

      } else if (
        state.water < 2000
      ) {

        waterMessage.textContent =
          `Você registrou ${liters} L. Continue distribuindo sua hidratação durante o dia.`;

      } else if (
        state.water < 4000
      ) {

        waterMessage.textContent =
          `Você já registrou ${liters} L. Está avançando bem para sua meta.`;

      } else {

        waterMessage.textContent =
          `Meta de 4 L registrada. Continue bebendo conforme sua sede e necessidade.`;
      }
    }


    if (disciplineMessage) {

      if (
        routinePercent === 0
      ) {

        disciplineMessage.textContent =
          "Seu dia ainda está começando. Vá concluindo as tarefas no seu ritmo.";

      } else if (
        routinePercent < 40
      ) {

        disciplineMessage.textContent =
          `Você concluiu ${routinePercent}% da rotina. Continue avançando uma tarefa de cada vez.`;

      } else if (
        routinePercent < 70
      ) {

        disciplineMessage.textContent =
          `Você já concluiu ${routinePercent}% da rotina de hoje. Bom ritmo.`;

      } else if (
        routinePercent < 100
      ) {

        disciplineMessage.textContent =
          `Você chegou a ${routinePercent}% da rotina. Falta pouco para fechar o dia.`;

      } else {

        disciplineMessage.textContent =
          "Rotina de hoje 100% concluída. Dia fechado.";
      }
    }

    renderEvolutionPanel();
    renderHistoryProgressPanel();
    renderSleepProgressSummary();
  }


  // =====================================================
  // HOME COMPLETA
  // =====================================================

  function renderHome() {

    renderHeader();

    renderTasks();

    renderNextTask();

    renderProgress();

    renderWater();

    renderStudyHome();

    renderSmartSummary();
  }


  // =====================================================
  // ÁGUA - EVENTOS
  // =====================================================

  document
    .querySelectorAll(
      "[data-water]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            state.water +=
              Number(
                button.dataset.water
              );


            state.water =
              Math.min(
                state.water,
                6000
              );


            saveState();

            renderWater();

            renderProgressScreen();

          }
        );
      }
    );


  const resetWaterButton =
    document.getElementById(
      "resetWater"
    );


  if (resetWaterButton) {

    resetWaterButton.addEventListener(
      "click",
      () => {

        state.water = 0;

        saveState();

        renderWater();

        renderProgressScreen();

      }
    );
  }


  // =====================================================
  // RESET TAREFAS
  // =====================================================

  const resetTasksButton =
    document.getElementById(
      "resetTasks"
    );


  if (resetTasksButton) {

    resetTasksButton.addEventListener(
      "click",
      () => {

        showSiteConfirm(
          "Deseja resetar todas as tarefas concluídas de hoje?",
          () => {
            state.completed = [];
            state.xp = 0;
            saveState();
            syncDailyEvolution();
            renderHome();
            renderProgressScreen();
            showSiteMessage("Tarefas de hoje foram resetadas.", "info");
          },
          { title: "Resetar tarefas", icon: "↻", confirmText: "Resetar" }
        );

      }
    );
  }


  // =====================================================
  // AGENDA
  // =====================================================

  let calendarDate =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );


  let selectedCalendarDate =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );


  const monthNames = [

    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"

  ];


  function renderCalendar() {

    const grid =
      document.getElementById(
        "calendarGrid"
      );


    if (!grid) {
      return;
    }


    const year =
      calendarDate.getFullYear();


    const month =
      calendarDate.getMonth();


    const monthElement =
      document.getElementById(
        "calendarMonth"
      );


    const yearElement =
      document.getElementById(
        "calendarYear"
      );


    if (monthElement) {

      monthElement.textContent =
        monthNames[month];
    }


    if (yearElement) {

      yearElement.textContent =
        year;
    }


    grid.innerHTML = "";


    const firstDay =
      new Date(
        year,
        month,
        1
      );


    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );


    for (
      let i = 0;
      i < firstDay.getDay();
      i++
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "calendar-day empty";


      grid.appendChild(
        empty
      );
    }


    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {

      const date =
        new Date(
          year,
          month,
          day
        );


      const work =
        isWorkDay(
          date
        );


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        `calendar-day ${
          work
            ? "work-day"
            : "off-day"
        }`;


      if (
        isSameDay(
          date,
          today
        )
      ) {

        button.classList.add(
          "today"
        );
      }


      if (
        isSameDay(
          date,
          selectedCalendarDate
        )
      ) {

        button.classList.add(
          "selected"
        );
      }


      button.innerHTML = `

        <span class="calendar-day-number">
          ${day}
        </span>

        <span class="calendar-day-label">
          ${
            work
              ? "TRABALHO"
              : "FOLGA"
          }
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          selectedCalendarDate =
            new Date(date);

          renderCalendar();
        }
      );


      grid.appendChild(
        button
      );
    }


    renderSelectedDay();

    renderNextDays();
  }


  function renderSelectedDay() {

    const title =
      document.getElementById(
        "selectedDateTitle"
      );


    const type =
      document.getElementById(
        "selectedDateType"
      );


    const badge =
      document.getElementById(
        "selectedDayBadge"
      );


    const list =
      document.getElementById(
        "selectedDayTasks"
      );


    if (
      !title ||
      !type ||
      !badge ||
      !list
    ) {

      return;
    }


    const work =
      isWorkDay(
        selectedCalendarDate
      );


    title.textContent =
      selectedCalendarDate
        .toLocaleDateString(
          "pt-BR",
          {
            weekday: "long",
            day: "2-digit",
            month: "long"
          }
        );


    type.textContent =
      work
        ? "Escala 12x36 • expediente das 08:00 às 20:00"
        : "Escala 12x36 • dia de folga";


    badge.textContent =
      work
        ? "TRABALHO"
        : "FOLGA";


    badge.className =
      work
        ? "selected-day-badge work"
        : "selected-day-badge off";


    list.innerHTML = "";


    const selectedTasks =
      work
        ? workTasks
        : offTasks;


    selectedTasks.forEach(
      task => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "agenda-task";


        item.innerHTML = `

          <div class="agenda-task-time">
            ${task.time}
          </div>

          <div>

            <strong>
              ${task.title}
            </strong>

            <span>
              ${task.description}
            </span>

          </div>

        `;


        list.appendChild(
          item
        );
      }
    );
  }


  function renderNextDays() {

    const list =
      document.getElementById(
        "nextDaysList"
      );


    if (!list) {
      return;
    }


    list.innerHTML = "";


    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + i
        );


      const work =
        isWorkDay(
          date
        );


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "next-day-item";


      item.innerHTML = `

        <div>

          <strong>
            ${
              date.toLocaleDateString(
                "pt-BR",
                {
                  weekday: "long"
                }
              )
            }
          </strong>

          <span>
            ${
              date.toLocaleDateString(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "2-digit"
                }
              )
            }
          </span>

        </div>

        <div
          class="next-day-type ${
            work
              ? "work"
              : "off"
          }"
        >
          ${
            work
              ? "TRABALHO"
              : "FOLGA"
          }
        </div>

      `;


      list.appendChild(
        item
      );
    }
  }


  document
    .getElementById(
      "prevMonth"
    )
    ?.addEventListener(
      "click",
      () => {

        calendarDate =
          new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1
          );

        renderCalendar();
      }
    );


  document
    .getElementById(
      "nextMonth"
    )
    ?.addEventListener(
      "click",
      () => {

        calendarDate =
          new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1
          );

        renderCalendar();
      }
    );




  // =====================================================
  // LIFEFLOW 3.4 — CENTRAL LATERAL + EVOLUÇÃO DE TREINO
  // =====================================================

  const gymStorageKey = "lifeflow-gym-v26";

  let gymHistory = {};

  try {
    const savedGym = localStorage.getItem(gymStorageKey);
    if (savedGym) gymHistory = JSON.parse(savedGym) || {};
  } catch (error) {
    console.log("Erro ao carregar academia:", error);
    gymHistory = {};
  }

  let workoutStartedAt = null;
  let workoutElapsedBeforeStart = 0;
  let workoutTimerInterval = null;

  let restRemaining = 0;
  let restTimerInterval = null;

  function saveGymHistory() {
    localStorage.setItem(
      gymStorageKey,
      JSON.stringify(gymHistory)
    );
  }

  function getTodayGym() {
    return gymHistory[todayKey] || {
      date: todayKey,
      started: false,
      workoutSeconds: 0,
      completedExercises: [],
      notes: "",
      updatedAt: null
    };
  }

  function saveTodayGym(patch = {}) {
    gymHistory[todayKey] = {
      ...getTodayGym(),
      ...patch,
      updatedAt: new Date().toISOString()
    };
    saveGymHistory();
  }

  function formatTimer(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    }

    return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }

  function currentWorkoutSeconds() {
    if (!workoutStartedAt) {
      return workoutElapsedBeforeStart;
    }

    return workoutElapsedBeforeStart +
      Math.floor((Date.now() - workoutStartedAt) / 1000);
  }

  function updateWorkoutTimerDisplay() {
    const display = document.getElementById("gymWorkoutTimer");
    if (display) {
      display.textContent =
        formatTimer(currentWorkoutSeconds());
    }
  }

  function startWorkoutTimer() {
    if (workoutStartedAt) return;

    workoutStartedAt = Date.now();
    saveTodayGym({ started: true });
    markGymTrainingDay();

    clearInterval(workoutTimerInterval);
    workoutTimerInterval = setInterval(
      updateWorkoutTimerDisplay,
      1000
    );

    updateWorkoutTimerDisplay();
    updateGymTimerButtons();
  }

  function pauseWorkoutTimer() {
    if (!workoutStartedAt) return;

    workoutElapsedBeforeStart =
      currentWorkoutSeconds();

    workoutStartedAt = null;

    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;

    saveTodayGym({
      workoutSeconds: workoutElapsedBeforeStart,
      started: false
    });

    updateWorkoutTimerDisplay();
    updateGymTimerButtons();
  }

  function resetWorkoutTimer() {
    workoutStartedAt = null;
    workoutElapsedBeforeStart = 0;

    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;

    saveTodayGym({
      workoutSeconds: 0,
      started: false
    });

    updateWorkoutTimerDisplay();
    updateGymTimerButtons();
  }

  function updateGymTimerButtons() {
    const start = document.getElementById("gymStartWorkout");
    const pause = document.getElementById("gymPauseWorkout");

    if (start) start.disabled = Boolean(workoutStartedAt);
    if (pause) pause.disabled = !workoutStartedAt;
  }

  function updateRestTimerDisplay() {
    const display = document.getElementById("gymRestTimer");
    if (!display) return;

    display.textContent = formatTimer(restRemaining);

    if (restRemaining <= 0) {
      display.classList.remove("running");
    }
  }

  function startRestTimer(seconds) {
    restRemaining = Math.max(0, Number(seconds) || 0);

    clearInterval(restTimerInterval);

    const display = document.getElementById("gymRestTimer");
    display?.classList.add("running");

    updateRestTimerDisplay();

    restTimerInterval = setInterval(() => {
      restRemaining -= 1;
      updateRestTimerDisplay();

      if (restRemaining <= 0) {
        clearInterval(restTimerInterval);
        restTimerInterval = null;

        if ("vibrate" in navigator) {
          navigator.vibrate([180, 100, 180]);
        }
      }
    }, 1000);
  }

  function addRestTime(seconds) {
    restRemaining =
      Math.max(0, restRemaining + Number(seconds || 0));

    updateRestTimerDisplay();
  }


  const gymProgramsStorageKey = "lifeflow-gym-programs-v27";

  const defaultGymPrograms = {
    activePlanId: "A",
    plans: [
      {
        id: "A",
        name: "Treino A",
        focus: "Peito • Ombro • Tríceps",
        exercises: [
          {
            id: "supino-reto",
            name: "Supino reto",
            sets: 4,
            reps: "8–12",
            load: 0,
            rest: 90,
            image: "",
            posture: "Pés firmes no chão, escápulas levemente para trás e peito elevado. Mantenha punhos alinhados.",
            execution: "Desça a barra de forma controlada até a região média do peito e empurre sem perder a posição dos ombros.",
            mistakes: "Evite quicar a barra no peito, abrir demais os cotovelos ou tirar os pés do chão."
          },
          {
            id: "desenvolvimento",
            name: "Desenvolvimento de ombros",
            sets: 3,
            reps: "8–12",
            load: 0,
            rest: 75,
            image: "",
            posture: "Abdômen firme e coluna neutra. Ombros para baixo, sem elevar excessivamente.",
            execution: "Empurre os pesos acima da cabeça até quase estender os cotovelos e retorne com controle.",
            mistakes: "Evite arquear muito a lombar ou usar impulso."
          },
          {
            id: "triceps-polia",
            name: "Tríceps na polia",
            sets: 3,
            reps: "10–15",
            load: 0,
            rest: 60,
            image: "",
            posture: "Cotovelos próximos ao corpo e tronco estável.",
            execution: "Estenda os cotovelos até contrair o tríceps e retorne sem deixar o braço balançar.",
            mistakes: "Evite abrir os cotovelos ou movimentar o ombro."
          }
        ]
      },
      {
        id: "B",
        name: "Treino B",
        focus: "Costas • Bíceps",
        exercises: [
          {
            id: "puxada-frontal",
            name: "Puxada frontal",
            sets: 4,
            reps: "8–12",
            load: 0,
            rest: 90,
            image: "",
            posture: "Peito aberto, tronco levemente inclinado e ombros longe das orelhas.",
            execution: "Puxe a barra em direção à parte superior do peito, conduzindo o movimento pelos cotovelos.",
            mistakes: "Evite puxar atrás da nuca, balançar o tronco ou usar impulso."
          },
          {
            id: "remada-baixa",
            name: "Remada baixa",
            sets: 4,
            reps: "8–12",
            load: 0,
            rest: 90,
            image: "",
            posture: "Coluna neutra, peito aberto e abdômen firme.",
            execution: "Puxe o pegador em direção ao abdômen, aproximando as escápulas sem jogar o tronco para trás.",
            mistakes: "Evite arredondar a lombar ou transformar o exercício em balanço."
          },
          {
            id: "rosca-direta",
            name: "Rosca direta",
            sets: 3,
            reps: "10–12",
            load: 0,
            rest: 60,
            image: "",
            posture: "Cotovelos próximos ao corpo e tronco parado.",
            execution: "Flexione os cotovelos sem mover os ombros e desça lentamente.",
            mistakes: "Evite jogar o corpo para trás ou avançar os cotovelos."
          }
        ]
      },
      {
        id: "C",
        name: "Treino C",
        focus: "Pernas • Glúteos",
        exercises: [
          {
            id: "agachamento",
            name: "Agachamento livre",
            sets: 4,
            reps: "8–12",
            load: 0,
            rest: 120,
            image: "",
            posture: "Pés firmes, joelhos acompanhando a direção dos pés, abdômen ativo e coluna neutra.",
            execution: "Desça controlando quadril e joelhos até uma amplitude confortável e suba empurrando o chão.",
            mistakes: "Evite deixar os joelhos colapsarem para dentro ou perder a posição da lombar."
          },
          {
            id: "leg-press",
            name: "Leg press",
            sets: 4,
            reps: "10–15",
            load: 0,
            rest: 90,
            image: "",
            posture: "Lombar e quadril apoiados no encosto durante todo o movimento.",
            execution: "Flexione joelhos e quadris com controle e empurre a plataforma sem travar os joelhos.",
            mistakes: "Evite tirar a lombar do banco ou descer além da amplitude que consegue controlar."
          },
          {
            id: "mesa-flexora",
            name: "Mesa flexora",
            sets: 3,
            reps: "10–15",
            load: 0,
            rest: 60,
            image: "",
            posture: "Quadril apoiado e abdômen levemente contraído.",
            execution: "Flexione os joelhos até sentir forte contração posterior e retorne devagar.",
            mistakes: "Evite levantar o quadril ou soltar o peso na volta."
          }
        ]
      }
    ]
  };

  let gymPrograms = JSON.parse(
    JSON.stringify(defaultGymPrograms)
  );

  try {
    const savedPrograms =
      localStorage.getItem(gymProgramsStorageKey);

    if (savedPrograms) {
      gymPrograms = {
        ...gymPrograms,
        ...JSON.parse(savedPrograms)
      };
    }
  } catch (error) {
    console.log("Erro ao carregar treinos:", error);
  }

  function saveGymPrograms() {
    localStorage.setItem(
      gymProgramsStorageKey,
      JSON.stringify(gymPrograms)
    );
  }

  function getActiveGymPlan() {
    return gymPrograms.plans.find(
      plan => plan.id === gymPrograms.activePlanId
    ) || gymPrograms.plans[0];
  }

  function makeGymId(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getGymSessionProgress() {
    const saved = getTodayGym();

    return saved.exerciseProgress || {};
  }

  function saveGymExerciseProgress(progress) {
    saveTodayGym({
      exerciseProgress: progress
    });
  }

  function escapeGymHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderGymExerciseImage(exercise) {
    if (exercise.image) {
      return `
        <div class="gym-exercise-media gym-exercise-media-pair">
          <img
            src="${escapeGymHtml(exercise.image)}"
            alt="Início de ${escapeGymHtml(exercise.name)}"
            loading="lazy"
            onerror="this.style.display='none';"
          >
          ${
            exercise.image2
              ? `<img
                  src="${escapeGymHtml(exercise.image2)}"
                  alt="Final de ${escapeGymHtml(exercise.name)}"
                  loading="lazy"
                  onerror="this.style.display='none';"
                >`
              : ""
          }
          <div class="gym-image-fallback">
            <span>🏋️</span>
            <small>Imagem indisponível</small>
          </div>
        </div>
      `;
    }

    return `
      <div class="gym-exercise-media image-empty">
        <div class="gym-image-placeholder">
          <span>🏋️</span>
          <strong>${escapeGymHtml(exercise.name)}</strong>
          <small>Escolha pela biblioteca visual</small>
        </div>
      </div>
    `;
  }

  function adjustExerciseLoad(exerciseId, delta) {
    const plan = getActiveGymPlan();
    const exercise = plan?.exercises.find(
      item => item.id === exerciseId
    );

    if (!exercise) return;

    exercise.load =
      Math.max(
        0,
        Math.round(
          ((Number(exercise.load) || 0) + delta) * 10
        ) / 10
      );

    saveGymPrograms();
    renderGymPanel();
  }

  function completeGymSet(exerciseId) {
    const plan = getActiveGymPlan();
    const exercise = plan?.exercises.find(
      item => item.id === exerciseId
    );

    if (!exercise) return;

    const progress = getGymSessionProgress();
    const current = Number(progress[exerciseId] || 0);

    progress[exerciseId] =
      current >= exercise.sets
        ? 0
        : current + 1;

    saveGymExerciseProgress(progress);

    if (progress[exerciseId] > 0) {
      registerGymSet();
      recordExercisePerformance(exerciseId, progress[exerciseId]);
      startRestTimer(exercise.rest || 60);
      checkPerfectGymDay();
    }

    renderGymPanel();
  }

  function addGymExerciseFromEditor() {
    const plan = getActiveGymPlan();
    if (!plan) return;

    const name =
      document.getElementById("gymEditName")?.value.trim();

    if (!name) {
      showSiteMessage("Informe o nome do exercício.", "warning");
      return;
    }

    const sets =
      Math.max(
        1,
        Number(
          document.getElementById("gymEditSets")?.value
        ) || 3
      );

    const reps =
      document.getElementById("gymEditReps")?.value.trim() ||
      "8–12";

    const load =
      Math.max(
        0,
        Number(
          document.getElementById("gymEditLoad")?.value
        ) || 0
      );

    const rest =
      Math.max(
        15,
        Number(
          document.getElementById("gymEditRest")?.value
        ) || 60
      );

    const image =
      document.getElementById("gymEditImage")?.value.trim() || "";

    const posture =
      document.getElementById("gymEditPosture")?.value.trim() ||
      "Mantenha uma postura estável e use uma amplitude que consiga controlar.";

    const execution =
      document.getElementById("gymEditExecution")?.value.trim() ||
      "Faça o movimento de forma controlada, sem usar impulso.";

    const mistakes =
      document.getElementById("gymEditMistakes")?.value.trim() ||
      "Evite cargas que prejudiquem a técnica.";

    plan.exercises.push({
      id: makeGymId("exercise"),
      name,
      sets,
      reps,
      load,
      rest,
      image,
      posture,
      execution,
      mistakes
    });

    saveGymPrograms();
    renderGymPanel();
    showSiteMessage(`${name} adicionado ao treino.`, "success");
  }

  function deleteGymExercise(exerciseId) {
    const plan = getActiveGymPlan();
    if (!plan) return;

    showSiteConfirm(
      "Remover este exercício do treino?",
      () => {
        plan.exercises =
          plan.exercises.filter(
            exercise => exercise.id !== exerciseId
          );
        saveGymPrograms();
        renderGymPanel();
        showSiteMessage("Exercício removido do treino.", "success");
      },
      { title: "Remover exercício", icon: "🗑️", confirmText: "Remover" }
    );
  }

  function createGymPlan() {
    showSitePrompt(
      "Nome do novo treino:",
      `Treino ${gymPrograms.plans.length + 1}`,
      name => {
        showSitePrompt(
          "Partes que serão treinadas. Ex.: Costas • Bíceps",
          "",
          focus => {
            const id = makeGymId("plan");
            gymPrograms.plans.push({
              id,
              name,
              focus,
              exercises: []
            });
            gymPrograms.activePlanId = id;
            saveGymPrograms();
            showSiteMessage("Novo treino criado.", "success");
            showGymPlan(id);
          }
        );
      }
    );
  }

  function deleteActiveGymPlan() {
    if (gymPrograms.plans.length <= 1) {
      showSiteMessage("Mantenha pelo menos um treino cadastrado.", "warning");
      return;
    }

    const plan = getActiveGymPlan();

    showSiteConfirm(
      `Excluir ${plan.name}?`,
      () => {
        gymPrograms.plans =
          gymPrograms.plans.filter(
            item => item.id !== plan.id
          );
        gymPrograms.activePlanId = gymPrograms.plans[0].id;
        saveGymPrograms();
        renderGymPanel();
        showSiteMessage(`${plan.name} foi excluído.`, "success");
      },
      { title: "Excluir treino", icon: "🗑️", confirmText: "Excluir" }
    );
  }

  function setupGymHub() {
    if (!document.getElementById("gymScreen")) {
      const sleepScreen =
        document.getElementById("sleepScreen");

      const progressScreen =
        document.getElementById("progressScreen");

      const gymScreen =
        document.createElement("section");

      gymScreen.id = "gymScreen";
      gymScreen.className = "hidden lifeflow-gym-screen";

      const reference = sleepScreen || progressScreen;

      if (reference?.parentNode) {
        reference.parentNode.insertBefore(
          gymScreen,
          reference.nextSibling
        );
      } else {
        document.body.appendChild(gymScreen);
      }
    }

    if (!document.getElementById("gymButton")) {
      const sleepButton =
        document.getElementById("sleepButton");

      const progressButton =
        document.getElementById("progressButton");

      const referenceButton =
        sleepButton || progressButton;

      if (referenceButton?.parentNode) {
        const gymButton =
          document.createElement(
            referenceButton.tagName || "button"
          );

        gymButton.id = "gymButton";
        gymButton.className =
          referenceButton.className || "nav-item";
        gymButton.classList.remove("active");
        gymButton.type = "button";
        gymButton.setAttribute(
          "aria-label",
          "Academia"
        );

        gymButton.innerHTML = `
          <span class="gym-nav-icon">🏋️</span>
          <span class="gym-nav-label">Academia</span>
        `;

        referenceButton.parentNode.insertBefore(
          gymButton,
          referenceButton.nextSibling
        );
      }
    }
  }


  // =====================================================
  // LIFEFLOW 2.8 — BIBLIOTECA VISUAL DE EXERCÍCIOS
  // Base pública: free-exercise-db (800+ exercícios)
  // =====================================================

  const gymLibraryUrl =
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

  const gymLibraryImageBase =
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

  let gymExerciseLibrary = [];
  let gymLibraryLoaded = false;
  let gymLibraryLoading = false;
  let gymLibraryError = "";

  const gymMuscleLabels = {
    abdominals: "Abdômen",
    abductors: "Abdutores",
    adductors: "Adutores",
    biceps: "Bíceps",
    calves: "Panturrilhas",
    chest: "Peito",
    forearms: "Antebraços",
    glutes: "Glúteos",
    hamstrings: "Posteriores",
    lats: "Dorsais",
    "lower back": "Lombar",
    "middle back": "Costas",
    neck: "Pescoço",
    quadriceps: "Quadríceps",
    shoulders: "Ombros",
    traps: "Trapézio",
    triceps: "Tríceps"
  };

  const gymEquipmentLabels = {
    "body only": "Peso corporal",
    "e-z curl bar": "Barra EZ",
    barbell: "Barra",
    cable: "Cabo",
    dumbbell: "Halteres",
    "exercise ball": "Bola",
    "foam roll": "Rolo",
    kettlebells: "Kettlebell",
    machine: "Máquina",
    bands: "Elástico",
    other: "Outros"
  };

  const gymCategoryLabels = {
    strength: "Musculação",
    stretching: "Alongamento",
    cardio: "Cardio",
    plyometrics: "Pliometria",
    strongman: "Strongman",
    powerlifting: "Powerlifting",
    "olympic weightlifting": "Levantamento olímpico"
  };

  function gymLabelMuscle(value) {
    return gymMuscleLabels[value] || value || "Outros";
  }

  function gymLabelEquipment(value) {
    return gymEquipmentLabels[value] || value || "Sem equipamento";
  }

  function gymLabelCategory(value) {
    return gymCategoryLabels[value] || value || "Outros";
  }

  function getGymLibraryImage(path) {
    if (!path) return "";
    return gymLibraryImageBase + path;
  }

  function getSuggestedPrescription(exercise) {
    const category = exercise?.category || "strength";
    const level = exercise?.level || "beginner";

    if (category === "stretching") {
      return {
        sets: 2,
        reps: "20–30s",
        rest: 30
      };
    }

    if (category === "cardio") {
      return {
        sets: 1,
        reps: "10–20 min",
        rest: 60
      };
    }

    if (
      category === "powerlifting" ||
      category === "olympic weightlifting"
    ) {
      return {
        sets: 3,
        reps: "3–6",
        rest: 120
      };
    }

    if (level === "advanced") {
      return {
        sets: 3,
        reps: "6–10",
        rest: 90
      };
    }

    return {
      sets: 3,
      reps: "8–12",
      rest: 60
    };
  }

  function getGenericPostureTip(exercise) {
    const muscle =
      gymLabelMuscle(exercise?.primaryMuscles?.[0]);

    const equipment =
      gymLabelEquipment(exercise?.equipment);

    return `Mantenha o tronco estável, articulações alinhadas e movimento controlado. Foque em ${muscle.toLowerCase()} e ajuste ${equipment.toLowerCase()} para uma amplitude confortável.`;
  }

  function getGenericExecutionTip(exercise) {
    const instructions =
      Array.isArray(exercise?.instructions)
        ? exercise.instructions
        : [];

    if (instructions.length) {
      return `Execute lentamente, sem impulso. A referência original deste exercício possui ${instructions.length} etapas; use a imagem inicial/final como guia visual e mantenha controle em toda a amplitude.`;
    }

    return "Faça a fase de ida e de volta com controle, respirando normalmente e sem perder o alinhamento.";
  }

  function getGenericMistakeTip(exercise) {
    return "Evite compensar com balanço do corpo, encurtar a amplitude por excesso de carga ou continuar caso apareça dor incomum.";
  }

  async function loadGymExerciseLibrary() {
    if (gymLibraryLoaded || gymLibraryLoading) return;

    gymLibraryLoading = true;
    gymLibraryError = "";

    try {
      const response = await fetch(gymLibraryUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      gymExerciseLibrary =
        Array.isArray(data)
          ? data
          : [];

      gymLibraryLoaded = true;
    } catch (error) {
      console.log("Erro ao carregar biblioteca:", error);
      gymLibraryError =
        "Não foi possível carregar a biblioteca agora. Verifique sua internet e tente novamente.";
    } finally {
      gymLibraryLoading = false;

      if (
        document.getElementById("gymScreen") &&
        !document.getElementById("gymLibraryMuscle")?.options.length
      ) {
        renderGymPanel();
      } else {
        renderGymLibrary();
      }
    }
  }

  function getGymLibraryFilters() {
    const search =
      document
        .getElementById("gymLibrarySearch")
        ?.value
        .trim()
        .toLowerCase() || "";

    const muscle =
      document
        .getElementById("gymLibraryMuscle")
        ?.value || "";

    const equipment =
      document
        .getElementById("gymLibraryEquipment")
        ?.value || "";

    const category =
      document
        .getElementById("gymLibraryCategory")
        ?.value || "";

    return {
      search,
      muscle,
      equipment,
      category
    };
  }

  function filteredGymLibrary() {
    const filters = getGymLibraryFilters();

    return gymExerciseLibrary.filter(exercise => {
      const haystack = [
        exercise.name,
        exercise.id,
        exercise.equipment,
        exercise.category,
        ...(exercise.primaryMuscles || []),
        ...(exercise.secondaryMuscles || [])
      ]
        .join(" ")
        .toLowerCase();

      if (
        filters.search &&
        !haystack.includes(filters.search)
      ) {
        return false;
      }

      if (
        filters.muscle &&
        !(exercise.primaryMuscles || [])
          .includes(filters.muscle)
      ) {
        return false;
      }

      if (
        filters.equipment &&
        exercise.equipment !== filters.equipment
      ) {
        return false;
      }

      if (
        filters.category &&
        exercise.category !== filters.category
      ) {
        return false;
      }

      return true;
    });
  }

  function getGymLibraryUnique(field) {
    const values = new Set();

    gymExerciseLibrary.forEach(exercise => {
      const value = exercise[field];

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item) values.add(item);
        });
      } else if (value) {
        values.add(value);
      }
    });

    return [...values].sort();
  }

  function addLibraryExerciseToPlan(exerciseId) {
    const source =
      gymExerciseLibrary.find(
        item => item.id === exerciseId
      );

    const plan = getActiveGymPlan();

    if (!source || !plan) return;

    const prescription =
      getSuggestedPrescription(source);

    const alreadyExists =
      plan.exercises.some(
        item =>
          item.libraryId === source.id
      );

    if (alreadyExists) {
      showSiteMessage("Esse exercício já está neste treino.", "info");
      return;
    }

    plan.exercises.push({
      id: makeGymId("exercise"),
      libraryId: source.id,
      name: source.name,
      sets: prescription.sets,
      reps: prescription.reps,
      load: 0,
      rest: prescription.rest,
      image:
        getGymLibraryImage(
          source.images?.[0] || ""
        ),
      image2:
        getGymLibraryImage(
          source.images?.[1] || ""
        ),
      posture:
        getGenericPostureTip(source),
      execution:
        getGenericExecutionTip(source),
      mistakes:
        getGenericMistakeTip(source),
      primaryMuscle:
        source.primaryMuscles?.[0] || "",
      equipment:
        source.equipment || "",
      category:
        source.category || ""
    });

    saveGymPrograms();
    renderGymPanel();

    setTimeout(() => {
      document
        .getElementById("gymExerciseLibrarySection")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }, 50);
  }

  function renderGymLibrary() {
    const container =
      document.getElementById("gymLibraryResults");

    const count =
      document.getElementById("gymLibraryCount");

    if (!container) return;

    if (gymLibraryLoading) {
      container.innerHTML = `
        <div class="gym-library-status">
          <span>⏳</span>
          <strong>Carregando biblioteca...</strong>
        </div>
      `;
      return;
    }

    if (gymLibraryError) {
      container.innerHTML = `
        <div class="gym-library-status error">
          <span>⚠️</span>
          <strong>${escapeGymHtml(gymLibraryError)}</strong>
          <button
            id="gymLibraryRetry"
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      `;

      document
        .getElementById("gymLibraryRetry")
        ?.addEventListener(
          "click",
          loadGymExerciseLibrary
        );

      return;
    }

    if (!gymLibraryLoaded) {
      return;
    }

    const filtered =
      filteredGymLibrary();

    if (count) {
      count.textContent =
        `${filtered.length} de ${gymExerciseLibrary.length} exercícios`;
    }

    const limit = 60;
    const visible =
      filtered.slice(0, limit);

    if (!visible.length) {
      container.innerHTML = `
        <div class="gym-library-status">
          <span>🔎</span>
          <strong>Nenhum exercício encontrado.</strong>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      ${visible.map(exercise => {
        const prescription =
          getSuggestedPrescription(exercise);

        const image1 =
          getGymLibraryImage(
            exercise.images?.[0] || ""
          );

        const image2 =
          getGymLibraryImage(
            exercise.images?.[1] || ""
          );

        return `
          <article class="gym-library-card">
            <div class="gym-library-visual">
              ${
                image1
                  ? `<img
                      src="${escapeGymHtml(image1)}"
                      alt="${escapeGymHtml(exercise.name)} início"
                      loading="lazy"
                    >`
                  : `<div class="gym-library-placeholder">🏋️</div>`
              }

              ${
                image2
                  ? `<img
                      src="${escapeGymHtml(image2)}"
                      alt="${escapeGymHtml(exercise.name)} final"
                      loading="lazy"
                    >`
                  : ""
              }
            </div>

            <div class="gym-library-body">
              <div class="gym-library-tags">
                <span>
                  ${escapeGymHtml(
                    gymLabelMuscle(
                      exercise.primaryMuscles?.[0]
                    )
                  )}
                </span>
                <span>
                  ${escapeGymHtml(
                    gymLabelEquipment(
                      exercise.equipment
                    )
                  )}
                </span>
              </div>

              <h4>${escapeGymHtml(exercise.name)}</h4>

              <p>
                ${escapeGymHtml(
                  gymLabelCategory(
                    exercise.category
                  )
                )}
                •
                ${escapeGymHtml(exercise.level || "—")}
              </p>

              <div class="gym-library-prescription">
                <div>
                  <span>Séries</span>
                  <strong>${prescription.sets}</strong>
                </div>
                <div>
                  <span>Reps</span>
                  <strong>${escapeGymHtml(prescription.reps)}</strong>
                </div>
                <div>
                  <span>Descanso</span>
                  <strong>${prescription.rest}s</strong>
                </div>
              </div>

              <details class="gym-library-details">
                <summary>Ver dicas</summary>
                <p>
                  <strong>Postura:</strong>
                  ${escapeGymHtml(
                    getGenericPostureTip(exercise)
                  )}
                </p>
                <p>
                  <strong>Execução:</strong>
                  ${escapeGymHtml(
                    getGenericExecutionTip(exercise)
                  )}
                </p>
              </details>

              <button
                type="button"
                class="gym-library-add"
                data-library-add="${escapeGymHtml(exercise.id)}"
              >
                ＋ Adicionar ao ${escapeGymHtml(getActiveGymPlan()?.name || "treino")}
              </button>
            </div>
          </article>
        `;
      }).join("")}

      ${
        filtered.length > limit
          ? `<p class="gym-library-limit-note">
              Mostrando os primeiros ${limit}. Use a busca ou os filtros para encontrar qualquer exercício da biblioteca.
            </p>`
          : ""
      }
    `;

    document
      .querySelectorAll("[data-library-add]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            addLibraryExerciseToPlan(
              button.dataset.libraryAdd
            );
          }
        );
      });
  }

  function setupGymLibraryControls() {
    [
      "gymLibrarySearch",
      "gymLibraryMuscle",
      "gymLibraryEquipment",
      "gymLibraryCategory"
    ].forEach(id => {
      const element =
        document.getElementById(id);

      if (!element) return;

      element.addEventListener(
        id === "gymLibrarySearch"
          ? "input"
          : "change",
        renderGymLibrary
      );
    });
  }

  function renderGymPanel() {
    const screen =
      document.getElementById("gymScreen");

    if (!screen) return;

    const saved = getTodayGym();

    if (!workoutStartedAt) {
      workoutElapsedBeforeStart =
        Number(saved.workoutSeconds || 0);
    }

    const plan = getActiveGymPlan();
    const progress = getGymSessionProgress();

    const workoutType =
      workDay
        ? "Treino de dia de trabalho"
        : "Treino de folga";

    const workoutHint =
      workDay
        ? "Meta aproximada: 1h–1h15"
        : "Musculação + cardio • treino mais longo";

    screen.innerHTML = `
      <div class="gym-page-header">
        <div>
          <span>TREINO DO DIA</span>
          <h2>🏋️ Academia</h2>
          <p>${workoutType} • ${workoutHint}</p>
        </div>
        <span class="gym-day-badge">
          ${workDay ? "Trabalho" : "Folga"}
        </span>
      </div>

      <section class="gym-plan-switcher">
        <div class="gym-plan-tabs">
          ${gymPrograms.plans.map(item => `
            <button
              type="button"
              class="gym-plan-tab ${item.id === gymPrograms.activePlanId ? "active" : ""}"
              data-gym-plan="${escapeGymHtml(item.id)}"
            >
              ${escapeGymHtml(item.name)}
            </button>
          `).join("")}
        </div>

        <button
          id="gymNewPlanButton"
          class="gym-add-plan-button"
          type="button"
        >
          ＋ Novo treino
        </button>
      </section>

      <section class="gym-active-plan-card">
        <div>
          <span>PLANO ATUAL</span>
          <h3>${escapeGymHtml(plan?.name || "Treino")}</h3>
          <p>${escapeGymHtml(plan?.focus || "")}</p>
        </div>

        <button
          id="gymDeletePlanButton"
          type="button"
          aria-label="Excluir treino"
        >
          🗑️
        </button>
      </section>

      <section class="gym-timer-card">
        <div class="gym-section-heading">
          <div>
            <span>CRONÔMETRO</span>
            <h3>Tempo de treino</h3>
          </div>
          <span class="gym-live-dot">● AO VIVO</span>
        </div>

        <strong id="gymWorkoutTimer" class="gym-main-timer">
          ${formatTimer(currentWorkoutSeconds())}
        </strong>

        <div class="gym-timer-actions">
          <button id="gymStartWorkout" type="button">▶ Iniciar</button>
          <button id="gymPauseWorkout" type="button">Ⅱ Pausar</button>
          <button id="gymResetWorkout" type="button">↻ Zerar</button>
        </div>
      </section>

      <section class="gym-rest-card">
        <div class="gym-section-heading">
          <div>
            <span>DESCANSO ENTRE SÉRIES</span>
            <h3>⏳ Timer de descanso</h3>
          </div>
        </div>

        <strong id="gymRestTimer" class="gym-rest-timer">
          ${formatTimer(restRemaining)}
        </strong>

        <div class="gym-rest-presets">
          <button type="button" data-rest="30">30s</button>
          <button type="button" data-rest="60">60s</button>
          <button type="button" data-rest="90">90s</button>
          <button type="button" data-rest="120">120s</button>
        </div>

        <div class="gym-rest-adjust">
          <button type="button" data-rest-add="-15">−15s</button>
          <button type="button" data-rest-add="15">+15s</button>
          <button type="button" id="gymRestStop">Zerar</button>
        </div>
      </section>

      <section class="gym-exercises-section">
        <div class="gym-exercises-heading">
          <div>
            <span>EXERCÍCIOS</span>
            <h3>${plan?.exercises.length || 0} exercícios</h3>
          </div>
        </div>

        <div class="gym-exercises-list">
          ${(plan?.exercises || []).map(exercise => {
            const completedSets =
              Number(progress[exercise.id] || 0);

            const done =
              completedSets >= exercise.sets;

            return `
              <article class="gym-exercise-card ${done ? "done" : ""}">
                ${renderGymExerciseImage(exercise)}

                <div class="gym-exercise-content">
                  <div class="gym-exercise-title-row">
                    <div>
                      <span>${done ? "✓ CONCLUÍDO" : "EXERCÍCIO"}</span>
                      <h4>${escapeGymHtml(exercise.name)}</h4>
                    </div>

                    <button
                      type="button"
                      class="gym-delete-exercise"
                      data-gym-delete="${escapeGymHtml(exercise.id)}"
                      aria-label="Remover exercício"
                    >×</button>
                  </div>

                  <div class="gym-exercise-stats">
                    <div>
                      <span>Séries</span>
                      <strong>${completedSets}/${exercise.sets}</strong>
                    </div>
                    <div>
                      <span>Reps</span>
                      <strong>${escapeGymHtml(exercise.reps)}</strong>
                    </div>
                    <div>
                      <span>Descanso</span>
                      <strong>${exercise.rest}s</strong>
                    </div>
                  </div>

                  <div class="gym-load-control">
                    <span>CARGA</span>

                    <div>
                      <button
                        type="button"
                        data-gym-load="${escapeGymHtml(exercise.id)}"
                        data-gym-load-delta="-2.5"
                      >−2,5</button>

                      <strong>${Number(exercise.load || 0).toLocaleString("pt-BR")} kg</strong>

                      <button
                        type="button"
                        data-gym-load="${escapeGymHtml(exercise.id)}"
                        data-gym-load-delta="2.5"
                      >+2,5</button>
                    </div>
                  </div>

                  <details class="gym-technique-details">
                    <summary>📘 Ver postura e execução</summary>

                    <div class="gym-tip">
                      <strong>🧍 Postura</strong>
                      <p>${escapeGymHtml(exercise.posture)}</p>
                    </div>

                    <div class="gym-tip">
                      <strong>🎯 Como executar</strong>
                      <p>${escapeGymHtml(exercise.execution)}</p>
                    </div>

                    <div class="gym-tip warning">
                      <strong>⚠️ Evite</strong>
                      <p>${escapeGymHtml(exercise.mistakes)}</p>
                    </div>
                  </details>

                  <button
                    type="button"
                    class="gym-complete-set-button"
                    data-gym-complete="${escapeGymHtml(exercise.id)}"
                  >
                    ${done ? "↻ Reiniciar séries" : "✓ Concluir série"}
                  </button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>


      <section
        id="gymExerciseLibrarySection"
        class="gym-library-section"
      >
        <div class="gym-library-heading">
          <div>
            <span>BIBLIOTECA VISUAL</span>
            <h3>Todos os exercícios</h3>
            <p>
              Pesquise na base pública com mais de 800 exercícios e imagens.
            </p>
          </div>

          <strong id="gymLibraryCount">
            Carregando...
          </strong>
        </div>

        <div class="gym-library-filters">
          <input
            id="gymLibrarySearch"
            type="search"
            placeholder="Buscar exercício, músculo..."
            autocomplete="off"
          >

          <select id="gymLibraryMuscle">
            <option value="">Todos os músculos</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("primaryMuscles")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelMuscle(value))}
                      </option>
                    `)
                    .join("")
                : ""
            }
          </select>

          <select id="gymLibraryEquipment">
            <option value="">Todos os equipamentos</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("equipment")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelEquipment(value))}
                      </option>
                    `)
                    .join("")
                : ""
            }
          </select>

          <select id="gymLibraryCategory">
            <option value="">Todas as categorias</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("category")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelCategory(value))}
                      </option>
                    `)
                    .join("")
                : ""
            }
          </select>
        </div>

        <div
          id="gymLibraryResults"
          class="gym-library-results"
        >
          <div class="gym-library-status">
            <span>⏳</span>
            <strong>Carregando biblioteca...</strong>
          </div>
        </div>

        <p class="gym-library-credit">
          Imagens e dados: Free Exercise DB • base pública.
        </p>
      </section>

      <section class="gym-editor-card">
        <div class="gym-section-heading">
          <div>
            <span>PERSONALIZAR TREINO</span>
            <h3>Adicionar exercício</h3>
          </div>
        </div>

        <div class="gym-editor-grid">
          <label>
            <span>Nome</span>
            <input id="gymEditName" type="text" placeholder="Ex.: Supino inclinado">
          </label>

          <label>
            <span>Séries</span>
            <input id="gymEditSets" type="number" min="1" value="3">
          </label>

          <label>
            <span>Repetições</span>
            <input id="gymEditReps" type="text" value="8–12">
          </label>

          <label>
            <span>Carga inicial (kg)</span>
            <input id="gymEditLoad" type="number" min="0" step="0.5" value="0">
          </label>

          <label>
            <span>Descanso (s)</span>
            <input id="gymEditRest" type="number" min="15" step="15" value="60">
          </label>

          <label class="gym-editor-wide">
            <span>Foto / imagem por link</span>
            <input
              id="gymEditImage"
              type="url"
              placeholder="https://..."
            >
          </label>

          <label class="gym-editor-wide">
            <span>Dica de postura</span>
            <textarea
              id="gymEditPosture"
              rows="2"
              placeholder="Como posicionar corpo, pés, mãos..."
            ></textarea>
          </label>

          <label class="gym-editor-wide">
            <span>Como executar</span>
            <textarea
              id="gymEditExecution"
              rows="2"
              placeholder="Explique o movimento..."
            ></textarea>
          </label>

          <label class="gym-editor-wide">
            <span>Erros a evitar</span>
            <textarea
              id="gymEditMistakes"
              rows="2"
              placeholder="Erros comuns..."
            ></textarea>
          </label>
        </div>

        <button
          id="gymAddExerciseButton"
          class="gym-editor-add-button"
          type="button"
        >
          ＋ Adicionar ao ${escapeGymHtml(plan?.name || "treino")}
        </button>

        <p class="gym-safety-note">
          Use as dicas como referência geral. Priorize técnica confortável,
          carga controlada e interrompa o exercício se sentir dor incomum.
        </p>
      </section>
    `;

    document
      .getElementById("gymStartWorkout")
      ?.addEventListener("click", startWorkoutTimer);

    document
      .getElementById("gymPauseWorkout")
      ?.addEventListener("click", pauseWorkoutTimer);

    document
      .getElementById("gymResetWorkout")
      ?.addEventListener("click", resetWorkoutTimer);

    document
      .querySelectorAll("[data-rest]")
      .forEach(button => {
        button.addEventListener("click", () => {
          startRestTimer(Number(button.dataset.rest));
        });
      });

    document
      .querySelectorAll("[data-rest-add]")
      .forEach(button => {
        button.addEventListener("click", () => {
          addRestTime(Number(button.dataset.restAdd));
        });
      });

    document
      .getElementById("gymRestStop")
      ?.addEventListener("click", () => {
        restRemaining = 0;
        clearInterval(restTimerInterval);
        restTimerInterval = null;
        updateRestTimerDisplay();
      });

    document
      .querySelectorAll("[data-gym-plan]")
      .forEach(button => {
        button.addEventListener("click", () => {
          gymPrograms.activePlanId =
            button.dataset.gymPlan;
          saveGymPrograms();
          renderGymPanel();
        });
      });

    document
      .getElementById("gymNewPlanButton")
      ?.addEventListener("click", createGymPlan);

    document
      .getElementById("gymDeletePlanButton")
      ?.addEventListener("click", deleteActiveGymPlan);

    document
      .querySelectorAll("[data-gym-load]")
      .forEach(button => {
        button.addEventListener("click", () => {
          adjustExerciseLoad(
            button.dataset.gymLoad,
            Number(button.dataset.gymLoadDelta)
          );
        });
      });

    document
      .querySelectorAll("[data-gym-complete]")
      .forEach(button => {
        button.addEventListener("click", () => {
          completeGymSet(
            button.dataset.gymComplete
          );
        });
      });

    document
      .querySelectorAll("[data-gym-delete]")
      .forEach(button => {
        button.addEventListener("click", () => {
          deleteGymExercise(
            button.dataset.gymDelete
          );
        });
      });

    document
      .getElementById("gymAddExerciseButton")
      ?.addEventListener(
        "click",
        addGymExerciseFromEditor
      );

    updateWorkoutTimerDisplay();
    updateRestTimerDisplay();
    updateGymTimerButtons();

    setupGymLibraryControls();

    if (!gymLibraryLoaded) {
      loadGymExerciseLibrary();
    } else {
      renderGymLibrary();
    }
  }


  function injectGymStyles() {
    if (document.getElementById("lifeflowGymStyles")) return;

    const style = document.createElement("style");
    style.id = "lifeflowGymStyles";

    style.textContent = `
      .lifeflow-gym-screen {
        width: 100%;
      }

      .gym-page-header,
      .gym-timer-card,
      .gym-rest-card,
      .gym-coming-card {
        border: 1px solid rgba(255,255,255,.075);
        background:
          radial-gradient(circle at 92% 0%, rgba(92,230,153,.09), transparent 32%),
          linear-gradient(145deg, rgba(18,18,20,.98), rgba(7,7,8,.98));
        box-shadow: 0 22px 60px rgba(0,0,0,.32);
      }

      .gym-page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin: 4px 0 14px;
        padding: 18px;
        border-radius: 22px;
      }

      .gym-page-header > div > span,
      .gym-section-heading span,
      .gym-coming-card > span {
        color: #66d99d;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .gym-page-header h2 {
        margin: 5px 0 3px;
        color: #f4f4f5;
        font-size: 24px;
      }

      .gym-page-header p,
      .gym-coming-card p {
        margin: 0;
        color: #7f7f87;
        font-size: 10px;
        line-height: 1.55;
      }

      .gym-day-badge {
        flex: 0 0 auto;
        border: 1px solid rgba(92,230,153,.17);
        border-radius: 999px;
        padding: 7px 10px;
        background: rgba(92,230,153,.06);
        color: #8ae9b6;
        font-size: 8px;
        font-weight: 900;
      }

      .gym-timer-card,
      .gym-rest-card,
      .gym-coming-card {
        margin: 12px 0;
        padding: 16px;
        border-radius: 20px;
      }

      .gym-section-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .gym-section-heading h3,
      .gym-coming-card h3 {
        margin: 5px 0 0;
        color: #eeeeef;
        font-size: 16px;
      }

      .gym-live-dot {
        color: #65dda0 !important;
        font-size: 7px !important;
      }

      .gym-main-timer,
      .gym-rest-timer {
        display: block;
        margin: 20px 0;
        text-align: center;
        color: #f7f7f8;
        font-variant-numeric: tabular-nums;
        letter-spacing: 2px;
      }

      .gym-main-timer {
        font-size: clamp(38px, 10vw, 58px);
      }

      .gym-rest-timer {
        font-size: clamp(34px, 9vw, 48px);
      }

      .gym-rest-timer.running {
        color: #8ae9b6;
      }

      .gym-timer-actions,
      .gym-rest-presets,
      .gym-rest-adjust {
        display: grid;
        gap: 8px;
      }

      .gym-timer-actions {
        grid-template-columns: 1.2fr 1fr 1fr;
      }

      .gym-rest-presets {
        grid-template-columns: repeat(4, 1fr);
      }

      .gym-rest-adjust {
        grid-template-columns: repeat(3, 1fr);
        margin-top: 8px;
      }

      .gym-timer-actions button,
      .gym-rest-presets button,
      .gym-rest-adjust button {
        min-height: 48px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        background: #0d0d0f;
        color: #d5d5d8;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .gym-timer-actions button:first-child {
        border-color: rgba(92,230,153,.22);
        background: rgba(92,230,153,.08);
        color: #8ae9b6;
      }

      .gym-timer-actions button:disabled {
        opacity: .35;
      }

      .gym-coming-card p {
        margin-top: 8px;
      }

      #gymButton .gym-nav-icon,
      #gymButton .gym-nav-label {
        pointer-events: none;
      }

      .gym-nav-icon {
        display: block;
        font-size: 17px;
        line-height: 1;
      }

      .gym-nav-label {
        display: block;
        margin-top: 3px;
        font-size: 8px;
        font-weight: 800;
      }


      .gym-plan-switcher {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
      }

      .gym-plan-tabs {
        display: flex;
        flex: 1 1 auto;
        gap: 7px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .gym-plan-tabs::-webkit-scrollbar {
        display: none;
      }

      .gym-plan-tab,
      .gym-add-plan-button {
        flex: 0 0 auto;
        min-height: 42px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 13px;
        padding: 0 13px;
        background: #0d0d0f;
        color: #8f8f96;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
      }

      .gym-plan-tab.active {
        border-color: rgba(92,230,153,.24);
        background: rgba(92,230,153,.08);
        color: #8ae9b6;
      }

      .gym-active-plan-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 12px 0;
        padding: 14px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 18px;
        background: rgba(255,255,255,.018);
      }

      .gym-active-plan-card span,
      .gym-exercises-heading span,
      .gym-editor-card label > span {
        display: block;
        color: #707078;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .6px;
        text-transform: uppercase;
      }

      .gym-active-plan-card h3 {
        margin: 4px 0 2px;
        color: #eeeeef;
        font-size: 17px;
      }

      .gym-active-plan-card p {
        margin: 0;
        color: #777780;
        font-size: 9px;
      }

      .gym-active-plan-card > button {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 12px;
        background: rgba(255,255,255,.025);
        cursor: pointer;
      }

      .gym-exercises-section,
      .gym-editor-card {
        margin: 14px 0;
      }

      .gym-exercises-heading {
        margin-bottom: 10px;
      }

      .gym-exercises-heading h3 {
        margin: 4px 0 0;
        color: #ededee;
        font-size: 17px;
      }

      .gym-exercises-list {
        display: grid;
        gap: 12px;
      }

      .gym-exercise-card {
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 20px;
        background:
          linear-gradient(145deg, rgba(17,17,19,.98), rgba(8,8,9,.98));
      }

      .gym-exercise-card.done {
        border-color: rgba(92,230,153,.18);
      }

      .gym-exercise-media {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 8;
        overflow: hidden;
        background: #101012;
      }

      .gym-exercise-media img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .gym-image-fallback,
      .gym-image-placeholder {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        text-align: center;
        background:
          radial-gradient(circle at 50% 20%, rgba(92,230,153,.08), transparent 42%),
          #101012;
      }

      .gym-image-fallback {
        display: none;
      }

      .gym-exercise-media.image-error .gym-image-fallback {
        display: grid;
      }

      .gym-image-placeholder > span {
        font-size: 28px;
      }

      .gym-image-placeholder strong {
        color: #d7d7da;
        font-size: 12px;
      }

      .gym-image-placeholder small,
      .gym-image-fallback small {
        color: #6f6f76;
        font-size: 8px;
      }

      .gym-exercise-content {
        padding: 14px;
      }

      .gym-exercise-title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .gym-exercise-title-row span {
        color: #66d99d;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .8px;
      }

      .gym-exercise-title-row h4 {
        margin: 4px 0 0;
        color: #f0f0f1;
        font-size: 18px;
      }

      .gym-delete-exercise {
        width: 34px;
        height: 34px;
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 10px;
        background: rgba(255,255,255,.02);
        color: #77777e;
        font-size: 18px;
        cursor: pointer;
      }

      .gym-exercise-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 7px;
        margin-top: 12px;
      }

      .gym-exercise-stats > div {
        padding: 9px;
        border: 1px solid rgba(255,255,255,.055);
        border-radius: 12px;
        background: rgba(255,255,255,.02);
      }

      .gym-exercise-stats span,
      .gym-load-control > span {
        display: block;
        color: #6f6f76;
        font-size: 7px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .gym-exercise-stats strong {
        display: block;
        margin-top: 3px;
        color: #e4e4e6;
        font-size: 12px;
      }

      .gym-load-control {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid rgba(255,255,255,.055);
        border-radius: 13px;
        background: rgba(255,255,255,.018);
      }

      .gym-load-control > div {
        display: grid;
        grid-template-columns: 1fr 1.2fr 1fr;
        align-items: center;
        gap: 7px;
        margin-top: 7px;
      }

      .gym-load-control button {
        min-height: 42px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 11px;
        background: #0d0d0f;
        color: #9c9ca3;
        font-size: 9px;
        font-weight: 900;
      }

      .gym-load-control strong {
        text-align: center;
        color: #f0f0f2;
        font-size: 14px;
      }

      .gym-technique-details {
        margin-top: 10px;
        border: 1px solid rgba(106,167,255,.09);
        border-radius: 13px;
        background: rgba(106,167,255,.025);
      }

      .gym-technique-details summary {
        list-style: none;
        padding: 12px;
        color: #aebcd2;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
      }

      .gym-technique-details summary::-webkit-details-marker {
        display: none;
      }

      .gym-tip {
        margin: 0 10px 10px;
        padding: 10px;
        border-radius: 11px;
        background: rgba(255,255,255,.024);
      }

      .gym-tip strong {
        display: block;
        color: #d9d9dc;
        font-size: 9px;
      }

      .gym-tip p {
        margin: 5px 0 0;
        color: #82828a;
        font-size: 9px;
        line-height: 1.55;
      }

      .gym-tip.warning {
        background: rgba(231,182,95,.04);
      }

      .gym-complete-set-button,
      .gym-editor-add-button {
        width: 100%;
        min-height: 48px;
        margin-top: 10px;
        border: 1px solid rgba(92,230,153,.20);
        border-radius: 13px;
        background: rgba(92,230,153,.07);
        color: #8ae9b6;
        font-size: 10px;
        font-weight: 950;
        cursor: pointer;
        touch-action: manipulation;
      }

      .gym-editor-card {
        padding: 15px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 20px;
        background:
          radial-gradient(circle at 92% 0%, rgba(106,167,255,.08), transparent 32%),
          linear-gradient(145deg, rgba(17,17,19,.98), rgba(8,8,9,.98));
      }

      .gym-editor-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 9px;
        margin-top: 12px;
      }

      .gym-editor-grid label {
        display: block;
      }

      .gym-editor-wide {
        grid-column: 1 / -1;
      }

      .gym-editor-grid input,
      .gym-editor-grid textarea {
        box-sizing: border-box;
        width: 100%;
        margin-top: 6px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 12px;
        outline: none;
        background: #0d0d0f;
        color: #e7e7e9;
        padding: 11px;
        font: inherit;
        font-size: 10px;
      }

      .gym-editor-grid textarea {
        resize: vertical;
      }

      .gym-safety-note {
        margin: 10px 2px 0;
        color: #686870;
        font-size: 8px;
        line-height: 1.5;
      }


      .gym-exercise-media-pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
      }

      .gym-exercise-media-pair img {
        min-width: 0;
      }

      .gym-library-section {
        margin: 14px 0;
        padding: 15px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 20px;
        background:
          radial-gradient(circle at 92% 0%, rgba(106,167,255,.09), transparent 32%),
          linear-gradient(145deg, rgba(17,17,19,.98), rgba(8,8,9,.98));
      }

      .gym-library-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .gym-library-heading span {
        display: block;
        color: #6aa7ff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .9px;
      }

      .gym-library-heading h3 {
        margin: 4px 0 3px;
        color: #efeff1;
        font-size: 18px;
      }

      .gym-library-heading p,
      .gym-library-credit,
      .gym-library-limit-note {
        margin: 0;
        color: #74747c;
        font-size: 8px;
        line-height: 1.5;
      }

      .gym-library-heading > strong {
        color: #9dbfff;
        font-size: 9px;
        white-space: nowrap;
      }

      .gym-library-filters {
        display: grid;
        grid-template-columns: 1.4fr repeat(3, 1fr);
        gap: 8px;
        margin-top: 13px;
      }

      .gym-library-filters input,
      .gym-library-filters select {
        box-sizing: border-box;
        width: 100%;
        min-height: 44px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 12px;
        outline: none;
        background: #0d0d0f;
        color: #dedee1;
        padding: 0 10px;
        font: inherit;
        font-size: 10px;
      }

      .gym-library-results {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }

      .gym-library-card {
        min-width: 0;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 17px;
        background: rgba(255,255,255,.018);
      }

      .gym-library-visual {
        display: grid;
        grid-template-columns: 1fr 1fr;
        aspect-ratio: 16 / 8;
        overflow: hidden;
        background: #101012;
      }

      .gym-library-visual img,
      .gym-library-placeholder {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .gym-library-placeholder {
        display: grid;
        place-items: center;
        font-size: 28px;
      }

      .gym-library-body {
        padding: 11px;
      }

      .gym-library-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .gym-library-tags span {
        padding: 5px 7px;
        border: 1px solid rgba(106,167,255,.12);
        border-radius: 999px;
        background: rgba(106,167,255,.04);
        color: #91b7ff;
        font-size: 7px;
        font-weight: 850;
      }

      .gym-library-body h4 {
        margin: 8px 0 3px;
        color: #ececee;
        font-size: 14px;
      }

      .gym-library-body > p {
        margin: 0;
        color: #717179;
        font-size: 8px;
      }

      .gym-library-prescription {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        margin-top: 9px;
      }

      .gym-library-prescription > div {
        padding: 7px;
        border: 1px solid rgba(255,255,255,.05);
        border-radius: 10px;
        background: rgba(255,255,255,.018);
      }

      .gym-library-prescription span {
        display: block;
        color: #686870;
        font-size: 6px;
        text-transform: uppercase;
      }

      .gym-library-prescription strong {
        display: block;
        margin-top: 3px;
        color: #dcdce0;
        font-size: 10px;
      }

      .gym-library-details {
        margin-top: 8px;
        border-top: 1px solid rgba(255,255,255,.045);
      }

      .gym-library-details summary {
        padding: 9px 0 4px;
        color: #9aabc4;
        font-size: 8px;
        font-weight: 900;
        cursor: pointer;
      }

      .gym-library-details p {
        margin: 6px 0 0;
        color: #76767f;
        font-size: 8px;
        line-height: 1.5;
      }

      .gym-library-add {
        width: 100%;
        min-height: 44px;
        margin-top: 10px;
        border: 1px solid rgba(92,230,153,.18);
        border-radius: 12px;
        background: rgba(92,230,153,.06);
        color: #8ae9b6;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .gym-library-status {
        grid-column: 1 / -1;
        display: grid;
        place-items: center;
        gap: 7px;
        min-height: 130px;
        border: 1px dashed rgba(255,255,255,.07);
        border-radius: 15px;
        color: #85858d;
        text-align: center;
      }

      .gym-library-status button {
        min-height: 40px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 11px;
        background: #111114;
        color: #d6d6da;
        padding: 0 14px;
      }

      .gym-library-credit,
      .gym-library-limit-note {
        margin-top: 10px;
        text-align: center;
      }

      @media (max-width: 520px) {
        .gym-page-header {
          padding: 15px;
          border-radius: 18px;
        }

        .gym-page-header h2 {
          font-size: 21px;
        }

        .gym-timer-card,
        .gym-rest-card,
        .gym-coming-card {
          padding: 14px;
          border-radius: 18px;
        }

        .gym-rest-presets {
          grid-template-columns: repeat(2, 1fr);
        }

        .gym-timer-actions button,
        .gym-rest-presets button,
        .gym-rest-adjust button {
          min-height: 50px;
        }

        #gymButton {
          min-width: 0 !important;
          padding-left: 3px !important;
          padding-right: 3px !important;
        }

        .gym-plan-switcher {
          align-items: stretch;
          flex-direction: column;
        }

        .gym-add-plan-button {
          width: 100%;
        }

        .gym-exercise-media {
          aspect-ratio: 16 / 9;
        }

        .gym-exercise-content {
          padding: 12px;
        }

        .gym-exercise-title-row h4 {
          font-size: 16px;
        }

        .gym-editor-grid {
          grid-template-columns: 1fr;
        }

        .gym-editor-wide {
          grid-column: auto;
        }

        .gym-editor-grid input,
        .gym-editor-grid textarea {
          font-size: 16px;
        }

        .gym-library-section {
          padding: 12px;
          border-radius: 18px;
        }

        .gym-library-heading {
          display: block;
        }

        .gym-library-heading > strong {
          display: block;
          margin-top: 7px;
        }

        .gym-library-filters {
          grid-template-columns: 1fr;
        }

        .gym-library-filters input,
        .gym-library-filters select {
          min-height: 48px;
          font-size: 16px;
        }

        .gym-library-results {
          grid-template-columns: 1fr;
        }

        .gym-library-card {
          border-radius: 16px;
        }

        .gym-library-body h4 {
          font-size: 16px;
        }

        .gym-library-add {
          min-height: 50px;
          font-size: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // =====================================================
  // LIFEFLOW 2.5 — SLEEP HUB / ABA SONO
  // =====================================================

  function setupSleepHub() {
    if (!document.getElementById("sleepScreen")) {
      const referenceScreen =
        document.getElementById("progressScreen");

      const sleepScreen =
        document.createElement("section");

      sleepScreen.id = "sleepScreen";
      sleepScreen.className = "hidden lifeflow-sleep-screen";

      sleepScreen.innerHTML = `
        <div class="sleep-page-header">
          <div>
            <span>RECUPERAÇÃO</span>
            <h2>🌙 Sono</h2>
            <p>Acompanhe seu descanso, qualidade e consistência.</p>
          </div>
        </div>
      `;

      if (referenceScreen?.parentNode) {
        referenceScreen.parentNode.insertBefore(
          sleepScreen,
          referenceScreen
        );
      } else {
        document.body.appendChild(sleepScreen);
      }
    }

    if (!document.getElementById("sleepButton")) {
      const progressButton =
        document.getElementById("progressButton");

      if (progressButton?.parentNode) {
        const sleepButton =
          document.createElement(
            progressButton.tagName || "button"
          );

        sleepButton.id = "sleepButton";
        sleepButton.className =
          progressButton.className || "nav-item";
        sleepButton.classList.remove("active");
        sleepButton.type = "button";
        sleepButton.setAttribute(
          "aria-label",
          "Sono"
        );

        sleepButton.innerHTML = `
          <span class="sleep-nav-icon">🌙</span>
          <span class="sleep-nav-label">Sono</span>
        `;

        progressButton.parentNode.insertBefore(
          sleepButton,
          progressButton
        );
      }
    }
  }

  function renderSleepProgressSummary() {
    const progressScreen =
      document.getElementById("progressScreen");

    if (!progressScreen) return;

    let summary =
      document.getElementById("sleepProgressSummary");

    if (!summary) {
      summary = document.createElement("section");
      summary.id = "sleepProgressSummary";
      summary.className = "sleep-progress-summary";

      const historyPanel =
        document.getElementById("historyProgressPanel");

      if (historyPanel?.parentNode) {
        historyPanel.parentNode.insertBefore(
          summary,
          historyPanel.nextSibling
        );
      } else {
        progressScreen.appendChild(summary);
      }
    }

    const todaySleep = getTodaySleep();
    const week = getSleepRange(7);
    const averageMinutes = averageSleepMinutes(week);
    const averageScore = averageSleepScore(week);
    const registered =
      week.filter(item => item.hasData).length;

    summary.innerHTML = `
      <button
        id="openSleepHubButton"
        class="sleep-summary-card"
        type="button"
      >
        <div class="sleep-summary-top">
          <div>
            <span>🌙 SONO INTELIGENTE</span>
            <strong>
              ${todaySleep
                ? formatSleepDuration(todaySleep.minutes)
                : "Sem registro hoje"}
            </strong>
          </div>

          <span class="sleep-summary-arrow">›</span>
        </div>

        <div class="sleep-summary-metrics">
          <div>
            <span>Score</span>
            <strong>${todaySleep?.score || "—"}</strong>
          </div>
          <div>
            <span>Média 7 dias</span>
            <strong>${formatSleepDuration(averageMinutes)}</strong>
          </div>
          <div>
            <span>Registros</span>
            <strong>${registered}/7</strong>
          </div>
        </div>

        <small>Toque para abrir o Sleep Hub</small>
      </button>
    `;

    document
      .getElementById("openSleepHubButton")
      ?.addEventListener(
        "click",
        showSleep
      );
  }

  function injectSleepHubStyles() {
    if (
      document.getElementById(
        "lifeflowSleepHubStyles"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id = "lifeflowSleepHubStyles";

    style.textContent = `
      .lifeflow-sleep-screen {
        width: 100%;
      }

      .sleep-page-header {
        margin: 4px 0 14px;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 22px;
        background:
          radial-gradient(circle at 90% 0%, rgba(129,107,255,.13), transparent 35%),
          linear-gradient(145deg, rgba(18,18,21,.98), rgba(7,7,8,.98));
      }

      .sleep-page-header span {
        color: #8d80df;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.2px;
      }

      .sleep-page-header h2 {
        margin: 5px 0 3px;
        color: #f4f2ff;
        font-size: 24px;
      }

      .sleep-page-header p {
        margin: 0;
        color: #7f7f88;
        font-size: 10px;
        line-height: 1.5;
      }

      .sleep-progress-summary {
        margin: 14px 0;
      }

      .sleep-summary-card {
        width: 100%;
        display: block;
        text-align: left;
        border: 1px solid rgba(145,124,255,.14);
        border-radius: 20px;
        padding: 15px;
        background:
          radial-gradient(circle at 92% 0%, rgba(129,107,255,.10), transparent 32%),
          rgba(12,12,14,.96);
        color: inherit;
        cursor: pointer;
        touch-action: manipulation;
      }

      .sleep-summary-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .sleep-summary-top > div > span {
        display: block;
        color: #8d80df;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .8px;
      }

      .sleep-summary-top > div > strong {
        display: block;
        margin-top: 5px;
        color: #f0eef9;
        font-size: 17px;
      }

      .sleep-summary-arrow {
        color: #a99cff;
        font-size: 28px;
        line-height: 1;
      }

      .sleep-summary-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 7px;
        margin-top: 12px;
      }

      .sleep-summary-metrics > div {
        padding: 9px;
        border: 1px solid rgba(255,255,255,.055);
        border-radius: 12px;
        background: rgba(255,255,255,.02);
      }

      .sleep-summary-metrics span {
        display: block;
        color: #6f6f78;
        font-size: 7px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .sleep-summary-metrics strong {
        display: block;
        margin-top: 4px;
        color: #e7e5ee;
        font-size: 12px;
      }

      .sleep-summary-card small {
        display: block;
        margin-top: 10px;
        color: #777780;
        font-size: 8px;
      }

      #sleepButton .sleep-nav-icon,
      #sleepButton .sleep-nav-label {
        pointer-events: none;
      }

      .sleep-nav-icon {
        display: block;
        font-size: 17px;
        line-height: 1;
      }

      .sleep-nav-label {
        display: block;
        margin-top: 3px;
        font-size: 8px;
        font-weight: 800;
      }

      @media (max-width: 520px) {
        .sleep-page-header {
          padding: 15px;
          border-radius: 18px;
        }

        .sleep-page-header h2 {
          font-size: 21px;
        }

        .sleep-summary-card {
          padding: 13px;
          border-radius: 17px;
        }

        .sleep-summary-metrics {
          gap: 5px;
        }

        .sleep-summary-metrics > div {
          padding: 8px 6px;
        }

        .nav-item {
          min-width: 0 !important;
        }

        #sleepButton {
          min-width: 0 !important;
          padding-left: 4px !important;
          padding-right: 4px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // =====================================================
  // TELAS
  // =====================================================

  const screens = [

    "homeScreen",

    "agendaScreen",

    "studyScreen",

    "sleepScreen",

    "gymScreen",

    "progressScreen"

  ];


  function hideAllScreens() {

    screens.forEach(
      id => {

        const screen =
          document.getElementById(
            id
          );


        if (screen) {

          screen.classList.add(
            "hidden"
          );
        }
      }
    );
  }


  function showScreen(
    id
  ) {

    hideAllScreens();


    const screen =
      document.getElementById(
        id
      );


    if (screen) {

      screen.classList.remove(
        "hidden"
      );
    }
  }


  function clearNav() {

    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(
        button => {

          button.classList.remove(
            "active"
          );
        }
      );
  }


  function showHome() {

    showScreen(
      "homeScreen"
    );


    clearNav();


    document
      .getElementById(
        "homeButton"
      )
      ?.classList.add(
        "active"
      );


    renderHome();


    window.scrollTo(
      0,
      0
    );
  }


  function showAgenda() {

    showScreen(
      "agendaScreen"
    );


    clearNav();


    document
      .getElementById(
        "agendaButton"
      )
      ?.classList.add(
        "active"
      );


    renderCalendar();


    window.scrollTo(
      0,
      0
    );
  }


  function showStudy() {

    showScreen(
      "studyScreen"
    );


    clearNav();


    document
      .getElementById(
        "studyNavButton"
      )
      ?.classList.add(
        "active"
      );


    renderStudyPlan();


    window.scrollTo(
      0,
      0
    );
  }



  function showSleep() {

    showScreen(
      "sleepScreen"
    );

    clearNav();

    document
      .getElementById(
        "sleepButton"
      )
      ?.classList.add(
        "active"
      );

    renderSleepPanel();

    window.scrollTo(
      0,
      0
    );
  }



  function showGym() {
    showScreen("gymScreen");
    clearNav();

    document
      .getElementById("gymButton")
      ?.classList.add("active");

    if (
      typeof gymFolderView === "undefined" ||
      !gymFolderView
    ) {
      gymFolderView = "root";
    }

    renderGymPanel();

    window.scrollTo(0, 0);
  }


  function showProgress() {

    showScreen(
      "progressScreen"
    );


    clearNav();


    document
      .getElementById(
        "progressButton"
      )
      ?.classList.add(
        "active"
      );


    renderProgressScreen();


    window.scrollTo(
      0,
      0
    );
  }




  // =====================================================
  // LIFEFLOW 3.1 — ACADEMIA PRO / METAS + GRÁFICOS + EDIÇÃO
  // =====================================================

  const gymAnalyticsStorageKey = "lifeflow-gym-analytics-v31";

  let gymAnalytics = {
    weeklyGoal: 4,
    trainingDays: [],
    perfectDays: [],
    setsByDay: {},
    weightEntries: []
  };

  try {
    const savedGymAnalytics =
      localStorage.getItem(gymAnalyticsStorageKey);

    if (savedGymAnalytics) {
      gymAnalytics = {
        ...gymAnalytics,
        ...JSON.parse(savedGymAnalytics)
      };
    }
  } catch (error) {
    console.log("Erro ao carregar evolução da academia:", error);
  }

  if (!Array.isArray(gymAnalytics.trainingDays)) gymAnalytics.trainingDays = [];
  if (!Array.isArray(gymAnalytics.perfectDays)) gymAnalytics.perfectDays = [];
  if (!Array.isArray(gymAnalytics.weightEntries)) gymAnalytics.weightEntries = [];
  if (!gymAnalytics.setsByDay || typeof gymAnalytics.setsByDay !== "object") {
    gymAnalytics.setsByDay = {};
  }

  function saveGymAnalytics() {
    localStorage.setItem(
      gymAnalyticsStorageKey,
      JSON.stringify(gymAnalytics)
    );
  }

  function markGymTrainingDay() {
    if (!gymAnalytics.trainingDays.includes(todayKey)) {
      gymAnalytics.trainingDays.push(todayKey);
      gymAnalytics.trainingDays.sort();
      saveGymAnalytics();
      showSiteMessage("Treino de hoje registrado no seu progresso.", "success");
    }
  }

  function registerGymSet() {
    markGymTrainingDay();

    gymAnalytics.setsByDay[todayKey] =
      Number(gymAnalytics.setsByDay[todayKey] || 0) + 1;

    saveGymAnalytics();
  }

  function checkPerfectGymDay() {
    const plan = getActiveGymPlan();
    if (!plan?.exercises?.length) return;

    const progress = getGymSessionProgress();

    const complete =
      plan.exercises.every(exercise =>
        Number(progress[exercise.id] || 0) >= Number(exercise.sets || 0)
      );

    if (
      complete &&
      !gymAnalytics.perfectDays.includes(todayKey)
    ) {
      gymAnalytics.perfectDays.push(todayKey);
      gymAnalytics.perfectDays.sort();
      saveGymAnalytics();

      showSiteMessage(
        `Meta batida: ${plan.name} concluído 100%!`,
        "success"
      );
    }
  }

  function getGymDateRange(days = 7, offset = 0) {
    const list = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i - offset);

      const key = getDateKey(date);

      list.push({
        key,
        date,
        trained: gymAnalytics.trainingDays.includes(key),
        perfect: gymAnalytics.perfectDays.includes(key),
        sets: Number(gymAnalytics.setsByDay[key] || 0)
      });
    }

    return list;
  }

  function getGymWeekCount(offset = 0) {
    return getGymDateRange(7, offset)
      .filter(item => item.trained).length;
  }

  function getGymTrainingStreak() {
    const days =
      [...new Set(gymAnalytics.trainingDays)].sort();

    if (!days.length) return 0;

    let streak = 0;
    let cursor = startOfDay(new Date());

    const todayValue = getDateKey(cursor);
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);

    const last = days[days.length - 1];

    if (
      last !== todayValue &&
      last !== getDateKey(yesterday)
    ) {
      return 0;
    }

    if (last !== todayValue) {
      cursor = yesterday;
    }

    while (
      gymAnalytics.trainingDays.includes(
        getDateKey(cursor)
      )
    ) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  function getTotalGymSets() {
    return Object.values(gymAnalytics.setsByDay)
      .reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function getLatestWeightEntry() {
    return gymAnalytics.weightEntries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1) || null;
  }

  function getWeightGoalData() {
    const entries =
      gymAnalytics.weightEntries
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));

    const latest = entries.at(-1) || null;
    const first = entries[0] || null;

    const target =
      Number(
        localStorage.getItem("lifeflow-gym-weight-target-v31") || 0
      );

    let progress = 0;

    if (
      first &&
      latest &&
      target > 0 &&
      first.weight !== target
    ) {
      const totalDistance =
        Math.abs(first.weight - target);

      const moved =
        totalDistance -
        Math.abs(latest.weight - target);

      progress =
        Math.max(
          0,
          Math.min(
            100,
            Math.round((moved / totalDistance) * 100)
          )
        );
    }

    return {
      first,
      latest,
      target,
      progress,
      entries
    };
  }

  function weightChartSvg(entries) {
    const data = entries.slice(-10);

    if (data.length < 2) {
      return `
        <div class="lf-gym-chart-empty">
          Registre seu peso em pelo menos 2 dias para gerar o gráfico.
        </div>
      `;
    }

    const values = data.map(item => Number(item.weight));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const points = data.map((item, index) => {
      const x =
        data.length === 1
          ? 50
          : (index / (data.length - 1)) * 100;

      const y =
        90 - ((Number(item.weight) - min) / range) * 70;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

    return `
      <svg
        class="lf-weight-chart-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="Gráfico de evolução do peso"
      >
        <polyline
          points="${points}"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          vector-effect="non-scaling-stroke"
        ></polyline>
      </svg>
    `;
  }

  function ensureGymProModal() {
    if (document.getElementById("lfGymProModal")) return;

    const modal = document.createElement("div");
    modal.id = "lfGymProModal";
    modal.className = "lf-gym-pro-modal";

    modal.innerHTML = `
      <div class="lf-gym-pro-modal-card">
        <div class="lf-gym-pro-modal-head">
          <div>
            <span id="lfGymProModalKicker">ACADEMIA</span>
            <h3 id="lfGymProModalTitle">Editar</h3>
          </div>
          <button id="lfGymProModalClose" type="button">×</button>
        </div>

        <div id="lfGymProModalBody"></div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.classList.remove("open");

    document
      .getElementById("lfGymProModalClose")
      ?.addEventListener("click", close);

    modal.addEventListener("click", event => {
      if (event.target === modal) close();
    });
  }

  function openGymGoalsModal() {
    ensureGymProModal();

    const modal = document.getElementById("lfGymProModal");
    const title = document.getElementById("lfGymProModalTitle");
    const kicker = document.getElementById("lfGymProModalKicker");
    const body = document.getElementById("lfGymProModalBody");

    if (!modal || !title || !body || !kicker) return;

    const weight = getWeightGoalData();

    kicker.textContent = "METAS";
    title.textContent = "Metas da Academia";

    body.innerHTML = `
      <div class="lf-pro-form-grid">
        <label>
          <span>Treinos por semana</span>
          <input
            id="lfGymWeeklyGoalInput"
            type="number"
            min="1"
            max="7"
            value="${Number(gymAnalytics.weeklyGoal || 4)}"
          >
        </label>

        <label>
          <span>Peso atual (kg)</span>
          <input
            id="lfGymCurrentWeightInput"
            type="number"
            min="1"
            step="0.1"
            value="${weight.latest?.weight || ""}"
            placeholder="Ex.: 78,5"
          >
        </label>

        <label>
          <span>Meta de peso (kg)</span>
          <input
            id="lfGymTargetWeightInput"
            type="number"
            min="1"
            step="0.1"
            value="${weight.target || ""}"
            placeholder="Você escolhe sua meta"
          >
        </label>
      </div>

      <button
        id="lfGymSaveGoals"
        class="lf-pro-primary"
        type="button"
      >
        Salvar metas
      </button>

      <p class="lf-pro-helper">
        A meta de peso é definida por você. O LifeFlow apenas registra e mostra sua evolução.
      </p>
    `;

    modal.classList.add("open");

    document
      .getElementById("lfGymSaveGoals")
      ?.addEventListener("click", () => {
        const weekly =
          Math.max(
            1,
            Math.min(
              7,
              Number(
                document.getElementById("lfGymWeeklyGoalInput")?.value
              ) || 4
            )
          );

        const currentWeight =
          Number(
            document.getElementById("lfGymCurrentWeightInput")?.value
          );

        const target =
          Number(
            document.getElementById("lfGymTargetWeightInput")?.value
          );

        gymAnalytics.weeklyGoal = weekly;

        if (currentWeight > 0) {
          const todayEntryIndex =
            gymAnalytics.weightEntries.findIndex(
              item => item.date === todayKey
            );

          const entry = {
            date: todayKey,
            weight: Math.round(currentWeight * 10) / 10
          };

          if (todayEntryIndex >= 0) {
            gymAnalytics.weightEntries[todayEntryIndex] = entry;
          } else {
            gymAnalytics.weightEntries.push(entry);
          }
        }

        if (target > 0) {
          localStorage.setItem(
            "lifeflow-gym-weight-target-v31",
            String(Math.round(target * 10) / 10)
          );
        } else {
          localStorage.removeItem(
            "lifeflow-gym-weight-target-v31"
          );
        }

        saveGymAnalytics();

        modal.classList.remove("open");

        showSiteMessage("Metas atualizadas com sucesso.", "success");

        if (gymFolderView === "root") {
          renderGymFolderRoot();
        }
      });
  }

  function openExerciseEditor(exerciseId) {
    const exercise = getGymExerciseById(exerciseId);
    if (!exercise) return;

    ensureGymProModal();

    const modal = document.getElementById("lfGymProModal");
    const title = document.getElementById("lfGymProModalTitle");
    const kicker = document.getElementById("lfGymProModalKicker");
    const body = document.getElementById("lfGymProModalBody");

    if (!modal || !title || !body || !kicker) return;

    kicker.textContent = "EXERCÍCIO";
    title.textContent = "Editar exercício";

    body.innerHTML = `
      <div class="lf-pro-form-grid">
        <label class="wide">
          <span>Nome</span>
          <input id="lfEditExerciseName" type="text" value="${escapeGymHtml(exercise.name)}">
        </label>

        <label>
          <span>Séries</span>
          <input id="lfEditExerciseSets" type="number" min="1" value="${Number(exercise.sets || 3)}">
        </label>

        <label>
          <span>Repetições</span>
          <input id="lfEditExerciseReps" type="text" value="${escapeGymHtml(exercise.reps || "8–12")}">
        </label>

        <label>
          <span>Carga (kg)</span>
          <input id="lfEditExerciseLoad" type="number" min="0" step="0.5" value="${Number(exercise.load || 0)}">
        </label>

        <label>
          <span>Descanso (s)</span>
          <input id="lfEditExerciseRest" type="number" min="15" step="15" value="${Number(exercise.rest || 60)}">
        </label>

        <label class="wide">
          <span>Foto / link</span>
          <input id="lfEditExerciseImage" type="url" value="${escapeGymHtml(exercise.image || "")}">
        </label>

        <label class="wide">
          <span>Postura</span>
          <textarea id="lfEditExercisePosture" rows="3">${escapeGymHtml(exercise.posture || "")}</textarea>
        </label>

        <label class="wide">
          <span>Como executar</span>
          <textarea id="lfEditExerciseExecution" rows="3">${escapeGymHtml(exercise.execution || "")}</textarea>
        </label>

        <label class="wide">
          <span>Erros a evitar</span>
          <textarea id="lfEditExerciseMistakes" rows="3">${escapeGymHtml(exercise.mistakes || "")}</textarea>
        </label>
      </div>

      <button
        id="lfSaveExerciseEdit"
        class="lf-pro-primary"
        type="button"
      >
        Salvar alterações
      </button>
    `;

    modal.classList.add("open");

    document
      .getElementById("lfSaveExerciseEdit")
      ?.addEventListener("click", () => {
        const name =
          document.getElementById("lfEditExerciseName")?.value.trim();

        if (!name) {
          showSiteMessage("Informe o nome do exercício.", "warning");
          return;
        }

        exercise.name = name;
        exercise.sets =
          Math.max(
            1,
            Number(
              document.getElementById("lfEditExerciseSets")?.value
            ) || 3
          );

        exercise.reps =
          document.getElementById("lfEditExerciseReps")?.value.trim() ||
          "8–12";

        exercise.load =
          Math.max(
            0,
            Number(
              document.getElementById("lfEditExerciseLoad")?.value
            ) || 0
          );

        exercise.rest =
          Math.max(
            15,
            Number(
              document.getElementById("lfEditExerciseRest")?.value
            ) || 60
          );

        exercise.image =
          document.getElementById("lfEditExerciseImage")?.value.trim() || "";

        exercise.posture =
          document.getElementById("lfEditExercisePosture")?.value.trim() || "";

        exercise.execution =
          document.getElementById("lfEditExerciseExecution")?.value.trim() || "";

        exercise.mistakes =
          document.getElementById("lfEditExerciseMistakes")?.value.trim() || "";

        saveGymPrograms();

        modal.classList.remove("open");

        showSiteMessage("Exercício atualizado.", "success");

        gymOpenExerciseId = exercise.id;
        gymFolderView = "exercise";
        renderGymOrganizedPanel();
      });
  }

  function renderGymProDashboardHtml() {
    const week = getGymDateRange(7);
    const currentWeek = getGymWeekCount();
    const previousWeek = getGymWeekCount(7);
    const weeklyGoal = Number(gymAnalytics.weeklyGoal || 4);
    const goalProgress =
      Math.min(
        100,
        Math.round((currentWeek / weeklyGoal) * 100)
      );

    const comparison =
      currentWeek - previousWeek;

    const streak = getGymTrainingStreak();
    const totalSets = getTotalGymSets();
    const perfectDays = gymAnalytics.perfectDays.length;
    const weight = getWeightGoalData();

    return `
      <section class="lf-gym-pro-dashboard">
        <div class="lf-pro-dashboard-head">
          <div>
            <span>SEU PROGRESSO</span>
            <h3>Academia em números</h3>
          </div>

          <button
            id="lfGymGoalsButton"
            type="button"
          >
            ⚙ Metas
          </button>
        </div>

        <div class="lf-pro-hero-grid">
          <div class="lf-pro-goal-card">
            <div class="lf-pro-goal-top">
              <div>
                <span>META SEMANAL</span>
                <strong>${currentWeek}/${weeklyGoal}</strong>
                <small>treinos concluídos</small>
              </div>
              <b>${goalProgress}%</b>
            </div>

            <div class="lf-pro-track">
              <i style="width:${goalProgress}%"></i>
            </div>

            <p>
              ${
                goalProgress >= 100
                  ? "🏆 Meta semanal batida!"
                  : `${Math.max(0, weeklyGoal - currentWeek)} treino(s) para bater a meta.`
              }
            </p>
          </div>

          <div class="lf-pro-mini-card">
            <span>🔥 SEQUÊNCIA</span>
            <strong>${streak}</strong>
            <small>dias seguidos</small>
          </div>
        </div>

        <div class="lf-pro-week-chart">
          ${week.map(item => {
            const label =
              item.date
                .toLocaleDateString(
                  "pt-BR",
                  { weekday: "short" }
                )
                .replace(".", "")
                .slice(0, 3);

            const height =
              item.trained
                ? Math.min(100, 32 + (item.sets * 6))
                : 7;

            return `
              <div>
                <div class="lf-pro-day-track">
                  <i
                    class="${item.perfect ? "perfect" : item.trained ? "trained" : ""}"
                    style="height:${height}%"
                  ></i>
                </div>
                <strong>${item.sets || "—"}</strong>
                <span>${label}</span>
              </div>
            `;
          }).join("")}
        </div>

        <div class="lf-pro-stats-grid">
          <div>
            <span>Treinos totais</span>
            <strong>${gymAnalytics.trainingDays.length}</strong>
          </div>
          <div>
            <span>Séries feitas</span>
            <strong>${totalSets}</strong>
          </div>
          <div>
            <span>Treinos 100%</span>
            <strong>${perfectDays}</strong>
          </div>
          <div>
            <span>Vs. semana passada</span>
            <strong>${comparison > 0 ? "+" : ""}${comparison}</strong>
          </div>
        </div>

        <div class="lf-weight-progress-card">
          <div class="lf-weight-head">
            <div>
              <span>EVOLUÇÃO DE PESO</span>
              <strong>
                ${weight.latest ? `${Number(weight.latest.weight).toLocaleString("pt-BR")} kg` : "Sem registro"}
              </strong>
              <small>
                ${
                  weight.target
                    ? `Meta: ${Number(weight.target).toLocaleString("pt-BR")} kg`
                    : "Defina uma meta se quiser acompanhar"
                }
              </small>
            </div>

            <b>${weight.target ? `${weight.progress}%` : "—"}</b>
          </div>

          <div class="lf-weight-chart">
            ${weightChartSvg(weight.entries)}
          </div>
        </div>

        <div class="lf-pro-achievements">
          <span class="lf-kicker">METAS BATIDAS</span>

          <div>
            <article class="${gymAnalytics.trainingDays.length >= 1 ? "unlocked" : ""}">
              <i>🏋️</i>
              <strong>Primeiro treino</strong>
              <small>Complete 1 treino</small>
            </article>

            <article class="${currentWeek >= weeklyGoal ? "unlocked" : ""}">
              <i>🏆</i>
              <strong>Meta semanal</strong>
              <small>Bata sua meta de treinos</small>
            </article>

            <article class="${streak >= 3 ? "unlocked" : ""}">
              <i>🔥</i>
              <strong>Ritmo forte</strong>
              <small>3 dias de sequência</small>
            </article>

            <article class="${perfectDays >= 5 ? "unlocked" : ""}">
              <i>💎</i>
              <strong>5 treinos perfeitos</strong>
              <small>Finalize 5 treinos 100%</small>
            </article>
          </div>
        </div>
      </section>
    `;
  }

  function injectGymProStyles() {
    if (document.getElementById("lifeflowGymProStyles")) return;

    ensureGymProModal();

    const style = document.createElement("style");
    style.id = "lifeflowGymProStyles";

    style.textContent = `
      .lf-gym-pro-dashboard {
        display: grid;
        gap: 11px;
        margin: 12px 0 18px;
      }

      .lf-pro-dashboard-head,
      .lf-pro-goal-top,
      .lf-weight-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .lf-pro-dashboard-head > div > span,
      .lf-pro-goal-card span,
      .lf-pro-mini-card span,
      .lf-weight-head span {
        display: block;
        color: #6f7478;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .8px;
      }

      .lf-pro-dashboard-head h3 {
        margin: 4px 0 0;
        color: #f0f1f1;
        font-size: 17px;
      }

      .lf-pro-dashboard-head button {
        min-height: 38px;
        border: 1px solid rgba(100,231,155,.16);
        border-radius: 11px;
        background: rgba(100,231,155,.06);
        color: #74eaaa;
        padding: 0 11px;
        font-size: 8px;
        font-weight: 900;
      }

      .lf-pro-hero-grid {
        display: grid;
        grid-template-columns: 1.6fr .7fr;
        gap: 9px;
      }

      .lf-pro-goal-card,
      .lf-pro-mini-card,
      .lf-weight-progress-card,
      .lf-pro-achievements {
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 17px;
        background:
          radial-gradient(circle at 90% 0%, rgba(100,231,155,.06), transparent 34%),
          #0e0f11;
      }

      .lf-pro-goal-card {
        padding: 13px;
      }

      .lf-pro-goal-card strong {
        display: block;
        margin-top: 4px;
        color: #f2f2f3;
        font-size: 24px;
      }

      .lf-pro-goal-card small,
      .lf-pro-mini-card small,
      .lf-weight-head small {
        display: block;
        margin-top: 2px;
        color: #707479;
        font-size: 8px;
      }

      .lf-pro-goal-top > b {
        color: #72e8a8;
        font-size: 15px;
      }

      .lf-pro-track {
        height: 6px;
        overflow: hidden;
        margin-top: 10px;
        border-radius: 999px;
        background: rgba(255,255,255,.05);
      }

      .lf-pro-track i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #3fa976, #72e8a8);
      }

      .lf-pro-goal-card p {
        margin: 8px 0 0;
        color: #777b80;
        font-size: 8px;
      }

      .lf-pro-mini-card {
        display: grid;
        align-content: center;
        padding: 13px;
        text-align: center;
      }

      .lf-pro-mini-card strong {
        margin-top: 4px;
        color: #f2f2f3;
        font-size: 31px;
      }

      .lf-pro-week-chart {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
        height: 150px;
        padding: 12px 10px 8px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 17px;
        background: #0e0f11;
      }

      .lf-pro-week-chart > div {
        min-width: 0;
        display: grid;
        grid-template-rows: 1fr auto auto;
        gap: 4px;
        text-align: center;
      }

      .lf-pro-day-track {
        position: relative;
        overflow: hidden;
        min-height: 90px;
        border-radius: 9px;
        background: rgba(255,255,255,.035);
      }

      .lf-pro-day-track i {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 9px;
        background: rgba(255,255,255,.07);
      }

      .lf-pro-day-track i.trained {
        background: linear-gradient(180deg, #65dfa0, #2d8d61);
      }

      .lf-pro-day-track i.perfect {
        background: linear-gradient(180deg, #e4c778, #b48a36);
      }

      .lf-pro-week-chart strong {
        color: #a8abad;
        font-size: 7px;
      }

      .lf-pro-week-chart span {
        color: #666a6f;
        font-size: 7px;
        text-transform: uppercase;
      }

      .lf-pro-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
      }

      .lf-pro-stats-grid > div {
        min-width: 0;
        padding: 9px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 13px;
        background: rgba(255,255,255,.018);
      }

      .lf-pro-stats-grid span {
        display: block;
        color: #666a70;
        font-size: 6px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .lf-pro-stats-grid strong {
        display: block;
        margin-top: 3px;
        color: #e4e5e6;
        font-size: 13px;
      }

      .lf-weight-progress-card {
        padding: 13px;
      }

      .lf-weight-head strong {
        display: block;
        margin-top: 4px;
        color: #ededee;
        font-size: 18px;
      }

      .lf-weight-head > b {
        color: #72e8a8;
        font-size: 15px;
      }

      .lf-weight-chart {
        position: relative;
        height: 105px;
        margin-top: 10px;
        overflow: hidden;
        border-radius: 12px;
        background:
          linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px);
        background-size: 100% 25%;
        color: #72e8a8;
      }

      .lf-weight-chart-svg {
        width: 100%;
        height: 100%;
      }

      .lf-gym-chart-empty {
        height: 100%;
        display: grid;
        place-items: center;
        padding: 12px;
        color: #676b70;
        font-size: 8px;
        text-align: center;
      }

      .lf-pro-achievements {
        padding: 13px;
      }

      .lf-pro-achievements > div {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 7px;
        margin-top: 9px;
      }

      .lf-pro-achievements article {
        padding: 10px;
        border: 1px solid rgba(255,255,255,.05);
        border-radius: 12px;
        opacity: .42;
        background: rgba(255,255,255,.015);
      }

      .lf-pro-achievements article.unlocked {
        opacity: 1;
        border-color: rgba(100,231,155,.13);
        background: rgba(100,231,155,.035);
      }

      .lf-pro-achievements i {
        font-style: normal;
        font-size: 18px;
      }

      .lf-pro-achievements strong,
      .lf-pro-achievements small {
        display: block;
      }

      .lf-pro-achievements strong {
        margin-top: 5px;
        color: #dcddde;
        font-size: 9px;
      }

      .lf-pro-achievements small {
        margin-top: 2px;
        color: #676b70;
        font-size: 7px;
      }

      .lf-gym-pro-modal {
        position: fixed;
        inset: 0;
        z-index: 12000;
        display: grid;
        place-items: end center;
        padding: 16px;
        box-sizing: border-box;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: .22s ease;
      }

      .lf-gym-pro-modal.open {
        opacity: 1;
        visibility: visible;
      }

      .lf-gym-pro-modal-card {
        width: min(100%, 520px);
        max-height: 88dvh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 23px;
        background: #0d0f10;
        box-shadow: 0 28px 90px rgba(0,0,0,.65);
        padding: 16px;
      }

      .lf-gym-pro-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 13px;
      }

      .lf-gym-pro-modal-head span {
        color: #72e8a8;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .lf-gym-pro-modal-head h3 {
        margin: 3px 0 0;
        color: #f0f0f1;
        font-size: 18px;
      }

      .lf-gym-pro-modal-head button {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 12px;
        background: #141617;
        color: #c6c8c9;
        font-size: 22px;
      }

      .lf-pro-form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 9px;
      }

      .lf-pro-form-grid label.wide {
        grid-column: 1 / -1;
      }

      .lf-pro-form-grid span {
        display: block;
        color: #72767a;
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .lf-pro-form-grid input,
      .lf-pro-form-grid textarea {
        box-sizing: border-box;
        width: 100%;
        margin-top: 5px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        outline: none;
        background: #121415;
        color: #ededee;
        padding: 11px;
        font: inherit;
        font-size: 12px;
      }

      .lf-pro-form-grid textarea {
        resize: vertical;
      }

      .lf-pro-primary {
        width: 100%;
        min-height: 49px;
        margin-top: 12px;
        border: 1px solid rgba(100,231,155,.2);
        border-radius: 13px;
        background: rgba(100,231,155,.09);
        color: #72e8a8;
        font-size: 10px;
        font-weight: 950;
      }

      .lf-pro-helper {
        margin: 8px 2px 0;
        color: #62666b;
        font-size: 8px;
        line-height: 1.5;
      }

      .lf-edit-exercise-button {
        width: 100%;
        min-height: 46px;
        margin-top: 9px;
        border: 1px solid rgba(106,167,255,.16);
        border-radius: 12px;
        background: rgba(106,167,255,.055);
        color: #9ebfff;
        font-size: 9px;
        font-weight: 900;
      }

      @media (max-width: 520px) {
        .lf-pro-hero-grid {
          grid-template-columns: 1fr .65fr;
        }

        .lf-pro-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .lf-pro-week-chart {
          gap: 4px;
          height: 145px;
        }

        .lf-gym-pro-modal {
          padding: 8px;
        }

        .lf-gym-pro-modal-card {
          width: 100%;
          max-height: 92dvh;
          border-radius: 22px 22px 14px 14px;
        }

        .lf-pro-form-grid {
          grid-template-columns: 1fr;
        }

        .lf-pro-form-grid label.wide {
          grid-column: auto;
        }

        .lf-pro-form-grid input,
        .lf-pro-form-grid textarea {
          font-size: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // =====================================================
  // LIFEFLOW 2.9 — SMART DRAWER + ACADEMIA EM PASTAS
  // Layout inspirado no mockup aprovado pelo usuário
  // =====================================================

  let gymFolderView = "root";
  let gymOpenExerciseId = null;

  function setupSmartDrawer() {
    if (document.getElementById("lifeflowDrawer")) return;

    const drawerOverlay = document.createElement("div");
    drawerOverlay.id = "lifeflowDrawerOverlay";
    drawerOverlay.className = "lf-drawer-overlay";

    const drawer = document.createElement("aside");
    drawer.id = "lifeflowDrawer";
    drawer.className = "lf-drawer";

    drawer.innerHTML = `
      <div class="lf-drawer-head lf63-head">
        <div class="lf63-brand">
          <span>MENU</span>
          <strong>Life<span>Flow</span></strong>
          <div class="lf63-os">
            <b>INTELLIGENCE OS</b>
            <i></i>
          </div>
        </div>

        <button id="lfDrawerClose" class="lf63-close" type="button" aria-label="Fechar menu">×</button>
      </div>

      <button id="lf63Profile" class="lf63-profile" type="button">
        <div class="lf63-avatar">LF</div>

        <div class="lf63-profile-copy">
          <strong>Meu perfil</strong>
          <span>Minha evolução, minha rotina.</span>
        </div>

        <b class="lf63-chevron">›</b>

        <div class="lf63-level">
          <span>NÍVEL ATIVO</span>
          <i><em></em></i>
          <small>EVOLUÇÃO</small>
        </div>
      </button>

      <div class="lf-drawer-nav lf63-nav">

        <button class="lf-drawer-item lf63-item active" data-drawer-go="home">
          <span class="lf63-icon">⌂</span>
          <strong>Início</strong>
          <b>›</b>
        </button>

        <div class="lf-drawer-group lf63-gym-card">
          <button class="lf-drawer-item lf-drawer-parent lf63-item" id="lfGymGroupButton" type="button">
            <span class="lf63-icon">◫</span>
            <strong>Academia</strong>
            <b class="lf63-gym-arrow">⌃</b>
          </button>

          <div class="lf-drawer-submenu lf63-submenu" id="lfGymSubmenu">
            ${gymPrograms.plans.map((plan, idx) => `
              <button type="button" data-drawer-plan="${escapeGymHtml(plan.id)}">
                <span>${idx === 0 ? "⌁" : "•"}</span>
                <strong>${escapeGymHtml(plan.name)}</strong>
              </button>
            `).join("")}

            <button type="button" data-drawer-go="gym">
              <span>▦</span>
              <strong>Meus Treinos</strong>
            </button>
          </div>
        </div>

        <button class="lf-drawer-item lf63-item lf63-sleep" data-drawer-go="sleep">
          <span class="lf63-icon">☾</span>
          <strong>Sono</strong>
          <b>›</b>
        </button>

        <button class="lf-drawer-item lf63-item lf63-study" data-drawer-go="study">
          <span class="lf63-icon">▣</span>
          <strong>Estudos</strong>
          <b>›</b>
        </button>

        <button class="lf-drawer-item lf63-item lf63-agenda" data-drawer-go="agenda">
          <span class="lf63-icon">▦</span>
          <strong>Agenda</strong>
          <b>›</b>
        </button>

        <button class="lf-drawer-item lf63-item lf63-progress" data-drawer-go="progress">
          <span class="lf63-icon">↗</span>
          <strong>Progresso</strong>
          <b>›</b>
        </button>

      </div>

      <div class="lf63-motivation">
        <span class="lf63-motivation-icon">↗</span>

        <div>
          <strong>Disciplina hoje, resultado sempre.</strong>
          <small>Você no controle da sua melhor versão.</small>
        </div>

        <b>›</b>
      </div>

      <div class="lf63-signature">
        LIFEFLOW // INTELLIGENCE OS
      </div>
    `;

    // LifeFlow 6.3.1: remove perfil antigo/duplicado do drawer.
    const legacyProfileCandidates = [
      drawer.querySelector("#lf40ProfileDrawer"),
      drawer.querySelector(".drawer-profile"),
      drawer.querySelector(".profile-card"),
      ...drawer.querySelectorAll('[data-life-module="profile"], [data-screen="profile"]')
    ].filter(Boolean);

    legacyProfileCandidates.forEach(node => {
      if (node.id !== "lf63Profile" && !node.classList.contains("lf63-profile")) {
        node.remove();
      }
    });

    // Fallback textual: remove somente cards antigos com "Meu perfil"
    // que não sejam o novo card premium.
    [...drawer.querySelectorAll("button,a,div")].forEach(node => {
      if (
        node !== drawer &&
        !node.classList.contains("lf63-profile") &&
        !node.closest(".lf63-profile") &&
        /meu perfil/i.test((node.textContent || "").trim()) &&
        node.children.length <= 4
      ) {
        const isLegacyProfile =
          node.classList.contains("lf-drawer-item") ||
          node.classList.contains("drawer-profile") ||
          node.classList.contains("profile-card") ||
          node.id === "lf40ProfileDrawer";
        if (isLegacyProfile) node.remove();
      }
    });


    const edgeHandle = document.createElement("button");
    edgeHandle.id = "lfDrawerHandle";
    edgeHandle.className = "lf-drawer-handle";
    edgeHandle.type = "button";
    edgeHandle.setAttribute("aria-label", "Abrir menu lateral");
    edgeHandle.innerHTML = `<span>‹</span>`;

    document.body.appendChild(drawerOverlay);
    document.body.appendChild(drawer);
    document.body.appendChild(edgeHandle);

    const openDrawer = () => {
      drawer.classList.add("open");
      drawerOverlay.classList.add("open");
      edgeHandle.classList.add("hidden-handle");
      document.body.classList.add("lf-drawer-open");
    };

    const closeDrawer = () => {
      drawer.classList.remove("open");
      drawerOverlay.classList.remove("open");
      edgeHandle.classList.remove("hidden-handle");
      document.body.classList.remove("lf-drawer-open");
    };

    window.openLifeFlowDrawer = openDrawer;
    window.closeLifeFlowDrawer = closeDrawer;

    edgeHandle.addEventListener("click", openDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);
    document.getElementById("lfDrawerClose")?.addEventListener("click", closeDrawer);

    document.getElementById("lf63Profile")?.addEventListener("click", () => {
      showLifeSettings();
      closeDrawer();
    });

    document
      .getElementById("lfGymGroupButton")
      ?.addEventListener("click", () => {
        document
          .getElementById("lfGymSubmenu")
          ?.classList.toggle("collapsed");
      });

    document
      .querySelectorAll("[data-drawer-go]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const go = button.dataset.drawerGo;

          if (go === "home") showHome();
          if (go === "agenda") showAgenda();
          if (go === "study") showStudy();
          if (go === "sleep") showSleep();
          if (go === "gym") showGymRoot();
          if (go === "progress") showProgress();

          closeDrawer();
        });
      });

    document
      .querySelectorAll("[data-drawer-plan]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const planId = button.dataset.drawerPlan;

          if (
            gymPrograms.plans.some(plan => plan.id === planId)
          ) {
            gymPrograms.activePlanId = planId;
            saveGymPrograms();
          }

          showGymPlan(planId);
          closeDrawer();
        });
      });

    // Swipe from the right edge to open; swipe right to close.
    let touchStartX = null;
    let touchStartY = null;

    document.addEventListener(
      "touchstart",
      event => {
        const touch = event.touches?.[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      event => {
        if (touchStartX === null) return;

        const touch = event.changedTouches?.[0];
        if (!touch) return;

        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const width = window.innerWidth;

        if (
          Math.abs(dx) > 55 &&
          Math.abs(dx) > Math.abs(dy)
        ) {
          // Start near right edge and swipe left.
          if (
            touchStartX > width - 70 &&
            dx < -55
          ) {
            openDrawer();
          }

          // Drawer open and swipe right.
          if (
            drawer.classList.contains("open") &&
            dx > 55
          ) {
            closeDrawer();
          }
        }

        touchStartX = null;
        touchStartY = null;
      },
      { passive: true }
    );
  }

  function showGymRoot() {
    gymStatsStandalone = false;
    gymFolderView = "root";
    gymOpenExerciseId = null;
    showGym();
  }

  function showGymPlan(planId) {
    const plan =
      gymPrograms.plans.find(item => item.id === planId);

    if (plan) {
      gymPrograms.activePlanId = plan.id;
      saveGymPrograms();
    }

    gymFolderView = "plan";
    gymOpenExerciseId = null;

    showGym();
  }

  function showGymExercise(exerciseId) {
    gymOpenExerciseId = exerciseId;
    gymFolderView = "exercise";
    showGym();
  }

  function getGymExerciseById(exerciseId) {
    const plan = getActiveGymPlan();
    return plan?.exercises.find(
      exercise => exercise.id === exerciseId
    ) || null;
  }

  function getGymPlanFolderIcon(plan) {
    return "📁";
  }

  function renderGymFolderRoot() {
    const screen = document.getElementById("gymScreen");
    if (!screen) return;

    const now = new Date();
    const todayGym = getTodayGym();
    const activePlan = getActiveGymPlan();

    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0,0,0,0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDays.push(d);
    }

    const trainedDates = Object.values(gymHistory)
      .filter(item => item?.completed && item?.date)
      .map(item => item.date);

    const trainedThisWeek = weekDays.filter(d =>
      trainedDates.includes(getDateKey(d))
    ).length;

    const weeklyGoal = 5;
    const goalPct = Math.min(
      100,
      Math.round((trainedThisWeek / weeklyGoal) * 100)
    );

    const greeting =
      now.getHours() < 12
        ? "Bom dia"
        : now.getHours() < 18
          ? "Boa tarde"
          : "Boa noite";

    const displayName =
      lfProfile?.name?.trim()
        ? lfProfile.name.trim().split(" ")[0]
        : "Atleta";

    const lastCompleted = Object.values(gymHistory)
      .filter(item => item?.completed)
      .sort((a,b) => String(b.date).localeCompare(String(a.date)))[0];

    const streak = typeof getGymStreak === "function"
      ? getGymStreak()
      : 0;

    screen.innerHTML = `
      <section class="lf-pro-gym-hero">
        <div class="lf-pro-gym-hero-copy">
          <span class="lf-pro-eyebrow">ACADEMIA</span>
          <h2>${greeting}, <b>${escapeGymHtml(displayName)}</b>.</h2>
          <p>Seu treino organizado. Sem distração, só consistência.</p>
        </div>

        <button id="lfProGymProfile" class="lf-pro-gym-avatar" type="button" aria-label="Abrir perfil">
          ${
            lfProfile?.photo
              ? `<img src="${lfProfile.photo}" alt="">`
              : `<span>${escapeGymHtml(displayName.charAt(0).toUpperCase())}</span>`
          }
        </button>
      </section>

      <section class="lf-pro-week-card">
        <div class="lf-pro-week-head">
          <div>
            <span>SEMANA ATUAL</span>
            <strong>${trainedThisWeek}/${weeklyGoal} treinos</strong>
          </div>
          <b>${goalPct}%</b>
        </div>

        <div class="lf-pro-week-progress">
          <i style="width:${goalPct}%"></i>
        </div>

        <div class="lf-pro-week-days">
          ${weekDays.map(d => {
            const key = getDateKey(d);
            const done = trainedDates.includes(key);
            const today = isSameDay(d, now);
            return `
              <div class="lf-pro-day ${today ? "today" : ""} ${done ? "done" : ""}">
                <span>${d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","").slice(0,3)}</span>
                <strong>${String(d.getDate()).padStart(2,"0")}</strong>
                <i>${done ? "✓" : ""}</i>
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <section class="lf-pro-today-card ${todayGym.completed ? "done" : ""}">
        <div class="lf-pro-today-glow"></div>

        <div class="lf-pro-today-top">
          <span class="lf-pro-pill">${todayGym.completed ? "CONCLUÍDO" : "TREINO DO DIA"}</span>
          <span class="lf-pro-more">•••</span>
        </div>

        <div class="lf-pro-today-body">
          <div>
            <small>FOCO PRINCIPAL</small>
            <h3>${escapeGymHtml(activePlan?.name || "Sem treino definido")}</h3>
            <p>${escapeGymHtml(activePlan?.focus || "Defina os grupos musculares do treino")}</p>
          </div>

          <div class="lf-pro-today-ring" style="--p:${todayGym.completed ? 100 : goalPct}">
            <span>${todayGym.completed ? "✓" : `${goalPct}%`}</span>
          </div>
        </div>

        <button id="lfProOpenToday" type="button">
          <span>${todayGym.completed ? "Ver treino concluído" : "Abrir treino"}</span>
          <b>→</b>
        </button>
      </section>

      <section class="lf-pro-section">
        <div class="lf-pro-section-head">
          <div>
            <span class="lf-pro-eyebrow">DIVISÃO DE TREINO</span>
            <h3>Meus treinos</h3>
          </div>
          <button id="lfProNewPlan" type="button">＋ Adicionar</button>
        </div>

        <div class="lf-pro-plan-grid">
          ${gymPrograms.plans.map((plan, index) => {
            const isActive = plan.id === gymPrograms.activePlanId;
            const letter = (plan.name || `Treino ${index+1}`)
              .replace(/treino/ig,"")
              .trim()
              .slice(0,2)
              .toUpperCase() || String.fromCharCode(65+index);

            return `
              <button class="lf-pro-plan-card ${isActive ? "active" : ""}"
                      type="button"
                      data-pro-plan="${escapeGymHtml(plan.id)}">
                <div class="lf-pro-plan-top">
                  <span>${escapeGymHtml(letter)}</span>
                  <i>${isActive ? "HOJE" : "›"}</i>
                </div>

                <strong>${escapeGymHtml(plan.name)}</strong>
                <p>${escapeGymHtml(plan.focus || "Grupos musculares não definidos")}</p>

                <div class="lf-pro-plan-footer">
                  <small>${plan.exercises?.length || 0} itens internos</small>
                  <b>ABRIR</b>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </section>

      <section class="lf-pro-stats">
        <article>
          <span>✓</span>
          <div>
            <strong>${trainedThisWeek}</strong>
            <small>treinos na semana</small>
          </div>
        </article>

        <article>
          <span>⚡</span>
          <div>
            <strong>${streak}</strong>
            <small>dias de sequência</small>
          </div>
        </article>

        <article>
          <span>◷</span>
          <div>
            <strong>${lastCompleted?.date ? lastCompleted.date.split("-").reverse().slice(0,2).join("/") : "—"}</strong>
            <small>último treino</small>
          </div>
        </article>
      </section>
    `;

    document.querySelectorAll("[data-pro-plan]").forEach(button => {
      button.addEventListener("click", () => showGymPlan(button.dataset.proPlan));
    });

    document.getElementById("lfProOpenToday")?.addEventListener("click", () => {
      if (activePlan) showGymPlan(activePlan.id);
    });

    document.getElementById("lfProNewPlan")?.addEventListener("click", createGymPlan);

    document.getElementById("lfProGymProfile")?.addEventListener("click", () => {
      if (typeof showLifeSettings === "function") showLifeSettings();
    });
  }

  function renderGymPlanFolder() {
    const screen = document.getElementById("gymScreen");
    const plan = getActiveGymPlan();
    if (!screen || !plan) return;

    const todayGym = getTodayGym();
    const completed = Boolean(todayGym.completed && todayGym.planId === plan.id);

    const muscles = String(plan.focus || "")
      .split(/[•,;]+/)
      .map(item => item.trim())
      .filter(Boolean);

    screen.innerHTML = `
      <section class="lf-pro-detail-hero">
        <div class="lf-pro-detail-nav">
          <button id="lfBackGymRoot" type="button" aria-label="Voltar">‹</button>
          <span>${completed ? "TREINO CONCLUÍDO" : "PLANEJAMENTO"}</span>
          <button id="lfProEditPlan" type="button">Editar</button>
        </div>

        <div class="lf-pro-detail-title">
          <span class="lf-pro-eyebrow">MEU TREINO</span>
          <h2>${escapeGymHtml(plan.name)}</h2>
          <p>${escapeGymHtml(plan.focus || "Defina os grupos musculares")}</p>
        </div>

        <div class="lf-pro-detail-status ${completed ? "done" : ""}">
          <span>${completed ? "✓" : "◎"}</span>
          <div>
            <strong>${completed ? "Finalizado hoje" : "Planejado para hoje"}</strong>
            <small>${completed ? "Seu treino já foi registrado no LifeFlow." : "Marque como concluído quando terminar no seu app de academia."}</small>
          </div>
        </div>
      </section>

      <section class="lf-pro-muscles-card">
        <div class="lf-pro-section-head compact">
          <div>
            <span class="lf-pro-eyebrow">GRUPOS MUSCULARES</span>
            <h3>Partes que vou treinar</h3>
          </div>
          <b>${muscles.length}</b>
        </div>

        <div class="lf-pro-muscle-list">
          ${muscles.length ? muscles.map((muscle, index) => `
            <article class="lf-pro-muscle-item ${completed ? "done" : ""}">
              <span>${completed ? "✓" : String(index + 1).padStart(2,"0")}</span>
              <div>
                <strong>${escapeGymHtml(muscle)}</strong>
                <small>${completed ? "Treinado hoje" : "Planejado"}</small>
              </div>
              <i>${completed ? "CONCLUÍDO" : "HOJE"}</i>
            </article>
          `).join("") : `
            <div class="lf-pro-empty">
              <span>＋</span>
              <strong>Nenhum grupo definido</strong>
              <small>Toque em Editar para adicionar as partes do corpo.</small>
            </div>
          `}
        </div>
      </section>

      <section class="lf-pro-info-card">
        <span>LF</span>
        <div>
          <strong>LifeFlow organiza. Seu app executa.</strong>
          <p>Exercícios, séries, cargas, vídeos e cronômetro ficam no seu aplicativo de academia. Aqui você controla sua rotina e frequência.</p>
        </div>
      </section>

      <button id="lfProCompleteWorkout"
              class="lf-pro-complete-btn ${completed ? "done" : ""}"
              type="button">
        <span>${completed ? "✓" : "○"}</span>
        <strong>${completed ? "Treino concluído hoje" : "Marcar treino como concluído"}</strong>
      </button>

      <button id="lfProDeletePlan" class="lf-pro-delete-btn" type="button">
        Excluir treino
      </button>
    `;

    document.getElementById("lfBackGymRoot")?.addEventListener("click", showGymRoot);

    document.getElementById("lfProCompleteWorkout")?.addEventListener("click", () => {
      saveTodayGym({
        completed: !completed,
        planId: plan.id,
        planName: plan.name,
        focus: plan.focus
      });

      showSiteMessage(
        !completed ? "Treino marcado como concluído. ✓" : "Conclusão removida.",
        "success"
      );

      renderGymPlanFolder();
    });

    document.getElementById("lfProEditPlan")?.addEventListener("click", () => {
      showSitePrompt("Nome do treino:", plan.name, newName => {
        plan.name = newName;
        saveGymPrograms();

        showSitePrompt(
          "Partes que serão treinadas. Ex.: Peito • Ombro • Tríceps",
          plan.focus || "",
          newFocus => {
            plan.focus = newFocus;
            saveGymPrograms();
            showSiteMessage("Treino atualizado.", "success");
            renderGymPlanFolder();
          }
        );
      });
    });

    document.getElementById("lfProDeletePlan")?.addEventListener("click", deleteActiveGymPlan);
  }

  function renderGymExerciseDetail() {
    const screen = document.getElementById("gymScreen");
    const exercise = getGymExerciseById(gymOpenExerciseId);
    const plan = getActiveGymPlan();

    if (!screen || !exercise || !plan) {
      showGymPlan(plan?.id);
      return;
    }

    const progress = getGymSessionProgress();
    const completedSets =
      Number(progress[exercise.id] || 0);

    screen.innerHTML = `
      <div class="lf-detail-header">
        <button
          type="button"
          class="lf-back-btn"
          id="lfBackGymPlan"
        >‹</button>

        <div class="lf-ex-title-head">
          <h2>${escapeGymHtml(exercise.name)}</h2>
          <span>${escapeGymHtml(plan.name)}</span>
        </div>

        <button
          type="button"
          class="lf-more-btn"
          id="lfExerciseMore"
        >⋮</button>
      </div>

      <div class="lf-gym-tabs lf-detail-tabs">
        <button class="active" type="button">EXECUÇÃO</button>
        <button type="button" id="lfMusclesTab">MÚSCULOS</button>
        <button type="button" id="lfExerciseHistoryTab">HISTÓRICO</button>
      </div>

      <section class="lf-exercise-hero">
        <div class="lf-exercise-big-media">
          ${
            exercise.image
              ? `<img src="${escapeGymHtml(exercise.image)}" alt="${escapeGymHtml(exercise.name)} início">`
              : `<div class="lf-big-placeholder">🏋️</div>`
          }

          ${
            exercise.image2
              ? `<img src="${escapeGymHtml(exercise.image2)}" alt="${escapeGymHtml(exercise.name)} final">`
              : ""
          }
        </div>
      </section>

      <section class="lf-guidance-card">
        <span class="lf-kicker">COMO EXECUTAR</span>

        <div class="lf-guidance-list">
          <div><i>✓</i><p>${escapeGymHtml(exercise.posture || "Mantenha postura estável e confortável.")}</p></div>
          <div><i>✓</i><p>${escapeGymHtml(exercise.execution || "Execute o movimento de forma controlada.")}</p></div>
        </div>

        <span class="lf-kicker lf-tip-title">DICAS</span>

        <div class="lf-guidance-list">
          <div><i>✓</i><p>Use uma carga que permita manter a técnica.</p></div>
          <div><i>✓</i><p>Controle a descida e evite impulso.</p></div>
          <div><i>✓</i><p>${escapeGymHtml(exercise.mistakes || "Evite compensações e dor incomum.")}</p></div>
        </div>
      </section>

      <section class="lf-exercise-prescription">
        <div><span>SÉRIES</span><strong>${completedSets}/${exercise.sets}</strong></div>
        <div><span>REPS</span><strong>${escapeGymHtml(exercise.reps)}</strong></div>
        <div><span>DESCANSO</span><strong>${exercise.rest}s</strong></div>
      </section>

      ${renderExercisePerformanceHtml(exercise.id)}

      <button
        id="lfEditExerciseButton"
        class="lf-edit-exercise-button"
        type="button"
      >
        ✎ Editar exercício
      </button>

      <section class="lf-exercise-action">
        <button
          type="button"
          id="lfCompleteSet"
        >
          ▶ ${completedSets >= exercise.sets ? "Reiniciar exercício" : "Concluir série"}
        </button>

        <div class="lf-rest-inline">
          <span>Descanso</span>
          <strong id="gymRestTimer">${formatTimer(restRemaining)}</strong>
          <button id="lfRestPlus" type="button">+15s</button>
        </div>
      </section>
    `;

    document
      .getElementById("lfBackGymPlan")
      ?.addEventListener("click", () => {
        showGymPlan(plan.id);
      });

    document
      .getElementById("lfEditExerciseButton")
      ?.addEventListener("click", () => {
        openExerciseEditor(exercise.id);
      });

    document
      .getElementById("lfCompleteSet")
      ?.addEventListener("click", () => {
        completeGymSet(exercise.id);

        gymOpenExerciseId = exercise.id;
        gymFolderView = "exercise";
        renderGymOrganizedPanel();
      });

    document
      .getElementById("lfRestPlus")
      ?.addEventListener("click", () => {
        addRestTime(15);
      });

    document
      .getElementById("lfMusclesTab")
      ?.addEventListener("click", () => {
        const muscle =
          exercise.primaryMuscle
            ? gymLabelMuscle(exercise.primaryMuscle)
            : "Grupo muscular principal";
        showSiteMessage(`${exercise.name}: ${muscle}.`, "info");
      });

    document
      .getElementById("lfExerciseHistoryTab")
      ?.addEventListener("click", () => {
        showSiteMessage("Histórico de carga deste exercício entra na próxima evolução.", "info");
      });

    document
      .getElementById("lfExerciseMore")
      ?.addEventListener("click", () => {
        deleteGymExercise(exercise.id);
        showGymPlan(plan.id);
      });

    updateRestTimerDisplay();
  }

  function renderGymLibraryOrganized() {
    const screen = document.getElementById("gymScreen");
    if (!screen) return;

    screen.innerHTML = `
      <div class="lf-detail-header">
        <button
          type="button"
          class="lf-back-btn"
          id="lfBackLibrary"
        >‹</button>

        <div>
          <h2>Exercícios</h2>
          <span>Biblioteca visual</span>
        </div>

        <button
          type="button"
          class="lf-more-btn"
          onclick="window.openLifeFlowDrawer?.()"
        >☰</button>
      </div>

      <section
        id="gymExerciseLibrarySection"
        class="gym-library-section lf-library-clean"
      >
        <div class="gym-library-heading">
          <div>
            <span>BIBLIOTECA VISUAL</span>
            <h3>Todos os exercícios</h3>
            <p>Pesquise e adicione ao ${escapeGymHtml(getActiveGymPlan()?.name || "treino")}.</p>
          </div>

          <strong id="gymLibraryCount">Carregando...</strong>
        </div>

        <div class="gym-library-filters">
          <input
            id="gymLibrarySearch"
            type="search"
            placeholder="Buscar exercício, músculo..."
            autocomplete="off"
          >

          <select id="gymLibraryMuscle">
            <option value="">Todos os músculos</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("primaryMuscles")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelMuscle(value))}
                      </option>
                    `).join("")
                : ""
            }
          </select>

          <select id="gymLibraryEquipment">
            <option value="">Todos os equipamentos</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("equipment")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelEquipment(value))}
                      </option>
                    `).join("")
                : ""
            }
          </select>

          <select id="gymLibraryCategory">
            <option value="">Todas as categorias</option>
            ${
              gymLibraryLoaded
                ? getGymLibraryUnique("category")
                    .map(value => `
                      <option value="${escapeGymHtml(value)}">
                        ${escapeGymHtml(gymLabelCategory(value))}
                      </option>
                    `).join("")
                : ""
            }
          </select>
        </div>

        <div id="gymLibraryResults" class="gym-library-results">
          <div class="gym-library-status">
            <span>⏳</span>
            <strong>Carregando biblioteca...</strong>
          </div>
        </div>
      </section>
    `;

    document
      .getElementById("lfBackLibrary")
      ?.addEventListener("click", showGymRoot);

    setupGymLibraryControls();

    if (!gymLibraryLoaded) {
      loadGymExerciseLibrary();
    } else {
      renderGymLibrary();
    }
  }

  function renderGymOrganizedPanel() {
    if (gymFolderView === "root") {
      renderGymFolderRoot();
      return;
    }

    if (gymFolderView === "plan") {
      renderGymPlanFolder();
      return;
    }

    if (gymFolderView === "exercise") {
      renderGymExerciseDetail();
      return;
    }

    if (gymFolderView === "library") {
      renderGymLibraryOrganized();
      return;
    }

    renderGymFolderRoot();
  }

  function injectOrganizedLayoutStyles() {
    if (document.getElementById("lifeflowOrganizedStyles")) return;

    const style = document.createElement("style");
    style.id = "lifeflowOrganizedStyles";

    style.textContent = `
      :root {
        --lf-accent: #64e79b;
        --lf-card: #0d0e10;
        --lf-card-2: #121316;
        --lf-line: rgba(255,255,255,.075);
      }

      .lf-drawer-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0,0,0,.62);
        backdrop-filter: blur(5px);
        opacity: 0;
        visibility: hidden;
        transition: opacity .24s ease, visibility .24s ease;
      }

      .lf-drawer-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      .lf-drawer {
        position: fixed;
        z-index: 10001;
        top: 0;
        right: 0;
        width: min(84vw, 360px);
        height: 100dvh;
        padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
        box-sizing: border-box;
        border-left: 1px solid rgba(255,255,255,.08);
        background:
          radial-gradient(circle at 80% 0%, rgba(100,231,155,.055), transparent 28%),
          #0c0d0f;
        box-shadow: -30px 0 80px rgba(0,0,0,.65);
        transform: translateX(103%);
        transition: transform .3s cubic-bezier(.22,.9,.3,1);
        overflow-y: auto;
      }

      .lf-drawer.open {
        transform: translateX(0);
      }

      .lf-drawer-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 54px;
        padding: 0 4px 14px;
        border-bottom: 1px solid var(--lf-line);
      }

      .lf-drawer-head span {
        display: block;
        color: #777b80;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.2px;
      }

      .lf-drawer-head strong {
        display: block;
        margin-top: 3px;
        color: #f3f3f3;
        font-size: 18px;
      }

      .lf-drawer-head button,
      .lf-icon-btn,
      .lf-back-btn,
      .lf-more-btn {
        display: grid;
        place-items: center;
        border: 1px solid var(--lf-line);
        background: rgba(255,255,255,.025);
        color: #dadbdd;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lf-drawer-head button {
        width: 42px;
        height: 42px;
        border-radius: 13px;
        font-size: 25px;
      }

      .lf-drawer-nav {
        display: grid;
        gap: 7px;
        margin-top: 15px;
      }

      .lf-drawer-item {
        width: 100%;
        min-height: 52px;
        display: grid;
        grid-template-columns: 30px 1fr auto;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 14px;
        background: transparent;
        color: #d3d4d6;
        padding: 0 12px;
        text-align: left;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lf-drawer-item.active {
        background: rgba(100,231,155,.075);
        color: var(--lf-accent);
      }

      .lf-drawer-item > span {
        font-size: 19px;
      }

      .lf-drawer-item strong {
        font-size: 13px;
        font-weight: 800;
      }

      .lf-drawer-parent b {
        font-size: 12px;
      }

      .lf-drawer-submenu {
        display: grid;
        margin: 0 0 4px 49px;
        border-left: 1px solid rgba(255,255,255,.08);
      }

      .lf-drawer-submenu.collapsed {
        display: none;
      }

      .lf-drawer-submenu button {
        min-height: 41px;
        border: 0;
        background: transparent;
        color: #a0a2a5;
        padding: 0 13px;
        text-align: left;
        font-size: 11px;
        cursor: pointer;
      }

      .lf-drawer-handle {
        position: fixed;
        z-index: 9998;
        top: 50%;
        right: 0;
        width: 22px;
        height: 70px;
        transform: translateY(-50%);
        border: 1px solid rgba(100,231,155,.22);
        border-right: 0;
        border-radius: 16px 0 0 16px;
        background: rgba(20,90,51,.62);
        color: var(--lf-accent);
        backdrop-filter: blur(12px);
        box-shadow: -8px 0 28px rgba(0,0,0,.35);
        cursor: pointer;
        transition: opacity .2s ease;
      }

      .lf-drawer-handle.hidden-handle {
        opacity: 0;
        pointer-events: none;
      }

      .lf-drawer-handle span {
        font-size: 22px;
      }

      body.lf-drawer-open {
        overflow: hidden;
      }

      /* Academia raiz = somente pastas */
      .lf-gym-topbar,
      .lf-detail-header {
        display: grid;
        grid-template-columns: 44px 1fr 44px;
        align-items: center;
        gap: 10px;
        margin: 2px 0 12px;
      }

      .lf-gym-topbar > div,
      .lf-detail-header > div {
        min-width: 0;
      }

      .lf-gym-topbar > div > span {
        color: var(--lf-accent);
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .lf-gym-topbar h2,
      .lf-detail-header h2 {
        margin: 2px 0 0;
        color: #f3f3f4;
        font-size: 21px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lf-detail-header > div > span {
        display: block;
        margin-top: 2px;
        color: #777a7f;
        font-size: 9px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lf-icon-btn,
      .lf-back-btn,
      .lf-more-btn {
        width: 44px;
        height: 44px;
        border-radius: 13px;
        font-size: 19px;
      }

      .lf-gym-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
        margin: 8px 0 18px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .lf-gym-tabs button {
        min-height: 40px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #777a7f;
        font-size: 8px;
        font-weight: 900;
        cursor: pointer;
      }

      .lf-gym-tabs button.active {
        border-bottom-color: var(--lf-accent);
        color: var(--lf-accent);
      }

      .lf-detail-tabs {
        grid-template-columns: repeat(3, 1fr);
      }

      .lf-kicker {
        display: block;
        color: var(--lf-accent);
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1.2px;
      }

      .lf-folder-list {
        display: grid;
        gap: 10px;
        margin-top: 10px;
      }

      .lf-folder-card {
        width: 100%;
        min-height: 92px;
        display: grid;
        grid-template-columns: 52px 1fr 24px;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--lf-line);
        border-radius: 18px;
        background:
          linear-gradient(145deg, rgba(18,19,22,.98), rgba(10,10,12,.98));
        color: inherit;
        padding: 12px;
        text-align: left;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lf-folder-icon {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border: 1px solid rgba(100,231,155,.1);
        border-radius: 14px;
        background: rgba(100,231,155,.05);
        font-size: 28px;
      }

      .lf-folder-copy {
        min-width: 0;
      }

      .lf-folder-copy strong,
      .lf-folder-copy span,
      .lf-folder-copy small {
        display: block;
      }

      .lf-folder-copy strong {
        color: #ececed;
        font-size: 15px;
      }

      .lf-folder-copy span {
        margin-top: 3px;
        color: #777a7f;
        font-size: 9px;
      }

      .lf-folder-copy small {
        margin-top: 7px;
        color: #5f6267;
        font-size: 8px;
      }

      .lf-folder-card > b {
        color: #6f7277;
        font-size: 22px;
      }

      .lf-folder-new {
        opacity: .88;
      }

      .lf-gym-quick,
      .lf-plan-timer-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
        border: 1px solid var(--lf-line);
        border-radius: 17px;
        background: rgba(255,255,255,.02);
        padding: 13px;
      }

      .lf-gym-quick span,
      .lf-plan-timer-strip span {
        display: block;
        color: #6d7075;
        font-size: 7px;
        font-weight: 900;
      }

      .lf-gym-quick strong,
      .lf-plan-timer-strip strong {
        display: block;
        margin-top: 3px;
        color: #e9e9eb;
        font-size: 18px;
        font-variant-numeric: tabular-nums;
      }

      .lf-gym-quick button,
      .lf-floating-add,
      .lf-empty-folder button {
        min-height: 44px;
        border: 1px solid rgba(100,231,155,.18);
        border-radius: 12px;
        background: rgba(100,231,155,.07);
        color: var(--lf-accent);
        padding: 0 14px;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
      }

      .lf-plan-timer-actions {
        display: flex;
        gap: 7px;
      }

      .lf-plan-timer-actions button {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 11px;
        background: #0d0e10;
        color: #d2d3d5;
      }

      .lf-plan-exercises {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .lf-exercise-row {
        width: 100%;
        display: grid;
        grid-template-columns: 66px 1fr 18px;
        align-items: center;
        gap: 10px;
        min-height: 78px;
        border: 1px solid var(--lf-line);
        border-radius: 14px;
        background: #0e0f11;
        color: inherit;
        padding: 7px;
        text-align: left;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lf-ex-thumb {
        width: 66px;
        height: 62px;
        overflow: hidden;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: #151619;
      }

      .lf-ex-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .lf-ex-thumb span {
        font-size: 22px;
      }

      .lf-ex-copy {
        min-width: 0;
      }

      .lf-ex-copy strong,
      .lf-ex-copy span,
      .lf-ex-copy small {
        display: block;
      }

      .lf-ex-copy strong {
        color: #ececee;
        font-size: 11px;
      }

      .lf-ex-copy span {
        margin-top: 4px;
        color: #85888c;
        font-size: 8px;
      }

      .lf-ex-copy small {
        margin-top: 3px;
        color: #62656a;
        font-size: 7px;
      }

      .lf-exercise-row > b {
        color: #66696e;
        font-size: 18px;
      }

      .lf-floating-add {
        width: 100%;
        margin-top: 12px;
        min-height: 50px;
      }

      .lf-empty-folder {
        display: grid;
        place-items: center;
        gap: 7px;
        min-height: 210px;
        border: 1px dashed rgba(255,255,255,.08);
        border-radius: 17px;
        color: #777a7f;
        text-align: center;
      }

      .lf-empty-folder > span {
        font-size: 35px;
      }

      .lf-empty-folder strong {
        color: #d7d8da;
      }

      .lf-empty-folder p {
        margin: 0;
        font-size: 9px;
      }

      .lf-exercise-big-media {
        display: grid;
        grid-template-columns: 1fr 1fr;
        overflow: hidden;
        min-height: 190px;
        border-radius: 18px;
        background: #121315;
      }

      .lf-exercise-big-media img,
      .lf-big-placeholder {
        width: 100%;
        height: 100%;
        min-height: 190px;
        object-fit: cover;
      }

      .lf-big-placeholder {
        display: grid;
        place-items: center;
        font-size: 48px;
      }

      .lf-guidance-card {
        margin-top: 14px;
        border: 1px solid var(--lf-line);
        border-radius: 18px;
        background: #0e0f11;
        padding: 14px;
      }

      .lf-guidance-list {
        display: grid;
        gap: 9px;
        margin-top: 10px;
      }

      .lf-guidance-list > div {
        display: grid;
        grid-template-columns: 20px 1fr;
        gap: 8px;
        align-items: start;
      }

      .lf-guidance-list i {
        display: grid;
        place-items: center;
        width: 18px;
        height: 18px;
        border: 1px solid rgba(100,231,155,.2);
        border-radius: 50%;
        color: var(--lf-accent);
        font-style: normal;
        font-size: 8px;
      }

      .lf-guidance-list p {
        margin: 0;
        color: #a0a2a5;
        font-size: 9px;
        line-height: 1.6;
      }

      .lf-tip-title {
        margin-top: 18px;
      }

      .lf-exercise-prescription {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 7px;
        margin-top: 12px;
      }

      .lf-exercise-prescription > div {
        border: 1px solid var(--lf-line);
        border-radius: 13px;
        background: #0e0f11;
        padding: 10px;
      }

      .lf-exercise-prescription span {
        display: block;
        color: #686b70;
        font-size: 7px;
        font-weight: 900;
      }

      .lf-exercise-prescription strong {
        display: block;
        margin-top: 4px;
        color: #ebebed;
        font-size: 13px;
      }

      .lf-exercise-action {
        display: grid;
        gap: 9px;
        margin-top: 12px;
      }

      .lf-exercise-action > button {
        min-height: 52px;
        border: 1px solid rgba(100,231,155,.2);
        border-radius: 14px;
        background: rgba(100,231,155,.09);
        color: var(--lf-accent);
        font-weight: 900;
        cursor: pointer;
      }

      .lf-rest-inline {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--lf-line);
        border-radius: 13px;
        background: #0e0f11;
        padding: 9px 11px;
      }

      .lf-rest-inline span {
        color: #707378;
        font-size: 8px;
        font-weight: 900;
      }

      .lf-rest-inline strong {
        color: #e8e8ea;
        font-size: 16px;
        font-variant-numeric: tabular-nums;
      }

      .lf-rest-inline button {
        min-height: 38px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px;
        background: #151619;
        color: #bbbcc0;
      }

      .lf-library-clean {
        margin-top: 0 !important;
      }

      /* Academia e Sono saem do menu inferior e ficam no drawer */
      #gymButton,
      #sleepButton {
        display: none !important;
      }

      /* Mais espaço para não ficar coberto pelo nav no celular */
      .lifeflow-gym-screen,
      .lifeflow-sleep-screen {
        padding-bottom: 105px !important;
      }

      @media (max-width: 520px) {
        .lf-drawer {
          width: min(86vw, 350px);
        }

        .lf-drawer-handle {
          height: 64px;
        }

        .lf-gym-tabs button {
          font-size: 7px;
        }

        .lf-folder-card {
          min-height: 88px;
        }

        .lf-gym-quick {
          align-items: stretch;
          flex-direction: column;
        }

        .lf-gym-quick button {
          width: 100%;
          min-height: 48px;
        }

        .lf-exercise-row {
          grid-template-columns: 72px 1fr 16px;
          min-height: 84px;
        }

        .lf-ex-thumb {
          width: 72px;
          height: 68px;
        }

        .lf-exercise-big-media {
          min-height: 180px;
        }

        .lf-exercise-big-media img,
        .lf-big-placeholder {
          min-height: 180px;
        }
      }
    `;


    style.textContent += `
      /* LIFEFLOW 6.2.2 — DIRECT MENU REBUILD */
      #lifeflowDrawer {
        width:min(430px,94vw) !important;
        padding:max(24px,env(safe-area-inset-top)) 22px max(28px,env(safe-area-inset-bottom)) !important;
        border-left:1px solid rgba(104,240,168,.14) !important;
        background:
          radial-gradient(circle at 12% 5%,rgba(104,240,168,.075),transparent 25%),
          linear-gradient(180deg,#070b09,#030605) !important;
        box-shadow:-42px 0 120px rgba(0,0,0,.75) !important;
      }

      #lifeflowDrawer .lf622-head {
        min-height:108px !important;
        align-items:flex-start !important;
        padding:4px 0 20px !important;
        margin:0 0 16px !important;
        border-bottom:1px solid rgba(255,255,255,.06) !important;
      }

      #lifeflowDrawer .lf622-brand > span {
        color:#64e79b !important;
        font-size:8px !important;
        font-weight:950 !important;
        letter-spacing:2.4px !important;
      }

      #lifeflowDrawer .lf622-brand > strong {
        margin-top:4px !important;
        color:#f4f7f5 !important;
        font-size:29px !important;
        font-weight:950 !important;
        letter-spacing:-1.5px !important;
      }

      #lifeflowDrawer .lf622-brand > strong span {
        display:inline !important;
        color:#64e79b !important;
        font-size:inherit !important;
        letter-spacing:inherit !important;
      }

      #lifeflowDrawer .lf622-os {
        display:flex;
        align-items:center;
        gap:9px;
        margin-top:7px;
      }

      #lifeflowDrawer .lf622-os b {
        color:#69756d;
        font-size:6px;
        letter-spacing:2.1px;
      }

      #lifeflowDrawer .lf622-os i {
        width:110px;
        height:1px;
        background:linear-gradient(90deg,#64e79b,transparent);
      }

      #lifeflowDrawer #lfDrawerClose {
        width:54px !important;
        height:54px !important;
        border:1px solid rgba(104,240,168,.22) !important;
        border-radius:18px !important;
        background:linear-gradient(145deg,#0e1511,#060907) !important;
        color:#f1f5f2 !important;
      }

      #lifeflowDrawer .lf622-profile {
        width:100%;
        min-height:148px;
        position:relative;
        display:grid;
        grid-template-columns:64px 1fr 20px;
        align-items:center;
        gap:13px;
        margin:0 0 18px;
        padding:16px 16px 49px;
        overflow:hidden;
        border:1px solid rgba(104,240,168,.16);
        border-radius:23px;
        background:
          radial-gradient(circle at 0 50%,rgba(104,240,168,.10),transparent 34%),
          linear-gradient(145deg,#101713,#070a08);
        color:inherit;
        text-align:left;
        box-shadow:0 20px 55px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.04);
      }

      #lifeflowDrawer .lf622-profile::before {
        content:"";
        position:absolute;
        left:0; top:18px; bottom:18px;
        width:2px;
        background:linear-gradient(transparent,#64e79b,transparent);
      }

      #lifeflowDrawer .lf622-avatar {
        width:62px;height:62px;display:grid;place-items:center;
        border:1px solid rgba(104,240,168,.5);
        border-radius:50%;
        background:#09110d;
        color:#64e79b;
        font-size:17px;font-weight:950;
      }

      #lifeflowDrawer .lf622-profile-copy strong {
        display:block;color:#edf3ef;font-size:13px;
      }
      #lifeflowDrawer .lf622-profile-copy span {
        display:block;margin-top:5px;color:#6e7a72;font-size:7px;
      }
      #lifeflowDrawer .lf622-chevron {color:#e7ede9;font-size:22px;}

      #lifeflowDrawer .lf622-level {
        position:absolute;left:16px;right:16px;bottom:14px;
        display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;
      }
      #lifeflowDrawer .lf622-level span,
      #lifeflowDrawer .lf622-level small {
        color:#64e79b;font-size:6px;font-weight:950;letter-spacing:.8px;
      }
      #lifeflowDrawer .lf622-level small {color:#68746c;}
      #lifeflowDrawer .lf622-level i {
        height:5px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.07);
      }
      #lifeflowDrawer .lf622-level em {
        display:block;width:68%;height:100%;border-radius:inherit;
        background:linear-gradient(90deg,#2fc779,#64e79b);
        box-shadow:0 0 12px rgba(104,240,168,.3);
      }

      #lifeflowDrawer .lf622-nav {
        display:grid !important;
        gap:10px !important;
        margin-top:0 !important;
      }

      #lifeflowDrawer .lf622-item {
        width:100% !important;
        min-height:64px !important;
        display:grid !important;
        grid-template-columns:38px 1fr auto !important;
        align-items:center !important;
        gap:12px !important;
        padding:11px 14px !important;
        margin:0 !important;
        border:1px solid rgba(255,255,255,.065) !important;
        border-radius:18px !important;
        background:linear-gradient(145deg,rgba(13,18,15,.94),rgba(6,9,7,.96)) !important;
        color:#d6ded9 !important;
      }

      #lifeflowDrawer .lf622-item > .lf622-icon {
        width:36px !important;height:36px !important;
        display:grid !important;place-items:center !important;
        border-radius:11px;background:rgba(104,240,168,.05);
        color:#64e79b !important;font-size:16px !important;
      }

      #lifeflowDrawer .lf622-item strong {
        color:inherit !important;font-size:12px !important;font-weight:850 !important;
      }
      #lifeflowDrawer .lf622-item > b {color:#a8b3ac;font-size:18px;}

      #lifeflowDrawer .lf622-item.active {
        border-color:rgba(104,240,168,.18) !important;
        background:linear-gradient(90deg,rgba(104,240,168,.14),rgba(104,240,168,.035)) !important;
        color:#64e79b !important;
        box-shadow:inset -3px 0 0 #64e79b;
      }

      #lifeflowDrawer .lf622-sleep .lf622-icon {color:#d39cff !important;background:rgba(211,156,255,.055);}
      #lifeflowDrawer .lf622-study .lf622-icon {color:#79aaff !important;background:rgba(121,170,255,.055);}
      #lifeflowDrawer .lf622-agenda .lf622-icon {color:#ffcb50 !important;background:rgba(255,203,80,.055);}

      #lifeflowDrawer .lf622-gym {
        overflow:hidden;
        border:1px solid rgba(104,240,168,.12);
        border-radius:20px;
        background:linear-gradient(145deg,#0c110e,#060907);
      }

      #lifeflowDrawer .lf622-gym > .lf622-item {
        border:0 !important;border-radius:0 !important;background:transparent !important;
      }

      #lifeflowDrawer .lf622-submenu {
        margin:0 12px 12px 51px !important;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.055) !important;
        border-left:1px solid rgba(104,240,168,.14) !important;
        border-radius:14px !important;
        background:rgba(0,0,0,.17);
      }

      #lifeflowDrawer .lf622-submenu button {
        min-height:48px !important;
        display:grid !important;
        grid-template-columns:28px 1fr !important;
        align-items:center !important;
        gap:8px !important;
        padding:8px 11px !important;
        border-bottom:1px solid rgba(255,255,255,.045) !important;
        color:#a6b0aa !important;
        font-size:9px !important;
      }

      #lifeflowDrawer .lf622-submenu button span {
        color:#64e79b !important;font-size:12px !important;
      }

      #lifeflowDrawer .lf622-motivation {
        min-height:80px;display:grid;grid-template-columns:42px 1fr 18px;
        align-items:center;gap:10px;margin-top:20px;padding:12px 13px;
        border:1px solid rgba(104,240,168,.12);border-radius:18px;
        background:linear-gradient(90deg,rgba(104,240,168,.07),rgba(255,255,255,.015));
      }

      #lifeflowDrawer .lf622-motivation-icon {
        width:39px;height:39px;display:grid;place-items:center;
        border-right:1px solid rgba(104,240,168,.17);
        color:#64e79b;font-size:17px;
      }
      #lifeflowDrawer .lf622-motivation strong {display:block;color:#e6ece8;font-size:9px;}
      #lifeflowDrawer .lf622-motivation small {display:block;margin-top:4px;color:#68736c;font-size:7px;}
      #lifeflowDrawer .lf622-motivation > b {color:#64e79b;font-size:20px;}

      #lifeflowDrawer .lf622-signature {
        padding:16px 0 4px;color:rgba(104,240,168,.66);
        font-size:6px;font-weight:950;letter-spacing:2.8px;text-align:center;
      }

      @media(max-width:520px){
        #lifeflowDrawer {
          width:min(390px,96vw) !important;
          padding:max(20px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom)) !important;
        }
        #lifeflowDrawer .lf622-brand > strong {font-size:25px !important;}
        #lifeflowDrawer .lf622-profile {min-height:138px;}
        #lifeflowDrawer .lf622-item {min-height:59px !important;}
      }
    `;

    document.head.appendChild(style);
  }

  // Override only the Gym render path. Existing data/timers/library stay intact.
  const _lifeFlowLegacyRenderGymPanel = renderGymPanel;

  renderGymPanel = function () {
    renderGymOrganizedPanel();
  };


  setupSleepHub();
  setupGymHub();
  setupSmartDrawer();
  injectOrganizedLayoutStyles();
  injectGymProStyles();
  injectRoutineEditorStyles();
  setupProfessionalStatsDrawer();
  injectSimplifiedInterfaceStyles();
  moveLifeAreasToDrawer();
  addLifeAreasToDrawer();
  addGymEvolutionToDrawer();
  injectLifeFlow34Styles();
  injectLifeFlow40Styles();
  wireLifeHubDrawer();
  injectLifeFlow41Styles();
  injectGymPremiumThemeStyles();
  renderLifeProfileChip();
  enforceLifeFlowAuth();

  // =====================================================
  // NAVEGAÇÃO
  // =====================================================

  document
    .getElementById(
      "homeButton"
    )
    ?.addEventListener(
      "click",
      showHome
    );


  document
    .getElementById(
      "agendaButton"
    )
    ?.addEventListener(
      "click",
      showAgenda
    );


  document
    .getElementById(
      "studyNavButton"
    )
    ?.addEventListener(
      "click",
      showStudy
    );


  document
    .getElementById(
      "sleepButton"
    )
    ?.addEventListener(
      "click",
      showSleep
    );


  document
    .getElementById(
      "gymButton"
    )
    ?.addEventListener(
      "click",
      showGymRoot
    );


  document
    .getElementById(
      "progressButton"
    )
    ?.addEventListener(
      "click",
      showProgress
    );


  document
    .getElementById(
      "studyButton"
    )
    ?.addEventListener(
      "click",
      showStudy
    );


  document
    .getElementById(
      "studyAreaButton"
    )
    ?.addEventListener(
      "click",
      showStudy
    );


  document
    .getElementById(
      "academyAreaButton"
    )
    ?.addEventListener(
      "click",
      showGymRoot
    );


  // =====================================================
  // ÁREAS EM DESENVOLVIMENTO
  // =====================================================

  const developmentButtons = [

    {
      id:
        "foodAreaButton",

      message:
        "A área Alimentação e Marmitas será adicionada em breve."
    },

    {
      id:
        "familyAreaButton",

      message:
        "A área Família será desenvolvida em uma próxima versão."
    },

    {
      id:
        "motorcycleAreaButton",

      message:
        "A área Projeto da Moto será adicionada em breve."
    },

    {
      id:
        "careAreaButton",

      message:
        "A área Cuidados será preparada quando adicionarmos cabelo e skincare."
    }

  ];


  developmentButtons.forEach(
    item => {

      document
        .getElementById(
          item.id
        )
        ?.addEventListener(
          "click",
          () => {

            showSiteMessage(
              item.message,
              "info"
            );
          }
        );
    }
  );




  function injectEvolutionStyles() {
    if (document.getElementById("lifeflowEvolutionStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "lifeflowEvolutionStyles";

    style.textContent = `
      .evolution-panel {
        display: grid;
        gap: 14px;
        margin: 16px 0;
      }

      .evolution-hero,
      .achievement-section {
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 24px;
        background:
          radial-gradient(circle at 90% 0%, rgba(85,227,154,.10), transparent 30%),
          linear-gradient(145deg, rgba(22,22,22,.98), rgba(7,7,7,.98));
        box-shadow: 0 22px 60px rgba(0,0,0,.42);
        padding: 18px;
      }

      .evolution-topline,
      .evolution-progress-head,
      .achievement-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .evolution-kicker {
        color: #8c8c8c;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.2px;
      }

      .evolution-level-badge {
        border: 1px solid rgba(85,227,154,.22);
        border-radius: 999px;
        background: rgba(85,227,154,.08);
        color: #70edb1;
        padding: 7px 10px;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .4px;
        text-transform: uppercase;
      }

      .evolution-main {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 14px;
        margin-top: 20px;
      }

      .evolution-label {
        display: block;
        color: #777;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .9px;
        margin-bottom: 5px;
      }

      .evolution-xp {
        display: block;
        color: #f4f4f4;
        font-size: clamp(25px, 5vw, 36px);
        letter-spacing: -1.2px;
      }

      .evolution-streak {
        display: flex;
        align-items: baseline;
        gap: 5px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 18px;
        background: rgba(255,255,255,.035);
        padding: 10px 12px;
      }

      .evolution-streak > span {
        font-size: 20px;
      }

      .evolution-streak strong {
        font-size: 24px;
      }

      .evolution-streak small {
        color: #8f8f8f;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .evolution-progress-head {
        margin-top: 20px;
        color: #8f8f8f;
        font-size: 9px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .evolution-progress-head strong {
        color: #cfcfcf;
      }

      .evolution-progress-track {
        height: 8px;
        margin-top: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
      }

      .evolution-progress-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #43c983, #78efb3);
        box-shadow: 0 0 18px rgba(85,227,154,.18);
        transition: width .4s ease;
      }

      .evolution-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 14px;
      }

      .evolution-stats > div {
        min-width: 0;
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 15px;
        background: rgba(255,255,255,.025);
        padding: 10px;
      }

      .evolution-stats span {
        display: block;
        color: #777;
        font-size: 8px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .evolution-stats strong {
        display: block;
        margin-top: 4px;
        color: #ededed;
        font-size: 12px;
      }

      .achievement-heading h3 {
        margin: 4px 0 0;
        color: #f0f0f0;
        font-size: 17px;
      }

      .achievement-heading > strong {
        color: #70edb1;
        font-size: 12px;
      }

      .achievement-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 14px;
      }

      .achievement-card {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.065);
        border-radius: 16px;
        background: rgba(255,255,255,.025);
        padding: 11px;
      }

      .achievement-card.unlocked {
        border-color: rgba(231,182,95,.20);
        background: rgba(231,182,95,.055);
      }

      .achievement-card.locked {
        opacity: .48;
      }

      .achievement-icon {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: rgba(255,255,255,.045);
        font-size: 17px;
      }

      .achievement-card strong,
      .achievement-card span {
        display: block;
      }

      .achievement-card strong {
        color: #e9e9e9;
        font-size: 10px;
      }

      .achievement-card span {
        margin-top: 3px;
        color: #777;
        font-size: 8px;
        line-height: 1.35;
      }

      @media (max-width: 520px) {
        .evolution-stats {
          grid-template-columns: 1fr;
        }

        .achievement-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }


  // =====================================================
  // ATUALIZAÇÃO INTELIGENTE DO HORÁRIO
  // =====================================================

  setInterval(
    refreshSmartNow,
    30000
  );


  // =====================================================
  // INICIAR
  // =====================================================

  injectEvolutionStyles();
  injectHistoryStyles();
  injectSleepStyles();
  injectSleepHubStyles();
  injectGymStyles();

  syncDailyEvolution();
  syncTodayHistory();

  renderHome();

  renderCalendar();

  renderStudyPlan();

  renderSleepPanel();
  renderGymPanel();

  renderProgressScreen();


  /* ============================================================
     LIFEFLOW 6.0 — INTELLIGENCE LAYER
  ============================================================ */

  function lf6Escape(value) {
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function lf6TimeToMinutes(time) {
    const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
    if (!match) return 99999;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function lf6GetRoutineForToday() {
    try {
      if (typeof getCurrentRoutine === "function") {
        const r = getCurrentRoutine();
        if (Array.isArray(r)) return r;
      }
    } catch (_) {}

    const candidates = [
      window.currentRoutine,
      window.todayRoutine,
      window.routineToday
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }

    return [];
  }

  function lf6CollectTodayItems() {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let items = [];

    document.querySelectorAll("#homeScreen .task").forEach((task, index) => {
      const time =
        task.querySelector(".task-time")?.textContent?.trim() ||
        task.dataset.time ||
        "";
      const title =
        task.querySelector(".task-title")?.textContent?.trim() ||
        task.querySelector("strong")?.textContent?.trim() ||
        `Atividade ${index + 1}`;
      const done =
        task.classList.contains("done") ||
        Boolean(task.querySelector('input[type="checkbox"]:checked'));

      if (time || title) {
        items.push({
          time,
          title,
          done,
          minutes: lf6TimeToMinutes(time)
        });
      }
    });

    if (!items.length) {
      const routine = lf6GetRoutineForToday();
      items = routine.map((item, index) => ({
        time: item.time || item.hour || item.start || "",
        title: item.title || item.name || item.label || `Atividade ${index + 1}`,
        done: Boolean(item.done || item.completed),
        minutes: lf6TimeToMinutes(item.time || item.hour || item.start)
      }));
    }

    items.sort((a,b) => a.minutes - b.minutes);

    return items.map(item => ({
      ...item,
      state: item.done ? "done" : item.minutes < nowMinutes ? "past" : "next"
    }));
  }

  function lf6RenderTimeline() {
    const host = document.getElementById("lf6TimelineList");
    if (!host) return;

    const items = lf6CollectTodayItems();

    if (!items.length) {
      host.innerHTML = `
        <div class="lf6-empty-state">
          <span>⌁</span>
          <strong>Seu dia está livre</strong>
          <small>As atividades da rotina aparecerão aqui automaticamente.</small>
        </div>
      `;
      return;
    }

    let firstFutureMarked = false;

    host.innerHTML = items.slice(0, 8).map(item => {
      let state = item.done ? "done" : item.state;
      if (!item.done && item.state === "next" && !firstFutureMarked) {
        state = "current";
        firstFutureMarked = true;
      }

      return `
        <div class="lf6-timeline-item ${state}">
          <div class="lf6-timeline-time">${lf6Escape(item.time || "—")}</div>
          <div class="lf6-timeline-line">
            <i></i>
          </div>
          <div class="lf6-timeline-copy">
            <strong>${lf6Escape(item.title)}</strong>
            <small>${
              state === "done" ? "Concluído" :
              state === "current" ? "Próxima ação" :
              state === "past" ? "Horário passou" :
              "Planejado"
            }</small>
          </div>
          <span class="lf6-timeline-state">${
            state === "done" ? "✓" :
            state === "current" ? "AGORA" :
            "•"
          }</span>
        </div>
      `;
    }).join("");
  }

  function lf6GetSmartInsight() {
    const hour = new Date().getHours();
    let title = "Mantenha o ritmo.";
    let text = "Pequenas ações consistentes constroem sua evolução.";

    if (hour < 9) {
      title = "O dia está começando.";
      text = "Priorize a primeira missão importante antes que o dia fique cheio.";
    } else if (hour < 13) {
      title = "Ritmo de execução.";
      text = "Você está no melhor momento para manter o plano e evitar acumular pendências.";
    } else if (hour < 18) {
      title = "Proteja sua energia.";
      text = "Finalize o essencial da tarde e deixe o restante organizado para depois.";
    } else {
      title = "Fechamento inteligente.";
      text = "Conclua o que falta e prepare amanhã para começar sem atrito.";
    }

    const items = lf6CollectTodayItems();
    const done = items.filter(i => i.done).length;
    if (items.length) {
      const pct = Math.round(done / items.length * 100);
      text = `Você concluiu ${done} de ${items.length} atividades detectadas hoje (${pct}%). ${text}`;
    }

    return { title, text };
  }

  function lf6RefreshIntelligence() {
    lf6RenderTimeline();

    const insight = lf6GetSmartInsight();
    const title = document.getElementById("lf6InsightTitle");
    const text = document.getElementById("lf6InsightText");
    if (title) title.textContent = insight.title;
    if (text) text.textContent = insight.text;

    const clock = document.getElementById("lf6Clock");
    if (clock) {
      clock.textContent = new Date().toLocaleTimeString("pt-BR", {
        hour:"2-digit",
        minute:"2-digit"
      });
    }
  }

  function lf6InjectSmartHome() {
    const home = document.getElementById("homeScreen");
    if (!home || home.querySelector("#lf6Intelligence")) return;

    const hero = home.querySelector(".hero-section");
    const mount = document.createElement("section");
    mount.id = "lf6Intelligence";
    mount.className = "lf6-intelligence";

    mount.innerHTML = `
      <div class="lf6-command-launch" id="lf6CommandLaunch" role="button" tabindex="0">
        <div class="lf6-command-symbol">⌘</div>
        <div class="lf6-command-copy">
          <span>COMMAND CENTER</span>
          <strong>O que você quer fazer?</strong>
        </div>
        <kbd>ABRIR</kbd>
      </div>

      <div class="lf6-intelligence-grid">
        <article class="lf6-timeline-card">
          <div class="lf6-card-head">
            <div>
              <span class="lf6-kicker">LIVE TIMELINE</span>
              <h3>Hoje</h3>
            </div>
            <div class="lf6-live-clock">
              <i></i>
              <b id="lf6Clock">--:--</b>
            </div>
          </div>
          <div id="lf6TimelineList" class="lf6-timeline-list"></div>
        </article>

        <article class="lf6-insight-card">
          <div class="lf6-insight-mark">AI</div>
          <span class="lf6-kicker">LIFEFLOW INTELLIGENCE</span>
          <h3 id="lf6InsightTitle">Analisando seu dia...</h3>
          <p id="lf6InsightText">Preparando seu insight.</p>
          <div class="lf6-scan-line"></div>
        </article>
      </div>
    `;

    if (hero?.nextSibling) {
      home.insertBefore(mount, hero.nextSibling);
    } else if (hero) {
      hero.insertAdjacentElement("afterend", mount);
    } else {
      home.prepend(mount);
    }

    const launch = mount.querySelector("#lf6CommandLaunch");
    launch?.addEventListener("click", lf6OpenCommandCenter);
    launch?.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") lf6OpenCommandCenter();
    });

    lf6RefreshIntelligence();
  }

  function lf6CommandCatalog() {
    return [
      { icon:"⌂", title:"Ir para Início", hint:"home início hoje", action:() => document.querySelector('.nav-item[data-screen="home"]')?.click() },
      { icon:"▦", title:"Abrir Agenda", hint:"agenda calendário compromisso", action:() => document.querySelector('.nav-item[data-screen="agenda"]')?.click() },
      { icon:"◈", title:"Abrir Estudos", hint:"estudos pmmg estudar aula", action:() => document.querySelector('.nav-item[data-screen="studies"]')?.click() },
      { icon:"↗", title:"Ver Progresso", hint:"progresso evolução xp meta", action:() => document.querySelector('.nav-item[data-screen="progress"]')?.click() },
      { icon:"＋", title:"Registrar 250 ml de água", hint:"agua água hidratação beber", action:() => document.getElementById("addWaterButton")?.click() },
      { icon:"✓", title:"Ver rotina de hoje", hint:"rotina hoje tarefas atividades", action:() => {
          document.querySelector('.nav-item[data-screen="home"]')?.click();
          setTimeout(() => document.querySelector(".daily-card")?.scrollIntoView({behavior:"smooth",block:"center"}), 180);
        }
      },
      { icon:"⌁", title:"Abrir Academia", hint:"academia treino treinar", action:() => {
          if (typeof showGymRoot === "function") showGymRoot();
          else document.querySelector('[data-life-module="gym"],[data-module="gym"]')?.click();
        }
      },
      { icon:"☾", title:"Abrir Sono", hint:"sono dormir descanso", action:() => {
          if (typeof showSleepScreen === "function") showSleepScreen();
          else document.querySelector('[data-life-module="sleep"],[data-module="sleep"]')?.click();
        }
      }
    ];
  }

  function lf6OpenCommandCenter() {
    let overlay = document.getElementById("lf6CommandCenter");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "lf6CommandCenter";
      overlay.className = "lf6-command-overlay";
      overlay.innerHTML = `
        <div class="lf6-command-panel">
          <div class="lf6-command-top">
            <span>⌘</span>
            <input id="lf6CommandInput"
                   type="text"
                   autocomplete="off"
                   placeholder="Digite uma ação...">
            <button id="lf6CommandClose" type="button">ESC</button>
          </div>
          <div class="lf6-command-label">AÇÕES RÁPIDAS</div>
          <div id="lf6CommandResults" class="lf6-command-results"></div>
          <div class="lf6-command-footer">
            <span>LifeFlow Intelligence</span>
            <b>v6.0</b>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector("#lf6CommandClose")?.addEventListener("click", lf6CloseCommandCenter);
      overlay.addEventListener("click", e => {
        if (e.target === overlay) lf6CloseCommandCenter();
      });

      const input = overlay.querySelector("#lf6CommandInput");
      input?.addEventListener("input", () => lf6RenderCommands(input.value));
    }

    overlay.classList.add("open");
    document.body.classList.add("lf6-command-open");
    lf6RenderCommands("");
    setTimeout(() => overlay.querySelector("#lf6CommandInput")?.focus(), 50);
  }

  function lf6CloseCommandCenter() {
    document.getElementById("lf6CommandCenter")?.classList.remove("open");
    document.body.classList.remove("lf6-command-open");
  }

  function lf6RenderCommands(query = "") {
    const host = document.getElementById("lf6CommandResults");
    if (!host) return;

    const q = query.trim().toLocaleLowerCase("pt-BR");
    const commands = lf6CommandCatalog().filter(cmd =>
      !q ||
      cmd.title.toLocaleLowerCase("pt-BR").includes(q) ||
      cmd.hint.toLocaleLowerCase("pt-BR").includes(q)
    );

    host.innerHTML = commands.length
      ? commands.map((cmd,index) => `
          <button type="button" class="lf6-command-result" data-lf6-command="${index}">
            <span>${cmd.icon}</span>
            <div>
              <strong>${lf6Escape(cmd.title)}</strong>
              <small>${lf6Escape(cmd.hint.split(" ").slice(0,3).join(" • "))}</small>
            </div>
            <i>↵</i>
          </button>
        `).join("")
      : `<div class="lf6-command-empty">Nenhuma ação encontrada.</div>`;

    const filtered = commands;
    host.querySelectorAll("[data-lf6-command]").forEach(button => {
      button.addEventListener("click", () => {
        const cmd = filtered[Number(button.dataset.lf6Command)];
        lf6CloseCommandCenter();
        setTimeout(() => cmd?.action?.(), 80);
      });
    });
  }

  document.addEventListener("keydown", e => {
    const isShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
    if (isShortcut) {
      e.preventDefault();
      lf6OpenCommandCenter();
    }
    if (e.key === "Escape") lf6CloseCommandCenter();
  });

  // Keep intelligence synced when the home DOM changes.
  const lf6HomeObserver = new MutationObserver(() => {
    clearTimeout(window.__lf6RefreshTimer);
    window.__lf6RefreshTimer = setTimeout(() => {
      lf6InjectSmartHome();
      lf6RefreshIntelligence();
    }, 100);
  });

  const lf6Home = document.getElementById("homeScreen");
  if (lf6Home) {
    lf6HomeObserver.observe(lf6Home, {childList:true,subtree:true});
    lf6InjectSmartHome();
  }

  setInterval(lf6RefreshIntelligence, 60000);


  /* ============================================================
     LIFEFLOW 6.1 — SMART COCKPIT
  ============================================================ */

  function lf61GetDayMode() {
    const items = lf6CollectTodayItems();
    const text = items.map(i => i.title).join(" ").toLocaleLowerCase("pt-BR");

    const workWords = ["trabalho","empresa","expediente","plantão","plantao"];
    const isWork = workWords.some(word => text.includes(word));

    return {
      type: isWork ? "work" : "off",
      label: isWork ? "DIA DE TRABALHO" : "DIA DE FOLGA",
      icon: isWork ? "◫" : "◇"
    };
  }

  function lf61GetWaterData() {
    const current =
      Number(document.getElementById("waterCurrent")?.textContent?.replace(/[^\d.,]/g,"").replace(",",".")) ||
      Number(document.getElementById("waterAmount")?.textContent?.replace(/[^\d.,]/g,"").replace(",",".")) ||
      0;

    const goal =
      Number(document.getElementById("waterGoal")?.textContent?.replace(/[^\d.,]/g,"").replace(",",".")) ||
      2.5;

    return { current, goal };
  }

  function lf61GetStudyProgress() {
    const raw =
      document.getElementById("studyProgressText")?.textContent ||
      document.querySelector("#studiesScreen .progress-text")?.textContent ||
      document.querySelector("#homeScreen .study-card")?.textContent ||
      "";

    const match = raw.match(/(\d{1,3})\s*%/);
    return match ? Math.min(100, Number(match[1])) : null;
  }

  function lf61BuildScore() {
    const items = lf6CollectTodayItems();
    const done = items.filter(i => i.done).length;
    const routineScore = items.length ? Math.round(done / items.length * 55) : 20;

    const water = lf61GetWaterData();
    const waterPct = water.goal > 0 ? Math.min(1, water.current / water.goal) : 0;
    const waterScore = Math.round(waterPct * 15);

    const study = lf61GetStudyProgress();
    const studyScore = study == null ? 8 : Math.round((study / 100) * 15);

    let gymScore = 0;
    try {
      const todayGym = typeof getTodayGym === "function" ? getTodayGym() : null;
      gymScore = todayGym?.completed ? 15 : 4;
    } catch (_) {
      gymScore = 4;
    }

    return Math.max(0, Math.min(100, routineScore + waterScore + studyScore + gymScore));
  }

  function lf61ScoreLabel(score) {
    if (score >= 90) return "DIA EXCELENTE";
    if (score >= 75) return "DIA SOB CONTROLE";
    if (score >= 55) return "BOM RITMO";
    if (score >= 35) return "ATENÇÃO ÀS PRIORIDADES";
    return "HORA DE RETOMAR O CONTROLE";
  }

  function lf61GetPriority() {
    const items = lf6CollectTodayItems();
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();

    const future = items.find(i => !i.done && i.minutes >= mins);
    const pending = items.find(i => !i.done);

    return future || pending || {
      time: "—",
      title: "Dia concluído",
      state: "done"
    };
  }

  function lf61GetNextFreeWindow() {
    const items = lf6CollectTodayItems().filter(i => !i.done && i.minutes < 99999);
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const future = items.filter(i => i.minutes >= nowMins);
    if (!future.length) return "Sem novos blocos programados hoje";

    const next = future[0];
    const gap = next.minutes - nowMins;
    if (gap >= 60) return `${Math.floor(gap/60)}h ${gap%60}min livres até ${next.time}`;
    if (gap > 10) return `${gap} min livres até ${next.time}`;
    return `Próxima atividade às ${next.time}`;
  }

  function lf61RenderCockpit() {
    const host = document.getElementById("lf61Cockpit");
    if (!host) return;

    const mode = lf61GetDayMode();
    const score = lf61BuildScore();
    const priority = lf61GetPriority();
    const items = lf6CollectTodayItems();
    const done = items.filter(i => i.done).length;
    const pending = Math.max(0, items.length - done);
    const water = lf61GetWaterData();
    const study = lf61GetStudyProgress();

    let gymDone = false;
    try {
      gymDone = Boolean(typeof getTodayGym === "function" && getTodayGym()?.completed);
    } catch (_) {}

    host.innerHTML = `
      <section class="lf61-cockpit-hero">
        <div class="lf61-cockpit-top">
          <div>
            <span class="lf61-system-label">LIFEFLOW // COCKPIT</span>
            <div class="lf61-day-mode ${mode.type}">
              <i>${mode.icon}</i>
              <strong>${mode.label}</strong>
            </div>
          </div>
          <div class="lf61-live-status">
            <i></i>
            <span>LIVE</span>
          </div>
        </div>

        <div class="lf61-score-zone">
          <div class="lf61-score-ring" style="--score:${score}">
            <div>
              <strong>${score}</strong>
              <small>/100</small>
            </div>
          </div>

          <div class="lf61-score-copy">
            <span>SCORE DO DIA</span>
            <h3>${lf61ScoreLabel(score)}</h3>
            <p>${done} concluídas • ${pending} pendentes • sistema acompanhando seu ritmo</p>
          </div>
        </div>

        <div class="lf61-priority">
          <div class="lf61-priority-number">01</div>
          <div class="lf61-priority-copy">
            <span>PRIORIDADE AGORA</span>
            <strong>${lf6Escape(priority.title)}</strong>
            <small>${lf6Escape(priority.time || "Sem horário")}</small>
          </div>
          <button id="lf61PriorityAction" type="button">→</button>
        </div>
      </section>

      <section class="lf61-vitals">
        <article>
          <span class="lf61-vital-icon">◉</span>
          <div>
            <small>ROTINA</small>
            <strong>${done}/${items.length || 0}</strong>
          </div>
          <i style="--v:${items.length ? Math.round(done/items.length*100) : 0}%"></i>
        </article>

        <article>
          <span class="lf61-vital-icon">⌁</span>
          <div>
            <small>ACADEMIA</small>
            <strong>${gymDone ? "FEITO" : "PENDENTE"}</strong>
          </div>
          <i style="--v:${gymDone ? 100 : 12}%"></i>
        </article>

        <article>
          <span class="lf61-vital-icon">◈</span>
          <div>
            <small>PMMG</small>
            <strong>${study == null ? "ATIVO" : study + "%"}</strong>
          </div>
          <i style="--v:${study == null ? 35 : study}%"></i>
        </article>

        <article>
          <span class="lf61-vital-icon">◌</span>
          <div>
            <small>ÁGUA</small>
            <strong>${water.current ? water.current.toFixed(1) : "0"}L</strong>
          </div>
          <i style="--v:${water.goal ? Math.min(100, Math.round(water.current/water.goal*100)) : 0}%"></i>
        </article>
      </section>

      <section class="lf61-intel-strip">
        <div class="lf61-intel-symbol">LF</div>
        <div>
          <span>INTELLIGENCE // PRÓXIMA JANELA</span>
          <strong>${lf6Escape(lf61GetNextFreeWindow())}</strong>
        </div>
        <i></i>
      </section>
    `;

    host.querySelector("#lf61PriorityAction")?.addEventListener("click", () => {
      const timeline = document.getElementById("lf6TimelineList");
      timeline?.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }

  function lf61InjectCockpit() {
    const home = document.getElementById("homeScreen");
    if (!home || home.querySelector("#lf61Cockpit")) return;

    const hero = home.querySelector(".hero-section");
    const cockpit = document.createElement("div");
    cockpit.id = "lf61Cockpit";
    cockpit.className = "lf61-cockpit";

    if (hero) {
      hero.insertAdjacentElement("afterend", cockpit);
    } else {
      home.prepend(cockpit);
    }

    lf61RenderCockpit();
  }

  // Move the v6 intelligence layer under the new cockpit if both exist.
  function lf61OrganizeHome() {
    lf61InjectCockpit();

    const cockpit = document.getElementById("lf61Cockpit");
    const intelligence = document.getElementById("lf6Intelligence");
    if (cockpit && intelligence && cockpit.nextElementSibling !== intelligence) {
      cockpit.insertAdjacentElement("afterend", intelligence);
    }

    lf61RenderCockpit();
  }

  lf61OrganizeHome();

  const lf61Observer = new MutationObserver(() => {
    clearTimeout(window.__lf61Timer);
    window.__lf61Timer = setTimeout(lf61OrganizeHome, 140);
  });

  const lf61Home = document.getElementById("homeScreen");
  if (lf61Home) {
    lf61Observer.observe(lf61Home, {childList:true,subtree:true});
  }

  setInterval(lf61RenderCockpit, 60000);

  // PWA service worker.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }

});