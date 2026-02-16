/**
 * Client-Side Catalog with Slide-Out Filter Panel
 * 
 * Size logic:
 * - On init, fetches /clothing_items/sizes to build profile ↔ specific size maps
 * - No category selected → shows standard sizes (XS, S, M, L, XL, XXL, etc.)
 * - Category selected → shows specific sizes (38, 40, 42, etc.)
 * - Switching between modes translates selections (M → all M-specific sizes, and back)
 */

(async function () {
  'use strict';
  
  // ============================================================
  // CONFIG
  // ============================================================
  
  const BASE = window.API_BASE_URL;
  const CATALOG_URL = `${BASE}/search`;
  const SIZES_URL = `${BASE}/clothing_items/sizes`;
  const STORAGE_KEY = 'dm_catalog';
  const ITEMS_PER_PAGE = 20;
  
  // ============================================================
  // SIZE PROFILE DATA (populated from API)
  // ============================================================
  
  // standard_size_string → Set of specific size strings
  // e.g. "M" → Set(["M", "38", "10", ...])
  let profileToSpecific = new Map();
  
  // specific_size_string → standard_size_string
  // e.g. "38" → "M"
  let specificToProfile = new Map();
  
  // Ordered list of standard size names (from API)
  let standardSizeOrder = [];
  
  // Raw sizes data from API
  let sizesData = [];
  
  async function fetchSizesData() {
    try {
      console.log('[Sizes] Fetching size profiles...');
      const res = await fetch(SIZES_URL, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      sizesData = await res.json();
      console.log(`[Sizes] Loaded ${sizesData.length} sizes`);
      
      // Build lookup maps
      profileToSpecific.clear();
      specificToProfile.clear();
      
      const standardSizeSet = new Set();
      
      sizesData.forEach(sizeEntry => {
        if (!sizeEntry.active) return;
        
        const specificSize = (sizeEntry.size || '').trim();
        const standardSize = (sizeEntry.standard_size?.standard_size || '').trim();
        
        if (!specificSize || !standardSize) return;
        
        // Map specific → profile
        specificToProfile.set(specificSize, standardSize);
        
        // Map profile → specifics
        if (!profileToSpecific.has(standardSize)) {
          profileToSpecific.set(standardSize, new Set());
        }
        profileToSpecific.get(standardSize).add(specificSize);
        
        standardSizeSet.add(standardSize);
      });
      
      // Build ordered standard sizes
      // Use a sensible default order, then append any extras
      const defaultOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'];
      standardSizeOrder = defaultOrder.filter(s => standardSizeSet.has(s));
      // Add any that weren't in default order
      standardSizeSet.forEach(s => {
        if (!standardSizeOrder.includes(s)) standardSizeOrder.push(s);
      });
      
      console.log('[Sizes] Standard sizes:', standardSizeOrder);
      console.log('[Sizes] Profile→Specific map:', Object.fromEntries(
        Array.from(profileToSpecific.entries()).map(([k, v]) => [k, Array.from(v)])
      ));
      
    } catch (err) {
      console.error('[Sizes] Failed to fetch size data:', err);
      // Fallback: empty maps, size filter will just show raw values
    }
  }
  
  // Get the standard/profile size for a specific size string
  function getProfileForSize(specificSize) {
    return specificToProfile.get(specificSize) || null;
  }
  
  // Get all specific sizes that belong to a profile
  function getSpecificSizes(profileName) {
    return profileToSpecific.get(profileName) || new Set();
  }
  
  // Get the item's specific size value
  function getItemSize(item) {
    if (item.size_name) return item.size_name.trim();
    if (typeof item.size === 'string') return item.size.trim();
    if (item.size && typeof item.size === 'object') {
      return (item.size.size || item.size.name || item.size.value || '').trim();
    }
    if (Array.isArray(item.attributes)) {
      const attr = item.attributes.find(a => a.key === 'size');
      if (attr) return (attr.value || '').trim();
    }
    return '';
  }
  
  // Translate profile selections → specific size selections
  function profilesToSpecifics(profileNames) {
    const specifics = new Set();
    profileNames.forEach(pName => {
      const specs = getSpecificSizes(pName);
      specs.forEach(s => specifics.add(s));
    });
    return Array.from(specifics);
  }
  
  // Translate specific size selections → profile selections
  function specificsToProfiles(specificNames) {
    const profiles = new Set();
    specificNames.forEach(sName => {
      const profile = getProfileForSize(sName);
      if (profile) profiles.add(profile);
    });
    return Array.from(profiles);
  }
  
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
    if (!val && filterDef.altField) val = item[filterDef.altField];
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
  
  const filterPanel = document.getElementById('filter-panel');
  const filterBackdrop = document.getElementById('filter-panel-backdrop');
  const filterCloseBtn = document.getElementById('filter-panel-close-btn');
  const filterResetBtn = document.getElementById('filter-panel-reset-btn');
  const filterApplyBtn = document.getElementById('filter-panel-apply-btn');
  const filterActiveCount = document.getElementById('filter-active-count');
  
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
  
  // Track size mode so we can translate on change
  let wasSizeProfileMode = true;
  
  // ============================================================
  // STORAGE
  // ============================================================
  
  function saveCatalog(data) {
    if (data.query) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('[Catalog] Could not save to sessionStorage:', e);
    }
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
  // FILTER PANEL: OPEN / CLOSE
  // ============================================================
  
  function openFilterPanel() {
    if (filterPanel) filterPanel.classList.add('is-open');
    if (filterBackdrop) filterBackdrop.classList.add('is-open');
    document.body.classList.add('filter-panel-open');
  }
  
  function closeFilterPanel() {
    if (filterPanel) filterPanel.classList.remove('is-open');
    if (filterBackdrop) filterBackdrop.classList.remove('is-open');
    document.body.classList.remove('filter-panel-open');
  }
  
  window.openFilterPanel = openFilterPanel;
  window.closeFilterPanel = closeFilterPanel;
  
  // ============================================================
  // FILTER PANEL: SECTION TOGGLE
  // ============================================================
  
  function setupSectionToggles() {
    document.querySelectorAll('.filter-section-header[data-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
      sizes: get('size'),
    };
    
    EXTRA_FILTERS.forEach(def => {
      filters[def.type] = get(def.type);
    });
    
    return filters;
  }
  
  function countActiveFilters(filters) {
    let count = filters.categories.length + filters.subcategories.length + 
                filters.colors.length + filters.sizes.length;
    EXTRA_FILTERS.forEach(def => { count += (filters[def.type] || []).length; });
    return count;
  }
  
  function isSizeProfileMode(filters) {
    return filters.categories.length === 0;
  }
  
  // Check if an item's size matches the selected sizes
  // In profile mode: selected values are standard sizes, match via profile mapping
  // In specific mode: selected values are specific sizes, match directly
  function itemMatchesSize(item, selectedSizes, profileMode) {
    if (selectedSizes.length === 0) return true;
    
    const itemSize = getItemSize(item);
    if (!itemSize) return false;
    
    if (profileMode) {
      // Selected values are standard/profile sizes like "M", "L"
      // Check if item's specific size belongs to any selected profile
      const itemProfile = getProfileForSize(itemSize);
      if (itemProfile && selectedSizes.includes(itemProfile)) return true;
      // Fallback: direct match (in case item size IS the profile name)
      if (selectedSizes.includes(itemSize)) return true;
      return false;
    } else {
      // Selected values are specific sizes
      return selectedSizes.includes(itemSize);
    }
  }
  
  function filterItems(items, filters) {
    const profileMode = isSizeProfileMode(filters);
    
    return items.filter(item => {
      if (filters.categories.length > 0 && !filters.categories.includes(item.category_name)) return false;
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(item.subcategory_name)) return false;
      if (filters.colors.length > 0 && !item.color_names.some(c => filters.colors.includes(c))) return false;
      if (!itemMatchesSize(item, filters.sizes, profileMode)) return false;
      
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
    const profileMode = isSizeProfileMode(currentFilters);
    const counts = { categories: {}, subcategories: {}, colors: {}, sizes: {} };
    EXTRA_FILTERS.forEach(def => { counts[def.type] = {}; });
    
    function itemsExcluding(excludeType) {
      return allItems.filter(item => {
        if (excludeType !== 'category' && currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name)) return false;
        if (excludeType !== 'subcategory' && currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name)) return false;
        if (excludeType !== 'color' && currentFilters.colors.length > 0 && !item.color_names.some(c => currentFilters.colors.includes(c))) return false;
        
        if (excludeType !== 'size') {
          // When excluding category, use profile mode for size matching
          const usePM = (excludeType === 'category') ? true : profileMode;
          if (!itemMatchesSize(item, currentFilters.sizes, usePM)) return false;
        }
        
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
    
    itemsExcluding('category').forEach(item => {
      if (item.category_name) counts.categories[item.category_name] = (counts.categories[item.category_name] || 0) + 1;
    });
    
    itemsExcluding('subcategory').forEach(item => {
      if (item.subcategory_name) counts.subcategories[item.subcategory_name] = (counts.subcategories[item.subcategory_name] || 0) + 1;
    });
    
    itemsExcluding('color').forEach(item => {
      (item.color_names || []).forEach(color => {
        counts.colors[color] = (counts.colors[color] || 0) + 1;
      });
    });
    
    // Size counts: depends on mode
    const sizeItems = itemsExcluding('size');
    if (profileMode) {
      // Count by standard/profile size
      sizeItems.forEach(item => {
        const itemSize = getItemSize(item);
        const profile = getProfileForSize(itemSize);
        if (profile) counts.sizes[profile] = (counts.sizes[profile] || 0) + 1;
      });
    } else {
      // Count by specific size
      sizeItems.forEach(item => {
        const sz = getItemSize(item);
        if (sz) counts.sizes[sz] = (counts.sizes[sz] || 0) + 1;
      });
    }
    
    EXTRA_FILTERS.forEach(def => {
      itemsExcluding(def.type).forEach(item => {
        const val = getExtraValue(item, def);
        if (val) counts[def.type][val] = (counts[def.type][val] || 0) + 1;
      });
    });
    
    return counts;
  }
  
  // ============================================================
  // BUILD FILTER OPTIONS FROM ITEMS
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
  
  function buildSizeOptions(items, profileMode) {
    if (profileMode) {
      // Show standard/profile sizes in defined order
      const available = new Set();
      items.forEach(item => {
        const profile = getProfileForSize(getItemSize(item));
        if (profile) available.add(profile);
      });
      return standardSizeOrder
        .filter(p => available.has(p))
        .map(p => ({ id: p, name: p }));
    } else {
      // Show actual specific sizes
      const sizeMap = new Map();
      items.forEach(item => {
        const sz = getItemSize(item);
        if (sz) sizeMap.set(sz, { id: sz, name: sz });
      });
      return Array.from(sizeMap.values());
    }
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
  // SIZE MODE TRANSLATION
  // When switching from profile → specific or specific → profile,
  // translate the selected sizes so the filter stays meaningful.
  // ============================================================
  
  function translateSizeSelections(selectedSizes, fromProfileMode) {
    if (selectedSizes.length === 0) return [];
    
    if (fromProfileMode) {
      // Was profile mode, now specific: expand profiles → specific sizes
      return profilesToSpecifics(selectedSizes);
    } else {
      // Was specific mode, now profile: collapse specifics → profiles
      return specificsToProfiles(selectedSizes);
    }
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
    
    const seen = new Set();
    const uniqueOptions = options.filter(opt => {
      if (seen.has(opt.name)) return false;
      seen.add(opt.name);
      return true;
    });
    
    // Sort sizes in a logical order
    if (filterType === 'size') {
      const sizeOrder = standardSizeOrder.length > 0 
        ? standardSizeOrder 
        : ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'];
        
      uniqueOptions.sort((a, b) => {
        const ai = sizeOrder.indexOf(a.name);
        const bi = sizeOrder.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        // Try uppercase match
        const aiu = sizeOrder.indexOf(a.name.toUpperCase());
        const biu = sizeOrder.indexOf(b.name.toUpperCase());
        if (aiu !== -1 && biu !== -1) return aiu - biu;
        if (aiu !== -1) return -1;
        if (biu !== -1) return 1;
        // Numeric sort
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
        section.style.display = (extraOptions[def.type] && extraOptions[def.type].length > 0) ? '' : 'none';
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
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif; font-weight: 300; color: #666;">no items found.</p>';
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
    const addChips = (values, type) => values.forEach(val => chips.push({ value: val, type }));
    
    addChips(filters.categories, 'category');
    addChips(filters.subcategories, 'subcategory');
    addChips(filters.sizes, 'size');
    addChips(filters.colors, 'color');
    EXTRA_FILTERS.forEach(def => addChips(filters[def.type] || [], def.type));
    
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
    if (searchClear) searchClear.style.display = searchInput?.value ? 'block' : 'none';
  }
  
  function updateActiveFilterCount(filters) {
    const count = countActiveFilters(filters);
    
    if (filterActiveCount) {
      filterActiveCount.textContent = count;
      filterActiveCount.style.display = count > 0 ? 'inline-flex' : 'none';
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
    if (filterApplyBtn) filterApplyBtn.textContent = total === 1 ? 'show 1 item' : `show ${total} items`;
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
    const profileMode = isSizeProfileMode(filters);
    
    filteredItems = filterItems(catalogData.items, filters);
    
    const availableFilters = searchQuery 
      ? buildFiltersFromItems(catalogData.items)
      : catalogData.filters;
    
    const extraOptions = buildExtraFilterOptions(catalogData.items);
    const counts = calculateFilterCounts(catalogData.items, filters);
    
    showExtraSections(extraOptions);
    
    // Core sections
    renderFilterSection('[data-list="category"]', availableFilters.categories, 'category', counts.categories, filters.categories);
    renderFilterSection('[data-list="color"]', availableFilters.colors, 'color', counts.colors, filters.colors);
    
    // Subcategory
    let subcatsToShow = availableFilters.subcategories;
    if (filters.categories.length > 0) {
      const selectedCatIds = availableFilters.categories
        .filter(c => filters.categories.includes(c.name))
        .map(c => c.id);
      subcatsToShow = subcatsToShow.filter(s => selectedCatIds.includes(s.category_id));
    }
    renderFilterSection('[data-list="subcategory"]', subcatsToShow, 'subcategory', counts.subcategories, filters.subcategories);
    const subSection = document.getElementById('filter-section-subcategory');
    if (subSection) subSection.style.display = filters.categories.length > 0 ? '' : 'none';
    
    // Size — always visible, content depends on mode
    const sizeOptions = buildSizeOptions(catalogData.items, profileMode);
    renderFilterSection('[data-list="size"]', sizeOptions, 'size', counts.sizes, filters.sizes);
    
    // Extra sections
    EXTRA_FILTERS.forEach(def => {
      renderFilterSection(`[data-list="${def.type}"]`, extraOptions[def.type], def.type, counts[def.type], filters[def.type] || []);
    });
    
    renderGrid(filteredItems, page);
    currentPage = page;
    updatePager(filteredItems.length, page);
    
    updateActiveFilterCount(filters);
    updateResultCount(filteredItems.length);
    updateResetVisibility(filters);
    renderFilterChips(filters);
    updateURL(filters, page);
    
    // Track mode for next change
    wasSizeProfileMode = profileMode;
    
    console.log(`[Catalog] Rendered ${filteredItems.length} items (page ${page}) [size mode: ${profileMode ? 'profile' : 'specific'}]${searchQuery ? ` [search: "${searchQuery}"]` : ''}`);
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
    filters.sizes.forEach(s => params.append('sizes', s));
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
      sizes: params.getAll('sizes').filter(Boolean),
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
  // EVENT HANDLERS
  // ============================================================
  
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-filter-open], .filter-trigger-btn');
    if (trigger) { e.preventDefault(); openFilterPanel(); }
  });
  
  if (filterCloseBtn) filterCloseBtn.addEventListener('click', closeFilterPanel);
  if (filterBackdrop) filterBackdrop.addEventListener('click', closeFilterPanel);
  if (filterApplyBtn) filterApplyBtn.addEventListener('click', closeFilterPanel);
  if (filterResetBtn) filterResetBtn.addEventListener('click', async () => { await handleResetAll(); });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filterPanel?.classList.contains('is-open')) closeFilterPanel();
  });
  
  // Filter checkbox changes — live re-render with size translation
  document.addEventListener('change', (e) => {
    if (!e.target.matches('[data-filter]')) return;
    
    // Uncheck subcategories when unchecking a category
    if (e.target.matches('[data-filter="category"]') && !e.target.checked) {
      document.querySelectorAll('[data-filter="subcategory"]:checked').forEach(i => i.checked = false);
    }
    
    // CATEGORY CHANGE → translate size selections between modes
    if (e.target.matches('[data-filter="category"]')) {
      const currentSizes = Array.from(
        document.querySelectorAll('[data-filter="size"]:checked')
      ).map(i => i.value);
      
      if (currentSizes.length > 0) {
        // Figure out the new mode after this category change
        const categoriesAfter = Array.from(
          document.querySelectorAll('[data-filter="category"]:checked')
        ).map(i => i.value);
        const newProfileMode = categoriesAfter.length === 0;
        
        if (wasSizeProfileMode !== newProfileMode) {
          // Mode is changing — translate sizes
          const translated = translateSizeSelections(currentSizes, wasSizeProfileMode);
          console.log(`[Sizes] Translating ${wasSizeProfileMode ? 'profiles' : 'specifics'} → ${newProfileMode ? 'profiles' : 'specifics'}:`, currentSizes, '→', translated);
          
          // We can't check boxes yet because render will rebuild the checkboxes.
          // Instead, we'll pass translated sizes into render via initialFilters.
          const filters = getSelectedFilters();
          filters.sizes = translated;
          render(1, filters);
          return; // Skip the normal render below
        }
      }
    }
    
    render(1);
  });
  
  // Filter chip removal
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    
    const type = chip.getAttribute('data-chip-type');
    const value = chip.getAttribute('data-chip-value');
    
    const checkbox = document.querySelector(`input[data-filter="${type}"][value="${value}"]`);
    if (checkbox) {
      checkbox.checked = false;
      if (type === 'category') {
        document.querySelectorAll('[data-filter="subcategory"]:checked').forEach(i => i.checked = false);
        // Translate sizes when removing category
        const currentSizes = Array.from(
          document.querySelectorAll('[data-filter="size"]:checked')
        ).map(i => i.value);
        if (currentSizes.length > 0) {
          const categoriesAfter = Array.from(
            document.querySelectorAll('[data-filter="category"]:checked')
          ).map(i => i.value);
          const newProfileMode = categoriesAfter.length === 0;
          if (wasSizeProfileMode !== newProfileMode) {
            const translated = translateSizeSelections(currentSizes, wasSizeProfileMode);
            const filters = getSelectedFilters();
            filters.sizes = translated;
            render(1, filters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }
    }
    
    render(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  document.addEventListener('click', (e) => {
    if (e.target.closest('.clothing-reset-all')) { e.preventDefault(); handleResetAll(); }
  });
  
  if (resetAllBtn) resetAllBtn.addEventListener('click', handleResetAll);
  
  if (btnPrev) btnPrev.addEventListener('click', () => {
    if (currentPage > 1) { render(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  if (btnNext) btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) { render(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  
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
  
  if (searchClear) searchClear.addEventListener('click', async () => {
    if (searchInput) searchInput.value = '';
    await handleSearch('');
  });
  
  document.querySelectorAll('[data-filter-reset]').forEach(btn => {
    btn.addEventListener('click', async (e) => { e.preventDefault(); await handleResetAll(); });
  });
  document.querySelectorAll('[data-filter-apply]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); closeFilterPanel(); });
  });
  
  window.addEventListener('popstate', async () => {
    const urlFilters = readFiltersFromURL();
    if (urlFilters.q !== searchQuery) await handleSearch(urlFilters.q);
    render(urlFilters.page, urlFilters);
  });
  
  setupSectionToggles();
  
  // ============================================================
  // INIT
  // ============================================================
  
  try {
    // Fetch size profile data and catalog in parallel
    const [_, __] = await Promise.all([
      fetchSizesData(),
      (async () => {
        const urlFilters = readFiltersFromURL();
        if (urlFilters.q) {
          searchQuery = urlFilters.q;
          if (searchInput) searchInput.value = searchQuery;
          catalogData = await fetchCatalog(searchQuery);
        } else {
          await initCatalog();
        }
      })()
    ]);
    
    updateSearchClearVisibility();
    
    const urlFilters = readFiltersFromURL();
    const hasFilters = urlFilters.categories.length || urlFilters.subcategories.length || 
                       urlFilters.colors.length || urlFilters.sizes.length ||
                       EXTRA_FILTERS.some(def => (urlFilters[def.type] || []).length > 0);
    
    if (hasFilters || urlFilters.page !== 1) {
      const filters = {
        categories: urlFilters.categories,
        subcategories: urlFilters.subcategories,
        colors: urlFilters.colors,
        sizes: urlFilters.sizes,
      };
      EXTRA_FILTERS.forEach(def => { filters[def.type] = urlFilters[def.type] || []; });
      render(urlFilters.page, filters);
      console.log('[Catalog] Applied URL filters:', filters);
    } else {
      render(1);
    }
    
    console.log('[Catalog] Ready');
    
  } catch (err) {
    console.error('[Catalog] Init failed:', err);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif;">Could not load catalog. Please refresh the page.</p>';
  }
  
})();
