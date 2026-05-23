# Movie Map

Simple Flask site that renders a SimpleMaps world SVG and fills configured countries with poster images from `config.yaml`.

## Run with Docker

```bash
docker compose up --build
```

Open http://localhost:7419.

## Configure Countries

Use two-letter country IDs from the SVG:

```yaml
countries:
  FR:
    country: France
    title: Little Amelie or the Character of Rain
    year: 2025
    imdb: https://www.imdb.com/title/tt29313285/
    image: https://example.com/poster.jpg
```

The bundled SVG is from SimpleMaps and includes its original MIT license notice.
