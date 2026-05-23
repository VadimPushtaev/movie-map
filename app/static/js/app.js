const panel = document.querySelector("[data-movie-panel]");
const panelImage = document.querySelector("[data-panel-image]");
const panelCountry = document.querySelector("[data-panel-country]");
const panelTitle = document.querySelector("[data-panel-title]");
const panelImdb = document.querySelector("[data-panel-imdb]");
const mapShell = document.querySelector("[data-map-shell]");
const mapSvg = document.querySelector(".world-map");
const zoomInButton = document.querySelector("[data-zoom-in]");
const zoomOutButton = document.querySelector("[data-zoom-out]");
const zoomResetButton = document.querySelector("[data-zoom-reset]");

panelImage.hidden = true;
panelImdb.hidden = true;

const baseViewBox = mapSvg.viewBox.baseVal;
const baseBox = {
  x: baseViewBox.x,
  y: baseViewBox.y,
  width: baseViewBox.width,
  height: baseViewBox.height,
};
const zoomState = { ...baseBox };
const minScale = 1;
const maxScale = 16;
let activePointer = null;
let lastPoint = null;
let didPan = false;
let pendingCountry = null;

function openMoviePanel(country) {
  const year = country.dataset.year ? ` · ${country.dataset.year}` : "";

  panelImage.src = country.dataset.image;
  panelImage.alt = `Poster for ${country.dataset.title}`;
  panelImage.hidden = false;
  panelCountry.textContent = `${country.dataset.country}${year}`;
  panelTitle.textContent = country.dataset.title;
  panelImdb.href = country.dataset.imdb;
  panelImdb.hidden = false;
}

function renderViewBox() {
  mapSvg.setAttribute(
    "viewBox",
    `${zoomState.x} ${zoomState.y} ${zoomState.width} ${zoomState.height}`,
  );
}

function currentScale() {
  return baseBox.width / zoomState.width;
}

function clampViewBox() {
  zoomState.width = Math.min(baseBox.width, Math.max(baseBox.width / maxScale, zoomState.width));
  zoomState.height = zoomState.width * (baseBox.height / baseBox.width);
  zoomState.x = Math.min(baseBox.x + baseBox.width - zoomState.width, Math.max(baseBox.x, zoomState.x));
  zoomState.y = Math.min(baseBox.y + baseBox.height - zoomState.height, Math.max(baseBox.y, zoomState.y));
}

function clientToSvgPoint(clientX, clientY) {
  const rect = mapSvg.getBoundingClientRect();
  return {
    x: zoomState.x + ((clientX - rect.left) / rect.width) * zoomState.width,
    y: zoomState.y + ((clientY - rect.top) / rect.height) * zoomState.height,
  };
}

function zoomAt(clientX, clientY, factor) {
  const before = clientToSvgPoint(clientX, clientY);
  const nextScale = Math.min(maxScale, Math.max(minScale, currentScale() * factor));
  const nextWidth = baseBox.width / nextScale;
  const nextHeight = baseBox.height / nextScale;
  const rect = mapSvg.getBoundingClientRect();
  const xRatio = (clientX - rect.left) / rect.width;
  const yRatio = (clientY - rect.top) / rect.height;

  zoomState.x = before.x - xRatio * nextWidth;
  zoomState.y = before.y - yRatio * nextHeight;
  zoomState.width = nextWidth;
  zoomState.height = nextHeight;
  clampViewBox();
  renderViewBox();
}

function zoomFromCenter(factor) {
  const rect = mapSvg.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
}

function resetZoom() {
  Object.assign(zoomState, baseBox);
  renderViewBox();
}

mapShell.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.18 : 1 / 1.18);
}, { passive: false });

mapSvg.addEventListener("pointerdown", (event) => {
  activePointer = event.pointerId;
  lastPoint = { x: event.clientX, y: event.clientY };
  didPan = false;
  pendingCountry = event.target.closest(".mapped-country");
  mapSvg.classList.add("is-panning");
  mapSvg.setPointerCapture(activePointer);
});

mapSvg.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer || !lastPoint) {
    return;
  }

  const rect = mapSvg.getBoundingClientRect();
  const dx = ((event.clientX - lastPoint.x) / rect.width) * zoomState.width;
  const dy = ((event.clientY - lastPoint.y) / rect.height) * zoomState.height;

  if (Math.abs(event.clientX - lastPoint.x) + Math.abs(event.clientY - lastPoint.y) > 1) {
    didPan = true;
  }

  zoomState.x -= dx;
  zoomState.y -= dy;
  lastPoint = { x: event.clientX, y: event.clientY };
  clampViewBox();
  renderViewBox();
});

mapSvg.addEventListener("pointerup", (event) => {
  if (event.pointerId !== activePointer) {
    return;
  }

  if (pendingCountry && !didPan) {
    openMoviePanel(pendingCountry);
  }

  mapSvg.classList.remove("is-panning");
  mapSvg.releasePointerCapture(activePointer);
  activePointer = null;
  lastPoint = null;
  pendingCountry = null;
});

mapSvg.addEventListener("pointercancel", () => {
  mapSvg.classList.remove("is-panning");
  activePointer = null;
  lastPoint = null;
  pendingCountry = null;
});

zoomInButton.addEventListener("click", () => zoomFromCenter(1.35));
zoomOutButton.addEventListener("click", () => zoomFromCenter(1 / 1.35));
zoomResetButton.addEventListener("click", resetZoom);
