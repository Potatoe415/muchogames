// Mascot picker on the profile page: a grid of every hub mascot
// (window.PlayerProfile.MASCOTS). The chosen mascot is the player's avatar
// everywhere (hub icon, Yatzy, card games via `?mascot=`).

let onPickHandler = null;

export function initMascotPicker(onPick) {
  onPickHandler = onPick;
  const picker = document.getElementById("profile-mascot-picker");
  const grid = document.getElementById("profile-mascot-picker-grid");
  if (!picker || !grid) return;

  window.PlayerProfile.MASCOTS.forEach((id) =>
    grid.appendChild(createOption(id))
  );
  document
    .getElementById("profile-avatar-button")
    ?.addEventListener("click", openMascotPicker);
  document
    .getElementById("profile-mascot-change-button")
    ?.addEventListener("click", openMascotPicker);
  document
    .getElementById("profile-mascot-picker-close")
    ?.addEventListener("click", closeMascotPicker);
  picker
    .querySelector(".mascot-picker-backdrop")
    ?.addEventListener("click", closeMascotPicker);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !picker.hidden) closeMascotPicker();
  });
}

function createOption(id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mascot-picker-option";
  button.dataset.id = `profile-mascot-option-${id}`;
  button.dataset.mascot = id;
  button.setAttribute("aria-label", id);
  const img = document.createElement("img");
  img.src = window.PlayerProfile.mascotSrc(id);
  img.alt = "";
  img.loading = "lazy";
  button.appendChild(img);
  button.addEventListener("click", () => {
    onPickHandler?.(id);
    closeMascotPicker();
  });
  return button;
}

function openMascotPicker() {
  const picker = document.getElementById("profile-mascot-picker");
  if (!picker) return;
  const current = window.PlayerProfile.getMascot();
  let selected = null;
  picker.querySelectorAll(".mascot-picker-option").forEach((option) => {
    const isCurrent = option.dataset.mascot === current;
    option.setAttribute("aria-pressed", String(isCurrent));
    if (isCurrent) selected = option;
  });
  picker.hidden = false;
  selected?.scrollIntoView({ block: "center" });
  selected?.focus();
}

function closeMascotPicker() {
  const picker = document.getElementById("profile-mascot-picker");
  if (picker) picker.hidden = true;
  document.getElementById("profile-avatar-button")?.focus();
}
