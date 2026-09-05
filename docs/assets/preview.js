const normalize = value => value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const siteRoot = new URL('../', import.meta.url);
const menu = document.querySelector('.mobile-nav');
document.addEventListener('pointerdown', event => {
  if (menu && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});
menu?.addEventListener('click', event => {
  if (event.target.closest('a')) menu.open = false;
});
for (const form of document.querySelectorAll('.contact-form')) {
  const buttons = form.querySelectorAll('button[type="submit"]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(form);
    const subject = values.get('subject') || 'Zapytanie o pomoc prawną';
    const message = [
      `Imię i nazwisko: ${values.get('firstName')} ${values.get('lastName')}`,
      `E-mail: ${values.get('email')}`,
      values.get('phone') ? `Telefon: ${values.get('phone')}` : '',
      `Temat: ${subject}`, '', values.get('message'),
    ].join('\n');
    const destination = event.submitter === buttons[1]
      ? `mailto:adwokat@annaszymczak.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
      : `https://wa.me/48730505530?text=${encodeURIComponent(message)}`;
    let status = form.querySelector('[role="status"]');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status'; status.setAttribute('role', 'status');
      form.append(status);
    }
    status.textContent = 'Wiadomość została przygotowana. Sprawdź jej treść i zatwierdź wysłanie w aplikacji. Kancelaria nie otrzyma wiadomości, dopóki jej nie wyślesz.';
    window.location.assign(destination);
  });
}
for (const placeholder of document.querySelectorAll('.map-placeholder')) {
  placeholder.querySelector('button')?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = 'Mapa dojazdu do kancelarii Anny Szymczak — Kościuszki 27a, Piaseczno';
    frame.src = 'https://maps.google.com/maps?q=ul.%20Tadeusza%20Ko%C5%9Bciuszki%2027a%2C%2005-500%20Piaseczno&output=embed';
    frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer-when-downgrade';
    placeholder.replaceWith(frame);
  });
}
const legacyQuery = new URLSearchParams(location.search).get('s');
if (legacyQuery) location.replace(new URL(`szukaj/?q=${encodeURIComponent(legacyQuery)}`, siteRoot));
const search = document.querySelector('.search-form');
if (search) {
  const query = (new URLSearchParams(location.search).get('q') || '').trim().slice(0, 160);
  search.querySelector('[name="q"]').value = query;
  if (query) {
    const output = document.createElement('div'); output.setAttribute('aria-live', 'polite');
    search.after(output);
    const intro = search.parentElement.querySelector('.section-intro');
    if (intro) intro.hidden = true;
    try {
      const response = await fetch(new URL('assets/search-index.json', siteRoot));
      if (!response.ok) throw new Error('search index');
      const records = await response.json();
      const results = records.filter(item => normalize(`${item.title} ${item.text}`).includes(normalize(query)));
      const count = document.createElement('p'); count.className = 'search-count';
      count.textContent = `Wyniki dla „${query}”: ${results.length}`; output.append(count);
      if (!results.length) {
        const empty = document.createElement('p'); empty.textContent = 'Nie znaleziono pasujących treści. Spróbuj krótszego hasła lub napisz do kancelarii.'; output.append(empty);
      }
      const list = document.createElement('ul'); list.className = 'search-results';
      for (const item of results) {
        const li = document.createElement('li'); const h = document.createElement('h2');
        const a = document.createElement('a'); a.href = new URL(item.href, siteRoot); a.textContent = item.title;
        h.append(a); const p = document.createElement('p'); p.textContent = `${item.text.slice(0,180)}…`;
        li.append(h, p); list.append(li);
      }
      output.append(list);
    } catch {
      output.textContent = 'Nie udało się wczytać wyszukiwarki. Odśwież stronę lub skorzystaj z menu Usługi.';
    }
  }
}
