// Image preload -> window.CafardsPreload: the eight card faces, the
// dashboard background and the banner are fetched and decoded as soon as the
// page loads, and kept referenced, so a match never fetches an image.
// Nouvelle partie / Reprendre / Rejouer wait for it behind a loading line.
(function () {
  const URLS = [...window.CafardsBoard.cardUrls, "assets/background.webp", "assets/thumbnail.webp"];
  const kept = [];
  let done = false;

  // A failed image never blocks play: that card just shows without its art.
  function load(url) {
    const img = new Image();
    kept.push(img);
    img.src = url;
    return img.decode().catch(() => {});
  }

  const loaded = Promise.all(URLS.map(load)).then(() => {
    done = true;
  });

  // Resolves once every image is in; until then the start buttons are off.
  async function ready() {
    if (done) return;
    const line = document.querySelector('[data-id="cafards-loading"]');
    const buttons = ["cafards-start-button", "cafards-resume-button", "cafards-replay-button"].map((id) =>
      document.querySelector(`[data-id="${id}"]`)
    );
    line.hidden = false;
    buttons.forEach((button) => (button.disabled = true));
    await loaded;
    line.hidden = true;
    buttons.forEach((button) => (button.disabled = false));
  }

  window.CafardsPreload = { ready };
})();
