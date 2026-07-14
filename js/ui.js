const screens = ["home", "setup", "form", "done"];

export function showScreen(name) {
  screens.forEach(s => {
    document.getElementById("screen-" + s).setAttribute("data-active", s === name ? "true" : "false");
  });
  window.scrollTo(0, 0);
}

export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}