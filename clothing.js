/**
 * Client-Side Catalog with Slide-Out Filter Panel
 * 
 * 1. Fetches catalog from /search endpoint
 * 2. Fetches subcategories + sizes from API
 * 3. Populates slide-out filter panel dynamically
 * 4. Client-side filtering with live counts
 * 5. Status / availability filter
 * 6. Filter chips, URL sync, result count
 */

(async function () {
  'use strict';
  
  // ============================================================
  // CONFIG
  // ============================================================
  
  const BASE = window.API_BASE_URL;
  const CATALOG_URL = `${BASE}/search`;
  const SUBCATEGORIES_URL = `${BASE}/clothing_items/subcategories`;
  const SIZES_URL = `${BASE}/clothing_items/sizes`;
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
    retired: 'No Longer Available',
    'in cleaning': 'Being Cleaned'
  };
  
  function formatStatus(status) {
    const s = (status || '').toLowerCase().trim();
    if (!s) return STATUS_DISPLAY['available'];
    return STATUS_DISPLAY[s] || (s.charAt(0).toUpperCase() + s.slice(1));
  }
  
  // ============================================================
  // EXTRA FILTER DEFINITIONS
  // ============================================================
  
  const EXTRA_FILTERS = [
    { type: 'sleeve_length', label: 'sleeve length', field: 'sleeve_length',   attrKey: 'sleeve_length' },
    { type: 'rise',          label: 'rise',          field: 'rise',            attrKey: 'rise' },
    { type: 'length',        label: 'length',        field: 'length',          attrKey: 'length' },
    { type: 'material',      label: 'material',      field: 'material',        attrKey: 'material' },
    { type: 'fit',           label: 'fit',           field: 'fit',             attrKey: 'fit' },
    { type: 'pattern',       label: 'pattern',       field: 'pattern',         attrKey: 'pattern' },
    { type: 'neckline',      label: 'neckline',      field: 'neckline',        attrKey: 'neckline' },
  ];
  
  function getExtraValue(item, filterDef) {
    let val = item[filterDef.field];
    if (!val && filterDef.field && item[filterDef.type]) {
      const nested = item[filterDef.type];
      if (typeof nested === 'object' && nested !== null) {
        val = nested.name || nested[filterDef.field] || nested.value;
      } else if (typeof nested === 'string') {
        val = nested;
      }
    }
    if (!val && filterDef.attrKey && Array.isArray(item.attributes)) {
      const attr = item.attributes.find(a => a.key === filterDef.attrKey);
      if (attr) val = attr.value;
    }
    if (typeof val === 'string') val = val.trim();
    return val || '';
  }
  
  // ============================================================
  // DOM HOOKS (static elements only)
  // ============================================================
  
  const grid = document.querySelector('[data-grid="products"]');
  const template = document.querySelector('[data-template="product-card"]');
  const btnPrev = document.querySelector('[data-page="prev"]');
  const btnNext = document.querySelector('[data-page="next"]');
  const pageLabel = document.querySelector('[data-page="label"]');
  const searchInput = document.querySelector('[data-search="input"]');
  const searchClear = document.querySelector('[data-search="clear"]');
  const resetAllBtn = document.querySelector('[data-reset-all]');
  
  // Lazy lookups — components.js may inject filter panel after this script runs
  function getFilterPanel() { return document.getElementById('filter-panel'); }
  function getFilterBackdrop() { return document.getElementById('filter-panel-backdrop'); }
  function getFilterActiveCount() { return document.getElementById('filter-active-count'); }
  function getFilterApplyBtn() { return document.getElementById('filter-panel-apply-btn'); }
  
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
  let apiSubcategories = []; // from GET /clothing_items/subcategories
  
  // Size profile data (from GET /clothing_items/sizes)
  let sizesData = [];
  let profileToSpecific = new Map(); // "M" → Set(["M", "38", "10"])
  let specificToProfile = new Map(); // "38" → "M"
  let standardSizeOrder = [];
  
  // ============================================================
  // FETCH: SUBCATEGORIES
  // ============================================================
  
  async function fetchSubcategories() {
    try {
      const res = await fetch(SUBCATEGORIES_URL, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      apiSubcategories = (data.subcategories || data || []).filter(s => s.active !== false);
      console.log(`[Catalog] Loaded ${apiSubcategories.length} subcategories from API`);
    } catch (err) {
      console.warn('[Catalog] Could not fetch subcategories:', err);
      apiSubcategories = [];
    }
  }
  
  // ============================================================
  // FETCH: SIZES
  // ============================================================
  
  async function fetchSizesData() {
    try {
      const res = await fetch(SIZES_URL, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sizesData = await res.json();
      if (!Array.isArray(sizesData)) sizesData = sizesData.sizes || [];
      
      profileToSpecific.clear();
      specificToProfile.clear();
      const orderSet = new Set();
      
      sizesData.forEach(s => {
        const specific = s.size || s.name || '';
        const profile = s.standard_size?.standard_size || '';
        if (!specific) return;
        
        if (profile) {
          if (!profileToSpecific.has(profile)) profileToSpecific.set(profile, new Set());
          profileToSpecific.get(profile).add(specific);
          profileToSpecific.get(profile).add(profile); // profile name itself
          specificToProfile.set(specific, profile);
          orderSet.add(profile);
        }
      });
      
      const sizeOrderRef = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', 'One Size'];
      standardSizeOrder = Array.from(orderSet).sort((a, b) => {
        const ai = sizeOrderRef.indexOf(a);
        const bi = sizeOrderRef.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      });
      
      console.log(`[Catalog] Loaded ${sizesData.length} sizes, ${standardSizeOrder.length} profiles`);
    } catch (err) {
      console.warn('[Catalog] Could not fetch sizes:', err);
    }
  }
  
  // ============================================================
  // SIZE HELPERS
  // ============================================================
  
  function getItemSize(item) {
    if (item.size_name) return String(item.size_name).trim();
    if (typeof item.size === 'string') return item.size.trim();
    if (item.size && typeof item.size === 'object') {
      return (item.size.name || item.size.size || item.size.value || '').toString().trim();
    }
    if (Array.isArray(item.attributes)) {
      const attr = item.attributes.find(a => a.key === 'size');
      if (attr) return String(attr.value).trim();
    }
    return '';
  }
  
  function isSizeProfileMode() {
    const filters = getSelectedFilters();
    return filters.categories.length === 0;
  }
  
  const STANDARD_PROFILE_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  function buildSizeOptions(items) {
    if (isSizeProfileMode() && standardSizeOrder.length > 0) {
      // Show ONLY standard letter sizes (XXS through XXL)
      const available = new Set();
      items.forEach(item => {
        const sz = getItemSize(item);
        if (!sz) return;
        const profile = specificToProfile.get(sz) || sz;
        if (STANDARD_PROFILE_SIZES.includes(profile)) {
          available.add(profile);
        }
      });
      return STANDARD_PROFILE_SIZES
        .filter(p => available.has(p))
        .map(p => ({ id: p, name: p }));
    } else {
      // Show specific sizes from items
      const valMap = new Map();
      items.forEach(item => {
        const sz = getItemSize(item);
        if (sz) valMap.set(sz, { id: sz, name: sz });
      });
      return Array.from(valMap.values());
    }
  }
  
  function translateSizeSelections(oldSelections) {
    if (!oldSelections.length) return [];
    const newSelections = new Set();
    
    if (isSizeProfileMode()) {
      // Specific → Profile
      oldSelections.forEach(sz => {
        const profile = specificToProfile.get(sz) || sz;
        newSelections.add(profile);
      });
    } else {
      // Profile → Specific
      oldSelections.forEach(sz => {
        if (profileToSpecific.has(sz)) {
          profileToSpecific.get(sz).forEach(s => newSelections.add(s));
        } else {
          newSelections.add(sz);
        }
      });
    }
    return Array.from(newSelections);
  }
  
  function itemMatchesSize(item, selectedSizes) {
    if (!selectedSizes.length) return true;
    const sz = getItemSize(item);
    if (!sz) return false;
    
    if (isSizeProfileMode()) {
      const profile = specificToProfile.get(sz) || sz;
      return selectedSizes.includes(profile);
    } else {
      return selectedSizes.includes(sz);
    }
  }
  
  // ============================================================
  // STORAGE
  // ============================================================
  
  function saveCatalog(data) {
    if (data.query) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { console.warn('[Catalog] Could not save:', e); }
  }
  
  function loadCatalog() {
    if (searchQuery) return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }
  
  // ============================================================
  // FETCH: CATALOG
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
  // FILTER PANEL: OPEN / CLOSE (lazy lookups)
  // ============================================================
  
  function openFilterPanel() {
    const panel = getFilterPanel();
    const backdrop = getFilterBackdrop();
    if (panel) panel.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');
    document.body.classList.add('filter-panel-open');
  }
  
  function closeFilterPanel() {
    const panel = getFilterPanel();
    const backdrop = getFilterBackdrop();
    if (panel) panel.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.classList.remove('filter-panel-open');
  }
  
  window.openFilterPanel = openFilterPanel;
  window.closeFilterPanel = closeFilterPanel;
  
  // ============================================================
  // FILTER PANEL: SECTION TOGGLE
  // ============================================================
  
  function setupSectionToggles() {
    // Use delegation since panel may be injected late
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-section-header[data-toggle]');
      if (!btn) return;
      e.preventDefault();
      const type = btn.getAttribute('data-toggle');
      const content = document.querySelector(`.filter-section-content[data-list="${type}"]`);
      if (!content) return;
      
      const isOpen = content.classList.contains('is-open');
      if (isOpen) {
        content.classList.remove('is-open');
        btn.classList.add('is-collapsed');
      } else {
        content.classList.add('is-open');
        btn.classList.remove('is-collapsed');
      }
    });
  }
  
  // ============================================================
  // FILTERING LOGIC
  // ============================================================
  
  function getSelectedFilters() {
    const get = (type) => Array.from(
      document.querySelectorAll(`input[data-filter="${type}"]:checked`)
    ).map(i => i.value);
    
    const filters = {
      categories: get('category'),
      subcategories: get('subcategory'),
      colors: get('color'),
      size: get('size'),
      status: get('status'), // "available" if checked
    };
    
    EXTRA_FILTERS.forEach(def => {
      filters[def.type] = get(def.type);
    });
    
    return filters;
  }
  
  function countActiveFilters(filters) {
    let count = 0;
    count += filters.categories.length;
    count += filters.subcategories.length;
    count += filters.colors.length;
    count += filters.size.length;
    count += filters.status.length;
    EXTRA_FILTERS.forEach(def => {
      count += (filters[def.type] || []).length;
    });
    return count;
  }
  
  function filterItems(items, filters) {
    return items.filter(item => {
      // Status filter
      if (filters.status.length > 0) {
        const itemStatus = (item.status || 'available').toLowerCase().trim();
        if (!filters.status.some(s => itemStatus === s.toLowerCase())) return false;
      }
      
      if (filters.categories.length > 0 && !filters.categories.includes(item.category_name)) return false;
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(item.subcategory_name)) return false;
      if (filters.colors.length > 0 && !item.color_names.some(c => filters.colors.includes(c))) return false;
      
      // Size filter with profile support
      if (filters.size.length > 0 && !itemMatchesSize(item, filters.size)) return false;
      
      // Extra filters
      for (const def of EXTRA_FILTERS) {
        const selected = filters[def.type] || [];
        if (selected.length > 0) {
          const val = getExtraValue(item, def);
          if (!val || !selected.includes(val)) return false;
        }
      }
      
      return true;
    });
  }
  
  function calculateFilterCounts(allItems, currentFilters) {
    const counts = { categories: {}, subcategories: {}, colors: {}, size: {} };
    EXTRA_FILTERS.forEach(def => { counts[def.type] = {}; });
    
    function itemsExcluding(excludeType) {
      return allItems.filter(item => {
        // Always apply status filter
        if (excludeType !== 'status' && currentFilters.status.length > 0) {
          const itemStatus = (item.status || 'available').toLowerCase().trim();
          if (!currentFilters.status.some(s => itemStatus === s.toLowerCase())) return false;
        }
        if (excludeType !== 'category' && currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
        if (excludeType !== 'subcategory' && currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
        if (excludeType !== 'color' && currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
        if (excludeType !== 'size' && currentFilters.size.length > 0 && !itemMatchesSize(item, currentFilters.size)) return false;
        
        for (const def of EXTRA_FILTERS) {
          if (excludeType === def.type) continue;
          const selected = currentFilters[def.type] || [];
          if (selected.length > 0) {
            const val = getExtraValue(item, def);
            if (!val || !selected.includes(val)) return false;
          }
        }
        return true;
      });
    }
    
    // Category counts
    itemsExcluding('category').forEach(item => {
      if (item.category_name) counts.categories[item.category_name] = (counts.categories[item.category_name] || 0) + 1;
    });
    
    // Subcategory counts
    itemsExcluding('subcategory').forEach(item => {
      if (item.subcategory_name) counts.subcategories[item.subcategory_name] = (counts.subcategories[item.subcategory_name] || 0) + 1;
    });
    
    // Color counts
    itemsExcluding('color').forEach(item => {
      (item.color_names || []).forEach(color => {
        counts.colors[color] = (counts.colors[color] || 0) + 1;
      });
    });
    
    // Size counts (profile or specific)
    const sizeItems = itemsExcluding('size');
    if (isSizeProfileMode() && standardSizeOrder.length > 0) {
      sizeItems.forEach(item => {
        const sz = getItemSize(item);
        if (!sz) return;
        const profile = specificToProfile.get(sz) || sz;
        if (STANDARD_PROFILE_SIZES.includes(profile)) {
          counts.size[profile] = (counts.size[profile] || 0) + 1;
        }
      });
    } else {
      sizeItems.forEach(item => {
        const sz = getItemSize(item);
        if (sz) counts.size[sz] = (counts.size[sz] || 0) + 1;
      });
    }
    
    // Extra filter counts
    EXTRA_FILTERS.forEach(def => {
      itemsExcluding(def.type).forEach(item => {
        const val = getExtraValue(item, def);
        if (val) counts[def.type][val] = (counts[def.type][val] || 0) + 1;
      });
    });
    
    return counts;
  }
  
  // ============================================================
  // BUILD FILTER OPTIONS
  // ============================================================
  
  function buildFiltersFromItems(items) {
    const categories = new Map();
    const subcategories = new Map();
    const colors = new Map();
    
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
      (item.color_names || []).forEach((colorName, idx) => {
        const colorId = item.color_ids?.[idx] || colorName;
        colors.set(colorName, { id: colorId, name: colorName });
      });
    });
    
    return {
      categories: Array.from(categories.values()),
      subcategories: Array.from(subcategories.values()),
      colors: Array.from(colors.values()),
    };
  }
  
  // Build subcategory options: prefer API data, fallback to item data
  function buildSubcategoryOptions(itemFilters, selectedCategories) {
    if (apiSubcategories.length > 0) {
      let subcats = apiSubcategories;
      
      // If categories are selected, filter to matching ones
      if (selectedCategories.length > 0) {
        const selectedCatIds = (itemFilters.categories || [])
          .filter(c => selectedCategories.includes(c.name))
          .map(c => c.id);
        if (selectedCatIds.length > 0) {
          subcats = subcats.filter(s => selectedCatIds.includes(s.category_id));
        }
      }
      
      return subcats.map(s => ({ 
        id: s.id, 
        name: s.name, 
        category_id: s.category_id 
      }));
    }
    
    // Fallback to item-derived subcategories
    let subcatsToShow = itemFilters.subcategories || [];
    if (selectedCategories.length > 0) {
      const selectedCatIds = (itemFilters.categories || [])
        .filter(c => selectedCategories.includes(c.name))
        .map(c => c.id);
      subcatsToShow = subcatsToShow.filter(s => selectedCatIds.includes(s.category_id));
    }
    return subcatsToShow;
  }
  
  function buildExtraFilterOptions(items) {
    const extraOptions = {};
    EXTRA_FILTERS.forEach(def => {
      const valMap = new Map();
      items.forEach(item => {
        const val = getExtraValue(item, def);
        if (val) valMap.set(val, { id: val, name: val });
      });
      extraOptions[def.type] = Array.from(valMap.values());
    });
    return extraOptions;
  }
  
  // ============================================================
  // RENDERING: FILTER PANEL
  // ============================================================
  
  function renderFilterSection(listSelector, options, filterType, counts, activeValues) {
    const listEl = document.querySelector(listSelector);
    if (!listEl) return;
    
    const currentlyChecked = new Set(activeValues || []);
    listEl.innerHTML = '';
    
    if (!options || !options.length) {
      listEl.innerHTML = '<div class="filter-section-empty">no options available</div>';
      return;
    }
    
    // Deduplicate
    const seen = new Set();
    const uniqueOptions = options.filter(opt => {
      if (seen.has(opt.name)) return false;
      seen.add(opt.name);
      return true;
    });
    
    // Sort
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', 'One Size'];
    if (filterType === 'size') {
      uniqueOptions.sort((a, b) => {
        const ai = sizeOrder.indexOf(a.name.toUpperCase());
        const bi = sizeOrder.indexOf(b.name.toUpperCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        const an = parseFloat(a.name);
        const bn = parseFloat(b.name);
        if (!isNaN(an) && !isNaN(bn)) return an - bn;
        return a.name.localeCompare(b.name);
      });
    } else {
      uniqueOptions.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    uniqueOptions.forEach(opt => {
      const count = (counts && counts[opt.name]) || 0;
      const isChecked = currentlyChecked.has(opt.name);
      if (count === 0 && !isChecked) return;
      
      const label = document.createElement('label');
      label.className = 'filter-row';
      label.innerHTML = `
        <input type="checkbox" 
               value="${opt.name}" 
               data-filter="${filterType}"
               data-id="${opt.id}"
               ${opt.category_id ? `data-category-id="${opt.category_id}"` : ''}
               ${isChecked ? 'checked' : ''}>
        <span class="filter-row-label">${opt.name}</span>
        <span class="filter-row-count">${count}</span>
      `;
      listEl.appendChild(label);
    });
  }
  
  function showExtraSections(extraOptions) {
    EXTRA_FILTERS.forEach(def => {
      const section = document.getElementById(`filter-section-${def.type}`);
      if (section) {
        const hasOptions = extraOptions[def.type] && extraOptions[def.type].length > 0;
        section.style.display = hasOptions ? '' : 'none';
      }
    });
  }
  
  // ============================================================
  // RENDERING: PRODUCT GRID
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
    
    const metaEl = card.querySelector('[data-field="meta"]');
    if (metaEl) {
      const displayStatus = formatStatus(item.status);
      metaEl.textContent = displayStatus;
      const statusClass = (item.status || 'available').toLowerCase().trim().replace(/\s+/g, '-');
      metaEl.classList.add(`status-${statusClass}`);
    }
    
    return card;
  }
  
  function renderGrid(items, page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);
    
    grid.innerHTML = '';
    
    if (pageItems.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif; font-weight: 300; color: #a86b9c;">no items found.</p>';
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
  
  function updatePager(totalItems, page) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (pageLabel) pageLabel.textContent = `${page} / ${totalPages}`;
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;
    return totalPages;
  }
  
  // ============================================================
  // FILTER CHIPS
  // ============================================================
  
  function renderFilterChips(filters) {
    let chipsBar = document.querySelector('.filter-chips-bar');
    
    if (!chipsBar) {
      chipsBar = document.createElement('div');
      chipsBar.className = 'filter-chips-bar';
      const toolbar = document.querySelector('.clothing-toolbar');
      if (toolbar && toolbar.parentNode) {
        toolbar.parentNode.insertBefore(chipsBar, toolbar.nextSibling);
      } else if (grid && grid.parentNode) {
        grid.parentNode.insertBefore(chipsBar, grid);
      }
    }
    
    if (!chipsBar) return;
    
    const chips = [];
    const addChips = (values, filterType, label) => {
      values.forEach(val => chips.push({ value: val, type: filterType, label }));
    };
    
    addChips(filters.categories, 'category', 'category');
    addChips(filters.subcategories, 'subcategory', 'type');
    addChips(filters.colors, 'color', 'color');
    addChips(filters.size, 'size', 'size');
    if (filters.status.length > 0) {
      chips.push({ value: 'available only', type: 'status', label: 'status' });
    }
    
    EXTRA_FILTERS.forEach(def => {
      addChips(filters[def.type] || [], def.type, def.label);
    });
    
    if (chips.length === 0) {
      chipsBar.classList.remove('has-chips');
      chipsBar.innerHTML = '';
      return;
    }
    
    chipsBar.classList.add('has-chips');
    chipsBar.innerHTML = chips.map(chip => `
      <button class="filter-chip" data-chip-type="${chip.type}" data-chip-value="${chip.value}">
        ${chip.value}
        <span class="filter-chip-x">&times;</span>
      </button>
    `).join('');
  }
  
  // ============================================================
  // UI STATE UPDATES
  // ============================================================
  
  function updateSearchClearVisibility() {
    if (searchClear) {
      searchClear.style.display = searchInput?.value ? 'block' : 'none';
    }
  }
  
  function updateActiveFilterCount(filters) {
    const count = countActiveFilters(filters);
    
    const fac = getFilterActiveCount();
    if (fac) {
      fac.textContent = count;
      fac.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    
    document.querySelectorAll('.filter-trigger-btn').forEach(btn => {
      const countEl = btn.querySelector('.filter-trigger-count');
      if (countEl) {
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'inline-flex' : 'none';
      }
      btn.classList.toggle('has-active', count > 0);
    });
    
    document.querySelectorAll('[data-filter-open]').forEach(btn => {
      const badge = btn.querySelector('[data-filter-badge]');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    });
  }
  
  function updateResultCount(total) {
    const el = document.querySelector('.clothing-result-count');
    if (el) el.textContent = total === 1 ? '1 item' : `${total} items`;
    const applyBtn = getFilterApplyBtn();
    if (applyBtn) applyBtn.textContent = total === 1 ? 'show 1 item' : `show ${total} items`;
  }
  
  function updateStatusCount(items) {
    const countEl = document.getElementById('filter-status-available-count');
    if (countEl) {
      const available = items.filter(i => (i.status || 'available').toLowerCase().trim() === 'available').length;
      countEl.textContent = available;
    }
  }
  
  function updateResetVisibility(filters) {
    const hasFilters = countActiveFilters(filters) > 0;
    const hasSearch = !!searchQuery;
    
    if (resetAllBtn) resetAllBtn.style.display = (hasFilters || hasSearch) ? 'flex' : 'none';
    
    const inlineReset = document.querySelector('.clothing-reset-all');
    if (inlineReset) inlineReset.style.display = (hasFilters || hasSearch) ? 'inline-flex' : 'none';
  }
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  
  function render(page = 1, initialFilters = null) {
    const filters = initialFilters || getSelectedFilters();
    filteredItems = filterItems(catalogData.items, filters);
    
    const availableFilters = searchQuery 
      ? buildFiltersFromItems(catalogData.items)
      : catalogData.filters || buildFiltersFromItems(catalogData.items);
    
    const extraOptions = buildExtraFilterOptions(catalogData.items);
    const counts = calculateFilterCounts(catalogData.items, filters);
    
    showExtraSections(extraOptions);
    
    // Core filter sections
    renderFilterSection('[data-list="category"]', availableFilters.categories, 'category', counts.categories, filters.categories);
    renderFilterSection('[data-list="color"]', availableFilters.colors, 'color', counts.colors, filters.colors);
    
    // Type (subcategory) — always visible, filtered by category if selected
    const subcatOptions = buildSubcategoryOptions(availableFilters, filters.categories);
    renderFilterSection('[data-list="subcategory"]', subcatOptions, 'subcategory', counts.subcategories, filters.subcategories);
    
    // Size — profile or specific mode
    const sizeOptions = buildSizeOptions(catalogData.items);
    renderFilterSection('[data-list="size"]', sizeOptions, 'size', counts.size, filters.size);
    
    // Extra filter sections
    EXTRA_FILTERS.forEach(def => {
      renderFilterSection(`[data-list="${def.type}"]`, extraOptions[def.type], def.type, counts[def.type], filters[def.type] || []);
    });
    
    // Status count
    updateStatusCount(catalogData.items);
    
    // Render grid
    renderGrid(filteredItems, page);
    currentPage = page;
    updatePager(filteredItems.length, page);
    
    // Update UI
    updateActiveFilterCount(filters);
    updateResultCount(filteredItems.length);
    updateResetVisibility(filters);
    renderFilterChips(filters);
    updateURL(filters, page);
    
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
    filters.size.forEach(s => params.append('size', s));
    filters.status.forEach(s => params.append('status', s));
    
    EXTRA_FILTERS.forEach(def => {
      (filters[def.type] || []).forEach(v => params.append(def.type, v));
    });
    
    history.replaceState({ page }, '', '?' + params.toString());
  }
  
  function readFiltersFromURL() {
    const params = new URLSearchParams(location.search);
    const filters = {
      categories: params.getAll('categories').filter(Boolean),
      subcategories: params.getAll('subcategories').filter(Boolean),
      colors: params.getAll('colors').filter(Boolean),
      size: params.getAll('size').filter(Boolean),
      status: params.getAll('status').filter(Boolean),
      page: parseInt(params.get('page') || '1', 10),
      q: params.get('q') || ''
    };
    
    EXTRA_FILTERS.forEach(def => {
      filters[def.type] = params.getAll(def.type).filter(Boolean);
    });
    
    return filters;
  }
  
  // ============================================================
  // SEARCH HANDLER
  // ============================================================
  
  async function handleSearch(query) {
    searchQuery = query.trim();
    document.querySelectorAll('[data-filter]').forEach(i => i.checked = false);
    
    if (!searchQuery) {
      catalogData = loadCatalog() || await fetchCatalog();
      saveCatalog(catalogData);
    } else {
      catalogData = await fetchCatalog(searchQuery);
    }
    
    updateSearchClearVisibility();
    render(1);
  }
  
  // ============================================================
  // RESET ALL HANDLER
  // ============================================================
  
  async function handleResetAll() {
    document.querySelectorAll('[data-filter]').forEach(i => i.checked = false);
    
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    updateSearchClearVisibility();
    
    catalogData = loadCatalog() || await fetchCatalog();
    saveCatalog(catalogData);
    
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // ============================================================
  // EVENT HANDLERS (all delegated for late-injected panel)
  // ============================================================
  
  // Filter panel open
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-filter-open], .filter-trigger-btn');
    if (trigger) {
      e.preventDefault();
      openFilterPanel();
    }
  });
  
  // Filter panel close, apply, reset — delegated
  document.addEventListener('click', (e) => {
    if (e.target.closest('#filter-panel-close-btn')) { closeFilterPanel(); return; }
    if (e.target.closest('#filter-panel-backdrop')) { closeFilterPanel(); return; }
    if (e.target.closest('#filter-panel-apply-btn')) { closeFilterPanel(); return; }
    if (e.target.closest('#filter-panel-reset-btn')) { handleResetAll(); return; }
  });
  
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getFilterPanel()?.classList.contains('is-open')) closeFilterPanel();
  });
  
  // Filter checkbox changes (live update)
  document.addEventListener('change', (e) => {
    if (!e.target.matches('[data-filter]')) return;
    
    const filterType = e.target.getAttribute('data-filter');
    
    // Category change: translate size selections if needed
    if (filterType === 'category') {
      const currentSizeSelections = Array.from(
        document.querySelectorAll('input[data-filter="size"]:checked')
      ).map(i => i.value);
      
      if (currentSizeSelections.length > 0) {
        // Will re-render with translated sizes
        const translated = translateSizeSelections(currentSizeSelections);
        // Store for re-render
        window._pendingSizeTranslation = translated;
      }
    }
    
    render(1);
    
    // Apply translated size selections after re-render
    if (window._pendingSizeTranslation) {
      const translated = window._pendingSizeTranslation;
      delete window._pendingSizeTranslation;
      document.querySelectorAll('input[data-filter="size"]').forEach(cb => {
        cb.checked = translated.includes(cb.value);
      });
      render(1);
    }
  });
  
  // Filter chip removal
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    
    const type = chip.getAttribute('data-chip-type');
    const value = chip.getAttribute('data-chip-value');
    
    if (type === 'status') {
      const statusCb = document.querySelector('input[data-filter="status"]');
      if (statusCb) statusCb.checked = false;
    } else {
      const checkbox = document.querySelector(`input[data-filter="${type}"][value="${value}"]`);
      if (checkbox) {
        checkbox.checked = false;
        if (type === 'category') {
          document.querySelectorAll('[data-filter="subcategory"]:checked').forEach(i => i.checked = false);
        }
      }
    }
    
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Inline reset
  document.addEventListener('click', (e) => {
    if (e.target.closest('.clothing-reset-all')) {
      e.preventDefault();
      handleResetAll();
    }
  });
  
  // Reset all button
  if (resetAllBtn) resetAllBtn.addEventListener('click', handleResetAll);
  
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
      if (e.key === 'Enter') { clearTimeout(debounceTimer); handleSearch(e.target.value); }
      if (e.key === 'Escape') { searchInput.value = ''; handleSearch(''); }
    });
  }
  
  if (searchClear) {
    searchClear.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      await handleSearch('');
    });
  }
  
  // Legacy Webflow buttons
  document.querySelectorAll('[data-filter-reset]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); handleResetAll(); });
  });
  document.querySelectorAll('[data-filter-apply]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); closeFilterPanel(); });
  });
  
  // Browser back/forward
  window.addEventListener('popstate', async () => {
    const urlFilters = readFiltersFromURL();
    if (urlFilters.q !== searchQuery) await handleSearch(urlFilters.q);
    render(urlFilters.page, urlFilters);
  });
  
  // Section toggles (delegated)
  setupSectionToggles();
  
  // ============================================================
  // INIT
  // ============================================================
  
  try {
    const urlFilters = readFiltersFromURL();
    
    // Fetch subcategories + sizes in parallel with catalog
    const initPromises = [fetchSubcategories(), fetchSizesData()];
    
    if (urlFilters.q) {
      searchQuery = urlFilters.q;
      if (searchInput) searchInput.value = searchQuery;
      initPromises.push(fetchCatalog(searchQuery).then(d => { catalogData = d; }));
    } else {
      initPromises.push(initCatalog());
    }
    
    await Promise.all(initPromises);
    
    updateSearchClearVisibility();
    
    // Apply URL filters + status
    const hasFilters = urlFilters.categories.length || urlFilters.subcategories.length || 
                       urlFilters.colors.length || (urlFilters.size || []).length ||
                       (urlFilters.status || []).length ||
                       EXTRA_FILTERS.some(def => (urlFilters[def.type] || []).length > 0);
    
    if (hasFilters || urlFilters.page !== 1) {
      const filters = {
        categories: urlFilters.categories,
        subcategories: urlFilters.subcategories,
        colors: urlFilters.colors,
        size: urlFilters.size || [],
        status: urlFilters.status || [],
      };
      EXTRA_FILTERS.forEach(def => {
        filters[def.type] = urlFilters[def.type] || [];
      });
      
      // Check status checkbox if in URL
      if (filters.status.length > 0) {
        const statusCb = document.querySelector('input[data-filter="status"]');
        if (statusCb) statusCb.checked = true;
      }
      
      render(urlFilters.page, filters);
    } else {
      render(1);
    }
    
    console.log('[Catalog] Ready');
    
  } catch (err) {
    console.error('[Catalog] Init failed:', err);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif; color: #a86b9c;">could not load catalog. please refresh the page.</p>';
  }
  
})();
