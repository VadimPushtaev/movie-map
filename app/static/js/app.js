const panel = document.querySelector("[data-movie-panel]");
const panelImage = document.querySelector("[data-panel-image]");
const panelCountry = document.querySelector("[data-panel-country]");
const panelTitle = document.querySelector("[data-panel-title]");
const panelImdb = document.querySelector("[data-panel-imdb]");

panelImage.hidden = true;
panelImdb.hidden = true;

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

document.addEventListener("click", (event) => {
  const country = event.target.closest(".mapped-country");
  if (!country) {
    return;
  }

  openMoviePanel(country);
});
