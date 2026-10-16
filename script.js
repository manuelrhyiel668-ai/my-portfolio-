Script

// ===== Settings =====
const GITHUB_USERNAME = "manuelrhyiel668-ai";

const $ = (id) => document.getElementById(id);
let allProjects = [];

// ----- Footer year -----
$("year").textContent = new Date().getFullYear();

// ----- Mobile menu -----
const menuToggle = $("menuToggle");
const mainMenu = $("mainMenu");
menuToggle.addEventListener("click", () => {
  const open = mainMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
mainMenu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    mainMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

// ----- Light / dark theme switch (my own feature) -----
const root = document.documentElement;
const themeToggle = $("themeToggle");
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.innerHTML = theme === "dark" ? "&#9728;" : "&#9790;";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (e) {}
applyTheme(savedTheme || "light");
themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ----- Profile photo fallback (purple "V" if the image is missing) -----
const photo = document.querySelector(".hero-photo");
photo.addEventListener("error", () => {
  photo.src = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#7c3aed"/>' +
    '<text x="100" y="130" font-size="100" font-family="sans-serif" font-weight="800" text-anchor="middle" fill="#fff">V</text></svg>'
  );
}, { once: true });

// ----- Projects from data/projects.json -----
async function loadProjects() {
  const msg = $("projectsMessage");
  try {
    const res = await fetch("data/projects.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    allProjects = await res.json();
    buildFilters();
    renderProjects("All");
  } catch (err) {
    console.warn("Projects could not be loaded:", err);
    msg.textContent = "Projects could not be loaded right now. Please try again later.";
    msg.classList.add("is-error");
    msg.hidden = false;
  }
}

function buildFilters() {
  const bar = $("filterBar");
  const techs = ["All", ...new Set(allProjects.flatMap((p) => p.technologies))];
  techs.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter-btn";
    b.textContent = t;
    b.setAttribute("aria-pressed", String(t === "All"));
    b.addEventListener("click", () => {
      bar.querySelectorAll(".filter-btn").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      renderProjects(t);
    });
    bar.append(b);
  });
}

function renderProjects(tech) {
  const list = $("projectsList");
  list.innerHTML = "";
  allProjects
    .filter((p) => tech === "All" || p.technologies.includes(tech))
    .forEach((p) => list.append(buildCard(p)));
}

function buildCard(p) {
  const card = document.createElement("article");
  card.className = "project-card";

  const shot = document.createElement("div");
  shot.className = "shot";
  const img = document.createElement("img");
  img.src = p.screenshot.includes("/") ? p.screenshot : "images/" + p.screenshot;
  img.alt = "Screenshot of " + p.title;
  img.loading = "lazy";
  img.addEventListener("error", () => { img.remove(); shot.classList.add("no-img"); }, { once: true });
  shot.append(img);

  const body = document.createElement("div");
  body.className = "project-body";
  const h3 = document.createElement("h3");
  h3.textContent = p.title;
  const desc = document.createElement("p");
  desc.textContent = p.description;
  const tech = document.createElement("p");
  tech.textContent = "Technologies: " + p.technologies.join(", ");
  const role = document.createElement("p");
  role.className = "role";
  role.textContent = "My role: " + p.role;
  const link = document.createElement("a");
  link.href = p.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "View project";

  body.append(h3, desc, tech, role, link);
  card.append(shot, body);
  return card;
}

// ----- Latest GitHub repositories -----
async function loadRepos() {
  const list = $("reposList");
  const msg = $("reposMessage");
  const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const repos = await res.json();
    if (repos.length === 0) {
      msg.textContent = "No public repositories yet.";
      return;
    }
    msg.hidden = true;
    repos.forEach((r) => {
      const li = document.createElement("li");
      const a =
