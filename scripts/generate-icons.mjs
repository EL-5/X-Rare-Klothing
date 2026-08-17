#!/usr/bin/env node
// Generates the PWA/home-screen icon set from the existing XR logo mark
// (public/favicon.png) so there's one source of truth for the brand mark
// instead of separately hand-exported icon files. Re-run this manually if
// the logo ever changes — it's not part of `npm run build` since the
// output are static files checked into public/, not build artifacts.
import sharp from 'sharp';

const SOURCE = 'public/favicon.png';

async function trimmedLogo() {
  return sharp(SOURCE).trim().toBuffer();
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function transparentIcon(size, outPath) {
  const logo = await trimmedLogo();
  const logoSize = Math.round(size * 0.8);
  // `background` must be passed here too — without it, sharp's `contain`
  // letterbox padding defaults to opaque black instead of transparent,
  // which silently turned every generated icon into a black square.
  const resizedLogo = await sharp(logo).resize(logoSize, logoSize, { fit: 'contain', background: TRANSPARENT }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: TRANSPARENT } })
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toFile(outPath);
  console.log(`[icons] wrote ${outPath} (${size}x${size}, transparent)`);
}

async function solidBackgroundIcon(size, outPath, logoFraction, background) {
  const logo = await trimmedLogo();
  const logoSize = Math.round(size * logoFraction);
  const resizedLogo = await sharp(logo).resize(logoSize, logoSize, { fit: 'contain', background: TRANSPARENT }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toFile(outPath);
  console.log(`[icons] wrote ${outPath} (${size}x${size}, solid background)`);
}

async function main() {
  // Standard manifest icons — transparent, browser/OS supplies its own
  // shape/background (used for purpose: "any").
  await transparentIcon(192, 'public/pwa-192.png');
  await transparentIcon(512, 'public/pwa-512.png');

  // Maskable icon — Android adaptive icons crop to arbitrary shapes
  // (circle, squircle, etc.), so content must stay inside the ~80% safe
  // zone. Solid white background so cropping never reveals transparency.
  await solidBackgroundIcon(512, 'public/maskable-icon-512.png', 0.55, { r: 255, g: 255, b: 255, alpha: 1 });

  // iOS home-screen icon — Apple applies its own rounded-corner mask and
  // does not handle transparency well, so this needs an opaque background.
  // White, not the brand's near-black `--color-ink`, since the logo mark
  // itself is black ink — black-on-near-black was invisible.
  await solidBackgroundIcon(180, 'public/apple-touch-icon.png', 0.7, { r: 255, g: 255, b: 255, alpha: 1 });
}

main().catch((err) => {
  console.error('[icons] generation failed:', err);
  process.exitCode = 1;
});
