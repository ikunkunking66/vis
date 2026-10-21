/* ============================================================
   可视化导论 · 章节页学习增强（course-theme.js）
   - 阅读进度条（顶部细线，章节主题色）
   - 章节学习路径条（由左侧导航自动生成，横向步骤条，可点击切换）
   - 回到顶部按钮
   - 与章节页既有 lesson.js（ES module）零耦合：
     切换章节通过 replaceState + 派发 hashchange 驱动原页面逻辑，
     不触碰其内部函数与 demo 渲染
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- 章节色 favicon（页面原有缺失，注入 SVG 图标） ---------- */
  var ch = getComputedStyle(root).getPropertyValue("--ch").trim() || "#2563eb";
  var icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" +
    "<rect width='64' height='64' rx='14' fill='" + ch + "'/>" +
    "<rect x='14' y='30' width='10' height='20' rx='3' fill='#fff'/>" +
    "<rect x='27' y='16' width='10' height='34' rx='3' fill='#fff' opacity='.88'/>" +
    "<rect x='40' y='23' width='10' height='27' rx='3' fill='#fff' opacity='.7'/>" +
    "</svg>"
  );
  document.head.appendChild(icon);

  /* ---------- 阅读进度条 ---------- */
  var bar = document.createElement("div");
  bar.id = "readProgress";
  root.appendChild(bar);

  /* ---------- 回到顶部 ---------- */
  var topBtn = document.createElement("button");
  topBtn.id = "toTopBtn";
  topBtn.setAttribute("aria-label", "回到顶部");
  topBtn.setAttribute("title", "回到顶部");
  topBtn.textContent = "↑";
  root.appendChild(topBtn);
  topBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 章节学习路径条 ---------- */
  var stepper = null;
  function buildStepper() {
    var nav = document.querySelector(".chapter-nav");
    var main = document.querySelector(".lesson-main");
    if (!nav || !main) return null;
    var links = nav.querySelectorAll("a[data-chapter]");
    if (links.length < 2) return null;
    var step = document.createElement("nav");
    step.className = "ch-stepper";
    step.setAttribute("aria-label", "本章学习路径");
    links.forEach(function (a) {
      var id = a.getAttribute("data-chapter");
      var btn = document.createElement("a");
      btn.className = "ch-step";
      btn.href = "#" + id;
      btn.setAttribute("data-chapter", id);
      var num = document.createElement("span");
      num.className = "ch-step-num";
      num.textContent = id.replace(/^ch-\d+-/, "");
      var title = document.createElement("span");
      title.className = "ch-step-title";
      title.textContent = (a.textContent || "").replace(/^\d+(\.\d+)?\s*/, "").trim();
      btn.appendChild(num);
      btn.appendChild(title);
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        // 与左侧导航一致：replaceState 不产生跳转，派发 hashchange 激活原页面的章节逻辑
        history.replaceState(null, "", "#" + id);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        setActive(id);
      });
      step.appendChild(btn);
    });
    main.parentNode.insertBefore(step, main);
    return step;
  }

  function setActive(id) {
    if (!stepper) return;
    stepper.querySelectorAll(".ch-step").forEach(function (s) {
      s.classList.toggle("active", s.getAttribute("data-chapter") === id);
    });
  }

  function currentId() {
    var h = location.hash ? location.hash.replace(/^#/, "") : "";
    if (h) return h;
    var first = document.querySelector(".chapter-nav a[data-chapter]");
    return first ? first.getAttribute("data-chapter") : "";
  }

  /* ---------- 滚动状态 ---------- */
  function onScroll() {
    var max = root.scrollHeight - root.clientHeight;
    var y = window.scrollY || root.scrollTop || 0;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    bar.style.width = (p * 100).toFixed(2) + "%";
    topBtn.classList.toggle("show", y > 480);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });

  /* ---------- 与章节页既有导航双向同步 ---------- */
  window.addEventListener("hashchange", function () {
    setActive(location.hash.replace(/^#/, ""));
  });
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest(".chapter-nav a[data-chapter]") : null;
    if (t) setActive(t.getAttribute("data-chapter"));
  });

  /* ---------- 初始化 ---------- */
  stepper = buildStepper();
  setActive(currentId());
  onScroll();
})();
