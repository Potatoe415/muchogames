// The definition sheet's content: one block per word tapped (across and/or
// down), filled in as Wiktionary answers. Wiktionary text is inserted as
// plain text only.
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function fill(block, entry, t) {
  const status = block.querySelector(".sc-define-text");
  if (entry.missing) status.textContent = t("defMissing");
  else {
    status.textContent = entry.text;
    if (entry.base) {
      const base = el("p", "sc-define-base");
      base.append(el("strong", "", entry.base), ` : ${entry.baseText}`);
      status.after(base);
    }
  }
  const link = el("a", "sc-define-link", t("defSource"));
  Object.assign(link, {
    href: entry.url,
    target: "_blank",
    rel: "noopener noreferrer"
  });
  block.append(link);
}

// Wiktionary text is CC BY-SA: the sheet credits it, live or offline.
function licenseNote(t) {
  const note = el("p", "sc-define-license");
  note.dataset.id = "scrabble-define-license";
  const link = el("a", "", t("defLicense"));
  Object.assign(link, {
    href: "https://creativecommons.org/licenses/by-sa/4.0/",
    target: "_blank",
    rel: "noopener noreferrer"
  });
  note.append(link);
  return note;
}

// items: [{ word, lang, entry: Promise }]; showLang when the match mixes languages.
export function renderDefinitions(host, items, t, showLang) {
  host.replaceChildren(
    ...items.map(({ word, lang, entry }) => {
      const block = el("section", "sc-define-entry");
      const title = el("h2", "sc-sheet-title", word);
      if (showLang)
        title.append(" ", el("small", "sc-word-lang", lang.toUpperCase()));
      block.append(title, el("p", "sc-define-text", t("defLoading")));
      entry
        .then((found) => fill(block, found, t))
        .catch(() => {
          block.querySelector(".sc-define-text").textContent = t("defError");
        });
      return block;
    }),
    licenseNote(t)
  );
}
