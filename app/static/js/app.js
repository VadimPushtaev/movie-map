const panel = document.querySelector("[data-movie-panel]");
const closeButton = document.querySelector("[data-panel-close]");
const panelImage = document.querySelector("[data-panel-image]");
const panelCountry = document.querySelector("[data-panel-country]");
const panelTitle = document.querySelector("[data-panel-title]");
const panelImdb = document.querySelector("[data-panel-imdb]");

function openMoviePanel(country) {
  const year = country.dataset.year ? ` · ${country.dataset.year}` : "";

  panelImage.src = country.dataset.image;
  panelImage.alt = `Poster for ${country.dataset.title}`;
  panelCountry.textContent = `${country.dataset.country}${year}`;
  panelTitle.textContent = country.dataset.title;
  panelImdb.href = country.dataset.imdb;
  panel.hidden = false;
}

function closeMoviePanel() {
  panel.hidden = true;
}

document.addEventListener("click", (event) => {
  const country = event.target.closest(".mapped-country");
  if (!country) {
    return;
  }

  openMoviePanel(country);
});

closeButton.addEventListener("click", closeMoviePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMoviePanel();
  }
});
