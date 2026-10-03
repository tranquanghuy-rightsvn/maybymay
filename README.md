# May By Mây — website

Static storefront for Hộ Kinh Doanh Thời Trang May By Mây. Every page is plain HTML; JavaScript only adds behaviour (menus, sliders, size picker, cart). No page loads data with `fetch()`.

- `html/` — the website. Deploy this folder as-is to any static host.
- `data/` — source data. `products.json` + `products/<slug>/detail.json` and `blog.json` + `blog/<slug>/detail.json` are written by the CMS; `pages.json` (info pages, size guide, shipping text) and `area/` (provinces and wards) are edited by hand.
- `scripts/build.py` — generates the static pages from `data/`.
- CMS: Google Apps Script in `gas/` (not in the repo, see `gas/README.md`), business rules in `GAS.md`. Admin page: `/admin/`.

## Edit content

Products and blog posts: in the CMS (`https://maybymay.vn/admin/`). Saving commits to `data/`, then `.github/workflows/build.yml` runs the build and commits `html/`; Cloudflare deploys that commit. Info pages: edit `data/pages.json` and push.

Build locally: `python3 scripts/build.py` (Python 3, no packages needed).

The build rewrites:

| Output | From |
|---|---|
| `html/product/<slug>/index.html` | products (variants = colours × sizes) |
| `html/collection/<handle>/index.html` | `all`, `san-pham-moi` (ticked "Sản phẩm mới"), `mua-he`, `dong-bo` (the product's collection) |
| `html/page/<handle>/index.html` | `data/pages.json` |
| `html/blog/`, `html/blog/chuyen-muc/<category>/`, `html/blog/<post>/` | blog posts (3 fixed categories) |
| Home carousels in `html/index.html` (between `<!-- build:<collection> -->` markers) | `san-pham-moi`, `mua-he`, `dong-bo` |
| `html/js/search-index.js` | product list for the search page |
| `html/js/vn-area.js` | `data/area/` (34 provinces, wards) for the checkout address pickers |
| `html/sitemap.xml`, `html/robots.txt` | all pages |

Do not edit generated files by hand; the next build overwrites them.

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
| `/blog/`, `/blog/chuyen-muc/<category>/`, `/blog/<post>/` | Blog: all posts, one category, one post |
| `/cart/` | Cart (stored in `localStorage`) |
| `/thanh-toan/` | Checkout: buyer details, province / ward pickers (`js/vn-area.js`), COD or bank transfer with QR |
| `/yeu-thich/` | Wishlist — products hearted with ♡ (stored in `localStorage`) |
| `/contact/` | Contact (sent to the CMS) |
| `/admin/` | CMS (embeds the Apps Script web app) |

## Forms and checkout settings

- `html/js/store.js` → `API_URL`: the CMS web app `/exec` URL. Orders (`/thanh-toan/`) and contact messages (`/contact/`) are POSTed there; the CMS re-checks prices, stores them in its sheet and notifies by Telegram + email. Empty: forms work but nothing is sent (payload logged to the console).
- `html/admin/index.html` → `CMS_URL`: the same `/exec` URL.
- `html/js/pages/checkout.js` → `BANK`: `bankId` (VietQR bank code such as `VCB`, `MB`, `TCB`), `bankName`, `account`, `holder`. When `bankId` and `account` are set, the demo QR (`images/qr-demo.svg`) is replaced by a real VietQR code with the amount and transfer content filled in.

## SEO and sharing

`scripts/build.py` writes the `<head>` of every page (hand-written pages between `<!-- build:head -->` markers):

- title, description, canonical (`https://maybymay.vn/...`, set by `SITE`), Open Graph and Twitter tags; cart / search / checkout / wishlist are `noindex`
- JSON-LD: `ClothingStore` + `WebSite` (home), `Product` with price, stock and 7-day return policy, `CollectionPage`, `BlogPosting`, `BreadcrumbList`
- icons: `favicon.ico`, `images/icons/*` (pink "Mây"), `site.webmanifest`
- share image: `images/og-image.webp` (+ `.jpg` fallback), 1200×630
- `robots.txt` and `sitemap.xml`
