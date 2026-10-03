// Two tabs on the profile page: "Infos" (avatar, name, account) and
// "Statistiques" (matches, favorites, per-game results). Both panels stay in
// the DOM, so the other profile modules keep rendering into them unchanged.

export function initProfileTabs() {
  const tabs = [...document.querySelectorAll(".profile-tab")];
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => selectTab(tabs, tab.dataset.tab))
  );
}

function selectTab(tabs, name) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    const panel = document.getElementById(
      `profile-tab-panel-${tab.dataset.tab}`
    );
    if (panel) panel.hidden = !isActive;
  });
}
