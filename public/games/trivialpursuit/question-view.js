// Question card (question → answer → right / wrong) and the category picker
// shown on the hub. Pure view: every decision goes back through `on`.
import { CAT_COLORS } from "./board-view.js";
import { CATS } from "./board.js";

export function createQuestionView(els, t, signal, on) {
  els.reveal.addEventListener("click", on.reveal, { signal });
  els.right.addEventListener("click", () => on.answer(true), { signal });
  els.wrong.addEventListener("click", () => on.answer(false), { signal });
  els.other.addEventListener("click", on.other, { signal });
  buildCategories(els.catList, on.choose);

  function showQuestion(item, q, revealed) {
    els.choose.hidden = true;
    els.card.style.setProperty("--cat", CAT_COLORS[q.cat]);
    els.cat.textContent = t(`cat${q.cat}`);
    els.tag.textContent = q.final
      ? t("finalLabel")
      : q.hq
        ? t("wedgeLabel")
        : "";
    els.tag.hidden = !els.tag.textContent;
    els.text.textContent = item.q;
    els.answerText.textContent = item.a;
    els.info.textContent = item.info;
    els.info.hidden = !item.info;
    setRevealed(revealed);
    els.question.hidden = false;
  }

  function setRevealed(revealed) {
    els.answer.hidden = !revealed;
    els.reveal.hidden = revealed;
    els.other.hidden = revealed;
    els.right.hidden = !revealed;
    els.wrong.hidden = !revealed;
    (revealed ? els.right : els.reveal).focus({ preventScroll: true });
  }

  function showChoose(title) {
    els.question.hidden = true;
    els.chooseTitle.textContent = title;
    relabel();
    els.choose.hidden = false;
    els.catList.querySelector("button")?.focus({ preventScroll: true });
  }

  function relabel() {
    els.catList.querySelectorAll("[data-cat]").forEach((button) => {
      button.textContent = t(`cat${button.dataset.cat}`);
    });
  }

  function hide() {
    els.question.hidden = true;
    els.choose.hidden = true;
  }

  return { showQuestion, showChoose, hide, relabel };
}

function buildCategories(list, onChoose) {
  list.innerHTML = "";
  for (let cat = 0; cat < CATS; cat += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tp-cat-button";
    button.dataset.cat = String(cat);
    button.dataset.id = `trivialpursuit-category-${cat + 1}`;
    button.style.setProperty("--cat", CAT_COLORS[cat]);
    button.addEventListener("click", () => onChoose(cat));
    list.append(button);
  }
}
