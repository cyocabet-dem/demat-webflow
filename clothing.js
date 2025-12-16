/**
 * Client-Side Catalog with Smart Search
 * 
 * 1. Fetches catalog from /search endpoint
 * 2. Search queries go to backend for smart matching
 * 3. Client-side filtering on top of search results
 * 4. Filter options reflect available items (search-aware)
 */

(async function () {
  'use strict';
  
  // ============================================================
  // CONFIG
  // ============================================================
  
  const BASE = window.API_BASE_URL;
  const CATALOG_URL = `${BASE}/search`;
  const STORAGE_KEY = 'dm_catalog';
  const ITEMS_PER_PAGE = 20;
  
  // ============================================================
  // STATUS DISPLAY MAPPING
  // ============================================================
  
  const STATUS_DISPLAY = {
    available: 'Available',
    rented: 'Rented Out',
    reserved: 'Reserved',
    returned: 'Returning Soon',
    purchased: 'Purchased',
    sold: 'Sold',
    damaged: 'Unavailable',
    retired: 'No Longer Available'
  };
  
  function formatStatus(status) {
    const s = (status || '').toLowerCase().trim();
    // If status is empty/missing, default to 'available'
    if (!s) {
      return STATUS_DISPLAY['available'];
    }
    return STATUS_DISPLAY[s] || (s.charAt(0).toUpperCase() + s.slice(1));
  }
  
  // ============================================================
  // DOM HOOKS
  // ============================================================
  
  const grid = document.querySelector('[data-grid="products"]');
  const template = document.querySelector('[data-template="product-card"]');
  const btnPrev = document.querySelector('[data-page="prev"]');
  const btnNext = document.querySelector('[data-page="next"]');
  const pageLabel = document.querySelector('[data-page="label"]');
  const searchInput = document.querySelector('[data-search="input"]');
  const searchClear = document.querySelector('[data-search="clear"]');
  const resetAllBtn = document.querySelector('[data-reset-all]');
  
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
  let searchQuery = '';
  
  // ============================================================
  // STORAGE (only for non-search results)
  // ============================================================
  
  function saveCatalog(data) {
    if (data.query) return; // Don't cache search results
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
    if (searchQuery) return null; // Don't use cache when searching
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
  
  async function fetchCatalog(query = '') {
    const url = query 
      ? `${CATALOG_URL}?q=${encodeURIComponent(query)}&limit=500`
      : CATALOG_URL;
    
    console.log('[Catalog] Fetching:', url);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log(`[Catalog] Loaded ${data.total_items} items${query ? ` for "${query}"` : ''}`);
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
      if (filters.categories.length > 0 && !filters.categories.includes(item.category_name)) return false;
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(item.subcategory_name)) return false;
      if (filters.colors.length > 0 && !item.color_names.some(c => filters.colors.includes(c))) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(item.brand_name)) return false;
      return true;
    });
  }
  
  function calculateFilterCounts(allItems, currentFilters) {
    const counts = { categories: {}, subcategories: {}, colors: {}, brands: {} };
    
    // Category counts
    allItems.filter(item => {
      if (currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
      if (currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
      if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(item.brand_name)) return false;
      return true;
    }).forEach(item => {
      counts.categories[item.category_name] = (counts.categories[item.category_name] || 0) + 1;
    });
    
    // Subcategory counts
    allItems.filter(item => {
      if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
      if (currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
      if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(item.brand_name)) return false;
      return true;
    }).forEach(item => {
      counts.subcategories[item.subcategory_name] = (counts.subcategories[item.subcategory_name] || 0) + 1;
    });
    
    // Color counts
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
    
    // Brand counts
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
  
  // Build filter options from items (for search results)
  function buildFiltersFromItems(items) {
    const categories = new Map();
    const subcategories = new Map();
    const colors = new Map();
    const brands = new Map();
    
    items.forEach(item => {
      if (item.category_id && item.category_name) {
        categories.set(item.category_name, { id: item.category_id, name: item.category_name });
      }
      if (item.subcategory_id && item.subcategory_name) {
        subcategories.set(item.subcategory_name, { 
          id: item.subcategory_id, 
          name: item.subcategory_name, 
          category_id: item.category_id 
        });
      }
      if (item.brand_id && item.brand_name) {
        brands.set(item.brand_name, { id: item.brand_id, name: item.brand_name });
      }
      item.color_names.forEach((colorName, idx) => {
        const colorId = item.color_ids?.[idx] || colorName;
        colors.set(colorName, { id: colorId, name: colorName });
      });
    });
    
    return {
      categories: Array.from(categories.values()),
      subcategories: Array.from(subcategories.values()),
      colors: Array.from(colors.values()),
      brands: Array.from(brands.values()),
    };
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
    card.setAttribute('data-status', item.status || 'available');
    
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
    
    // Format status for display
    const metaEl = card.querySelector('[data-field="meta"]');
    if (metaEl) {
      const displayStatus = formatStatus(item.status);
      metaEl.textContent = displayStatus;
      
      // Add status class for optional styling
      const statusClass = (item.status || 'available').toLowerCase().trim();
      metaEl.classList.add(`status-${statusClass}`);
    }
    
    return card;
  }
  
  function renderGrid(items, page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);
    
    grid.innerHTML = '';
    
    if (pageItems.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0;">No items found.</p>';
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
    
    const seen = new Set();
    const uniqueOptions = options.filter(opt => {
      if (seen.has(opt.name)) return false;
      seen.add(opt.name);
      return true;
    });
    
    uniqueOptions.forEach(opt => {
      const count = counts[opt.name] || 0;
      const isChecked = currentlyChecked.has(opt.name);
      if (count === 0 && !isChecked) return;
      
      const label = document.createElement('label');
      label.className = 'row';
      label.innerHTML = `
        <input type="checkbox" 
               value="${opt.name}" 
               data-filter="${filterType}"
               data-id="${opt.id}"
               ${opt.category_id ? `data-category-id="${opt.category_id}"` : ''}
               ${isChecked ? 'checked' : ''}>
        <span>${opt.name} (${count})</span>
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
  // UI STATE UPDATES
  // ============================================================
  
  function updateSearchClearVisibility() {
    if (searchClear) {
      searchClear.style.display = searchInput?.value ? 'block' : 'none';
    }
  }
  
  function updateResetAllVisibility() {
    if (!resetAllBtn) return;
    const filters = getSelectedFilters();
    const hasFilters = filters.categories.length || filters.subcategories.length || 
                       filters.colors.length || filters.brands.length;
    const hasSearch = !!searchQuery;
    resetAllBtn.style.display = (hasFilters || hasSearch) ? 'flex' : 'none';
  }
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  
  function render(page = 1) {
    const filters = getSelectedFilters();
    filteredItems = filterItems(catalogData.items, filters);
    
    // Use search-result-based filters when searching, full catalog filters otherwise
    const availableFilters = searchQuery 
      ? buildFiltersFromItems(catalogData.items)
      : catalogData.filters;
    
    const counts = calculateFilterCounts(catalogData.items, filters);
    
    renderFilterPanel('[data-list="category"]', availableFilters.categories, 'category', counts.categories);
    renderFilterPanel('[data-list="color"]', availableFilters.colors, 'color', counts.colors);
    renderFilterPanel('[data-list="brand"]', availableFilters.brands, 'brand', counts.brands);
    
    let subcatsToShow = availableFilters.subcategories;
    if (filters.categories.length > 0) {
      const selectedCatIds = availableFilters.categories
        .filter(c => filters.categories.includes(c.name))
        .map(c => c.id);
      subcatsToShow = subcatsToShow.filter(s => selectedCatIds.includes(s.category_id));
    }
    renderFilterPanel('[data-list="subcategory"]', subcatsToShow, 'subcategory', counts.subcategories);
    
    const subPanel = document.querySelector('[data-panel="subcategory"]');
    if (subPanel) subPanel.style.display = filters.categories.length > 0 ? '' : 'none';
    
    renderGrid(filteredItems, page);
    currentPage = page;
    updatePager(filteredItems.length, page);
    updateURL(filters, page);
    updateResetAllVisibility();
    
    console.log(`[Catalog] Rendered ${filteredItems.length} items (page ${page})${searchQuery ? ` [search: "${searchQuery}"]` : ''}`);
  }
  
  // ============================================================
  // URL SYNC
  // ============================================================
  
  function updateURL(filters, page) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (searchQuery) params.set('q', searchQuery);
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
      page: parseInt(params.get('page') || '1', 10),
      q: params.get('q') || ''
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
    
    if (searchInput && urlFilters.q) {
      searchInput.value = urlFilters.q;
      searchQuery = urlFilters.q;
    }
    
    return urlFilters.page;
  }
  
  // ============================================================
  // SEARCH HANDLER
  // ============================================================
  
  async function handleSearch(query) {
    searchQuery = query.trim();
    
    // Clear existing filters when searching
    document.querySelectorAll('[data-filter]').forEach(i => i.checked = false);
    
    if (!searchQuery) {
      // Clear search - reload full catalog
      catalogData = loadCatalog() || await fetchCatalog();
      saveCatalog(catalogData);
    } else {
      // Fetch search results from backend
      catalogData = await fetchCatalog(searchQuery);
    }
    
    updateSearchClearVisibility();
    render(1);
  }
  
  // ============================================================
  // RESET ALL HANDLER
  // ============================================================
  
  async function handleResetAll() {
    // Clear all filter checkboxes
    document.querySelectorAll('[data-filter]').forEach(i => i.checked = false);
    
    // Clear search
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    updateSearchClearVisibility();
    
    // Reload full catalog
    catalogData = loadCatalog() || await fetchCatalog();
    saveCatalog(catalogData);
    
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Filter changes
  document.addEventListener('change', (e) => {
    if (!e.target.matches('[data-filter]')) return;
    if (e.target.matches('[data-filter="category"]') && !e.target.checked) {
      document.querySelectorAll('[data-filter="subcategory"]:checked').forEach(i => i.checked = false);
    }
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Pagination
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
  
  // Search input with debounce
  if (searchInput) {
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
      updateSearchClearVisibility();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleSearch(e.target.value), 300);
    });
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        handleSearch(e.target.value);
      }
      if (e.key === 'Escape') {
        searchInput.value = '';
        handleSearch('');
      }
    });
  }
  
  // Search clear button
  if (searchClear) {
    searchClear.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      await handleSearch('');
    });
  }
  
  // Reset all button
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', handleResetAll);
  }
  
  // Filter panel reset buttons (existing in Webflow)
  document.querySelectorAll('[data-filter-reset]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleResetAll();
      
      const panel = btn.closest('[data-panel], .filter-panel, .filter-page');
      const closeBtn = panel?.querySelector('[data-panel-close], [data-close], .close-filter-button');
      closeBtn?.click();
    });
  });
  
  document.querySelectorAll('[data-filter-apply]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = btn.closest('[data-panel], .filter-panel, .filter-page');
      const closeBtn = panel?.querySelector('[data-panel-close], [data-close], .close-filter-button');
      closeBtn?.click();
    });
  });
  
  // Browser back/forward
  window.addEventListener('popstate', async () => {
    const urlFilters = readFiltersFromURL();
    if (urlFilters.q !== searchQuery) {
      await handleSearch(urlFilters.q);
    }
    applyURLFilters();
    render(urlFilters.page);
  });
  
  // ============================================================
  // INIT
  // ============================================================
  
  try {
    const urlFilters = readFiltersFromURL();
    
    // If URL has search query, fetch search results
    if (urlFilters.q) {
      searchQuery = urlFilters.q;
      if (searchInput) searchInput.value = searchQuery;
      catalogData = await fetchCatalog(searchQuery);
    } else {
      await initCatalog();
    }
    
    updateSearchClearVisibility();
    render(1);
    
    const hasFilters = urlFilters.categories.length || urlFilters.subcategories.length || 
                       urlFilters.colors.length || urlFilters.brands.length;
    
    if (urlFilters.page !== 1 || hasFilters) {
      applyURLFilters();
      render(urlFilters.page);
    }
    
    console.log('[Catalog] Ready 🚀');
    
  } catch (err) {
    console.error('[Catalog] Init failed:', err);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0;">Could not load catalog. Please refresh the page.</p>';
  }
  
})();
