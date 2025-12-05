/**
 * Client-Side Catalog - All filtering done locally
 * 
 * 1. Fetches full catalog once, stores in sessionStorage
 * 2. All filtering/pagination/search happens client-side
 * 3. Instant filter response (no network latency)
 * 4. Easy to add new filters (brand, size, search, etc.)
 */

(async function () {
  'use strict';
  
  // ============================================================
  // CONFIG
  // ============================================================
  
  const BASE = window.API_BASE_URL;
  const CATALOG_URL = `${BASE}/clothing_items/catalog/full`;
  const STORAGE_KEY = 'dm_catalog';
  const ITEMS_PER_PAGE = 20;
  
  // ============================================================
  // DOM HOOKS
  // ============================================================
  
  const grid = document.querySelector('[data-grid="products"]');
  const template = document.querySelector('[data-template="product-card"]');
  const btnPrev = document.querySelector('[data-page="prev"]');
  const btnNext = document.querySelector('[data-page="next"]');
  const pageLabel = document.querySelector('[data-page="label"]');
  
  if (!grid || !template) {
    console.warn('[Catalog] Grid or template not found');
    return;
  }
  
  // ============================================================
  // STATE
  // ============================================================
  
  let catalogData = null;
  let currentPage = 1;
  let filteredItems = [];
  
  // ============================================================
  // STORAGE
  // ============================================================
  
  function saveCatalog(data) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[Catalog] Could not save to sessionStorage:', e);
    }
  }
  
  function loadCatalog() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const { data, timestamp } = JSON.parse(stored);
      
      const MAX_AGE = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - timestamp > MAX_AGE) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return data;
    } catch (e) {
      return null;
    }
  }
  
  // ============================================================
  // FETCH
  // ============================================================
  
  async function fetchCatalog() {
    console.log('[Catalog] Fetching full catalog...');
    
    const res = await fetch(CATALOG_URL, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log(`[Catalog] Loaded ${data.total_items} items (version: ${data.version})`);
    
    return data;
  }
  
  async function initCatalog() {
    catalogData = loadCatalog();
    
    if (catalogData) {
      console.log('[Catalog] Using cached data');
    } else {
      catalogData = await fetchCatalog();
      saveCatalog(catalogData);
    }
    
    return catalogData;
  }
  
  // ============================================================
  // FILTERING
  // ============================================================
  
  function getSelectedFilters() {
    const get = (type) => Array.from(
      document.querySelectorAll(`input[data-filter="${type}"]:checked`)
    ).map(i => i.value);
    
    return {
      categories: get('category'),
      subcategories: get('subcategory'),
      colors: get('color'),
      brands: get('brand'),
    };
  }
  
  function filterItems(items, filters) {
    return items.filter(item => {
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(item.category_name)) return false;
      }
      
      if (filters.subcategories.length > 0) {
        if (!filters.subcategories.includes(item.subcategory_name)) return false;
      }
      
      if (filters.colors.length > 0) {
        if (!item.color_names.some(c => filters.colors.includes(c))) return false;
      }
      
      if (filters.brands.length > 0) {
        if (!filters.brands.includes(item.brand_name)) return false;
      }
      
      return true;
    });
  }
  
  function calculateFilterCounts(allItems, currentFilters) {
    const counts = {
      categories: {},
      subcategories: {},
      colors: {},
      brands: {},
    };
    
    // Category counts: items matching (subcategory + color + brand) filters
    allItems.filter(item => {
      if (currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
      if (currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
      if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(item.brand_name)) return false;
      return true;
    }).forEach(item => {
      counts.categories[item.category_name] = (counts.categories[item.category_name] || 0) + 1;
    });
    
    // Subcategory counts: items matching (category + color + brand) filters
    allItems.filter(item => {
      if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
      if (currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
      if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(item.brand_name)) return false;
      return true;
    }).forEach(item => {
      counts.subcategories[item.subcategory_name] = (counts.subcategories[item.subcategory_name] || 0) + 1;
    });
    
    // Color counts: items matching (category + subcategory + brand) filters
    allItems.filter(item => {
      if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
      if (currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
      if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(item.brand_name)) return false;
      return true;
    }).forEach(item => {
      item.color_names.forEach(color => {
        counts.colors[color] = (counts.colors[color] || 0) + 1;
      });
    });
    
    // Brand counts: items matching (category + subcategory + color) filters
    allItems.filter(item => {
      if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
      if (currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
      if (currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
      return true;
    }).forEach(item => {
      counts.brands[item.brand_name] = (counts.brands[item.brand_name] || 0) + 1;
    });
    
    return counts;
  }
  
  // ============================================================
  // RENDERING
  // ============================================================
  
  function setImg(el, url, alt) {
    if (!el) return;
    el.removeAttribute('srcset');
    el.removeAttribute('sizes');
    el.src = url || '';
    el.alt = alt || '';
    el.loading = 'lazy';
    el.decoding = 'async';
  }
  
  function makeCard(item) {
    const card = template.cloneNode(true);
    card.classList.remove('is-template');
    card.removeAttribute('data-template');
    card.setAttribute('data-sku', item.sku);
    card.setAttribute('data-name', item.name);
    card.setAttribute('data-item-id', item.id);
    
    const href = `/product?sku=${encodeURIComponent(item.sku)}`;
    const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
    
    if (linkEl) {
      linkEl.href = href;
    } else {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = href; });
    }
    
    setImg(card.querySelector('img[data-field="frontImage"]'), item.front_image, `${item.name} — front`);
    setImg(card.querySelector('img[data-field="backImage"]'), item.back_image || item.front_image, `${item.name} — back`);
    
    const nameEl = card.querySelector('[data-field="name"]');
    if (nameEl) nameEl.textContent = item.name || item.sku;
    
    const metaEl = card.querySelector('[data-field="meta"]');
    if (metaEl) metaEl.textContent = item.status || '';
    
    return card;
  }
  
  function renderGrid(items, page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);
    
    grid.innerHTML = '';
    
    if (pageItems.length === 0) {
      grid.innerHTML = '<p>No items found.</p>';
      return;
    }
    
    pageItems.forEach(item => grid.appendChild(makeCard(item)));
    
    if (window.Webflow?.require) {
      requestAnimationFrame(() => {
        try { window.Webflow.require('ix2').init(); } catch (_) {}
      });
    }
    
    if (window.updateWishlistIcons) {
      requestAnimationFrame(() => window.updateWishlistIcons());
    }
  }
  
  function renderFilterPanel(selector, options, filterType, counts) {
    const listEl = document.querySelector(selector);
    if (!listEl) return;
    
    const currentlyChecked = new Set(
      Array.from(document.querySelectorAll(`input[data-filter="${filterType}"]:checked`))
        .map(i => i.value)
    );
    
    listEl.innerHTML = '';
    
    if (!options.length) {
      listEl.innerHTML = '<div style="opacity:.6">No options available.</div>';
      return;
    }
    
    options.forEach(opt => {
      const count = counts[opt.name] || 0;
      const isChecked = currentlyChecked.has(opt.name);
      const isDisabled = count === 0 && !isChecked;
      
      const label = document.createElement('label');
      label.className = 'row';
      label.innerHTML = `
        <input type="checkbox" 
               value="${opt.name}" 
               data-filter="${filterType}"
               data-id="${opt.id}"
               ${opt.category_id ? `data-category-id="${opt.category_id}"` : ''}
               ${isChecked ? 'checked' : ''}
               ${isDisabled ? 'disabled' : ''}>
        <span style="${isDisabled ? 'opacity: 0.4' : ''}">${opt.name} (${count})</span>
      `;
      listEl.appendChild(label);
    });
  }
  
  function updatePager(totalItems, page) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    
    if (pageLabel) pageLabel.textContent = `${page} / ${totalPages}`;
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;
    
    return totalPages;
  }
  
  // ============================================================
  // MAIN RENDER FUNCTION
  // ============================================================
  
  function render(page = 1) {
    const filters = getSelectedFilters();
    
    filteredItems = filterItems(catalogData.items, filters);
    
    const counts = calculateFilterCounts(catalogData.items, filters);
    
    // Render filter panels
    renderFilterPanel('[data-list="category"]', catalogData.filters.categories, 'category', counts.categories);
    renderFilterPanel('[data-list="color"]', catalogData.filters.colors, 'color', counts.colors);
    renderFilterPanel('[data-list="brand"]', catalogData.filters.brands, 'brand', counts.brands);
    
    // Subcategories: only show those for selected categories
    let subcatsToShow = catalogData.filters.subcategories;
    if (filters.categories.length > 0) {
      const selectedCatIds = catalogData.filters.categories
        .filter(c => filters.categories.includes(c.name))
        .map(c => c.id);
      subcatsToShow = subcatsToShow.filter(s => selectedCatIds.includes(s.category_id));
    }
    renderFilterPanel('[data-list="subcategory"]', subcatsToShow, 'subcategory', counts.subcategories);
    
    // Show/hide subcategory panel
    const subPanel = document.querySelector('[data-panel="subcategory"]');
    if (subPanel) {
      subPanel.style.display = filters.categories.length > 0 ? '' : 'none';
    }
    
    renderGrid(filteredItems, page);
    
    currentPage = page;
    updatePager(filteredItems.length, page);
    
    updateURL(filters, page);
    
    console.log(`[Catalog] Rendered ${filteredItems.length} items (page ${page})`);
  }
  
  // ============================================================
  // URL SYNC
  // ============================================================
  
  function updateURL(filters, page) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    
    filters.categories.forEach(c => params.append('categories', c));
    filters.subcategories.forEach(s => params.append('subcategories', s));
    filters.colors.forEach(c => params.append('colors', c));
    filters.brands.forEach(b => params.append('brands', b));
    
    history.replaceState({ page }, '', '?' + params.toString());
  }
  
  function readFiltersFromURL() {
    const params = new URLSearchParams(location.search);
    return {
      categories: params.getAll('categories').filter(Boolean),
      subcategories: params.getAll('subcategories').filter(Boolean),
      colors: params.getAll('colors').filter(Boolean),
      brands: params.getAll('brands').filter(Boolean),
      page: parseInt(params.get('page') || '1', 10)
    };
  }
  
  function applyURLFilters() {
    const urlFilters = readFiltersFromURL();
    
    const filterMap = {
      category: urlFilters.categories,
      subcategory: urlFilters.subcategories,
      color: urlFilters.colors,
      brand: urlFilters.brands,
    };
    
    Object.entries(filterMap).forEach(([type, values]) => {
      document.querySelectorAll(`input[data-filter="${type}"]`).forEach(input => {
        input.checked = values.includes(input.value);
      });
    });
    
    return urlFilters.page;
  }
  
  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  document.addEventListener('change', (e) => {
    if (!e.target.matches('[data-filter]')) return;
    
    // If category unchecked, clear subcategories
    if (e.target.matches('[data-filter="category"]') && !e.target.checked) {
      document.querySelectorAll('[data-filter="subcategory"]:checked').forEach(i => {
        i.checked = false;
      });
    }
    
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        render(currentPage - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
      if (currentPage < totalPages) {
        render(currentPage + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  document.querySelectorAll('[data-filter-reset]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('[data-filter]').forEach(i => { i.checked = false; });
      render(1);
      
      const panel = btn.closest('[data-panel], .filter-panel');
      const closeBtn = panel?.querySelector('[data-panel-close], [data-close]');
      closeBtn?.click();
    });
  });
  
  document.querySelectorAll('[data-filter-apply]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = btn.closest('[data-panel], .filter-panel');
      const closeBtn = panel?.querySelector('[data-panel-close], [data-close]');
      closeBtn?.click();
    });
  });
  
  window.addEventListener('popstate', () => {
    const page = applyURLFilters();
    render(page);
  });
  
  // ============================================================
  // INIT
  // ============================================================
  
  try {
    await initCatalog();
    
    // Initial render populates filter panels
    render(1);
    
    // Apply URL filters (sets checkboxes) and re-render if needed
    const urlFilters = readFiltersFromURL();
    const hasFilters = urlFilters.categories.length || urlFilters.subcategories.length || 
                       urlFilters.colors.length || urlFilters.brands.length;
    
    if (urlFilters.page !== 1 || hasFilters) {
      applyURLFilters();
      render(urlFilters.page);
    }
    
    console.log('[Catalog] Ready - client-side filtering enabled 🚀');
    
  } catch (err) {
    console.error('[Catalog] Init failed:', err);
    grid.innerHTML = '<p>Could not load catalog. Please refresh the page.</p>';
  }
  
})();