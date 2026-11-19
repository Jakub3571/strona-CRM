// Brak API po stronie strony: formularz korzysta z wbudowanego fallbacku
// „przygotuj wiadomość i skopiuj” (poniżej), a nie z wysyłki na serwer.
window.NK_LIVE_FORM = false;
(() => {
  'use strict';
  const isSubpage = document.body.classList.contains('subpage');
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = q('#site-loader');
  let firstVisit = true, arriving = false;
  try {
    firstVisit = sessionStorage.getItem('nk-seen-entrance') !== '1';
    arriving = sessionStorage.getItem('nk-route-transition') === '1';
    sessionStorage.removeItem('nk-route-transition');
    sessionStorage.setItem('nk-seen-entrance','1');
  } catch (_) {}
  if (loader) {
    if (reduce) loader.classList.add('done');
    else if (arriving) { loader.classList.add('route','arriving'); setTimeout(() => loader.classList.add('done'), 100); }
    else if (firstVisit) { loader.classList.add('intro'); setTimeout(() => loader.classList.add('done'), 1200); }
    else loader.classList.add('done');
  }
  document.addEventListener('click', e => {
    if (!loader || reduce || loader.classList.contains('leaving') || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const next = new URL(a.href, location.href);
    if (next.origin !== location.origin || next.pathname === location.pathname && next.search === location.search) return;
    e.preventDefault();
    try { sessionStorage.setItem('nk-route-transition','1'); } catch (_) {}
    loader.classList.remove('done');
    loader.classList.add('route','leaving');
    setTimeout(() => { location.href = next.href; }, 590);
  });
  addEventListener('pageshow', e => { if (e.persisted) loader?.classList.add('done'); });
  const dropdown = q('.nav-dropdown');
  const menu = q('#nav-links');
  const menuButton = q('#menu-toggle');
  function closeDropdown() { if (dropdown) dropdown.open = false; }
  document.addEventListener('click', e => { if (dropdown && !dropdown.contains(e.target)) closeDropdown(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (dropdown?.open) { closeDropdown(); q('.nav-dropdown summary').focus(); }
    if (menu?.classList.contains('open')) { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Otwórz menu'); menuButton.focus(); }
  });
  if (isSubpage) {
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(expanded));
      menuButton.setAttribute('aria-label', expanded ? 'Zamknij menu' : 'Otwórz menu');
      menu.classList.toggle('open', expanded);
    });
    all('.nav-links a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false');
    }));
    const header = q('#site-header');
    let scheduled = false;
    const sections = all('[data-progress-section]');
    function scrollUpdate() {
      scheduled = false;
      const t = Math.min(1,Math.max(0,window.scrollY/500));
      const from = [255,255,255], to = [20,78,55];
      header.style.setProperty('--nav-bg', from.map((v,i) => Math.round(v+(to[i]-v)*t)).join(','));
      header.style.setProperty('--nav-text', t > .57 ? '#f5faf5' : '#183628');
      header.classList.toggle('dark', t > .57); header.classList.toggle('is-scrolled', t > .06);
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const progress = Math.min(1,Math.max(0,(innerHeight*.7-rect.top)/Math.max(1,rect.height*.8)));
        const clip = section.querySelector('[data-progress-clip]');
        if (clip) clip.setAttribute('height',String(reduce ? 100 : progress * 100));
        else section.style.setProperty('--progress', `${progress*100}%`);
        section.querySelectorAll('.story-row').forEach((row,index,list) => {
          row.classList.toggle('is-passed',progress >= (index + .45) / list.length);
        });
        section.querySelectorAll('.how-stage').forEach((stage,index,list) => {
          stage.classList.toggle('is-passed',progress >= (index + .45) / list.length);
        });
      });
    }
    function onScroll() { if (!scheduled) { scheduled = true; requestAnimationFrame(scrollUpdate); } }
    addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); scrollUpdate();
    if ('IntersectionObserver' in window && !reduce) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');entry.target.classList.add('show');observer.unobserve(entry.target);
      }),{threshold:0,rootMargin:'0px 0px 80px 0px'});
      all('.reveal').forEach(el => { if(el.getBoundingClientRect().top > innerHeight) el.classList.add('reveal-pending'); observer.observe(el); });
    }
    const stats = q('.page-o-nas .about-stats');
    if (stats && 'IntersectionObserver' in window && !reduce) {
      const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(stats);
        const entranceDelay = loader && !loader.classList.contains('done')
          ? (loader.classList.contains('intro') ? 1200 : 250) : 0;
        all('.page-o-nas .about-stats [data-count]').forEach((el, index) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          el.style.display = 'inline-block';
          el.style.minWidth = `${el.offsetWidth}px`;
          setTimeout(() => {
            const start = performance.now();
            const duration = target > 100 ? 1400 : 1050;
            function frame(now) {
              const t = Math.min(1, (now - start) / duration);
              el.textContent = `${Math.round(Number(el.dataset.count) * (1 - (1 - t) ** 3))}${suffix}`;
              if (t < 1) requestAnimationFrame(frame);
            }
            el.textContent = `0${suffix}`;
            requestAnimationFrame(frame);
          }, entranceDelay + index * 140);
        });
      }), {threshold:.25});
      countObserver.observe(stats);
    }
    all('.page-hero-video').forEach(video => {
      if (reduce) { video.pause(); return; }
      video.muted = true;
      const watch = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting && !document.hidden ? video.play().catch(() => {}) : video.pause());
      },{threshold:.05});
      watch.observe(video);
      document.addEventListener('visibilitychange', () => document.hidden ? video.pause() : video.play().catch(() => {}));
    });
  }
  all('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const form = q('#inquiry-form');
  if (!form) return;
  const subject = q('#inquiry-subject'), level = q('#inquiry-level');
  const email = q('#inquiry-email'), phone = q('#inquiry-phone');
  const classes = ["1 kl. SP", "2 kl. SP", "3 kl. SP", "1 kl. SP", "2 kl. SP", "3 kl. SP", "4 kl. SP", "5 kl. SP", "6 kl. SP", "7 kl. SP", "8 kl. SP", "1 LO", "2 LO", "3 LO", "4 LO", "1 technikum", "2 technikum", "3 technikum", "4 technikum", "5 technikum", "Dorosły"];
  function updateLevels() {
    const oldValue = level.value;
    const options = classes;
    level.replaceChildren(new Option('Wybierz klasę',''));
    options.forEach(v => level.add(new Option(v,v)));
    if(options.includes(oldValue)) level.value = oldValue;
    else if(options.length === 1) level.value = options[0];
  }
  subject.addEventListener('change',updateLevels);
  const incoming = new URLSearchParams(location.search).get('przedmiot');
  if (incoming && [...subject.options].some(o=>o.value===incoming)) subject.value = incoming;
  updateLevels();
  function validateContact() {
    email?.setCustomValidity('');
    phone.setCustomValidity(phone.value.trim() ? '' : 'Podaj numer telefonu.');
  }
  email?.addEventListener('input',validateContact); phone.addEventListener('input',validateContact);
  if (window.NK_LIVE_FORM) return;
  form.addEventListener('submit', e => {
    e.preventDefault(); validateContact();
    if(!form.reportValidity()) return;
    const contact = [email?.value.trim() ? `E-mail: ${email.value.trim()}` : '', phone.value.trim() ? `Telefon: ${phone.value.trim()}` : ''].filter(Boolean).join('\n');
    q('#inquiry-message').value = `Dzień dobry! Chcę zapytać o korepetycje.\n\nImię: ${q('#inquiry-name').value.trim()}\nPrzedmiot: ${subject.selectedOptions[0].text}\nPoziom: ${level.value}\nCel nauki: ${(q('#inquiry-goal')?.value.trim() || '')}\n\n${contact}`;
    q('#inquiry-result').hidden = false;
    q('#inquiry-result').scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
    q('#inquiry-copy').focus({preventScroll:true});
  });
  q('#inquiry-copy').addEventListener('click', async () => {
    const field = q('#inquiry-message');
    try {
      await navigator.clipboard.writeText(field.value);
      q('#copy-status').textContent = 'Skopiowano. Teraz otwórz profil szkoły, wklej wiadomość i wyślij.';
      q('#inquiry-copy').textContent = 'Skopiowano';
    } catch (_) {
      field.focus(); field.select();
      const copied = document.execCommand('copy');
      q('#copy-status').textContent = copied ? 'Skopiowano wiadomość.' : 'Zaznaczyliśmy treść — skopiuj ją ręcznie i wyślij na Facebooku.';
    }
  });
})();
