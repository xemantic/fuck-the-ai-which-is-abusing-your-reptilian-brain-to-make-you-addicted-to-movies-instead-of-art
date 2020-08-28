const PROJECT_CLEANUP_DELAY = 3000;

const FLICKITY_VERSION="2.2.1";
const FLICKITY_BG_LAZY_LOAD_VERSION="1.0.1";

const FLICKITY_DIST = "https://unpkg.com/flickity@" + FLICKITY_VERSION + "/dist/flickity.pkgd.min.js";
const FLICKITY_CSS_DIST = "https://unpkg.com/flickity@" + FLICKITY_VERSION + "/dist/flickity.min.css";
const FLICKITY_BG_LAZY_LOAD_DIST = "https://npmcdn.com/flickity-bg-lazyload@" + FLICKITY_BG_LAZY_LOAD_VERSION + "/bg-lazyload.js";
const FLICKITY_FULLSCREEN_DIST = "https://unpkg.com/flickity-fullscreen@1/fullscreen.js";
const FLICKITY_FULLSCREEN_CSS_DIST = "https://unpkg.com/flickity-fullscreen@1/fullscreen.css";

// TODO vimeo support should be conditional
const VIMEO_DIST = "https://player.vimeo.com/api/player.js";

const imageLoadHandler = (event) => {
  const image = event.target;
  image.classList.add("loaded");
  event.target.removeEventListener("load", imageLoadHandler);
}

// restoring back image src attributes
for (let i = 0; i < document.images.length; i++) {
  const image = document.images[i];
  const dataSrc = image.getAttribute("data-src");
  if (dataSrc) {
    image.addEventListener("load", imageLoadHandler);
    image.src = image.getAttribute("data-src");
    image.removeAttribute("data-src");
  }
}

const miniatures = document.getElementById("project-miniatures");
const projects = document.getElementById("projects");

function show(element) {
  element.classList.remove("hidden");
  element.classList.add("fade-in");
}

const loadJs = (src, extender) => new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.onload = () => resolve();
  script.onerror = (e) => reject(e);
  if (extender) {
    extender(script);
  }
  script.src = src;
  document.head.appendChild(script);
});

const loadCss = (src) => new Promise((resolve, reject) => {
  const firstStyle = document.head.querySelector("style");
  const link = document.createElement("link");
  link.onload = () => resolve();
  link.onerror = (e) => reject(e);
  link.rel = "stylesheet";
  link.href = src;
  document.head.insertBefore(link, firstStyle);
});

function newPlayer(element) {
  element.player = new Vimeo.Player(element, {
    id: element.getAttribute("data-video-id"),
    responsive: true,
    byline: false,
    title: false,
    color: "ffffff"
  });
  return element.player;
}

function setVisibility(button, visibility) {
  const value = visibility ? "visible" : "hidden";
  button.element.style.visibility = value;
}

function initialize() {
  const flickityMiniatures = new Flickity(miniatures, {
    bgLazyLoad: 2,
    freeScroll: true,
    pageDots: false,
  });
  var selectedProject = null;
  const projectCleaner = (projectToClean) => {
    if (!projectToClean) {
      return;
    }
    setTimeout(() => {
      if (projectToClean != selectedProject) {
        cleanUpProject(projectToClean);
      }
    }, PROJECT_CLEANUP_DELAY);
  }

  const projectExpander = document.createElement("div");
  projectExpander.id = "project-expander";
  projects.insertAdjacentElement("afterend", projectExpander);

  const hashChangeHandler = (e) => {
    const hash = location.hash;
    if (!hash) return;
    const project = projects.querySelector(hash);
    if (!project) return;
    flickityMiniatures.selectCell("[href='" + hash + "']");
    const height = project.clientHeight + "px";
    initializeProject(project);
    projects.style.height = height;
    projectExpander.style.height = height;
    projectCleaner(selectedProject);
    selectedProject = project;
  };
  window.addEventListener("hashchange", hashChangeHandler, false);

  document.querySelectorAll(".hidden").forEach(element => show(element));
  flickityMiniatures.resize();
  initializeProjects();
  root.style.setProperty("--z-index-background-layer", -2);

  let hash = window.location.hash;
  if (hash) {
    hashChangeHandler();
    if (selectedProject) {
      selectedProject.scrollIntoView();
    }
  }
}

function initializeProjects() {
  projects.querySelectorAll(".flickity").forEach(flickityElement => {
    const flickity = new Flickity(flickityElement, {
      adaptiveHeight: true
    });
    flickityElement.flickity = flickity;
    flickityElement.imageLoadHandler = (e) => flickity.resize();
    flickityElement.querySelectorAll("img.medium").forEach(image => {
      image.addEventListener("load", flickity.imageLoadHandler);
    });
  });
}

function initializeProject(project) {
  const media = project.querySelector(".media");
  const description = project.querySelector(".description");
  initializeMedia(project.querySelector(".media"));
  if (typeof initializeCustomProject === "function") {
    initializeCustomProject(project);
  }
}

function cleanUpProject(project) {
  const media = project.querySelector(".media");
  const description = project.querySelector(".description");
  cleanUpMedia(media);
  if (typeof cleanUpCustomProject === "function") {
    cleanUpCustomProject(project);
  }
}

function initializeMedia(media) {
  media.querySelectorAll(":scope > .flickity").forEach(flickityElement => {
    const flickity = flickityElement.flickity;
    flickityElement.querySelectorAll(".vimeo-video").forEach(video => {
      function showButtons(visibility) {
        setVisibility(flickity.prevButton, visibility);
        setVisibility(flickity.nextButton, visibility);
      }
      const player = newPlayer(video);
      player.ready().then(() => flickity.resize());
      player.on("playing", () => showButtons(false));
      player.on("pause",   () => showButtons(true));
      player.on("ended",   () => showButtons(true));
      player.on("loaded", () => {
        video.classList.add("loaded");
        flickity.resize();
      });
      flickity.on("change", (index) => { player.pause(); });
    });
  });
  media.querySelectorAll(":scope > .vimeo-video").forEach(video => {
    newPlayer(video);
  });
}

function cleanUpMedia(media) {
  videos = media.querySelectorAll(".vimeo-video");
  videos.forEach(video => {
    if (video.player) {
      video.player.destroy().then(() => {
        video.player = null;
        video.textContent = "";
      });
    }
    video.classList.remove("loaded");
  });
}

Promise.all(
  [
    loadJs(FLICKITY_DIST).then(() => Promise.all([
      //loadJs(FLICKITY_FULLSCREEN_DIST),
      loadJs(FLICKITY_BG_LAZY_LOAD_DIST)
    ])),
    loadJs(VIMEO_DIST),
    loadCss(FLICKITY_CSS_DIST),
    //loadCss(FLICKITY_FULLSCREEN_CSS_DIST)
  ].concat(
    scriptsToLoad.map(x => {
      loadJs(x[0], x[1]);
    }),
    cssToLoad.map(src => loadCss(src))
  )
).then(() => initialize());
