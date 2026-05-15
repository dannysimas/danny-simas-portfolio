# Danny Simas Portfolio

## Run locally
```bash
npm install
npm run dev
```

## Build for Vercel
```bash
npm run build
```

Then deploy the project folder to Vercel.

## Where images live
Put your final WebP/JPG images here:

```txt
public/images/about/about-danny.webp

public/images/hero/hero-01.webp
public/images/hero/hero-02.webp
public/images/hero/hero-03.webp
public/images/hero/hero-04.webp

public/images/resident-evil/re-cover.webp
public/images/resident-evil/re-01.webp
public/images/resident-evil/re-02.webp

public/images/pragmata/pragmata-cover.webp
public/images/expedition-33/e33-cover.webp
public/images/devil-may-cry/dmc-cover.webp
public/images/tomb-raider/tr-cover.webp
```

## How to change images
Open `src/App.jsx`.

At the top, replace the stock image URLs with local paths:

```jsx
const stock1 = "/images/hero/hero-01.webp";
```

For galleries, change the folder objects:

```jsx
{
  title: "Resident Evil",
  cover: "/images/resident-evil/re-cover.webp",
  images: [
    "/images/resident-evil/re-01.webp",
    "/images/resident-evil/re-02.webp",
  ],
}
```

## Recommended image sizes
- About image: 1200 x 700 WebP
- Hero images: 1800 x 1000 WebP
- Gallery vertical images: 1080 x 1920 WebP
- Folder covers: 1600 x 900 WebP
