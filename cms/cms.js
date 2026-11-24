// Panel CMS: czyta strony, zbiera [data-nk-slot] i [data-nk-media],
// a „Zapisz zmiany” wysyła wszystko POST-em na /cms/save (serwer zapisuje content.json).
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const PAGES = [
  ["Strona główna", "/"],
  ["Matematyka", "/matematyka/"],
  ["Język angielski", "/angielski/"],
  ["Język hiszpański", "/hiszpanski/"],
  ["Biologia", "/biologia/"],
  ["Chemia", "/chemia/"],
  ["Fizyka", "/fizyka/"],
  ["Język polski", "/polski/"],
  ["Geografia", "/geografia/"],
  ["Język niemiecki", "/niemiecki/"],
  ["Informatyka", "/informatyka/"],
  ["Filozofia", "/filozofia/"],
  ["Cennik", "/cennik/"],
  ["Jak uczymy", "/jak-uczymy/"],
  ["O nas", "/o-nas/"],
  ["Kontakt", "/kontakt/"],
  ["Zajęcia", "/zajecia/"],
  ["Start", "/start/"],
  ["Strona własna", "/strona/"],
  ["Polityka prywatności", "/polityka-prywatnosci/"],
  ["Polityka cookies", "/polityka-cookies/"],
  ["Regulamin", "/regulamin/"],
  ["Dziękujemy", "/dziekujemy/"],
  ["Strona 404", "/404.html"],
];

let content = { copy: {}, stats: {}, images: {} };
const pages = new Map();
let current = "/";

function status(msg) {
  $("#status").textContent = msg;
}

async function load() {
  status("Pobieranie content.json…");
  try {
    const r = await fetch("/content.json", { cache: "no-store" });
    if (r.ok) content = await r.json();
  } catch (_) {}
  content.copy = content.copy || {};
  content.stats = content.stats || {};
  content.images = content.images || {};

  status("Wczytywanie stron…");
  await Promise.all(
    PAGES.map(async ([label, url]) => {
      try {
        const html = await (await fetch(url, { cache: "no-store" })).text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const slots = {};
        const statics = {};
        $$("[data-nk-slot]", doc)
          .filter((el) => !el.hasAttribute("data-stat")) // liczby edytujemy w sekcji "Liczby na stronie głównej"
          .forEach((el) => {
            const key = el.getAttribute("data-nk-slot");
            statics[key] = (el.tagName === "INPUT" || el.tagName === "TEXTAREA") ? el.placeholder : el.textContent.trim();
            slots[key] = content.copy[key] ?? statics[key];
          });
        const images = {};
        $$("img[data-nk-media]", doc).forEach((img) => {
          const key = img.getAttribute("data-nk-media");
          images[key] = content.images[key] ?? img.getAttribute("src");
        });
        pages.set(url, { label, slots, images, statics });
      } catch (_) {
        pages.set(url, { label, slots: {}, images: {}, error: true });
      }
    }),
  );

  $("#stat-tutors").value = content.stats.tutors ?? "";
  $("#stat-students").value = content.stats.students ?? "";
  $("#stat-retention").value = content.stats.retention ?? "";

  renderNav();
  status("Gotowe — wybierz stronę z lewej, edytuj pola i kliknij „Zapisz zmiany”.");
  selectPage("/");
}

function renderNav() {
  const nav = $("#pages");
  nav.replaceChildren();
  for (const [label, url] of PAGES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.dataset.url = url;
    if (url === current) b.classList.add("active");
    b.addEventListener("click", () => selectPage(url));
    nav.append(b);
  }
}

function saveFields() {
  const page = pages.get(current);
  if (page) {
    $$("#slots [data-key]").forEach((inp) => {
      page.slots[inp.dataset.key] = inp.value;
    });
    $$("#images [data-key]").forEach((inp) => {
      page.images[inp.dataset.key] = inp.value;
    });
  }
}

function field(key, value, isImage) {
  const wrap = document.createElement("div");
  wrap.className = "cms-field";
  const label = document.createElement("label");
  label.textContent = key;
  label.append(document.createElement("small"));
  label.querySelector("small").textContent = isImage ? "adres obrazka (src)" : "tekst na stronie";
  const inp = isImage ? document.createElement("input") : document.createElement("textarea");
  inp.value = value ?? "";
  inp.dataset.key = key;
  wrap.append(label, inp);
  return wrap;
}

function selectPage(url) {
  saveFields();
  current = url;
  $$("#pages button").forEach((b) => b.classList.toggle("active", b.dataset.url === url));
  $("#open-site").setAttribute("href", url);
  const preview = $("#preview");
  if (preview.getAttribute("src") !== url) preview.src = url;
  const page = pages.get(url);
  const slotsBox = $("#slots");
  const imagesBox = $("#images");
  slotsBox.replaceChildren();
  imagesBox.replaceChildren();
  if (!page) return;
  if (page.error) {
    slotsBox.append(Object.assign(document.createElement("p"), { textContent: "Nie udało się pobrać tej strony." }));
    return;
  }
  for (const [key, value] of Object.entries(page.slots)) slotsBox.append(field(key, value, false));
  for (const [key, value] of Object.entries(page.images)) imagesBox.append(field(key, value, true));
}

function buildJson() {
  saveFields();
  const copy = {};
  const images = {};
  for (const page of pages.values()) {
    for (const [key, value] of Object.entries(page.slots)) {
      if (value !== (page.statics?.[key] ?? "")) copy[key] = value;
    }
    Object.assign(images, page.images);
  }
  const stats = {};
  for (const [key, id] of [["tutors", "#stat-tutors"], ["students", "#stat-students"], ["retention", "#stat-retention"]]) {
    const v = $(id).value.trim();
    if (v !== "") stats[key] = Number(v);
  }
  return { copy, stats, images };
}

$("#save").addEventListener("click", async () => {
  const data = buildJson();
  const text = JSON.stringify(data, null, 2);
  try {
    const r = await fetch("/cms/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: text,
    });
    const res = await r.json().catch(() => ({}));
    if (!r.ok || res.ok !== true) throw new Error(res.error || "błąd zapisu");
    content = data;
    status("Zapisano ✔ Podgląd poniżej pokazuje już nową wersję strony.");
    $("#preview").contentWindow.location.reload();
  } catch (e) {
    status(`Nie udało się zapisać przez serwer (${e.message}). Skorzystaj z awaryjnego JSON na dole.`);
    $("#output").value = text;
    document.querySelector(".cms-fallback").open = true;
  }
});

$("#copy").addEventListener("click", async () => {
  const out = $("#output");
  if (!out.value) out.value = JSON.stringify(buildJson(), null, 2);
  out.select();
  try {
    await navigator.clipboard.writeText(out.value);
    status("Skopiowano JSON — wklej go do pliku content.json w głównym folderze strony.");
  } catch (_) {
    status("Zaznaczono JSON w polu — skopiuj ręcznie (Ctrl+C).");
  }
});

$("#reload-preview").addEventListener("click", () => {
  $("#preview").contentWindow.location.reload();
});

load();