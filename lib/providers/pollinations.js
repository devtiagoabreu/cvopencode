const LEGACY_BASE = "https://image.pollinations.ai/prompt/";
const KEYED_BASE = "https://gen.pollinations.ai/image/";

export function pollinationsImageRequest({ prompt, width, height, seed, model }) {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const base = apiKey ? KEYED_BASE : LEGACY_BASE;
  const url = new URL(`${base}${encodeURIComponent(prompt)}`);

  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("model", model);
  url.searchParams.set("seed", String(seed));
  url.searchParams.set("nologo", "true");
  url.searchParams.set("referrer", "cvopencode");

  const headers = apiKey
    ? { Authorization: `Bearer ${apiKey}` }
    : { Accept: "image/*" };

  return { url, headers, demo: !apiKey, provider: "pollinations" };
}

export function extensionFor(mimeType) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
}
