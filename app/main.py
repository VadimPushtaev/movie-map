from __future__ import annotations

import os
from pathlib import Path
import re
from typing import Any
from xml.etree import ElementTree as ET

import yaml
from flask import Flask, render_template
from markupsafe import Markup


BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config.yaml"
WORLD_SVG_PATH = BASE_DIR / "app" / "static" / "vendor" / "world.svg"
SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"

ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK_NS)


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index() -> str:
        config = load_config(CONFIG_PATH)
        countries = config.get("countries", {})
        map_svg = build_map_svg(WORLD_SVG_PATH, countries)

        return render_template(
            "index.html",
            map_svg=Markup(map_svg),
            countries=countries,
        )

    return app


def load_config(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"countries": {}}

    with path.open(encoding="utf-8") as config_file:
        loaded = yaml.safe_load(config_file) or {}

    countries = loaded.get("countries", {})
    if not isinstance(countries, dict):
        raise ValueError("config.yaml must contain a 'countries' mapping")

    normalized = {
        str(code).upper(): value
        for code, value in countries.items()
        if isinstance(value, dict) and value.get("image")
    }
    return {"countries": normalized}


def build_map_svg(svg_path: Path, countries: dict[str, dict[str, Any]]) -> str:
    root = ET.parse(svg_path).getroot()
    ensure_accessible_svg(root)
    darken_unmapped_countries(root)
    defs = ensure_defs(root)

    for country_code, country in countries.items():
        country_node = find_country(root, country_code)
        if country_node is None:
            continue

        pattern_id = f"poster-{country_code.lower()}"
        add_image_pattern(defs, pattern_id, str(country["image"]))
        decorate_country(country_node, country_code, pattern_id, country)

    return ET.tostring(root, encoding="unicode")


def darken_unmapped_countries(root: ET.Element) -> None:
    for element in root.iter():
        if "data-id" not in element.attrib:
            continue
        style = parse_style(element.attrib.get("style", ""))
        style["fill"] = "#222831"
        style.setdefault("fill-rule", "evenodd")
        element.set("style", serialize_style(style))


def ensure_accessible_svg(root: ET.Element) -> None:
    root.set("role", "img")
    root.set("aria-label", "World map with movie poster fills by country")
    root.set("class", "world-map")
    if "viewBox" not in root.attrib:
        width = root.attrib.get("width")
        height = root.attrib.get("height")
        if width and height:
            root.set("viewBox", f"0 0 {strip_unit(width)} {strip_unit(height)}")
    root.attrib.pop("width", None)
    root.attrib.pop("height", None)


def ensure_defs(root: ET.Element) -> ET.Element:
    defs = root.find(f"{{{SVG_NS}}}defs")
    if defs is None:
        defs = ET.Element(f"{{{SVG_NS}}}defs")
        root.insert(0, defs)
    return defs


def add_image_pattern(defs: ET.Element, pattern_id: str, image_url: str) -> None:
    pattern = ET.SubElement(
        defs,
        f"{{{SVG_NS}}}pattern",
        {
            "id": pattern_id,
            "width": "1",
            "height": "1",
            "patternUnits": "objectBoundingBox",
            "patternContentUnits": "objectBoundingBox",
        },
    )
    image = ET.SubElement(
        pattern,
        f"{{{SVG_NS}}}image",
        {
            "x": "0",
            "y": "0",
            "width": "1",
            "height": "1",
            "preserveAspectRatio": "xMidYMid slice",
        },
    )
    image.set("href", image_url)
    image.set(f"{{{XLINK_NS}}}href", image_url)


def decorate_country(
    node: ET.Element,
    country_code: str,
    pattern_id: str,
    country: dict[str, Any],
) -> None:
    existing_style = parse_style(node.attrib.get("style", ""))
    existing_style["fill"] = f"url(#{pattern_id})"
    existing_style.setdefault("fill-rule", "evenodd")
    existing_style["stroke"] = "#ffffff"
    existing_style["stroke-width"] = "1.2"
    node.set("style", serialize_style(existing_style))
    node.set("class", "mapped-country")
    node.set("data-country-code", country_code)
    node.set("data-title", str(country.get("title", "")))
    node.set("data-imdb", str(country.get("imdb", "")))

    title_text = country.get("title") or country.get("country") or country_code
    if country.get("year"):
        title_text = f"{title_text} ({country['year']})"
    ET.SubElement(node, f"{{{SVG_NS}}}title").text = str(title_text)


def find_country(root: ET.Element, country_code: str) -> ET.Element | None:
    for element in root.iter():
        if element.attrib.get("id") == country_code or element.attrib.get("data-id") == country_code:
            return element
    return None


def parse_style(style: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for item in style.split(";"):
        if ":" not in item:
            continue
        key, value = item.split(":", 1)
        parsed[key.strip()] = value.strip()
    return parsed


def serialize_style(style: dict[str, str]) -> str:
    return ";".join(f"{key}:{value}" for key, value in style.items())


def strip_unit(value: str) -> str:
    return re.sub(r"[^0-9.]", "", value)


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "7419")))
