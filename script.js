const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileMenu?.classList.toggle("is-open", !open);
  mobileMenu?.setAttribute("aria-hidden", String(open));
});
document.querySelectorAll(".mobile-menu a").forEach((link) =>
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    mobileMenu?.classList.remove("is-open");
    mobileMenu?.setAttribute("aria-hidden", "true");
  }),
);
const revealItems = document.querySelectorAll("[data-reveal]");
if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.16 },
  );
  revealItems.forEach((item) => observer.observe(item));
} else revealItems.forEach((item) => item.classList.add("is-visible"));
const soundToggle = document.querySelector(".sound-toggle");
const videos = [...document.querySelectorAll("video")];
soundToggle?.addEventListener("click", () => {
  const on = soundToggle.getAttribute("aria-pressed") !== "true";
  soundToggle.setAttribute("aria-pressed", String(on));
  soundToggle.lastChild.textContent = on ? " Sound on" : " Sound off";
  videos.forEach((video) => {
    video.muted = !on;
    if (on) video.play().catch(() => {});
  });
});
document.querySelector("#discover-button")?.addEventListener("click", () => {
  const button = document.querySelector("#discover-button");
  button.innerHTML = "RAHA is on its way <span>✓</span>";
  button.setAttribute("aria-label", "RAHA is on its way");
});
const sectionLinks = [
  ...document.querySelectorAll('.desktop-nav a[href^="#"]'),
];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
if ("IntersectionObserver" in window && sections.length) {
  const activeObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          sectionLinks.forEach(
            (link) =>
              (link.style.opacity =
                link.getAttribute("href") === `#${entry.target.id}`
                  ? "1"
                  : ".72"),
          );
      }),
    { rootMargin: "-40% 0px -50% 0px" },
  );
  sections.forEach((section) => activeObserver.observe(section));
}
