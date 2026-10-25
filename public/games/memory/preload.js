import { PRELOAD_MS } from "./config.js";

// Holds the decoded images so the browser keeps them for the whole match.
const held = [];

function load(url) {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  return img.decode().then(
    () => img,
    () => img
  );
}

// Never rejects: a broken or slow image must not block the match.
export function preload(urls) {
  const all = Promise.all(urls.map(load)).then((images) => {
    held.splice(0, held.length, ...images);
  });
  const cap = new Promise((resolve) => setTimeout(resolve, PRELOAD_MS));
  return Promise.race([all, cap]);
}
