<script>
(async function () {
  // ====== CONFIG ======
  const API_BASE       = 'https://api.dematerialized.nl';
  const ALT_BASE       = 'https://demat-backend-load-balancer-358156782.eu-north-1.elb.amazonaws.com';
  const BASE           = API_BASE;
  const CATEGORIES_URL = `${BASE}/clothing_items/categories`;
  const SUBCATS_URL    = `${BASE}/clothing_items/subcategories`;
  const COLORS_URL     = `${BASE}/clothing_items/colors`;
  const ITEMS_URL      = `${BASE}/clothing_items/clothing_items`;
  const ITEMS_PER_PAGE = 20;

  // detected keys
  let CAT_FILTER_KEY = null;
  let SUB_FILTER_KEY = null;
  let COL_FILTER_KEY = null;

  // --- Persist detected filter keys across navigation ---
  const KEY_STORE = {
    get: (k) => { try { return localStorage.getItem(k); } catch(_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch(_) {} }
  };
  const CAT_KEY_STORAGE = 'dm_cat_key';
  const SUB_KEY_STORAGE = 'dm_sub_key';
  const COL_KEY_STORAGE = 'dm_col_key';
  CAT_FILTER_KEY = KEY_STORE.get(CAT_KEY_STORAGE) || CAT_FILTER_KEY;
  SUB_FILTER_KEY = KEY_STORE.get(SUB_KEY_STORAGE) || SUB_FILTER_KEY;
  COL_FILTER_KEY = KEY_STORE.get(COL_KEY_STORAGE) || COL_FILTER_KEY;

  // ====== CORE HOOKS ======
  const grid      = document.querySelector('[data-grid="products"]');
  const template  = document.querySelector('[data-template="product-card"]');
  const pager     = document.querySelector('[data-pager]');
  const btnPrev   = document.querySelector('[data-page="prev"]');
  const btnNext   = document.querySelector('[data-page="next"]');
  const pageLabel = document.querySelector('[data-page="label"]');
  if (!grid || !template) return;

  // ====== UTIL ======
  function waitFor(selector, options) {
    options = options || {};
    const tries = options.tries || 50;
    const interval = options.interval || 150;
    return new Promise(resolve => {
      let n = 0;
      const t = setInterval(() => {
        const el = document.querySelector(selector);
        if (el || ++n >= tries) { clearInterval(t); resolve(el || null); }
      }, interval);
    });
  }
  const slugify = s => (s || '').toString().trim().toLowerCase().replace(/\s+/g,'-');
  const pluralMap = { category: 'categories', subcategory: 'subcategories', color: 'colors' };
  function debounce(fn, ms) {
    ms = ms || 200;
    let t;
    return function() {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ——— PASS ITEM TO PRODUCT PAGE (via sessionStorage) ———
  function saveClickedItem(item){
    try {
      if (!item || !item.sku) return;
      sessionStorage.setItem('dm:last_sku', item.sku);
      sessionStorage.setItem('dm:item:' + item.sku, JSON.stringify(item));
    } catch(_) {}
  }

  // ====== IMAGE HELPERS ======
  function pickFrontImage(item) {
    const imgs = (item && item.images) || [];
    let img = imgs.find(i => i.image_type === 'front') || imgs.find(i => /front/i.test(i.image_name || ''));
    return (img && img.object_url) || (imgs[0] && imgs[0].object_url) || '';
  }
  function pickBackImage(item) {
    const imgs = (item && item.images) || [];
    let img = imgs.find(i => i.image_type === 'back') || imgs.find(i => /back/i.test(i.image_name || ''));
    return (img && img.object_url) || pickFrontImage(item);
  }
  function setImg(el, url, alt) {
    if (!el) return;
    el.removeAttribute('srcset'); el.removeAttribute('sizes');
    el.src = url || ''; el.alt = alt || '';
    el.loading = el.loading || 'lazy';
    el.decoding = el.decoding || 'async';
  }
  function makeCard(item) {
    const card = template.cloneNode(true);
    card.classList.remove('is-template');
    card.removeAttribute('data-template');

    // helpful metadata on root - INCLUDING item.id for wishlist
    card.setAttribute('data-sku', item.sku || '');
    card.setAttribute('data-name', item.name || '');
    card.setAttribute('data-item-id', item.id || '');

    const linkEl = card.querySelector('a') || (card.tagName.toLowerCase() === 'a' ? card : null);
    const q = location.search ? '&from=' + encodeURIComponent(location.pathname + location.search) : '';
    const href = '/product?sku=' + encodeURIComponent(item.sku) + q;
    if (linkEl) {
      linkEl.href = href;
      linkEl.setAttribute('data-sku', item.sku || '');
      linkEl.setAttribute('data-name', item.name || '');
      linkEl.setAttribute('data-description', item.description || item.desc || '');
      linkEl.setAttribute('data-color', item.color || (item.colors && item.colors[0]) || '');
      linkEl.setAttribute('data-size', item.size || (item.sizes && item.sizes[0]) || '');
      linkEl.setAttribute('data-brand', item.brand || item.label || '');
      linkEl.addEventListener('click', () => { saveClickedItem(item); }, { capture: true });
    } else {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { saveClickedItem(item); window.location.href = href; });
      card.setAttribute('data-description', item.description || item.desc || '');
      card.setAttribute('data-color', item.color || (item.colors && item.colors[0]) || '');
      card.setAttribute('data-size', item.size || (item.sizes && item.sizes[0]) || '');
      card.setAttribute('data-brand', item.brand || item.label || '');
    }

    setImg(card.querySelector('img[data-field="frontImage"]'), pickFrontImage(item), (item.name || item.sku || 'item') + ' — front');
    setImg(card.querySelector('img[data-field="backImage"]'),  pickBackImage(item),  (item.name || item.sku || 'item') + ' — back');

    const nameEl = card.querySelector('[data-field="name"]');
    if (nameEl) nameEl.textContent = item.name || item.sku;

    const metaEl = card.querySelector('[data-field="meta"]');
    if (metaEl) metaEl.textContent = item.status || '';
    
    return card;
  }

  // ====== URL → FILTERS ======
  function readURLGroup(group) {
    const p = new URLSearchParams(location.search);
    const out = { names: [], ids: [], slugs: [] };
    out.names.push.apply(out.names, p.getAll(group));
    out.slugs.push.apply(out.slugs, p.getAll(group + '_slug'));
    out.ids.push.apply(out.ids, p.getAll(group + '_id'));
    const plural = pluralMap[group];
    if (plural) {
      out.names.push.apply(out.names, p.getAll(plural));
      p.getAll(plural + '[]').forEach(v => out.names.push(v));
    }
    const single = p.get(group);
    if (single && single.includes(',')) out.names.push.apply(out.names, single.split(','));
    out.names = Array.from(new Set(out.names.filter(Boolean)));
    out.ids   = Array.from(new Set(out.ids.filter(Boolean)));
    out.slugs = Array.from(new Set(out.slugs.filter(Boolean)));
    return out;
  }

  // ====== READ FILTERS: DOM + URL (merged) ======
  function readGroupMerged(group) {
    const dom = { names: [], ids: [], slugs: [] };
    document.querySelectorAll('input[data-filter="' + group + '"]').forEach(input => {
      if (!input.checked) return;
      dom.names.push(input.value);
      const id = input.getAttribute('data-id');   if (id) dom.ids.push(id);
      const sg = input.getAttribute('data-slug'); if (sg) dom.slugs.push(sg);
    });
    const url = readURLGroup(group);
    const names = Array.from(new Set(url.names.concat(dom.names)));
    const ids   = Array.from(new Set(url.ids.concat(dom.ids)));
    const slugs = Array.from(new Set(url.slugs.concat(dom.slugs)));
    return { names: names, ids: ids, slugs: slugs };
  }
  const readCategoryFilters    = () => readGroupMerged('category');
  const readSubcategoryFilters = () => readGroupMerged('subcategory');
  const readColorFilters       = () => readGroupMerged('color');

  // ====== DETECTION ======
  async function detectGenericKey(group, selected, baseKv) {
    const one = {
      id:   (selected.ids && selected.ids[0])   || null,
      slug: (selected.slugs && selected.slugs[0]) || null,
      name: (selected.names && selected.names[0]) || null
    };
    if (!one.id && !one.slug && !one.name) return null;

    const fetchTotals = async (extraKv) => {
      const u = new URL(ITEMS_URL);
      u.searchParams.set('limit', '1');
      u.searchParams.set('page', '1');
      Object.entries(baseKv || {}).forEach(function(entry) { u.searchParams.append(entry[0], entry[1]); });
      Object.entries(extraKv || {}).forEach(function(entry) { u.searchParams.append(entry[0], entry[1]); });
      const r = await fetch(u.toString(), { headers: { accept: 'application/json' } });
      if (!r.ok) return null;
      const j = await r.json();
      return (j && j.total_items) || (j && j.clothing_items && j.clothing_items.length) || 0;
    };

    const baseline = await fetchTotals({});
    const candidates = [];
    if (one.id)   { candidates.push([group + '_id', one.id]); candidates.push([group + '_ids[]', one.id]); }
    if (one.slug) { candidates.push([group + '_slug', one.slug]); candidates.push([group + '_slugs[]', one.slug]); }
    if (one.name) {
      const plural = pluralMap[group];
      candidates.push([group, one.name]);
      if (plural) { candidates.push([plural, one.name]); candidates.push([plural + '[]', one.name]); }
    }

    for (let i = 0; i < candidates.length; i++) {
      const key = candidates[i][0];
      const val = candidates[i][1];
      const kvObj = {};
      kvObj[key] = val;
      const tot = await fetchTotals(kvObj);
      if (tot === null) continue;
      if (tot !== baseline) return key;
    }
    return group;
  }
  async function detectCategoryFilterKey(selected)  {
    if (CAT_FILTER_KEY) return CAT_FILTER_KEY;
    CAT_FILTER_KEY = (await detectGenericKey('category', selected, {})) || 'category';
    KEY_STORE.set(CAT_KEY_STORAGE, CAT_FILTER_KEY);
    return CAT_FILTER_KEY;
  }
  async function detectSubcategoryFilterKey(selected, baseKv) {
    if (SUB_FILTER_KEY) return SUB_FILTER_KEY;
    SUB_FILTER_KEY = (await detectGenericKey('subcategory', selected, baseKv)) || 'subcategory';
    KEY_STORE.set(SUB_KEY_STORAGE, SUB_FILTER_KEY);
    return SUB_FILTER_KEY;
  }
  async function detectColorFilterKey(selected, baseKv) {
    if (COL_FILTER_KEY) return COL_FILTER_KEY;
    COL_FILTER_KEY = (await detectGenericKey('color', selected, baseKv)) || 'color';
    KEY_STORE.set(COL_KEY_STORAGE, COL_FILTER_KEY);
    return COL_FILTER_KEY;
  }

  function buildBaseKvExcluding(excludedGroup) {
    const kv = {};
    if (excludedGroup !== 'category') {
      const cats = readCategoryFilters();
      if (cats.names.length || cats.ids.length || cats.slugs.length) {
        const key = CAT_FILTER_KEY || 'category';
        const list = key.endsWith('_id') ? cats.ids : key.endsWith('_slug') ? cats.slugs : cats.names;
        if (list[0]) kv[key] = list[0];
      }
    }
    if (excludedGroup !== 'subcategory') {
      const subs = readSubcategoryFilters();
      if (subs.names.length || subs.ids.length || subs.slugs.length) {
        const key = SUB_FILTER_KEY || 'subcategory';
        const list = key.endsWith('_id') ? subs.ids : key.endsWith('_slug') ? subs.slugs : subs.names;
        if (list[0]) kv[key] = list[0];
      }
    }
    if (excludedGroup !== 'color') {
      const cols = readColorFilters();
      if (cols.names.length || cols.ids.length || cols.slugs.length) {
        const key = COL_FILTER_KEY || 'color';
        const list = key.endsWith('_id') ? cols.ids : key.endsWith('_slug') ? cols.slugs : cols.names;
        if (list[0]) kv[key] = list[0];
      }
    }
    return kv;
  }

  // ====== PARAM BUILDERS ======
  function buildParams(page, limit) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    const cat = readCategoryFilters();
    if (CAT_FILTER_KEY) {
      const list =
        CAT_FILTER_KEY === 'category_id'   ? cat.ids   :
        CAT_FILTER_KEY === 'category_slug' ? cat.slugs :
        cat.names;
      if (CAT_FILTER_KEY === 'categories[]') list.forEach(v => params.append('categories[]', v));
      else list.forEach(v => params.append(CAT_FILTER_KEY, v));
    } else {
      cat.names.forEach(v => params.append('category', v));
      cat.slugs.forEach(v => params.append('category_slug', v));
      cat.ids.forEach(v   => params.append('category_id', v));
    }

    const sub = readSubcategoryFilters();
    if (SUB_FILTER_KEY) {
      const list =
        SUB_FILTER_KEY.endsWith('_id')   ? sub.ids   :
        SUB_FILTER_KEY.endsWith('_slug') ? sub.slugs :
        sub.names;
      if (SUB_FILTER_KEY.endsWith('[]')) list.forEach(v => params.append(SUB_FILTER_KEY, v));
      else list.forEach(v => params.append(SUB_FILTER_KEY, v));
    } else {
      sub.names.forEach(v => params.append('subcategory', v));
      sub.slugs.forEach(v => params.append('subcategory_slug', v));
      sub.ids.forEach(v   => params.append('subcategory_id', v));
    }

    const col = readColorFilters();
    if (COL_FILTER_KEY) {
      const list =
        COL_FILTER_KEY.endsWith('_id')   ? col.ids   :
        COL_FILTER_KEY.endsWith('_slug') ? col.slugs :
        col.names;
      if (COL_FILTER_KEY.endsWith('[]')) list.forEach(v => params.append(COL_FILTER_KEY, v));
      else list.forEach(v => params.append(COL_FILTER_KEY, v));
    } else {
      col.names.forEach(v => params.append('color', v));
      col.slugs.forEach(v => params.append('color_slug', v));
      col.ids.forEach(v   => params.append('color_id', v));
    }

    const current = new URLSearchParams(location.search);
    const excludeKeys = [
      'page','limit',
      'category','category_slug','category_id','categories','categories[]',
      'subcategory','subcategory_slug','subcategory_id','subcategories','subcategories[]',
      'color','color_slug','color_id','colors','colors[]'
    ];
    for (const entry of current.entries()) {
      const k = entry[0];
      const v = entry[1];
      if (!params.has(k) && excludeKeys.indexOf(k) === -1) {
        params.append(k, v);
      }
    }
    return params;
  }

  function buildAvailabilityParams(extraKv) {
    extraKv = extraKv || {};
    const p = buildParams(1, 1);
    p.set('page', '1'); p.set('limit', '1');
    Object.entries(extraKv).forEach(function(entry) { p.append(entry[0], entry[1]); });
    return p;
  }

  // ====== DATA + RENDER + PAGER ======
  let currentPage = 1, totalPages = 1;

  async function fetchItems(params) {
    const url = ITEMS_URL + '?' + params.toString();
    console.log('Fetching products:', url);
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function render(items) {
    grid.innerHTML = '';
    items.slice(0, ITEMS_PER_PAGE).forEach(item => grid.appendChild(makeCard(item)));
    if (window.Webflow && window.Webflow.require) {
      requestAnimationFrame(() => { try { window.Webflow.require('ix2').init(); } catch (_) {} });
    }
    if (window.updateWishlistIcons) {
      requestAnimationFrame(() => window.updateWishlistIcons());
    }
  }

  function updatePagerUI() {
    if (!pager) return;
    if (pageLabel) pageLabel.textContent = currentPage + ' / ' + totalPages;
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = currentPage >= totalPages;
  }

  async function loadPage(page, pushState) {
    page = page || 1;
    pushState = pushState || false;
    const params = buildParams(page, ITEMS_PER_PAGE);
    try {
      const data  = await fetchItems(params);
      const items = (data && data.clothing_items) || [];
      currentPage = (data && data.page) || page;
      totalPages  = (data && data.total_pages) || 1;

      grid.innerHTML = '';
      if (!items.length) {
        const p = document.createElement('p');
        p.textContent = 'No items found.';
        grid.appendChild(p);
      } else {
        render(items);
      }
      updatePagerUI();

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (pushState) {
        const u = new URL(location.href);
        u.search = params.toString();
        history.pushState({ page: currentPage }, '', u.toString());
      }

      refreshFacetAvailability();
      updateTypePanelVisibility();
    } catch (err) {
      console.error(err);
      grid.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = 'Could not load items.';
      grid.appendChild(p);
    }
  }

  if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage > 1) loadPage(currentPage - 1, true); });
  if (btnNext) btnNext.addEventListener('click', () => { if (currentPage < totalPages) loadPage(currentPage + 1, true); });

  // ====== PANELS & MASTER LISTS ======
  let ALL_CATS = [], ALL_SUBS = [], ALL_COLORS = [];
  let categoryListEl = null, subListEl = null, colorListEl = null;

  function renderCategoryListFrom(source) {
    if (!categoryListEl) return;
    const previouslyChecked = new Set(
      Array.from(document.querySelectorAll('input[data-filter="category"]:checked')).map(i => i.value)
    );
    categoryListEl.innerHTML = '';
    if (!source.length) {
      categoryListEl.innerHTML = '<div style="opacity:.6">No categories available.</div>';
      return;
    }
    for (let i = 0; i < source.length; i++) {
      const cat = source[i];
      const label = document.createElement('label');
      label.className = 'row';
      label.innerHTML =
        '<input type="checkbox" value="' + cat.name + '" data-filter="category" data-id="' +
        (cat.id || '') + '" data-slug="' + (cat.slug || '') + '">' +
        '<span>' + cat.name + '</span>';
      const input = label.querySelector('input');
      input.checked = previouslyChecked.has(cat.name);
      categoryListEl.appendChild(label);
    }
  }
  
  async function setupCategoryPanel() {
    categoryListEl = await waitFor('[data-list="category"]');
    if (!categoryListEl) return;

    categoryListEl.innerHTML = '<div style="opacity:.6">Loading…</div>';
    try {
      const res = await fetch(CATEGORIES_URL, { headers: { accept: 'application/json' } });
      if (!res.ok) { categoryListEl.innerHTML = 'Could not load categories (HTTP ' + res.status + ').'; return; }
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw
                : (raw && Array.isArray(raw.categories)) ? raw.categories
                : (raw && Array.isArray(raw.data)) ? raw.data
                : [];
      ALL_CATS = arr.map(x => {
        if (typeof x === 'string') return { id: null, name: x, slug: slugify(x) };
        return {
          id:   x.id || x.category_id || x.uuid || null,
          name: x.name || x.title || x.value || '',
          slug: x.slug || (x.name ? slugify(x.name) : null)
        };
      }).filter(c => c.name).sort((a,b)=>a.name.localeCompare(b.name));

      renderCategoryListFrom(ALL_CATS);

      const urlSel = readURLGroup('category').names;
      categoryListEl.querySelectorAll('input[data-filter="category"]').forEach(input => {
        input.checked = urlSel.indexOf(input.value) !== -1;
      });
    } catch (e) {
      console.error('Category panel error:', e);
      categoryListEl.innerHTML = 'Could not load categories.';
    }
  }

  function isCategoryActive() {
    return document.querySelector('input[data-filter="category"]:checked') !== null;
  }
  function currentSelectedCategories() {
    const ids = [], names = [], slugs = [];
    document.querySelectorAll('input[data-filter="category"]').forEach(input => {
      if (!input.checked) return;
      names.push(input.value);
      const id = input.getAttribute('data-id');   if (id)   ids.push(id);
      const sg = input.getAttribute('data-slug'); if (sg)   slugs.push(sg);
    });
    return { ids: ids, names: names, slugs: slugs };
  }
  function subMatchesSelectedCategories(sub, selCats) {
    if (!selCats.ids.length && !selCats.names.length && !selCats.slugs.length) return true;
    const anyIntersect = (a, b) => a.some(v => b.indexOf(String(v)) !== -1);
    if (selCats.ids.length   && anyIntersect(sub.catIds.map(String),   selCats.ids.map(String)))   return true;
    if (selCats.slugs.length && anyIntersect(sub.catSlugs.map(String), selCats.slugs.map(String))) return true;
    if (selCats.names.length && anyIntersect(sub.catNames.map(String), selCats.names.map(String))) return true;
    if (selCats.names.length) {
      const n = sub.name.toLowerCase();
      return selCats.names.some(cn => n.indexOf(cn.toLowerCase()) !== -1);
    }
    return false;
  }
  function buildSubcategorySource() {
    const selCats = currentSelectedCategories();
    if (!isCategoryActive()) return [];
    return ALL_SUBS.filter(sc => subMatchesSelectedCategories(sc, selCats));
  }
  function renderSubcategoryListFrom(source) {
    if (!subListEl) return;
    const previouslyChecked = new Set(
      Array.from(document.querySelectorAll('input[data-filter="subcategory"]:checked')).map(i => i.value)
    );
    subListEl.innerHTML = '';
    if (!source.length) {
      subListEl.innerHTML = '<div style="opacity:.6">Select a category to choose a type.</div>';
      return;
    }
    for (let i = 0; i < source.length; i++) {
      const sc = source[i];
      const label = document.createElement('label');
      label.className = 'row';
      label.innerHTML =
        '<input type="checkbox" value="' + sc.name + '" data-filter="subcategory" data-id="' + (sc.id || '') + '" data-slug="' + (sc.slug || '') + '">' +
        '<span>' + sc.name + '</span>';
      const input = label.querySelector('input');
      input.checked = previouslyChecked.has(sc.name);
      subListEl.appendChild(label);
    }
  }
  function updateTypePanelVisibility() {
    const panel = document.querySelector('[data-panel="subcategory"]');
    const list  = document.querySelector('[data-list="subcategory"]');
    if (!panel || !list) return;
    if (isCategoryActive()) {
      panel.style.display = '';
      renderSubcategoryListFrom(buildSubcategorySource());
    } else {
      document.querySelectorAll('input[data-filter="subcategory"]').forEach(i => { i.checked = false; });
      panel.style.display = 'none';
      list.innerHTML = '<div style="opacity:.6">Select a category to choose a type.</div>';
    }
  }
  async function setupSubcategoryPanel() {
    subListEl = await waitFor('[data-list="subcategory"]');
    if (!subListEl) return;

    subListEl.innerHTML = '<div style="opacity:.6">Loading…</div>';
    try {
      const res = await fetch(SUBCATS_URL, { headers: { accept: 'application/json' } });
      if (!res.ok) { subListEl.innerHTML = 'Could not load subcategories (HTTP ' + res.status + ').'; return; }
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw
                : (raw && Array.isArray(raw.subcategories)) ? raw.subcategories
                : (raw && Array.isArray(raw.data)) ? raw.data
                : [];
      ALL_SUBS = arr.map(x => {
        const name = (x && x.name) || (x && x.title) || (x && x.value) || '';
        const id   = (x && x.id) || (x && x.subcategory_id) || (x && x.uuid) || null;
        const slug = (x && x.slug) || (name ? slugify(name) : null);
        const catId   = (x && x.category_id) || (x && x.parent_id) || (x && x.group_id) || (x && x.categoryId) || (x && x.parentId) || null;
        const catName = (x && x.category_name) || (x && x.category) || (x && x.parent) || (x && x.group_name) || null;
        const catSlug = (x && x.category_slug) || (catName ? slugify(catName) : null);
        return {
          id: id, name: name, slug: slug,
          catIds:   [catId].filter(Boolean),
          catNames: [catName].filter(Boolean),
          catSlugs: [catSlug].filter(Boolean)
        };
      }).filter(s => s.name).sort((a,b)=>a.name.localeCompare(b.name));

      const urlSel = readURLGroup('subcategory').names;
      renderSubcategoryListFrom(buildSubcategorySource());
      subListEl.querySelectorAll('input[data-filter="subcategory"]').forEach(input => {
        input.checked = urlSel.indexOf(input.value) !== -1;
      });

      updateTypePanelVisibility();
    } catch (e) {
      console.error('Subcategory panel error:', e);
      subListEl.innerHTML = 'Could not load subcategories.';
    }
  }

  function renderColorListFrom(source) {
    if (!colorListEl) return;
    const previouslyChecked = new Set(
      Array.from(document.querySelectorAll('input[data-filter="color"]:checked')).map(i => i.value)
    );
    colorListEl.innerHTML = '';
    if (!source.length) {
      colorListEl.innerHTML = '<div style="opacity:.6">No colors available.</div>';
      return;
    }
    for (let i = 0; i < source.length; i++) {
      const c = source[i];
      const label = document.createElement('label');
      label.className = 'row';
      label.innerHTML =
        '<input type="checkbox" value="' + c.name + '" data-filter="color" data-id="' + (c.id || '') + '" data-slug="' + (c.slug || '') + '">' +
        '<span>' + c.name + '</span>';
      const input = label.querySelector('input');
      input.checked = previouslyChecked.has(c.name);
      colorListEl.appendChild(label);
    }
  }
  async function setupColorPanel() {
    colorListEl = await waitFor('[data-list="color"]');
    if (!colorListEl) return;

    colorListEl.innerHTML = '<div style="opacity:.6">Loading…</div>';
    try {
      const res = await fetch(COLORS_URL, { headers: { accept: 'application/json' } });
      if (!res.ok) { colorListEl.innerHTML = 'Could not load colors (HTTP ' + res.status + ').'; return; }
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw
                : (raw && Array.isArray(raw.colors)) ? raw.colors
                : (raw && Array.isArray(raw.data)) ? raw.data
                : [];
      ALL_COLORS = arr.map(x => {
        if (typeof x === 'string') return { id: null, name: x, slug: slugify(x) };
        return {
          id:   x.id || x.color_id || x.uuid || null,
          name: x.name || x.title || x.value || x.color || x.label || '',
          slug: x.slug || (x.name ? slugify(x.name) : null)
        };
      }).filter(c => c.name).sort((a,b)=>a.name.localeCompare(b.name));

      const urlSel = readURLGroup('color').names;
      renderColorListFrom(ALL_COLORS);
      colorListEl.querySelectorAll('input[data-filter="color"]').forEach(input => {
        input.checked = urlSel.indexOf(input.value) !== -1;
      });

    } catch (e) {
      console.error('Color panel error:', e);
      colorListEl.innerHTML = 'Could not load colors.';
    }
  }

  function buildParamsExcluding(groupToExclude) {
    const p = new URLSearchParams();
    p.set('page', '1');
    p.set('limit', '1');

    if (groupToExclude !== 'category') {
      const cat = readCategoryFilters();
      if (CAT_FILTER_KEY) {
        const list =
          CAT_FILTER_KEY === 'category_id'   ? cat.ids   :
          CAT_FILTER_KEY === 'category_slug' ? cat.slugs :
          cat.names;
        if (CAT_FILTER_KEY === 'categories[]') list.forEach(v => p.append('categories[]', v));
        else list.forEach(v => p.append(CAT_FILTER_KEY, v));
      } else {
        cat.names.forEach(v => p.append('category', v));
        cat.slugs.forEach(v => p.append('category_slug', v));
        cat.ids.forEach(v   => p.append('category_id', v));
      }
    }

    if (groupToExclude !== 'subcategory') {
      const sub = readSubcategoryFilters();
      if (SUB_FILTER_KEY) {
        const list =
          SUB_FILTER_KEY.endsWith('_id')   ? sub.ids   :
          SUB_FILTER_KEY.endsWith('_slug') ? sub.slugs :
          sub.names;
        if (SUB_FILTER_KEY.endsWith('[]')) list.forEach(v => p.append(SUB_FILTER_KEY, v));
        else list.forEach(v => p.append(SUB_FILTER_KEY, v));
      } else {
        sub.names.forEach(v => p.append('subcategory', v));
        sub.slugs.forEach(v => p.append('subcategory_slug', v));
        sub.ids.forEach(v   => p.append('subcategory_id', v));
      }
    }

    if (groupToExclude !== 'color') {
      const col = readColorFilters();
      if (COL_FILTER_KEY) {
        const list =
          COL_FILTER_KEY.endsWith('_id')   ? col.ids   :
          COL_FILTER_KEY.endsWith('_slug') ? col.slugs :
          col.names;
        if (COL_FILTER_KEY.endsWith('[]')) list.forEach(v => p.append(COL_FILTER_KEY, v));
        else list.forEach(v => p.append(COL_FILTER_KEY, v));
      } else {
        col.names.forEach(v => p.append('color', v));
        col.slugs.forEach(v => p.append('color_slug', v));
        col.ids.forEach(v   => p.append('color_id', v));
      }
    }

    return p;
  }

  const facetCache = new Map();

  async function hasAnyResultFor(group, kvKey, value) {
    const base = buildParamsExcluding(group);
    const p = new URLSearchParams(base.toString());
    p.append(kvKey, value);
    const cacheKey = 'q|' + p.toString();
    if (facetCache.has(cacheKey)) return facetCache.get(cacheKey);

    try {
      const url = ITEMS_URL + '?' + p.toString();
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      const tot = (j && j.total_items) || (j && j.clothing_items && j.clothing_items.length) || 0;
      const ok = (tot > 0);
      facetCache.set(cacheKey, ok);
      return ok;
    } catch (e) {
      console.warn('Facet check failed:', e);
      return true;
    }
  }

  function valueForKeyFromInput(key, inputEl) {
    if (!key) return null;
    if (key.endsWith('_id'))   return inputEl.getAttribute('data-id')   || null;
    if (key.endsWith('_slug')) return inputEl.getAttribute('data-slug') || null;
    return inputEl.value || null;
  }
  async function ensureKeyFor(group) {
    if (group === 'category'    && CAT_FILTER_KEY) return CAT_FILTER_KEY;
    if (group === 'subcategory' && SUB_FILTER_KEY) return SUB_FILTER_KEY;
    if (group === 'color'       && COL_FILTER_KEY) return COL_FILTER_KEY;

    if (group === 'subcategory' && ALL_SUBS.length) {
      const first = ALL_SUBS[0];
      const sample = { names:[first.name], ids:[first.id].filter(Boolean), slugs:[first.slug].filter(Boolean) };
      const base = buildBaseKvExcluding('subcategory');
      SUB_FILTER_KEY = await detectSubcategoryFilterKey(sample, base); return SUB_FILTER_KEY;
    }
    if (group === 'color' && ALL_COLORS.length) {
      const first = ALL_COLORS[0];
      const sample = { names:[first.name], ids:[first.id].filter(Boolean), slugs:[first.slug].filter(Boolean) };
      const base = buildBaseKvExcluding('color');
      COL_FILTER_KEY = await detectColorFilterKey(sample, base); return COL_FILTER_KEY;
    }
    if (group === 'category' && ALL_CATS.length) {
      const first = ALL_CATS[0];
      const sample = { names:[first.name], ids:[first.id].filter(Boolean), slugs:[first.slug].filter(Boolean) };
      CAT_FILTER_KEY = await detectCategoryFilterKey(sample); return CAT_FILTER_KEY;
    }
    return null;
  }
  async function prunePanelOptions(group) {
    const detectedKey = await ensureKeyFor(group);
    const container = document.querySelector('[data-list="' + group + '"]');
    if (!container) return;

    const options = Array.from(container.querySelectorAll('input[data-filter="' + group + '"]'));
    const toRemove = [];
    for (let i = 0; i < options.length; i++) {
      const input = options[i];
      const kvKey = detectedKey || group;
      const val = valueForKeyFromInput(kvKey, input) || input.value;
      const ok = await hasAnyResultFor(group, kvKey, val);
      if (!ok) toRemove.push(input.closest('label'));
    }
    toRemove.forEach(el => el && el.remove());
    if (!container.children.length) {
      container.innerHTML = '<div style="opacity:.6">No options available.</div>';
    }
  }
  async function refreshFacetAvailability() {
    if (categoryListEl && ALL_CATS.length) {
      renderCategoryListFrom(ALL_CATS);
      await prunePanelOptions('category');
    }
    if (subListEl && ALL_SUBS.length) {
      renderSubcategoryListFrom(buildSubcategorySource());
      if (isCategoryActive()) await prunePanelOptions('subcategory');
    }
    if (colorListEl && ALL_COLORS.length) {
      renderColorListFrom(ALL_COLORS);
      await prunePanelOptions('color');
    }
  }

  const autoApply = debounce(async () => {
    facetCache.clear();
    refreshFacetAvailability();
    updateTypePanelVisibility();

    const cats = readCategoryFilters();
    if (cats.names.length || cats.ids.length || cats.slugs.length) {
      await detectCategoryFilterKey(cats);
    }
    const baseKv = buildBaseKvExcluding(null);
    const subs = readSubcategoryFilters();
    const cols = readColorFilters();
    if (subs.names.length || subs.ids.length || subs.slugs.length) {
      await detectSubcategoryFilterKey(subs, baseKv);
    }
    if (cols.names.length || cols.ids.length || cols.slugs.length) {
      await detectColorFilterKey(cols, baseKv);
    }

    await loadPage(1, true);
  }, 150);

  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT' || input.type !== 'checkbox') return;
    if (!input.matches('[data-filter="category"],[data-filter="subcategory"],[data-filter="color"]')) return;
    if (input.matches('[data-filter="category"]')) updateTypePanelVisibility();
    autoApply();
  });

  function closePanel(panelEl) {
    if (!panelEl) return;
    const closeBtn =
      panelEl.querySelector('[data-panel-close], [data-close], [data-action="close"], [aria-label="Close"], [aria-label="close"]')
      || panelEl.querySelector('button, a');
    if (closeBtn) { closeBtn.click(); return; }
    const container = panelEl.closest('[data-panel], [data-filter-panel], .filter-panel, .panel') || panelEl;
    container.style.display = 'none';
    container.classList.remove('is-open','open','w--open');
  }
  function clearAllFiltersAndReload() {
    document.querySelectorAll('input[data-filter="category"],input[data-filter="subcategory"],input[data-filter="color"]')
      .forEach(i => { i.checked = false; });

    CAT_FILTER_KEY = null;
    SUB_FILTER_KEY = null;
    COL_FILTER_KEY = null;
    KEY_STORE.set(CAT_KEY_STORAGE, '');
    KEY_STORE.set(SUB_KEY_STORAGE, '');
    KEY_STORE.set(COL_KEY_STORAGE, '');

    facetCache.clear();

    if (categoryListEl) renderCategoryListFrom(ALL_CATS);
    if (subListEl)      renderSubcategoryListFrom(buildSubcategorySource());
    if (colorListEl)    renderColorListFrom(ALL_COLORS);

    refreshFacetAvailability();
    updateTypePanelVisibility();

    const params = new URLSearchParams();
    params.set('page','1');
    params.set('limit', String(ITEMS_PER_PAGE));
    history.pushState({ page: 1 }, '', '?' + params.toString());
    loadPage(1, false);
  }

  const resetButtons = Array.from(document.querySelectorAll('[data-filter-reset]'));
  resetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFiltersAndReload();
      const panel = btn.closest('[data-panel], [data-filter-panel], .filter-panel, .panel');
      if (panel) closePanel(panel);
    });
  });

  const applyButtons = Array.from(document.querySelectorAll('[data-filter-apply]'));
  applyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = btn.closest('[data-panel], [data-filter-panel], .filter-panel, .panel');
      closePanel(panel);
    });
  });

  function restoreSelectionsFromURL() {
    const params = new URLSearchParams(location.search);
    ['category','subcategory','color'].forEach(group => {
      const many = params.getAll(group);
      const single = params.get(group);
      const list = many.length ? many : (single && single.includes(',') ? single.split(',') : (single ? [single] : []));
      document.querySelectorAll('input[data-filter="' + group + '"]')
        .forEach(input => { input.checked = list.indexOf(input.value) !== -1; });
    });
  }
  async function detectAllKeysForCurrentSelections() {
    const cats = readCategoryFilters();
    if (cats.names.length || cats.ids.length || cats.slugs.length) {
      await detectCategoryFilterKey(cats);
    }
    const baseKv = buildBaseKvExcluding(null);

    const subs = readSubcategoryFilters();
    if (subs.names.length || subs.ids.length || subs.slugs.length) {
      await detectSubcategoryFilterKey(subs, baseKv);
    }

    const cols = readColorFilters();
    if (cols.names.length || cols.ids.length || cols.slugs.length) {
      await detectColorFilterKey(cols, baseKv);
    }
  }
  window.addEventListener('popstate', async () => {
    restoreSelectionsFromURL();
    facetCache.clear();
    updateTypePanelVisibility();
    await detectAllKeysForCurrentSelections();
    const p = parseInt(new URLSearchParams(location.search).get('page') || '1', 10) || 1;
    await loadPage(p, false);
  });
  window.addEventListener('pageshow', async (e) => {
    if (!e.persisted) return;
    restoreSelectionsFromURL();
    facetCache.clear();
    updateTypePanelVisibility();
    await detectAllKeysForCurrentSelections();
    const p = parseInt(new URLSearchParams(location.search).get('page') || '1', 10) || 1;
    await loadPage(p, false);
  });

  try { await setupCategoryPanel(); }    catch(e){ console.warn('setupCategoryPanel failed', e); }
  try { await setupSubcategoryPanel(); } catch(e){ console.warn('setupSubcategoryPanel failed', e); }
  try { await setupColorPanel(); }       catch(e){ console.warn('setupColorPanel failed', e); }

  refreshFacetAvailability();
  updateTypePanelVisibility();
  await detectAllKeysForCurrentSelections();

  const initialPage = parseInt(new URLSearchParams(location.search).get('page') || '1', 10) || 1;
  await loadPage(initialPage, false);
})();
</script>

<script>
(async function() {
  console.log('🚀 [Wishlist] Catalog script started');
  
  function waitForAuth() {
    return new Promise((resolve) => {
      console.log('⏳ [Wishlist] Waiting for auth0Client...');
      const checkAuth = setInterval(() => {
        if (window.auth0Client) {
          clearInterval(checkAuth);
          console.log('✅ [Wishlist] auth0Client found');
          resolve();
        }
      }, 100);
    });
  }

  await waitForAuth();

  console.log('🔐 [Wishlist] Checking authentication...');
  const isAuthenticated = await window.auth0Client.isAuthenticated();
  console.log('🔐 [Wishlist] Is authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.warn('❌ [Wishlist] User not authenticated - wishlist disabled');
    return;
  }

  console.log('🎫 [Wishlist] Getting auth token...');
  const token = await window.auth0Client.getTokenSilently();
  console.log('🎫 [Wishlist] Token obtained:', token ? 'YES (length: ' + token.length + ')' : 'NO');

  const API_BASE = 'https://api.dematerialized.nl';
  console.log('🌐 [Wishlist] API Base:', API_BASE);

  async function getUserWishlistIds() {
    try {
      const url = API_BASE + '/private_clothing_items/wishlist/clothing_item_ids/';
      console.log('📡 [Wishlist] Fetching user wishlist IDs from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 [Wishlist] Wishlist IDs response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [Wishlist] Failed to fetch wishlist IDs:', response.statusText);
        return [];
      }
      
      const ids = await response.json();
      console.log('✅ [Wishlist] User wishlist IDs:', ids);
      return ids;
    } catch (error) {
      console.error('❌ [Wishlist] Error fetching wishlist IDs:', error);
      return [];
    }
  }

  async function addToWishlist(clothingItemId) {
    try {
      const url = API_BASE + '/private_clothing_items/wishlist/' + clothingItemId;
      console.log('➕ [Wishlist] Adding item', clothingItemId, 'to wishlist');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });
      
      console.log('➕ [Wishlist] Add response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Wishlist] Failed to add:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ [Wishlist] Added successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ [Wishlist] Error adding to wishlist:', error);
      return false;
    }
  }

  async function removeFromWishlist(clothingItemId) {
    try {
      const url = API_BASE + '/private_clothing_items/wishlist/' + clothingItemId;
      console.log('➖ [Wishlist] Removing item', clothingItemId, 'from wishlist');
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });
      
      console.log('➖ [Wishlist] Remove response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Wishlist] Failed to remove:', errorText);
        return false;
      }
      
      console.log('✅ [Wishlist] Removed successfully');
      return true;
    } catch (error) {
      console.error('❌ [Wishlist] Error removing from wishlist:', error);
      return false;
    }
  }

  async function updateAllHeartIcons() {
    console.log('💗 [Wishlist] Updating all heart icons...');
    
    const wishlistIds = await getUserWishlistIds();
    console.log('💗 [Wishlist] Wishlist contains', wishlistIds.length, 'items');
    
    const cards = document.querySelectorAll('[data-sku]');
    console.log('💗 [Wishlist] Found', cards.length, 'clothing cards on page');
    
    cards.forEach((card, index) => {
      const clothingItemId = card.getAttribute('data-item-id');
      
      const outlineHeart = card.querySelector('.heart-icon-outline-20px');
      const filledHeart = card.querySelector('.heart-icon-filled-20px');
      
      if (!outlineHeart || !filledHeart) {
        console.warn('⚠️ [Wishlist] Card', index, 'missing heart icons');
        return;
      }
      
      if (!clothingItemId) {
        console.warn('⚠️ [Wishlist] Card', index, 'missing item ID');
        return;
      }
      
      const isInWishlist = wishlistIds.indexOf(parseInt(clothingItemId)) !== -1;
      
      if (isInWishlist) {
        outlineHeart.style.display = 'none';
        filledHeart.style.display = 'block';
        console.log('💗 [Wishlist] Card', index, '(ID:', clothingItemId, ') - FILLED');
      } else {
        outlineHeart.style.display = 'block';
        filledHeart.style.display = 'none';
        console.log('💗 [Wishlist] Card', index, '(ID:', clothingItemId, ') - OUTLINE');
      }
    });
    
    console.log('✅ [Wishlist] All heart icons updated');
  }

  function setupHeartClickHandlers() {
    console.log('🖱️ [Wishlist] Setting up click handlers...');
    
    document.addEventListener('click', async (e) => {
      const heartWrapper = e.target.closest('.div-wish-list-wrapper');
      if (!heartWrapper) return;

      e.preventDefault();
      e.stopPropagation();
      
      console.log('🖱️ [Wishlist] Heart clicked!');

      const card = heartWrapper.closest('[data-sku]');
      if (!card) {
        console.error('❌ [Wishlist] Could not find parent card');
        return;
      }

      const clothingItemId = card.getAttribute('data-item-id');
      if (!clothingItemId) {
        console.error('❌ [Wishlist] Card missing data-item-id');
        return;
      }
      
      console.log('🖱️ [Wishlist] Item ID:', clothingItemId);

      const outlineHeart = heartWrapper.querySelector('.heart-icon-outline-20px');
      const filledHeart = heartWrapper.querySelector('.heart-icon-filled-20px');

      if (!outlineHeart || !filledHeart) {
        console.error('❌ [Wishlist] Missing heart icons in wrapper');
        return;
      }

      const isInWishlist = filledHeart.style.display !== 'none';
      console.log('🖱️ [Wishlist] Current state:', isInWishlist ? 'IN WISHLIST' : 'NOT IN WISHLIST');

      let success;
      if (isInWishlist) {
        success = await removeFromWishlist(clothingItemId);
      } else {
        success = await addToWishlist(clothingItemId);
      }

      if (success) {
        if (isInWishlist) {
          outlineHeart.style.display = 'block';
          filledHeart.style.display = 'none';
          console.log('💗 [Wishlist] Updated to: OUTLINE');
        } else {
          outlineHeart.style.display = 'none';
          filledHeart.style.display = 'block';
          console.log('💗 [Wishlist] Updated to: FILLED');
        }
      } else {
        console.error('❌ [Wishlist] Failed to toggle wishlist');
      }
    });
    
    console.log('✅ [Wishlist] Click handlers ready');
  }

  function waitForItems() {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const cards = document.querySelectorAll('[data-sku]');
        if (cards.length > 0) {
          clearInterval(check);
          console.log('✅ [Wishlist] Items found on page:', cards.length);
          resolve();
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(check);
        console.warn('⚠️ [Wishlist] Timeout waiting for items');
        resolve();
      }, 10000);
    });
  }

  console.log('🎬 [Wishlist] Initializing...');
  setupHeartClickHandlers();
  await waitForItems();
  await updateAllHeartIcons();
  console.log('✅ [Wishlist] Initialization complete');
  
  window.updateWishlistIcons = updateAllHeartIcons;
  
  window.debugWishlist = {
    token: token.substring(0, 20) + '...',
    apiBase: API_BASE,
    async refresh() {
      console.log('🔄 [Debug] Refreshing wishlist state...');
      await updateAllHeartIcons();
    },
    async getWishlist() {
      console.log('🧪 [Debug] Getting wishlist IDs...');
      return await getUserWishlistIds();
    }
  };
  
  console.log('🧪 [Wishlist] Debug functions available:');
  console.log('  - window.debugWishlist.refresh()');
  console.log('  - window.debugWishlist.getWishlist()');

})();
</script>
<script>
// Cart handler for Clothing page - using capture phase
(function() {
  console.log('🛒 [Clothing] Cart script starting...');
  
  function setupCart() {
    console.log('🛒 [Clothing] Setting up cart...');
    
    // Move cart to body
    const backdrop = document.getElementById('cart-backdrop');
    const overlay = document.getElementById('cart-overlay');
    
    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
      console.log('🛒 [Clothing] Backdrop moved to body');
    }
    if (overlay && overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
      console.log('🛒 [Clothing] Overlay moved to body');
    }
    
    // Use capture phase to intercept click before other handlers
    document.addEventListener('click', function(e) {
      const cartTrigger = e.target.closest('[data-cart-trigger]');
      if (cartTrigger) {
        console.log('🛒 [Clothing] Cart trigger clicked!');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Ensure cart is in body
        const bd = document.getElementById('cart-backdrop');
        const ov = document.getElementById('cart-overlay');
        if (bd && bd.parentElement !== document.body) document.body.appendChild(bd);
        if (ov && ov.parentElement !== document.body) document.body.appendChild(ov);
        
        if (typeof openCartOverlay === 'function') {
          openCartOverlay();
        } else {
          console.error('🛒 [Clothing] openCartOverlay not found!');
        }
      }
    }, true); // true = capture phase
    
    console.log('🛒 [Clothing] Cart capture handler attached');
  }
  
  // Run setup at multiple times to ensure it catches
  setTimeout(setupCart, 100);
  setTimeout(setupCart, 500);
  setTimeout(setupCart, 1500);
  window.addEventListener('load', function() {
    setTimeout(setupCart, 500);
  });
})();
</script>
