const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const header = $('#site-header');
const menuButton = $('#menu-toggle');
const menu = $('#nav-links');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Otwórz menu' : 'Zamknij menu');
  menu.classList.toggle('open', !expanded);
});
$$('.nav-links a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

// The light navigation gradually becomes forest green as the page moves.
const firstNav = [248, 250, 247];
const lastNav = [20, 78, 55];
const mix = (a, b, t) => Math.round(a + (b - a) * t);
function updateNavigation() {
  const t = Math.min(1, Math.max(0, window.scrollY / 500));
  header.style.setProperty('--nav-bg', firstNav.map((value, i) => mix(value, lastNav[i], t)).join(','));
  header.style.setProperty('--nav-text', t > .57 ? '#f5faf5' : '#12291f');
  header.classList.toggle('is-scrolled', t > .06);
  header.classList.toggle('dark', t > .57);
  updateProgress();
}
window.addEventListener('scroll', updateNavigation, {passive:true});
window.addEventListener('resize', updateNavigation);

// The transition is encoded into one video, so native looping cannot drift.
const heroVideo = $('#hero-video-a');
if (heroVideo && !reducedMotion.matches && !matchMedia("(max-width: 767px)").matches) {
  heroVideo.querySelectorAll("source[data-src]").forEach(s=>s.src=s.dataset.src);
  heroVideo.load();
  heroVideo.muted = true;
  const playHero = () => heroVideo.play().catch(() => {});
  playHero();
  document.addEventListener('pointerdown', playHero, {once:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) heroVideo.pause(); else playHero();
  });
} else heroVideo?.pause();

// Content stays visible if observation or JavaScript is unavailable.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0, rootMargin:'0px 0px 70px 0px'});
  $$('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('reveal-pending');
    revealObserver.observe(el);
  });
}

// The three reasons arrive one after another as the section enters view.
$$('.why-list .why-item').forEach((card, index) => {
  card.style.setProperty('--entrance-delay', `${index * 170}ms`);
});

// Count up once, on first view; avoid animation for visitors requesting less motion.
const counters = $$('[data-count]');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const started = performance.now();
      function frame(now) {
        const progress = Math.min(1, (now - started) / 1100);
        el.textContent = `${Math.round(Number(el.dataset.count) * (1 - Math.pow(1 - progress, 3)))}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      counterObserver.unobserve(el);
    });
  }, {threshold: .35});
  counters.forEach(counter => { counter.textContent = `0${counter.dataset.suffix || ''}`; counterObserver.observe(counter); });
}

// Scroll-driven progress line connecting the four steps.
const processTrack = $('#process-track');
const progressClip = processTrack?.querySelector('[data-progress-clip]');
function updateProgress() {
  if (!processTrack || !progressClip) return;
  const bounds = processTrack.getBoundingClientRect();
  const focus = window.innerHeight * .68;
  const ratio = Math.min(1, Math.max(0, (focus - bounds.top) / Math.max(1, bounds.height * .8)));
  progressClip.setAttribute('height',String(reducedMotion.matches ? 100 : ratio * 100));
  $$('.story-row', processTrack).forEach((step, index) => step.classList.toggle('is-passed', ratio >= (index + .45) / 4));
}
updateNavigation();

// Five phones from the approved artwork move through a looping carousel.
const carousel = $('#reviews-carousel');
let phones = $$('.phone', carousel);
const carouselCount = $('#carousel-count');
let reviewIndex = 0;
let autoplayTimer;
function setReview(index) {
  reviewIndex = (index + phones.length) % phones.length;
  const mobile = window.innerWidth < 650;
  phones.forEach((phone, i) => {
    let offset = i - reviewIndex;
    if (offset > phones.length / 2) offset -= phones.length;
    if (offset < -phones.length / 2) offset += phones.length;
    const distance = Math.abs(offset);
    const spacing = mobile ? 205 : Math.min(315, window.innerWidth * .19);
    const x = offset * spacing;
    const scale = distance === 0 ? 1 : distance === 1 ? .85 : .62;
    const y = distance === 0 ? 0 : distance === 1 ? 35 : 60;
    phone.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    phone.style.zIndex = String(Math.max(0, 5 - distance));
    phone.style.opacity = distance > 2 ? '0' : distance === 2 ? (mobile ? '0' : '.72') : '1';
    phone.style.pointerEvents = distance > (mobile ? 1 : 2) ? 'none' : 'auto';
    phone.style.filter = 'none';
    phone.classList.toggle('current', distance === 0);
    phone.setAttribute('aria-hidden', distance > (mobile ? 1 : 2) ? 'true' : 'false');
    const artwork = $('img', phone);
    if (artwork) artwork.tabIndex = distance > (mobile ? 1 : 2) ? -1 : 0;
  });
  carouselCount.textContent = `${String(reviewIndex + 1).padStart(2, '0')} / ${String(phones.length).padStart(2, '0')}`;
  $$('.carousel-progress span', carousel).forEach((segment, i) => segment.classList.toggle('active', i === reviewIndex));
}
function startReviewAutoplay() {
  window.clearInterval(autoplayTimer);
  if (!reducedMotion.matches) autoplayTimer = window.setInterval(() => { if (!document.hidden && !$('#review-dialog').open) setReview(reviewIndex + 1); }, 4800);
}
$('#carousel-prev').addEventListener('click', () => { setReview(reviewIndex - 1); startReviewAutoplay(); });
$('#carousel-next').addEventListener('click', () => { setReview(reviewIndex + 1); startReviewAutoplay(); });
carousel.addEventListener('focusin', () => window.clearInterval(autoplayTimer));
carousel.addEventListener('focusout', startReviewAutoplay);
carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { setReview(reviewIndex + 1); event.preventDefault(); }
  if (event.key === 'ArrowLeft') { setReview(reviewIndex - 1); event.preventDefault(); }
});
let touchX = null;
carousel.addEventListener('touchstart', event => { touchX = event.changedTouches[0]?.screenX ?? null; }, {passive:true});
carousel.addEventListener('touchend', event => {
  if (touchX === null) return;
  const distance = (event.changedTouches[0]?.screenX ?? touchX) - touchX;
  if (Math.abs(distance) > 45) setReview(reviewIndex + (distance < 0 ? 1 : -1));
  touchX = null;
}, {passive:true});
window.addEventListener('resize', () => { setReview(reviewIndex); startReviewAutoplay(); });
setReview(2);
startReviewAutoplay();

$$('.faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
  if (!detail.open) return;
  $$('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
}));

$$('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));

// Enlarge the unaltered review image with keyboard and touch support.
const reviewDialog = $('#review-dialog');
function openReview(index) {
  setReview(index);
  const picture = $('img', phones[reviewIndex]);
  $('#expanded-review').src = picture.src;
  $('#expanded-review').alt = picture.alt;
  if (!reviewDialog.open) reviewDialog.showModal();
  window.clearInterval(autoplayTimer);
}
phones.forEach(phone => {
  const picture = $('img', phone);
  picture.tabIndex = 0;
  picture.setAttribute('role', 'button');
  picture.setAttribute('aria-label', 'Powiększ opinię');
  const expand = () => openReview(phones.indexOf(phone));
  picture.addEventListener('click', expand);
  picture.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); expand(); }
  });
});
setReview(reviewIndex);
$('#close-review').addEventListener('click', () => reviewDialog.close());
$('#review-dialog-prev').addEventListener('click', () => openReview(reviewIndex - 1));
$('#review-dialog-next').addEventListener('click', () => openReview(reviewIndex + 1));
reviewDialog.addEventListener('click', event => { if(event.target === reviewDialog) reviewDialog.close(); });
reviewDialog.addEventListener('close', startReviewAutoplay);

window.addEventListener('nk:reviews-added', () => {
  phones = $$('.phone', carousel);
  $$('.carousel-progress', carousel).forEach(progress => {
    while (progress.children.length < phones.length) progress.append(document.createElement('span'));
  });
  phones.forEach(phone => {
    if (phone.dataset.reviewReady) return;
    phone.dataset.reviewReady = 'true';
    const picture = $('img', phone);
    if (!picture) return;
    picture.tabIndex = 0;
    picture.setAttribute('role','button');
    picture.setAttribute('aria-label','Powiększ opinię');
    picture.addEventListener('click', () => openReview(phones.indexOf(phone)));
    picture.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openReview(phones.indexOf(phone)); }
    });
  });
  setReview(reviewIndex);
});
