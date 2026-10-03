#!/usr/bin/env python3
"""Generate the static pages of the May By Mây site from data/*.json.

Writes into html/:
  product/<handle>/index.html     one page per product
  collection/<handle>/index.html  one page per collection
  page/<handle>/index.html        info pages (policies, size guide, about)
  index.html                      fills the home carousels between <!-- build:<collection> --> markers
  js/search-index.js              product list used by the search page
  sitemap.xml

Run after editing data/:  python3 scripts/build.py
"""
import json
import re
import shutil
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "html"
SITE = "https://maybymay.vn"
# "Cùng bộ sưu tập" uses the first of these that holds the product (and another product)
RELATED_ORDER = ["dong-bo", "mua-he"]

products = json.loads((DATA / "products.json").read_text(encoding="utf-8"))
collections = json.loads((DATA / "collections.json").read_text(encoding="utf-8"))
pages = json.loads((DATA / "pages.json").read_text(encoding="utf-8"))
shared = pages.pop("_shared")
by_handle = {p["handle"]: p for p in products}


def esc(s):
    return escape(str(s), quote=True)


def money(n):
    return f"{round(n):,}đ"


def product_url(h):
    return f"/product/{h}/"


def collection_url(h):
    return f"/collection/{h}/"


def page_url(h):
    return f"/page/{h}/"


def shared_html(value):
    return shared[value[1:]] if value.startswith("@") else value


def price_of(p):
    v = next((v for v in p["variants"] if v["available"]), p["variants"][0])
    return v["price"]


def shell(title, body_class, main, scripts, description="", canonical="", image="", pages_css=True):
    head_extra = ""
    if description:
        head_extra += f'  <meta name="description" content="{esc(description)}">\n'
    if canonical:
        head_extra += f'  <link rel="canonical" href="{SITE}{canonical}">\n'
        head_extra += f'  <meta property="og:title" content="{esc(title)}">\n'
        head_extra += f'  <meta property="og:url" content="{SITE}{canonical}">\n'
    if image:
        head_extra += f'  <meta property="og:image" content="{SITE}{image}">\n'
    css = '  <link rel="stylesheet" href="/css/style.css">\n'
    if pages_css:
        css += '  <link rel="stylesheet" href="/css/pages.css">\n'
    js = "".join(f'<script src="{s}"></script>\n' for s in ["/js/store.js", "/js/layout.js", "/js/main.js"] + scripts)
    return f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
{head_extra}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="icon" type="image/jpeg" href="/images/logo.jpeg">
{css}</head>
<body class="{body_class}">

<main>
{main}
</main>

{js}</body>
</html>
"""


def card_data(p):
    """Everything a product card needs for quick add-to-cart and the wishlist (also used by search)."""
    color_idx = p["colorIndex"]
    size_idx = option_index(p, r"kích|size")
    return {
        "h": p["handle"],
        "t": p["title"],
        "u": product_url(p["handle"]),
        "i1": p["images"][0],
        "i2": p["images"][1] if len(p["images"]) > 1 else p["images"][0],
        "p": price_of(p),
        "c": p["variants"][0]["options"][color_idx] if color_idx >= 0 else "",
        "v": [[v["options"][size_idx] if size_idx >= 0 else v["title"], v["id"]] for v in p["variants"] if v["available"]],
    }


def card(p):
    d = card_data(p)
    t = esc(d["t"])
    data = esc(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    sizes = "".join(f'<button type="button" data-quick-size="{esc(s)}">{esc(s)}</button>' for s, _ in d["v"])
    return (
        f'<div class="pro-loop" data-card="{data}"><div class="pro-loop__wrap">'
        f'<div class="pro-loop__image"><a href="{d["u"]}">'
        f'<img class="img-1" src="{d["i1"]}" alt="{t}" loading="lazy">'
        f'<img class="img-2" src="{d["i2"]}" alt="" loading="lazy">'
        "</a>"
        '<button type="button" class="pro-loop__fav" data-fav aria-label="Yêu thích" aria-pressed="false"><svg><use href="#i-heart"/></svg></button>'
        '<div class="pro-loop__quick">'
        '<button type="button" class="pro-loop__add" data-quick-open>+ Thêm vào giỏ</button>'
        f'<div class="pro-loop__sizes"><span>Chọn size</span>{sizes}</div>'
        "</div></div>"
        f'<h3 class="pro-loop__name"><a href="{d["u"]}" title="{t}">{t}</a></h3>'
        f'<div class="pro-loop__price"><strong>{money(d["p"])}</strong></div>'
        "</div></div>"
    )


def carousel_section(title, items):
    if not items:
        return ""
    cards = "".join(card(p) for p in items)
    return (
        '<section class="product__related">'
        f'<div class="section-head"><h2>{title}</h2></div>'
        '<div class="carousel" data-carousel data-show="4.5,3,2.2">'
        '<button type="button" class="carousel__arrow carousel__arrow--prev" aria-label="Previous"><svg><use href="#i-left"/></svg></button>'
        f'<div class="carousel__viewport"><div class="carousel__track">{cards}</div></div>'
        '<button type="button" class="carousel__arrow carousel__arrow--next" aria-label="Next"><svg><use href="#i-right"/></svg></button>'
        "</div></section>"
    )


def popup(name, cls, body):
    return (
        f'<div class="side-popup {cls}" data-popup="{name}">'
        '<button type="button" class="side-popup__close" data-popup-close aria-label="Đóng"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></button>'
        f'<div class="side-popup__body">{body}</div></div>'
    )


def specs_html(p):
    out = []
    for line in p.get("specs", []):
        is_heading = re.fullmatch(r"[A-ZÀ-Ỹ\s]+", line) and len(line) < 40
        out.append(f"<h3>{esc(line)}</h3>" if is_heading else f"<p>{esc(line)}</p>")
    return "".join(out) or "<p>Đang cập nhật.</p>"


def option_index(p, pattern):
    return next((i for i, o in enumerate(p["options"]) if re.search(pattern, o["name"], re.I)), -1)


def product_page(p):
    color_idx = p["colorIndex"]
    size_idx = option_index(p, r"kích|size")
    first = next((v for v in p["variants"] if v["available"]), p["variants"][0])
    color = first["options"][color_idx] if color_idx >= 0 else ""
    size = first["options"][size_idx] if size_idx >= 0 else ""
    title = esc(p["title"])

    thumbs = "".join(
        f'<button type="button" class="product__thumb{" is-active" if i == 0 else ""}" data-thumb="{i}" aria-label="Ảnh {i + 1}">'
        f'<img src="{src}" alt="{title} - ảnh {i + 1}"></button>'
        for i, src in enumerate(p["images"])
    )
    arrows = (
        '<button type="button" class="product__nav product__nav--prev" data-step="-1" aria-label="Ảnh trước"><svg><use href="#i-left"/></svg></button>'
        '<button type="button" class="product__nav product__nav--next" data-step="1" aria-label="Ảnh sau"><svg><use href="#i-right"/></svg></button>'
    ) if len(p["images"]) > 1 else ""
    gallery = (
        '<div class="product__gallery">'
        f'<div class="product__thumbs">{thumbs}</div>'
        f'<div class="product__main"><img class="js-main-img" src="{p["images"][0]}" alt="{title}">{arrows}'
        f'<span class="product__count"><span class="js-count">1</span> / {len(p["images"])}</span></div>'
        "</div>"
    )

    color_line = ""
    if color_idx >= 0:
        chips = ""
        for s in p["swatches"]:
            v = next((v for v in p["variants"] if v["options"][color_idx] == s["name"] and v.get("image")), None)
            bg = f"background-image:url({s['chip']})" if s.get("chip") else (f"background-image:url({v['image']})" if v else "background:#ccc")
            active = " is-active" if s["name"] == color else ""
            chips += f'<span class="sw-item sw-item--color{active}" data-color="{esc(s["name"])}" title="{esc(s["name"])}"><span style="{bg}"></span></span>'
        color_line = (
            f'<div class="sw-line sw-line--color"><div class="sw-title"><b>{esc(p["options"][color_idx]["name"])}</b>'
            f'<p>Màu sản phẩm thật giống hình ảnh đến 99%</p></div><div class="sw-select">{chips}</div></div>'
        )

    size_line = ""
    if size_idx >= 0:
        items = ""
        for s in p["options"][size_idx]["values"]:
            active = " is-active" if s == size else ""
            items += f'<span class="sw-item sw-item--size{active}" data-size="{esc(s)}">{esc(s)}</span>'
        size_line = (
            f'<div class="sw-line sw-line--size"><div class="sw-title"><b>Kích cỡ</b></div><div class="sw-select">{items}</div>'
            '<a class="link-underline sw-size-guide js-open-size">Bảng kích cỡ</a></div>'
        )

    # variant table for the add-to-cart script (no data fetching at runtime)
    variants = [
        {"id": v["id"], "options": v["options"], "sku": v["sku"], "price": v["price"],
         "compare": v["compare"], "available": v["available"], "image": v.get("image") or p["images"][0]}
        for v in p["variants"]
    ]
    product_json = json.dumps(
        {"handle": p["handle"], "title": p["title"], "images": p["images"], "colorIndex": color_idx,
         "sizeIndex": size_idx, "swatches": p["swatches"], "variants": variants},
        ensure_ascii=False,
    ).replace("</", "<\\/")

    col = next(
        (collections[h] for h in RELATED_ORDER
         if h in collections and p["handle"] in collections[h]["products"] and len(collections[h]["products"]) > 1),
        collections["all"],
    )
    same = [by_handle[h] for h in col["products"] if h != p["handle"] and h in by_handle][:12]
    same_set = {x["handle"] for x in same} | {p["handle"]}
    others = [x for x in products if x["handle"] not in same_set][:8]

    main = (
        '  <div class="product" id="product">'
        '<div class="product__wrap">'
        + gallery
        +
        '<div class="product__side"><div class="product__detail">'
        f'<a class="product__back" href="{collection_url("all")}"><svg><use href="#i-long-arrow-left"/></svg>Xem thêm sản phẩm</a>'
        f'<h1 class="product__title">{title}</h1>'
        f'<div class="product__sku"><span>SKU:</span><b class="js-sku" style="font-weight:300">{esc(first["sku"])}</b></div>'
        f'<div class="product__price"><span class="product__price-main js-price">{money(first["price"])}</span><del class="js-compare"></del></div>'
        f'<div class="product__swatch">{color_line}{size_line}</div>'
        '<div class="product__links"><div class="js-open-size"><a class="link-underline">Bảng kích cỡ</a></div><div><a class="link-underline js-open-info">Thông tin sản phẩm</a></div></div>'
        '<div class="product__qty"><button type="button" data-qty="-1">-</button><input type="number" min="1" value="1" class="js-qty"><button type="button" data-qty="1">+</button></div>'
        '<button type="button" class="btn-add js-add">THÊM VÀO GIỎ HÀNG</button>'
        f'<button type="button" class="btn-fav" data-fav data-card="{esc(json.dumps(card_data(p), ensure_ascii=False, separators=(",", ":")))}" aria-pressed="false">'
        '<svg><use href="#i-heart"/></svg><span class="btn-fav__off">Thêm vào yêu thích</span><span class="btn-fav__on">Đã thêm vào yêu thích</span></button>'
        '<p class="product__ship"><a class="link-underline js-open-ship">Chính sách giao hàng</a></p>'
        "</div></div></div>"
        + carousel_section("CÙNG BỘ SƯU TẬP", same)
        + carousel_section("CÓ THỂ BẠN CŨNG THÍCH", others)
        + popup("size", "side-popup--info", shared["size"])
        + popup("info", "side-popup--info", specs_html(p))
        + popup("ship", "side-popup--ship", shared["shipping"])
        + "</div>\n"
        f'  <script type="application/json" id="product-data">{product_json}</script>'
    )
    color_text = f" Màu {color}." if color else ""
    desc = f"{p['title']} - {money(price_of(p))}.{color_text} Size {' '.join(p['options'][size_idx]['values']) if size_idx >= 0 else ''}. Hotline 0327 666 248."
    return shell(p["title"] + " – May By Mây", "page-inner page-product", main, ["/js/pages/product.js"],
                 description=desc, canonical=product_url(p["handle"]), image=p["images"][0])


def collection_page(c):
    grid = "".join(card(by_handle[h]) for h in c["products"] if h in by_handle)
    main = (
        '  <div class="collection">\n'
        f'    <h3 class="collection__title">{esc(c["title"])}</h3>\n'
        f'    <div class="collection__desc">{esc(c.get("description", ""))}</div>\n'
        f'    <div class="product-grid">{grid}</div>\n'
        "  </div>"
    )
    first = by_handle[c["products"][0]]["images"][0] if c["products"] else ""
    return shell("May By Mây – " + c["title"], "page-inner page-collection", main, [],
                 description=f"{c['title']} - May By Mây. Hotline 0327 666 248.", canonical=collection_url(c["handle"]), image=first)


def info_page(handle, pg):
    main = (
        '  <div class="container-xl">\n    <div class="page-layout">\n      <div class="page-wrapper">\n'
        f'        <h1>{esc(pg["title"])}</h1>\n'
        f'        <div class="page-content">{shared_html(pg["html"])}</div>\n'
        "      </div>\n    </div>\n  </div>"
    )
    return shell("May By Mây – " + pg["title"], "page-inner page-page", main, [],
                 description=f"{pg['title']} - May By Mây.", canonical=page_url(handle))


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def rebuild_dir(name, items):
    """Replace html/<name>/ with exactly the generated sub-pages."""
    d = OUT / name
    if d.exists():
        shutil.rmtree(d)
    for handle, text in items:
        write(d / handle / "index.html", text)


rebuild_dir("product", [(p["handle"], product_page(p)) for p in products])
rebuild_dir("collection", [(h, collection_page(c)) for h, c in collections.items()])
rebuild_dir("page", [(h, info_page(h, pg)) for h, pg in pages.items()])

# home: one carousel per collection, between <!-- build:<handle> --> markers
home = OUT / "index.html"
text = home.read_text(encoding="utf-8")


def fill(m):
    handle = m.group(1)
    if handle not in collections:
        raise SystemExit(f"index.html: unknown collection in marker build:{handle}")
    cards = "".join(card(by_handle[h]) for h in collections[handle]["products"] if h in by_handle)
    return f"<!-- build:{handle} -->{cards}<!-- /build:{handle} -->"


text, n = re.subn(r"<!-- build:([a-z0-9-]+) -->.*?<!-- /build:\1 -->", fill, text, flags=re.S)
if n == 0:
    raise SystemExit("index.html: no build markers found")
write(home, text)

# search index (plain script, loaded with <script src>)
index = [card_data(p) for p in products]
write(OUT / "js" / "search-index.js",
      "/* Generated by scripts/build.py — do not edit. */\nwindow.SEARCH_INDEX = " + json.dumps(index, ensure_ascii=False) + ";\n")

# sitemap
urls = ["/", "/contact/"] + [collection_url(h) for h in collections] + [product_url(p["handle"]) for p in products] + [page_url(h) for h in pages]
write(OUT / "sitemap.xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")

print(f"products: {len(products)}, collections: {len(collections)}, pages: {len(pages)}")
