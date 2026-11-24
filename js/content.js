// Napisy strony podstawiane są z pliku /content.json (edytuje go panel /cms/).
// Jeśli pliku nie ma lub jest pusty — zostają napisy statyczne z HTML.
(async () => {
  let content = {};
  try {
    const r = await fetch("/content.json", { cache: "no-store" });
    if (r.ok) content = await r.json();
  } catch (_) {}
  const copy = content.copy || {};

  document.querySelectorAll("[data-nk-slot]").forEach((el) => {
    if (el.hasAttribute("data-stat")) return; // liczby podstawia sekcja stats ponizej
    const key = el.getAttribute("data-nk-slot");
    const val = copy[key];
    if (val === undefined) return;
    if (!String(val).trim()) {
    const isField = el.tagName === "INPUT" || el.tagName === "TEXTAREA"; // slot na polu = placeholder
    if (isField) {
      el.placeholder = val;
      return;
    }
      // puste pole = element znika, ale tylko gdy ma tekst (nie chowamy przyciskow z samymi ikonami)
      if (el.textContent.trim()) el.style.display = "none";
      return;
    }
    const tn = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (tn) tn.textContent = val;
    else if (!el.children.length) el.textContent = val;
  });

  const stats = content.stats || {};
  for (const [key, value] of [
    ["tutors", stats.tutors],
    ["students", stats.students],
    ["retention", stats.retention],
  ]) {
    document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => {
      const p = el.parentElement && el.parentElement.tagName === "P" ? el.parentElement : null;
      if (value === undefined || value === null || value === "") {
        el.style.display = "none";
        if (p) p.style.display = "none";
        return;
      }
      el.style.display = "";
      if (p) p.style.display = "";
      el.dataset.count = String(value);
      el.textContent = `${value}${el.dataset.suffix || ""}`;
    });
  }
  const ret = document.querySelector('[data-stat="retention"]');
  if (ret) {
    const box = ret.closest(".hero-trust-stat");
    if (box) box.style.display = ret.style.display === "none" ? "none" : "";
  }

  const images = content.images || {};
  document.querySelectorAll("img[src]").forEach((img) => {
    const key = img.getAttribute("data-nk-media");
    const path = new URL(img.getAttribute("src"), location.href).pathname.replace(/^\//, "");
    const rep = (key && images[key]) || images[path];
    if (rep && img.src !== rep) img.src = rep;
  });
})();