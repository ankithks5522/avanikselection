(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menuToggle = $("#menuToggle");
  const nav = $("#nav");
  const modal = $("#thankYouModal");
  const modalDialog = $(".thankyou-modal", modal);
  const voteButton = $("#voteButton");
  const closeButton = $("#modalClose");
  const continueButton = $("#continueButton");
  const progressBar = $("#progressBar");
  let lastFocused = null;
  let animationLock = false;

  // Mobile navigation
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open", !expanded);
  });
  $$("#nav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  // Reading progress and header surface
  const header = $(".site-header");
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    header.classList.toggle("scrolled", window.scrollY > 30);
  };
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  // Reveal animations: GSAP when available, IntersectionObserver fallback otherwise.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".reveal").forEach((element, index) => {
      gsap.to(element, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        delay: element.closest(".hero") ? Math.min(index * 0.07, 0.35) : 0,
        scrollTrigger: { trigger: element, start: "top 88%", once: true }
      });
    });
    gsap.to(".vision-bg-number", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".vision", start: "top bottom", end: "bottom top", scrub: 1 }
    });
    gsap.to(".portrait-wrap", {
      y: 25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
    });
  } else if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = "opacity .75s ease, transform .75s cubic-bezier(.2,.75,.25,1)";
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    $$(".reveal").forEach(el => observer.observe(el));
  } else {
    $$(".reveal").forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; });
  }

  // Active navigation section
  const sections = $$("main section[id]");
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$("#nav a").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => modalDialog.focus(), 60);
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    animationLock = false;
  }

  voteButton.addEventListener("click", () => {
    if (animationLock) return;
    animationLock = true;
    voteButton.classList.add("celebrating");
    if (window.confetti && !reduceMotion) {
      const end = Date.now() + 1000;
      const colors = ["#c9a34a", "#4a1832", "#f8f2e8", "#e7c96d"];
      (function frame() {
        window.confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0.12, y: 0.72 }, colors });
        window.confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 0.88, y: 0.72 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      window.confetti({ particleCount: 100, spread: 85, startVelocity: 35, origin: { y: 0.62 }, colors });
    }
    window.setTimeout(() => {
      voteButton.classList.remove("celebrating");
      openModal();
    }, reduceMotion ? 0 : 450);
  });

  closeButton.addEventListener("click", closeModal);
  continueButton.addEventListener("click", () => {
    closeModal();
    $("#about").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    if (event.key === "Tab" && modal.classList.contains("open")) {
      const focusable = $$("button", modalDialog).filter(el => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();