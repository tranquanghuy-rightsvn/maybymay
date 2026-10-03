# May By Mây — website

Static storefront for Hộ Kinh Doanh Thời Trang May By Mây. Every page is plain HTML; JavaScript only adds behaviour (menus, sliders, size picker, cart). No page loads data with `fetch()`.

- `html/` — the website. Deploy this folder as-is to any static host.
- `data/` — source data: `products.json`, `collections.json`, `pages.json` (info pages, size guide, shipping text).
- `scripts/build.py` — generates the static pages from `data/`.

## Edit content

1. Change `data/*.json` (and add photos to `html/images/products/<handle>/`).
2. Run `python3 scripts/build.py` (Python 3, no packages needed).

The build rewrites:

| Output | From |
|---|---|
| `html/product/<handle>/index.html` | `data/products.json` |
| `html/collection/<handle>/index.html` | `data/collections.json` |
| `html/page/<handle>/index.html` | `data/pages.json` |
| Home carousels in `html/index.html` (between `<!-- build:<collection> -->` markers) | `san-pham-moi`, `mua-he`, `dong-bo` |
| `html/js/search-index.js` | product list for the search page |
| `html/sitemap.xml` | all pages |

Do not edit generated files by hand; the next build overwrites them.

### Adding a product

1. Put photos in `html/images/products/<handle>/1.jpg, 2.jpg, ...`.
2. Add an entry to `data/products.json` (copy an existing one; change `handle`, `title`, `code`, `images`, `options`, `variants`, `specs`).
3. Add the handle to `data/collections.json`: `all`; `dong-bo` for sets, otherwise `mua-he`; and `san-pham-moi` if it is new.
4. Run the build.

## Run locally

```bash
cd html && python3 -m http.server 5500
# open http://localhost:5500
```

## URLs

| URL | Page |
|---|---|
| `/` | Home |
| `/collection/<handle>/` | `all`, `san-pham-moi`, `mua-he`, `dong-bo` |
| `/product/<handle>/` | Product |
| `/page/<handle>/` | `thuong-hieu`, `bang-kich-co`, `chinh-sach-*`, `phuong-thuc-thanh-toan` |
| `/search/?q=<query>` | Search |
| `/cart/` | Cart (stored in `localStorage`) |
| `/yeu-thich/` | Wishlist — products hearted with ♡ (stored in `localStorage`) |
| `/contact/` | Contact (form is demo only) |
