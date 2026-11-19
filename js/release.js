/* Campaign attribution follows internal navigation in this tab; a new tagged visit replaces it. */
(() => {
  const params = new URLSearchParams(location.search);
  const keys = ['utm_source','utm_medium','utm_campaign'];
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('nk-attribution') || '{}'); } catch (_) {}
  if (params.has('utm_source')) {
    attribution = Object.fromEntries(keys.map(k => [k,(params.get(k)||'').trim().slice(0,120)]));
    try { sessionStorage.setItem('nk-attribution',JSON.stringify(attribution)); } catch (_) {}
  }
  window.NK_ATTRIBUTION = Object.fromEntries(keys.map(k=>[k,String(attribution[k]||'').slice(0,120)]));
})();

// Make an invalid optional email visible even if its details panel was closed.
document.addEventListener('invalid', event => {
  const details=event.target.closest?.('details.optional-fields');
  if(details) details.open=true;
},true);

/* Stały skrót do rozmowy z fanpage'em. */
(() => {
 const addContact = () => {
  if (document.querySelector('.floating-contact')) return;
  const link = document.createElement('a');
  link.className = 'floating-contact'; link.href = 'https://www.facebook.com/profile.php?id=61593535120289';
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Napisz do nas na Messengerze');
  const icon = document.createElement('img');
  icon.src = '/assets/social/messenger.svg'; icon.alt = ''; icon.setAttribute('aria-hidden', 'true');
  link.append(icon, document.createTextNode('Napisz do nas')); document.body.append(link);
 };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addContact, {once:true});
 else addContact();
})();
