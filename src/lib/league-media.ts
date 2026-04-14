function hashSeed(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 360;
  }
  return value;
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function slugifyTeamName(teamName: string) {
  return teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export function buildTeamBannerUrl(teamName: string) {
  const hue = hashSeed(teamName);
  const accentHue = (hue + 55) % 360;
  const safeTeamName = escapeSvgText(teamName);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 760">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue} 70% 40%)" />
          <stop offset="100%" stop-color="hsl(${accentHue} 72% 22%)" />
        </linearGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.32)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="1400" height="760" fill="url(#bg)" />
      <circle cx="1110" cy="150" r="210" fill="rgba(255,255,255,0.12)" />
      <circle cx="1230" cy="90" r="90" fill="rgba(255,255,255,0.08)" />
      <path d="M0 585 C220 520 315 665 525 620 S915 450 1400 620 V760 H0 Z" fill="rgba(8,14,24,0.42)" />
      <path d="M85 495 C120 395 198 330 284 330 C369 330 432 402 445 495 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M295 515 C335 388 425 302 528 302 C631 302 714 389 727 515 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M570 505 C602 416 673 356 750 356 C827 356 893 420 906 505 Z" fill="rgba(255,255,255,0.18)" />
      <path d="M790 522 C830 399 919 318 1021 318 C1124 318 1208 404 1220 522 Z" fill="rgba(255,255,255,0.24)" />
      <rect x="0" y="0" width="1400" height="760" fill="url(#shine)" />
      <text x="78" y="620" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="86" font-weight="700">${safeTeamName}</text>
      <text x="82" y="684" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial, sans-serif" font-size="28" letter-spacing="6">OFFICIAL TEAM PHOTO</text>
    </svg>
  `;

  return toDataUri(svg);
}

export function buildNewsImageUrl(title: string) {
  const hue = hashSeed(title);
  const accentHue = (hue + 96) % 360;
  const safeTitle = escapeSvgText(title.toUpperCase());

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue} 74% 42%)" />
          <stop offset="100%" stop-color="hsl(${accentHue} 78% 30%)" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)" />
      <path d="M0 510 C166 470 250 558 412 525 S754 404 1200 552 V720 H0 Z" fill="rgba(12,18,30,0.35)" />
      <circle cx="940" cy="162" r="150" fill="rgba(255,255,255,0.12)" />
      <rect x="82" y="86" width="196" height="34" rx="17" fill="rgba(255,255,255,0.2)" />
      <rect x="82" y="144" width="488" height="18" rx="9" fill="rgba(255,255,255,0.18)" />
      <rect x="82" y="177" width="420" height="18" rx="9" fill="rgba(255,255,255,0.12)" />
      <rect x="82" y="534" width="558" height="112" rx="32" fill="rgba(9,15,24,0.24)" />
      <text x="112" y="585" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">MATCHDAY NEWS</text>
      <text x="112" y="630" fill="rgba(255,255,255,0.85)" font-family="Segoe UI, Arial, sans-serif" font-size="24">${safeTitle}</text>
    </svg>
  `;

  return toDataUri(svg);
}
