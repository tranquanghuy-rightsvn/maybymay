#!/usr/bin/env python3
"""Generate the static pages of the May By Mây site from data/*.json.

Writes into html/:
  product/<handle>/index.html     one page per product
  collection/<handle>/index.html  one page per collection
  page/<handle>/index.html        info pages (policies, size guide, about)
  blog/...                        blog list, category pages and posts (data/posts.json)
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
blog = json.loads((DATA / "posts.json").read_text(encoding="utf-8"))
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


def blog_url(slug=None):
    return f"/blog/{slug}/" if slug else "/blog/"


def blog_cat_url(h):
    return f"/blog/chuyen-muc/{h}/"


def shared_html(value):
    return shared[value[1:]] if value.startswith("@") else value


def price_of(p):
    v = next((v for v in p["variants"] if v["available"]), p["variants"][0])
    return v["price"]


BRAND = "May By Mây"
SHOP = "Hộ Kinh Doanh Thời Trang May By Mây"
OG_IMAGE = "/images/og-image.webp"          # social share banner, 1200x630
OG_IMAGE_FALLBACK = "/images/og-image.jpg"  # same banner for crawlers that do not read WebP
STORE_ID = SITE + "/#store"
DEFAULT_DESC = "May By Mây – thời trang nữ: váy, áo, set đồ đồng bộ thanh lịch, dễ mặc. Đủ size S–XL, kiểm tra hàng trước khi thanh toán. Hotline / Zalo 0327 666 248."


def absu(path):
    return path if path.startswith("http") else SITE + path


def store_ld():
    prices = [price_of(p) for p in products]
    return {
        "@type": "ClothingStore",
        "@id": STORE_ID,
        "name": BRAND,
        "legalName": SHOP,
        "url": SITE + "/",
        "logo": absu("/images/logo.jpeg"),
        "image": absu(OG_IMAGE),
        "description": DEFAULT_DESC,
        "telephone": "+84327666248",
        "taxID": "038098030181",
        "address": {"@type": "PostalAddress", "addressLocality": "Phường Hoàng Liệt",
                    "addressRegion": "Thành phố Hà Nội", "addressCountry": "VN"},
        "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",
                                       "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                       "opens": "08:00", "closes": "21:00"}],
        "priceRange": f"{money(min(prices))} – {money(max(prices))}",
        "currenciesAccepted": "VND",
        "paymentAccepted": "Tiền mặt (COD), Chuyển khoản ngân hàng",
        "contactPoint": {"@type": "ContactPoint", "telephone": "+84327666248", "contactType": "customer service",
                         "availableLanguage": "vi"},
    }


def website_ld():
    return {
        "@type": "WebSite",
        "@id": SITE + "/#website",
        "url": SITE + "/",
        "name": BRAND,
        "inLanguage": "vi-VN",
        "publisher": {"@id": STORE_ID},
        "potentialAction": {"@type": "SearchAction", "target": SITE + "/search/?q={search_term_string}",
                            "query-input": "required name=search_term_string"},
    }


def breadcrumb_ld(trail):
    """trail: [(name, path), ...] starting after the home page."""
    items = [("Trang chủ", "/")] + trail
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": absu(u)} for i, (n, u) in enumerate(items)]}


def head_meta(title, description="", path="", image="", og_type="website", robots="", jsonld=(), og_extra=()):
    """<head> tags shared by every page: SEO meta, canonical, Open Graph / Twitter, icons, JSON-LD."""
    description = description or DEFAULT_DESC
    image = absu(image or OG_IMAGE)
    url = absu(path) if path else ""
    lines = [f"<title>{esc(title)}</title>",
             f'<meta name="description" content="{esc(description)}">']
    if robots:
        lines.append(f'<meta name="robots" content="{robots}">')
    elif url:
        lines.append(f'<link rel="canonical" href="{url}">')
    lines += [
        f'<meta property="og:site_name" content="{BRAND}">',
        '<meta property="og:locale" content="vi_VN">',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
    ]
    if url:
        lines.append(f'<meta property="og:url" content="{url}">')
    # each og:image is followed by its own type / size / alt (Open Graph structured properties)
    lines.append(f'<meta property="og:image" content="{image}">')
    if image.endswith(OG_IMAGE):
        lines += ['<meta property="og:image:type" content="image/webp">',
                  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']
    lines.append(f'<meta property="og:image:alt" content="{esc(title)}">')
    if image.endswith(OG_IMAGE):
        lines += [f'<meta property="og:image" content="{absu(OG_IMAGE_FALLBACK)}">',
                  '<meta property="og:image:type" content="image/jpeg">',
                  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']
    lines += [
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{esc(title)}">',
        f'<meta name="twitter:description" content="{esc(description)}">',
        f'<meta name="twitter:image" content="{image}">',
    ]
    lines += [f'<meta property="{k}" content="{esc(v)}">' for k, v in og_extra]
    lines += [
        '<meta name="theme-color" content="#fdfdfa">',
        '<link rel="icon" href="/favicon.ico" sizes="48x48">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">',
        '<link rel="manifest" href="/site.webmanifest">',
    ]
    if jsonld:
        data = {"@context": "https://schema.org", "@graph": list(jsonld)}
        lines.append('<script type="application/ld+json">' +
                     json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>")
    return "".join("  " + l + "\n" for l in lines)


def shell(title, body_class, main, scripts, description="", canonical="", image="", pages_css=True,
          og_type="website", jsonld=(), og_extra=(), robots=""):
    head_extra = head_meta(title, description, canonical, image, og_type, robots, jsonld, og_extra)
    css = '  <link rel="stylesheet" href="/css/style.css">\n'
    if pages_css:
        css += '  <link rel="stylesheet" href="/css/pages.css">\n'
    js = "".join(f'<script src="{s}"></script>\n' for s in ["/js/store.js", "/js/layout.js", "/js/main.js"] + scripts)
    return f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
{head_extra}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
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
        "</a>"
        '<button type="button" class="pro-loop__fav" data-fav aria-label="Yêu thích" aria-pressed="false"><svg><use href="#i-heart"/></svg></button>'
        '<div class="pro-loop__overlay">'
        '<div class="pro-loop__actions">'
        '<button type="button" class="pro-loop__btn" data-quick-open><svg><use href="#i-bag"/></svg><span>Thêm vào giỏ</span></button>'
        f'<a class="pro-loop__btn" href="{d["u"]}"><svg><use href="#i-eye"/></svg><span>Xem chi tiết</span></a>'
        "</div>"
        f'<div class="pro-loop__sizes"><span>Chọn size</span><div>{sizes}</div></div>'
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
        '<div class="carousel" data-carousel data-show="4,3,2">'
        '<button type="button" class="carousel__arrow carousel__arrow--prev" aria-label="Previous"><svg><use href="#i-left"/></svg></button>'
        f'<div class="carousel__viewport"><div class="carousel__track">{cards}</div></div>'
        '<button type="button" class="carousel__arrow carousel__arrow--next" aria-label="Next"><svg><use href="#i-right"/></svg></button>'
        "</div></section>"
    )


def popup(name, cls, body):
    return (
        f'<div class="side-popup {cls}" data-popup="{name}">'
        '<button type="button" class="side-popup__close" data-popup-close aria-label="Đóng"><svg><use href="#i-x"/></svg></button>'
        f'<div class="side-popup__body page-content">{body}</div></div>'
    )


def specs_html(p):
    out = []
    for line in p.get("specs", []):
        is_heading = re.fullmatch(r"[A-ZÀ-Ỹ\s]+", line) and len(line) < 40
        out.append(f"<h3>{esc(line)}</h3>" if is_heading else f"<p>{esc(line)}</p>")
    return "".join(out) or "<p>Đang cập nhật.</p>"


# colour name -> CSS background for the round colour picker (a swatch may override it with "css")
COLOR_CSS = {
    "trắng": "#ffffff",
    "trắng kem": "#efe6d2",
    "trắng hồng": "linear-gradient(135deg, #ffffff 50%, #f0c3cd 50%)",
    "đen": "#1c1c1c",
    "vàng": "#ecd36a",
    "xanh": "#a9c3e3",
    "nâu": "#5e3a2a",
    "hồng": "#efc4c9",
    "kẻ caro": "linear-gradient(90deg, rgba(74, 102, 168, 0.55) 50%, transparent 0) 0 0 / 8px 8px, "
               "linear-gradient(rgba(74, 102, 168, 0.55) 50%, #ffffff 0) 0 0 / 8px 8px",
    "hoa": "radial-gradient(circle, #b8323a 0 28%, transparent 30%) 0 0 / 9px 9px, "
           "radial-gradient(circle, #d9737b 0 22%, transparent 24%) 4.5px 4.5px / 9px 9px, #f7efe4",
}


def color_css(swatch):
    return swatch.get("css") or COLOR_CSS.get(swatch["name"].strip().lower(), "#cccccc")


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
            bg = f"background:{color_css(s)}"
            active = " is-active" if s["name"] == color else ""
            chips += f'<span class="sw-item sw-item--color{active}" data-color="{esc(s["name"])}" title="{esc(s["name"])}"><span style="{bg}"></span></span>'
        color_line = (
            f'<div class="sw-line sw-line--color"><div class="sw-title"><b>{esc(p["options"][color_idx]["name"])}: <span class="js-color-name">{esc(color)}</span></b>'
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
    col_crumb = next((c for h, c in collections.items() if h in ("dong-bo", "mua-he") and p["handle"] in c["products"]), collections["all"])
    product_ld = {
        "@type": "Product",
        "@id": absu(product_url(p["handle"])) + "#product",
        "name": p["title"],
        "description": desc,
        "image": [absu(i) for i in p["images"]],
        "sku": p.get("code", first["sku"]),
        "brand": {"@type": "Brand", "name": BRAND},
        "category": p.get("type", ""),
        "color": color,
        "size": p["options"][size_idx]["values"] if size_idx >= 0 else [],
        "offers": {
            "@type": "Offer",
            "url": absu(product_url(p["handle"])),
            "priceCurrency": "VND",
            "price": price_of(p),
            "availability": "https://schema.org/InStock" if p.get("available", True) else "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {"@id": STORE_ID},
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "VN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 7,
                "returnMethod": "https://schema.org/ReturnByMail",
            },
        },
    }
    crumbs = breadcrumb_ld([(col_crumb["title"], collection_url(col_crumb["handle"])), (p["title"], product_url(p["handle"]))])
    return shell(p["title"] + " – May By Mây", "page-inner page-product", main, ["/js/pages/product.js"],
                 description=desc, canonical=product_url(p["handle"]), image=p["images"][0], og_type="product",
                 og_extra=(("product:price:amount", str(price_of(p))), ("product:price:currency", "VND"),
                           ("product:availability", "in stock"), ("product:brand", BRAND)),
                 jsonld=(product_ld, crumbs, {"@id": STORE_ID, **store_ld()}))


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
    desc = f"{c['title']} – {len(c['products'])} mẫu thời trang nữ May By Mây, đủ size S–XL, giá từ {money(min(price_of(by_handle[h]) for h in c['products']))}. Hotline / Zalo 0327 666 248."
    item_list = {
        "@type": "CollectionPage",
        "name": c["title"],
        "url": absu(collection_url(c["handle"])),
        "isPartOf": {"@id": SITE + "/#website"},
        "mainEntity": {"@type": "ItemList", "numberOfItems": len(c["products"]), "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": absu(product_url(h)), "name": by_handle[h]["title"]}
            for i, h in enumerate(c["products"]) if h in by_handle]},
    }
    return shell("May By Mây – " + c["title"], "page-inner page-collection", main, [],
                 description=desc, canonical=collection_url(c["handle"]), image=first,
                 jsonld=(item_list, breadcrumb_ld([(c["title"], collection_url(c["handle"]))])))


def info_page(handle, pg):
    main = (
        '  <div class="container-xl">\n    <div class="page-layout">\n      <div class="page-wrapper">\n'
        f'        <h1>{esc(pg["title"])}</h1>\n'
        f'        <div class="page-content">{shared_html(pg["html"])}</div>\n'
        "      </div>\n    </div>\n  </div>"
    )
    text = re.sub(r"<[^>]+>", " ", shared_html(pg["html"]))
    text = re.sub(r"Cập nhật lần cuối: [\d/]+", "", re.sub(r"\s+", " ", text)).strip()
    desc = (text[:155].rsplit(" ", 1)[0] + "…") if len(text) > 160 else text
    return shell("May By Mây – " + pg["title"], "page-inner page-page", main, [],
                 description=desc, canonical=page_url(handle),
                 jsonld=({"@type": "WebPage", "name": pg["title"], "url": absu(page_url(handle)), "isPartOf": {"@id": SITE + "/#website"}},
                         breadcrumb_ld([(pg["title"], page_url(handle))])))


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

# ---------------- blog ----------------
blog_cats = {c["handle"]: c for c in blog["categories"]}
blog_posts = sorted(blog["posts"], key=lambda x: x["date"], reverse=True)


def vn_date(iso):
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


def post_card(post):
    cat = blog_cats[post["category"]]
    url = blog_url(post["slug"])
    return (
        '<article class="post-card">'
        f'<a class="post-card__img" href="{url}"><img src="{post["cover"]}" alt="{esc(post["title"])}" loading="lazy"></a>'
        '<div class="post-card__body">'
        f'<p class="post-meta"><a href="{blog_cat_url(cat["handle"])}">{esc(cat["title"])}</a><span>{vn_date(post["date"])}</span></p>'
        f'<h2 class="post-card__title"><a href="{url}">{esc(post["title"])}</a></h2>'
        f'<p class="post-card__excerpt">{esc(post["excerpt"])}</p>'
        f'<a class="post-card__more" href="{url}">Đọc tiếp ›</a>'
        "</div></article>"
    )


def blog_tabs(active):
    tabs = [("", "Tất cả", blog_url())] + [(c["handle"], c["title"], blog_cat_url(c["handle"])) for c in blog["categories"]]
    on = ' class="is-active" aria-current="page"'
    return '<nav class="blog-tabs" aria-label="Chuyên mục">' + "".join(
        f'<a href="{u}"{on if h == active else ""}>{esc(t)}</a>' for h, t, u in tabs
    ) + "</nav>"


def blog_list_page(active, posts_, title, intro):
    grid = "".join(post_card(x) for x in posts_) or '<p class="collection__empty">Chưa có bài viết.</p>'
    main = (
        '  <div class="blog">\n'
        f'    <h1 class="blog__title">{esc(title)}</h1>\n'
        f'    <p class="blog__intro">{esc(intro)}</p>\n'
        f'    {blog_tabs(active)}\n'
        f'    <div class="post-grid">{grid}</div>\n'
        "  </div>"
    )
    canonical = blog_cat_url(active) if active else blog_url()
    page_title = "Blog – May By Mây" if not active else f"{title} – Blog May By Mây"
    blog_ld = {
        "@type": "Blog" if not active else "CollectionPage",
        "name": title if active else "Blog May By Mây",
        "url": absu(canonical),
        "publisher": {"@id": STORE_ID},
        "blogPost" if not active else "hasPart": [{"@type": "BlogPosting", "headline": x["title"], "url": absu(blog_url(x["slug"])),
                                                  "datePublished": x["date"]} for x in posts_],
    }
    trail = [("Blog", blog_url())] + ([(title, canonical)] if active else [])
    return shell(page_title, "page-inner page-blog", main, [], description=intro, canonical=canonical,
                 image=posts_[0]["cover"] if posts_ else "", jsonld=(blog_ld, breadcrumb_ld(trail)))


def post_page(post):
    cat = blog_cats[post["category"]]
    others = [x for x in blog_posts if x["slug"] != post["slug"]][:3]
    by_code = {p["code"]: p for p in products}
    featured = [by_code[c] for c in blog.get("featured", []) if c in by_code]   # same list under every post
    related = ""
    if featured:
        related += (
            '<section class="post-products"><h2 class="post-section-title">Sản phẩm nổi bật</h2>'
            f'<div class="product-grid post-products__grid">{"".join(card(p) for p in featured)}</div></section>'
        )
    if others:
        related += (
            '<section class="post-more"><h2 class="post-section-title">Bài viết khác</h2>'
            f'<div class="post-grid post-grid--small">{"".join(post_card(x) for x in others)}</div></section>'
        )
    main = (
        '  <article class="post">\n'
        '    <nav class="breadcrumb-trail" aria-label="Đường dẫn">'
        f'<a href="/">Trang chủ</a><span>/</span><a href="{blog_url()}">Blog</a><span>/</span>'
        f'<a href="{blog_cat_url(cat["handle"])}">{esc(cat["title"])}</a></nav>\n'
        f'    <p class="post-meta"><a href="{blog_cat_url(cat["handle"])}">{esc(cat["title"])}</a><span>{vn_date(post["date"])}</span><span>May By Mây</span></p>\n'
        f'    <h1 class="post__title">{esc(post["title"])}</h1>\n'
        f'    <p class="post__lead">{esc(post["excerpt"])}</p>\n'
        f'    <img class="post__cover" src="{post["cover"]}" alt="{esc(post["title"])}">\n'
        f'    <div class="post__content page-content">{post["html"]}</div>\n'
        "  </article>\n"
        f'  <div class="post-related">{related}</div>'
    )
    posting = {
        "@type": "BlogPosting",
        "headline": post["title"],
        "description": post["excerpt"],
        "image": [absu(post["cover"])],
        "datePublished": post["date"],
        "dateModified": post.get("updated", post["date"]),
        "articleSection": cat["title"],
        "inLanguage": "vi-VN",
        "author": {"@type": "Organization", "name": BRAND, "url": SITE + "/"},
        "publisher": {"@type": "Organization", "name": BRAND, "logo": {"@type": "ImageObject", "url": absu("/images/logo.jpeg")}},
        "mainEntityOfPage": absu(blog_url(post["slug"])),
    }
    crumbs = breadcrumb_ld([("Blog", blog_url()), (cat["title"], blog_cat_url(cat["handle"])), (post["title"], blog_url(post["slug"]))])
    return shell(post["title"] + " – Blog May By Mây", "page-inner page-post", main, [],
                 description=post["excerpt"], canonical=blog_url(post["slug"]), image=post["cover"], og_type="article",
                 og_extra=(("article:published_time", post["date"]), ("article:section", cat["title"])),
                 jsonld=(posting, crumbs))


blog_items = [("index.html", blog_list_page("", blog_posts, "Blog",
               "Mẹo phối đồ, tin tức thời trang và cách chăm sóc trang phục từ May By Mây."))]
for c in blog["categories"]:
    blog_items.append((f"chuyen-muc/{c['handle']}/index.html",
                       blog_list_page(c["handle"], [x for x in blog_posts if x["category"] == c["handle"]], c["title"], c["description"])))
for x in blog_posts:
    blog_items.append((f"{x['slug']}/index.html", post_page(x)))
if (OUT / "blog").exists():
    shutil.rmtree(OUT / "blog")
for rel, text in blog_items:
    write(OUT / "blog" / rel, text)

# home: one carousel per collection, between <!-- build:<handle> --> markers
home = OUT / "index.html"
text = home.read_text(encoding="utf-8")


def fill(m):
    handle = m.group(1)
    if handle not in collections:
        raise SystemExit(f"index.html: unknown collection in marker build:{handle}")
    cards = "".join(card(by_handle[h]) for h in collections[handle]["products"] if h in by_handle)
    return f"<!-- build:{handle} -->{cards}<!-- /build:{handle} -->"


text, n = re.subn(r"<!-- build:(?!head\b)([a-z0-9-]+) -->.*?<!-- /build:\1 -->", fill, text, flags=re.S)
if n == 0:
    raise SystemExit("index.html: no build markers found")
write(home, text)

# search index (plain script, loaded with <script src>)
index = [card_data(p) for p in products]
write(OUT / "js" / "search-index.js",
      "/* Generated by scripts/build.py — do not edit. */\nwindow.SEARCH_INDEX = " + json.dumps(index, ensure_ascii=False) + ";\n")

# hand-written pages: fill their <head> (between <!-- build:head --> markers) with the shared tags
STATIC_PAGES = {
    "index.html": dict(title="May By Mây – Thời trang nữ thiết kế: váy, áo, set đồ đồng bộ", path="/",
                       jsonld=(store_ld(), website_ld())),
    "contact/index.html": dict(title="May By Mây – Liên hệ", path="/contact/",
                               description="Liên hệ May By Mây: hotline / Zalo 0327 666 248, 8:00 – 21:00 mỗi ngày. Hộ Kinh Doanh Thời Trang May By Mây, MST 038098030181, Phường Hoàng Liệt, Hà Nội.",
                               jsonld=({"@type": "ContactPage", "name": "Liên hệ", "url": SITE + "/contact/", "about": {"@id": STORE_ID}},
                                       store_ld(), breadcrumb_ld([("Liên hệ", "/contact/")]))),
    "cart/index.html": dict(title="Giỏ hàng – May By Mây", robots="noindex, follow"),
    "search/index.html": dict(title="Tìm kiếm – May By Mây", robots="noindex, follow"),
    "thanh-toan/index.html": dict(title="Thanh toán – May By Mây", robots="noindex, follow"),
    "yeu-thich/index.html": dict(title="Sản phẩm yêu thích – May By Mây", robots="noindex, follow"),
}
for rel, meta in STATIC_PAGES.items():
    f = OUT / rel
    text = f.read_text(encoding="utf-8")
    block = head_meta(meta["title"], meta.get("description", ""), meta.get("path", ""), "", "website",
                      meta.get("robots", ""), meta.get("jsonld", ()))
    text, n = re.subn(r"  <!-- build:head -->.*?<!-- /build:head -->\n",
                      lambda m: "  <!-- build:head -->\n" + block + "  <!-- /build:head -->\n", text, flags=re.S)
    if n != 1:
        raise SystemExit(f"{rel}: build:head markers not found")
    write(f, text)

write(OUT / "robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

# Vietnam provinces + wards (2-level, 34 provinces) for the checkout address pickers,
# shipped as a plain script so the checkout page needs no fetch()
area = []
for prov in json.loads((DATA / "area" / "provinces.json").read_text(encoding="utf-8")):
    wards = json.loads((DATA / "area" / "wards" / f"{prov['code']}.json").read_text(encoding="utf-8"))
    area.append({"n": prov["name"], "w": sorted((w["name"] for w in wards), key=str.lower)})
FIRST = ["Thành phố Hà Nội", "Thành phố Hồ Chí Minh"]   # most orders: list them first
area.sort(key=lambda p: (FIRST.index(p["n"]) if p["n"] in FIRST else len(FIRST), p["n"]))
write(OUT / "js" / "vn-area.js",
      "/* Generated by scripts/build.py from data/area — do not edit. */\nwindow.VN_AREA = "
      + json.dumps(area, ensure_ascii=False, separators=(",", ":")) + ";\n")

# sitemap
urls = (["/", "/contact/", blog_url()] + [collection_url(h) for h in collections] + [product_url(p["handle"]) for p in products]
        + [page_url(h) for h in pages] + [blog_cat_url(c["handle"]) for c in blog["categories"]] + [blog_url(x["slug"]) for x in blog_posts])
write(OUT / "sitemap.xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")

print(f"products: {len(products)}, collections: {len(collections)}, pages: {len(pages)}, blog posts: {len(blog_posts)}")
