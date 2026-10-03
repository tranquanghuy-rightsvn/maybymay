# May By Mây — website

Static storefront for Hộ Kinh Doanh Thời Trang May By Mây. Every page is plain HTML; JavaScript only adds behaviour (menus, sliders, size picker, cart). No page loads data with `fetch()`.

- `html/` — the website. Deploy this folder as-is to any static host.
- `data/` — source data: `products.json`, `collections.json`, `pages.json` (info pages, size guide, shipping text), `posts.json` (blog categories and posts), `area/` (provinces and wards).
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
| `html/blog/`, `html/blog/chuyen-muc/<category>/`, `html/blog/<post>/` | `data/posts.json` |
| Home carousels in `html/index.html` (between `<!-- build:<collection> -->` markers) | `san-pham-moi`, `mua-he`, `dong-bo` |
| `html/js/search-index.js` | product list for the search page |
| `html/js/vn-area.js` | `data/area/` (34 provinces, wards) for the checkout address pickers |
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
| `/blog/`, `/blog/chuyen-muc/<category>/`, `/blog/<post>/` | Blog: all posts, one category, one post |
| `/cart/` | Cart (stored in `localStorage`) |
| `/thanh-toan/` | Checkout: buyer details, province / ward pickers (`js/vn-area.js`), COD or bank transfer with QR |
| `/yeu-thich/` | Wishlist — products hearted with ♡ (stored in `localStorage`) |
| `/contact/` | Contact (form is demo only) |

## Checkout settings

At the top of `html/js/pages/checkout.js`:

- `ORDER_ENDPOINT_URL` — where orders are POSTed (e.g. a Google Apps Script web app `/exec` URL). Empty: the page works but orders are not sent anywhere (the order is logged to the browser console).
- `BANK` — `bankId` (VietQR bank code such as `VCB`, `MB`, `TCB`), `bankName`, `account`, `holder`. When `bankId` and `account` are set, the demo QR (`images/qr-demo.svg`) is replaced by a real VietQR code with the amount and transfer content filled in.

## SEO and sharing

`scripts/build.py` writes the `<head>` of every page (hand-written pages between `<!-- build:head -->` markers):

- title, description, canonical (`https://maybymay.vn/...`, set by `SITE`), Open Graph and Twitter tags; cart / search / checkout / wishlist are `noindex`
- JSON-LD: `ClothingStore` + `WebSite` (home), `Product` with price, stock and 7-day return policy, `CollectionPage`, `BlogPosting`, `BreadcrumbList`
- icons: `favicon.ico`, `images/icons/*` (pink "Mây"), `site.webmanifest`
- share image: `images/og-image.webp` (+ `.jpg` fallback), 1200×630
- `robots.txt` and `sitemap.xml`
