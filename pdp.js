/**
 * Product Detail Page (PDP) - Optimized
 * 
 * Load via: <script src="https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/pdp.js"></script>
 * 
 * Optimizations:
 * 1. Single fetch for product item (shared across gallery, wishlist, cart)
 * 2. Uses sessionStorage catalog for related items (from clothing page)
 * 3. Consolidated into single module (was 4 separate scripts)
 * 
 * Before: 3 item fetches + 300 item fetch = 4 requests
 * After:  1 item fetch + 0 extra (uses cache) = 1 request
 * 
 * STATUS-AWARE CART BUTTON:
 * - available: Normal Add/Remove from Cart
 * - rented: Disabled, "Rented Out"
 * - reserved: Disabled, "Reserved"
 * - returned: Disabled, "Returning Soon"
 * - purchased/sold: Disabled, "Purchased"/"Sold"
 * - Other statuses: Disabled, "Unavailable"
 */

// ============================================================
// SKU CHECK (runs immediately)
// ============================================================
(function() {
  document.body.classList.add('pdp-checking');
  
  const loader = document.createElement('div');
  loader.className = 'pdp-loader';
  loader.innerHTML = '<div class="pdp-spinner"></div>';
  document.body.insertBefore(loader, document.body.firstChild);
  
  const sku = new URLSearchParams(window.location.search).get('sku');
  
  if (!sku || sku.trim() === '') {
    window.location.href = '/clothing';
  } else {
    document.body.classList.remove('pdp-checking');
    loader.remove();
  }
})();

// ============================================================
// MAIN PDP MODULE
// ============================================================
(async function() {
  'use strict';

  const API_BASE = window.API_BASE_URL;
  const CATALOG_STORAGE_KEY = 'dm_catalog';
  
  // Shared state
  const state = {
    sku: null,
    item: null,
    normalized: null,
    ready: false
  };

  // ============================================================
  // ITEM STATUS CONFIGURATION
  // ============================================================
  
  const ITEM_STATUS_CONFIG = {
    available: {
      canAddToCart: true,
      buttonText: null,
      buttonClass: ''
    },
    rented: {
      canAddToCart: false,
      buttonText: 'Rented Out',
      buttonClass: 'status-rented'
    },
    reserved: {
      canAddToCart: false,
      buttonText: 'Reserved',
      buttonClass: 'status-reserved'
    },
    returned: {
      canAddToCart: false,
      buttonText: 'Returning Soon',
      buttonClass: 'status-returned'
    },
    purchased: {
      canAddToCart: false,
      buttonText: 'Purchased',
      buttonClass: 'status-purchased'
    },
    sold: {
      canAddToCart: false,
      buttonText: 'Sold',
      buttonClass: 'status-sold'
    },
    damaged: {
      canAddToCart: false,
      buttonText: 'Unavailable',
      buttonClass: 'status-unavailable'
    },
    retired: {
      canAddToCart: false,
      buttonText: 'No Longer Available',
      buttonClass: 'status-retired'
    }
  };

  const DEFAULT_STATUS_CONFIG = {
    canAddToCart: false,
    buttonText: 'Unavailable',
    buttonClass: 'status-unavailable'
  };

  function getStatusConfig(status) {
    const normalizedStatus = (status || '').toLowerCase().trim();
    return ITEM_STATUS_CONFIG[normalizedStatus] || DEFAULT_STATUS_CONFIG;
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const getSKU = () => new URLSearchParams(location.search).get('sku')?.trim() || '';

  function setVisual(el, url, alt = '') {
    if (!el) return;
    if (el.tagName.toLowerCase() === 'img') {
      el.removeAttribute('srcset');
      el.removeAttribute('sizes');
      el.src = url || '';
      if (alt) el.alt = alt;
      el.loading = 'lazy';
      el.decoding = 'async';
    } else {
      el.style.backgroundImage = url ? `url("${url}")` : '';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
  }

  function writeText(sel, value) {
    const v = (value ?? '').toString();
    $$(`[data-field="${sel}"], [data-pdp="${sel}"]`).forEach(el => {
      el.textContent = v;
    });
  }

  function writeHTML(sel, value) {
    const v = (value ?? '').toString();
    $$(`[data-field="${sel}"], [data-pdp="${sel}"]`).forEach(el => {
      el.innerHTML = v;
    });
  }

  // ============================================================
  // IMAGE HELPERS
  // ============================================================

  function detectImageType(img) {
    if (img?.image_type) return img.image_type;
    const n = (img?.image_name || '').toLowerCase();
    if (n.includes('front')) return 'front';
    if (n.includes('back')) return 'back';
    if (n.includes('label')) return 'label';
    if (n.includes('fabric')) return 'fabric';
    return 'other';
  }

  const IMAGE_ORDER = { front: 1, back: 2, label: 3, fabric: 4, other: 99 };
  const sortImages = (a, b) => (IMAGE_ORDER[a._type] || 99) - (IMAGE_ORDER[b._type] || 99);

  function pickFrontImage(images) {
    if (!images?.length) return '';
    const front = images.find(i => i.image_type === 'front') ||
                  images.find(i => /front/i.test(i.image_name || ''));
    return front?.object_url || images[0]?.object_url || '';
  }

  // ============================================================
  // COLOR NORMALIZATION
  // ============================================================

  const normKey = s => (s || '').toString().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

  const COLOR_SYNONYMS = {
    'green': ['olive green', 'olive', 'army green', 'forest green', 'sage'],
    'gray': ['grey', 'light gray', 'light grey', 'ash'],
    'beige': ['light brown', 'sand', 'tan', 'khaki'],
    'pink': ['blush', 'rose'],
    'off white': ['cream', 'ivory']
  };

  const COLOR_HEX = {
    black: '#000000', white: '#FFFFFF', gray: '#808080', grey: '#808080',
    green: '#008000', beige: '#F5F5DC', pink: '#FFC0CB', blue: '#0000FF',
    brown: '#8B4513', red: '#FF0000', yellow: '#FFFF00', purple: '#800080',
    orange: '#FFA500', 'off white': '#FAF9F6'
  };

  function sanitizeHex(s) {
    if (!s) return '';
    let x = s.toString().trim();
    if (x[0] !== '#') x = '#' + x;
    const m3 = x.match(/^#([0-9a-fA-F]{3})$/);
    if (m3) x = '#' + m3[1].split('').map(c => c + c).join('');
    return /^#([0-9a-fA-F]{6})$/.test(x) ? x.toUpperCase() : '';
  }

  function extractHex(v) {
    if (!v) return '';
    if (typeof v === 'string') {
      const m = v.match(/#?[0-9a-fA-F]{3,6}/);
      return sanitizeHex(m ? m[0] : '');
    }
    if (typeof v === 'object') {
      return sanitizeHex(v.hex || v.hex_code || v.color_hex || v.code || v.color || '');
    }
    return '';
  }

  function canonicalizeColors(raw) {
    const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const seen = new Set();
    const names = [];
    const nameHexMap = new Map();

    for (const v of arr) {
      let name = '';
      if (typeof v === 'string') name = v.trim();
      else if (v && typeof v === 'object') {
        name = (v.name || v.label || v.value || v.title || v.color || '').toString().trim();
        const hex = extractHex(v);
        if (hex) nameHexMap.set(normKey(name), hex);
      }
      const k = normKey(name);
      if (k && !seen.has(k)) {
        seen.add(k);
        names.push(name);
      }
    }

    const canonSet = new Set();
    names.forEach(n => {
      const k = normKey(n);
      let canon = null;
      for (const [c, syns] of Object.entries(COLOR_SYNONYMS)) {
        if (k === normKey(c) || syns.some(s => normKey(s) === k)) {
          canon = c;
          break;
        }
      }
      canonSet.add(canon || k);
    });

    if (canonSet.has('multicolor') && canonSet.size > 1) {
      canonSet.delete('multicolor');
    }

    const canonNames = Array.from(canonSet);
    const hexes = canonNames.map(cn => {
      let h = nameHexMap.get(normKey(cn));
      if (h) return h;
      const syns = COLOR_SYNONYMS[cn] || [];
      for (const s of syns) {
        h = nameHexMap.get(normKey(s));
        if (h) return h;
      }
      return COLOR_HEX[cn] || '';
    }).filter(Boolean);

    const displayNames = canonNames.map(cn =>
      cn.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    return { displayNames, hexes, canonNames };
  }

  function paintColorCircles(hexes) {
    const els = document.querySelectorAll('.color-circle-pdp');
    const colorText = ($('[data-field="color"]')?.textContent || '').trim().toLowerCase();
    const isMulticolor = colorText === 'multicolor';

    els.forEach(el => {
      if (isMulticolor) {
        el.style.background = 'linear-gradient(90deg, #FDE2E4, #FFF1E6, #E2F0CB, #CDE7F0, #EADCF8, #F9E2AE)';
        el.title = 'Multicolor';
        return;
      }
      if (!hexes?.length) {
        el.style.background = 'transparent';
        el.title = 'Unknown';
        return;
      }
      if (hexes.length === 1) {
        el.style.background = hexes[0];
      } else {
        const step = 100 / hexes.length;
        const stops = hexes.map((h, i) => `${h} ${Math.round(i * step)}% ${Math.round((i + 1) * step)}%`).join(', ');
        el.style.background = `conic-gradient(${stops})`;
      }
      el.title = hexes.join(', ');
    });
  }

  // ============================================================
  // ITEM NORMALIZATION
  // ============================================================

  function normalizeItem(raw) {
    const i = raw || {};
    
    const brand_name = (i.brand && (i.brand.brand_name || i.brand.sku_label)) ||
                       i.brand_name || i.label || i.maker || i.manufacturer || '';
    
    const { displayNames, hexes, canonNames } = canonicalizeColors(i.colors || i.color || i.primary_color);

    const sizeRaw = i.sizes || i.size || i.primary_size;
    const sizeArr = Array.isArray(sizeRaw) ? sizeRaw : (sizeRaw ? [sizeRaw] : []);
    const sizes = [];
    const seenSizes = new Set();
    for (const v of sizeArr) {
      let s = typeof v === 'string' ? v.trim() :
              (v?.size || v?.name || v?.label || v?.value || '').toString().trim();
      const k = s.toLowerCase();
      if (s && !seenSizes.has(k)) {
        seenSizes.add(k);
        sizes.push(s);
      }
    }

    return {
      id: i.id,
      sku: i.sku || '',
      name: i.name || i.title || i.product_name || i.sku || '',
      description: i.description || i.desc || i.long_description || '',
      brand: (brand_name || '').trim() || 'Unknown',
      fabric: ((i.fabric ?? '').toString().trim()) || 'Unknown',
      care_instructions: ((i.care_instructions ?? '').toString().trim()) || 'Unknown',
      acquired_from: (i.acquired_from ?? '').toString().trim(),
      color: displayNames.join(', '),
      color_keys: canonNames,
      color_hexes: hexes,
      size: sizes.join(', '),
      category_id: i.category_id || i.category?.id || null,
      category: i.category?.name || i.category_name || '',
      subcategory: i.subcategory?.name || i.subcategory_name || '',
      condition: i.condition || '',
      status: i.status || '',
      price: i.price || i.retail_price || i.list_price || '',
      images: Array.isArray(i.images) ? i.images : [],
      _raw: i
    };
  }

  // ============================================================
  // HYDRATE TEXT FIELDS
  // ============================================================

  function hydrateTextFields(n) {
    if (n.name) document.title = `${n.name} – Dematerialized`;
    
    writeText('name', n.name);
    writeHTML('description', n.description);
    writeText('brand', n.brand);
    writeText('fabric', n.fabric);
    writeText('care_instructions', n.care_instructions);
    writeText('acquired_from', n.acquired_from);
    writeText('color', n.color);
    writeText('size', n.size);
    writeText('condition', n.condition);
    writeText('status', n.status);
    writeText('price', n.price);
    writeText('sku', n.sku);
    writeText('category', n.category);
    writeText('subcategory', n.subcategory);
    
    paintColorCircles(n.color_hexes);
  }

  // ============================================================
  // FETCH ITEM (SINGLE REQUEST)
  // ============================================================

  async function fetchItem(sku) {
    const res = await fetch(`${API_BASE}/clothing_items/clothing_item/${encodeURIComponent(sku)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // ============================================================
  // GALLERY
  // ============================================================

  function initGallery(n) {
    const main = $('[data-main-img]');
    const thumbs = $('[data-thumbs]');
    const tpl = $('[data-template="thumb"]');

    if (!main || !thumbs || !tpl) return;

    const imgs = (n.images || []).map(i => ({ ...i, _type: detectImageType(i) })).sort(sortImages);

    if (!imgs.length) {
      setVisual(main, '', n.name);
      thumbs.style.display = 'none';
      return;
    }

    const indexByUrl = new Map(imgs.map((im, i) => [im.object_url, i]));
    $$('.thumb-clone', thumbs).forEach(el => el.remove());

    const nodes = imgs.map(img => {
      const x = tpl.cloneNode(true);
      x.classList.remove('is-template');
      x.removeAttribute('data-template');
      x.classList.add('thumb-clone');
      x.dataset.url = img.object_url;
      setVisual(x.querySelector('[data-thumb-img]'), img.object_url, n.name);
      x.onclick = () => show(indexByUrl.get(img.object_url));
      thumbs.appendChild(x);
      return x;
    });

    let current = Math.max(0, imgs.findIndex(i => i._type === 'front'));

    function highlight(url) {
      nodes.forEach(nd => nd.classList.remove('is-active'));
      const node = nodes.find(nd => nd.dataset.url === url);
      if (node) node.classList.add('is-active');
    }

    function show(i) {
      current = (i + imgs.length) % imgs.length;
      const img = imgs[current];
      setVisual(main, img.object_url, n.name);
      highlight(img.object_url);
    }

    show(current);

    // Desktop zoom
    const wrap = $('.div-pdp-image-wrapper');
    if (wrap && main) {
      const Z = 2;
      const setZ = on => {
        wrap.classList.toggle('is-zoomed', on);
        main.style.transform = `scale(${on ? Z : 1})`;
        if (!on) main.style.transformOrigin = '50% 50%';
        main.style.cursor = on ? 'zoom-out' : 'zoom-in';
        main.style.transition = 'transform .25s ease, transform-origin .05s linear';
      };

      wrap.addEventListener('mouseenter', () => setZ(true));
      wrap.addEventListener('mouseleave', () => setZ(false));
      wrap.addEventListener('mousemove', e => {
        if (!wrap.classList.contains('is-zoomed')) return;
        const r = wrap.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        main.style.transformOrigin = `${x}% ${y}%`;
      }, { passive: true });
    }

    initMobileSlider(imgs, n.name);
  }

  function initMobileSlider(imgs, name) {
    const slider = $('[data-slider="mobile-gallery"]');
    if (!slider) return;

    const mask = slider.querySelector('.w-slider-mask');
    if (!mask || !imgs.length) return;

    mask.innerHTML = '';
    imgs.forEach((img, idx) => {
      const slide = document.createElement('div');
      slide.className = 'w-slide';
      const el = document.createElement('img');
      el.className = 'mobile-slide-img';
      el.loading = 'lazy';
      el.decoding = 'async';
      el.alt = name ? `${name} – image ${idx + 1}` : `Product image ${idx + 1}`;
      el.src = img.object_url;
      slide.appendChild(el);
      mask.appendChild(slide);
    });

    if (window.Webflow?.require) {
      try { Webflow.require('slider').redraw(); } catch (e) {}
    }
  }

  // ============================================================
  // RELATED ITEMS (client-side from cached catalog)
  // ============================================================

  function getCachedCatalog() {
    try {
      const stored = sessionStorage.getItem(CATALOG_STORAGE_KEY);
      if (!stored) return null;
      const { data, timestamp } = JSON.parse(stored);
      // 5 min TTL
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data.items || [];
      }
    } catch (e) {}
    return null;
  }

  async function fetchAndCacheCatalog() {
    // Only called if user landed directly on PDP (no cache)
    try {
      const res = await fetch(`${API_BASE}/clothing_items/catalog/full`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      
      // Cache it for subsequent pages
      try {
        sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {}
      
      return data.items || [];
    } catch (e) {
      console.warn('[PDP] Catalog fetch failed:', e);
      return [];
    }
  }

  function findRelatedItems(catalog, current) {
    // Filter out current item
    const pool = catalog.filter(i => i.sku !== current.sku);
    
    const wantCategory = current.category_id || current.category;
    const wantColors = (current.color_keys || []).map(c => c.toLowerCase());
    
    // Score items by relevance
    const scored = pool.map(item => {
      let score = 0;
      
      // Same category: +10
      if (item.category_id === current.category_id || 
          item.category_name === current.category) {
        score += 10;
      }
      
      // Color match: +5
      const itemColors = (item.color_names || []).map(c => c.toLowerCase());
      if (wantColors.some(c => itemColors.includes(c))) {
        score += 5;
      }
      
      return { ...item, _score: score };
    });
    
    // Sort by score desc, take top 12
    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
  }

  async function initRelated(current) {
    const wrap = $('[data-related="wrapper"]');
    const viewport = wrap?.querySelector('[data-related-viewport]');
    const track = wrap?.querySelector('[data-related-track]');
    const tplCard = wrap?.querySelector('[data-template="related-card"]');

    if (!wrap || !viewport || !track || !tplCard) return;

    Array.from(track.children).forEach(ch => {
      if (ch !== tplCard) ch.remove();
    });

    // Get catalog (from cache or fetch once)
    let catalog = getCachedCatalog();
    if (!catalog?.length) {
      console.log('[PDP] No cache, fetching catalog...');
      catalog = await fetchAndCacheCatalog();
    } else {
      console.log('[PDP] Using cached catalog for related');
    }

    if (!catalog.length) {
      wrap.style.display = 'none';
      return;
    }

    // Client-side filtering
    const list = findRelatedItems(catalog, current);

    if (!list.length) {
      wrap.style.display = 'none';
      return;
    }

    const itemsForLoader = [];

    for (const item of list) {
      // Catalog items have front_image directly
      const imgUrl = item.front_image;
      if (!imgUrl) continue;

      const card = tplCard.cloneNode(true);
      card.classList.remove('is-template');
      card.removeAttribute('data-template');
      card.setAttribute('data-related-card', '');

      const imgEl = card.querySelector('[data-related-img]');
      const nameEl = card.querySelector('[data-related-name]');
      const hrefEl = card.tagName.toLowerCase() === 'a' ? card : card.querySelector('a');

      if (nameEl) nameEl.textContent = item.name || item.sku || '';
      if (hrefEl) hrefEl.href = `/product?sku=${encodeURIComponent(item.sku)}`;

      track.appendChild(card);
      itemsForLoader.push({ card, imgEl, url: imgUrl, name: item.name || item.sku });
    }

    wrap.style.display = '';

    const setImage = ({ imgEl, url, name }) => {
      if (!imgEl || !url) return;
      imgEl.loading = 'eager';
      imgEl.decoding = 'async';
      imgEl.removeAttribute('srcset');
      imgEl.removeAttribute('sizes');
      imgEl.src = url;
      if (!imgEl.alt) imgEl.alt = name;
    };

    const vpRect = viewport.getBoundingClientRect();
    const eager = [], lazy = [];

    for (const it of itemsForLoader) {
      const r = it.card.getBoundingClientRect();
      (r.left < vpRect.right && r.right > vpRect.left ? eager : lazy).push(it);
    }

    eager.forEach(setImage);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          setImage(en.target.__relItem);
          io.unobserve(en.target);
        });
      }, { root: viewport, rootMargin: '200px 0px', threshold: 0.01 });

      for (const it of lazy) {
        it.card.__relItem = it;
        io.observe(it.card);
      }
    } else {
      lazy.forEach(setImage);
    }

    viewport.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        viewport.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  // ============================================================
  // WISHLIST
  // ============================================================

  async function initWishlist() {
    const btn = $('#pdp-wishlist-button');
    if (!btn || !state.item) return;

    const itemId = state.item.id;
    let isInWishlist = false;

    async function getToken() {
      if (!window.auth0Client) return null;
      const isAuth = await window.auth0Client.isAuthenticated();
      if (!isAuth) return null;
      return window.auth0Client.getTokenSilently();
    }

    async function checkStatus() {
      const token = await getToken();
      if (!token) return false;

      try {
        const res = await fetch(`${API_BASE}/private_clothing_items/wishlist/exists/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          return data.exists || data === true;
        }
      } catch (e) {}
      return false;
    }

    function updateBtn() {
      btn.textContent = isInWishlist ? 'Remove From Wish List' : 'Add To Wish List';
    }

    async function toggle() {
      const token = await getToken();
      if (!token) {
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
      }

      try {
        const method = isInWishlist ? 'DELETE' : 'POST';
        const res = await fetch(`${API_BASE}/private_clothing_items/wishlist/${itemId}`, {
          method,
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
          isInWishlist = !isInWishlist;
          updateBtn();
        }
      } catch (e) {
        console.error('[PDP] Wishlist toggle error:', e);
      }
    }

    btn.addEventListener('click', async e => {
      e.preventDefault();
      await toggle();
    });

    let attempts = 0;
    while (!window.auth0Client && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (window.auth0Client) {
      const isAuth = await window.auth0Client.isAuthenticated();
      if (isAuth) {
        isInWishlist = await checkStatus();
        updateBtn();
      }
    }
  }

  // ============================================================
  // CART (STATUS-AWARE)
  // ============================================================

  async function initCart() {
    const btn = $('#pdp-cart-button');
    if (!btn || !state.item) return;

    const itemData = {
      ...state.item,
      frontImage: pickFrontImage(state.item.images)
    };

    // Get status configuration
    const itemStatus = state.normalized?.status || state.item?.status || '';
    const statusConfig = getStatusConfig(itemStatus);

    if (window.CartManager) {
      await CartManager.init();
    }

    function updateBtn() {
      // First check if item status allows cart operations
      if (!statusConfig.canAddToCart) {
        btn.textContent = statusConfig.buttonText;
        btn.classList.remove('in-cart');
        btn.classList.add('status-disabled', statusConfig.buttonClass);
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        return;
      }

      // Item is available - normal cart functionality
      if (!window.CartManager) return;

      // Remove any status classes
      btn.classList.remove('status-disabled', 'status-rented', 'status-reserved', 
                           'status-returned', 'status-purchased', 'status-sold',
                           'status-unavailable', 'status-retired');

      const isInCart = CartManager.isInCart(itemData.id);
      const cartCount = CartManager.getCartCount();

      if (isInCart) {
        btn.textContent = 'Remove From Cart';
        btn.classList.add('in-cart');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      } else if (cartCount >= CartManager.MAX_ITEMS) {
        btn.textContent = 'Cart Full (10 Items)';
        btn.classList.remove('in-cart');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.textContent = 'Add To Cart';
        btn.classList.remove('in-cart');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }

    btn.addEventListener('click', async e => {
      e.preventDefault();
      
      // Don't allow clicks if item isn't available
      if (!statusConfig.canAddToCart) return;
      if (!window.CartManager) return;

      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Updating...';
      btn.style.opacity = '0.7';

      try {
        const isInCart = CartManager.isInCart(itemData.id);
        if (isInCart) {
          await CartManager.removeFromCart(itemData.id);
        } else {
          const result = await CartManager.addToCart(itemData);
          if (!result.success && result.reason === 'max_items') {
            alert('Your cart is full! You can reserve up to 10 items at a time.');
          }
        }
      } catch (e) {
        console.error('[PDP] Cart error:', e);
      }

      btn.disabled = false;
      btn.style.opacity = '1';
      updateBtn();
    });

    updateBtn();
  }

  // ============================================================
  // EXPORT CART BUTTON UTILITIES (for use on other pages)
  // ============================================================
  
  window.CartButtonUtils = {
    getStatusConfig,
    ITEM_STATUS_CONFIG,
    DEFAULT_STATUS_CONFIG,
    
    /**
     * Updates any cart button based on item status
     * @param {HTMLElement} btn - The button element
     * @param {Object} item - Item data with id and status
     * @returns {Object} { canInteract, status }
     */
    updateCartButton(btn, item) {
      if (!btn || !item) return { canInteract: false, status: 'unknown' };

      const itemStatus = (item.status || '').toLowerCase().trim();
      const config = getStatusConfig(itemStatus);

      if (!config.canAddToCart) {
        btn.textContent = config.buttonText;
        btn.classList.remove('in-cart');
        btn.classList.add('status-disabled', config.buttonClass);
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        return { canInteract: false, status: itemStatus };
      }

      btn.classList.remove('status-disabled', 'status-rented', 'status-reserved',
                           'status-returned', 'status-purchased', 'status-sold',
                           'status-unavailable', 'status-retired');

      if (!window.CartManager) {
        btn.textContent = 'Add To Cart';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        return { canInteract: true, status: itemStatus };
      }

      const isInCart = CartManager.isInCart(item.id);
      const cartCount = CartManager.getCartCount();

      if (isInCart) {
        btn.textContent = 'Remove From Cart';
        btn.classList.add('in-cart');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      } else if (cartCount >= CartManager.MAX_ITEMS) {
        btn.textContent = 'Cart Full (10 Items)';
        btn.classList.remove('in-cart');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.textContent = 'Add To Cart';
        btn.classList.remove('in-cart');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }

      return { canInteract: config.canAddToCart, status: itemStatus };
    },

    /**
     * Handles cart button click with status check
     * @param {HTMLElement} btn - The button
     * @param {Object} item - Item data
     * @param {Function} onUpdate - Callback after update
     */
    async handleCartClick(btn, item, onUpdate) {
      const config = getStatusConfig(item.status);
      if (!config.canAddToCart || !window.CartManager) return;

      btn.disabled = true;
      btn.textContent = 'Updating...';
      btn.style.opacity = '0.7';

      try {
        const isInCart = CartManager.isInCart(item.id);
        if (isInCart) {
          await CartManager.removeFromCart(item.id);
        } else {
          const result = await CartManager.addToCart(item);
          if (!result.success && result.reason === 'max_items') {
            alert('Your cart is full! You can reserve up to 10 items at a time.');
          }
        }
      } catch (e) {
        console.error('[Cart] Error:', e);
      }

      btn.disabled = false;
      btn.style.opacity = '1';
      if (typeof onUpdate === 'function') onUpdate(btn, item);
    }
  };

  // ============================================================
  // INIT
  // ============================================================

  async function init() {
    state.sku = getSKU();
    if (!state.sku) return;

    try {
      // Single fetch for item (was 3 separate fetches before)
      state.item = await fetchItem(state.sku);
      state.normalized = normalizeItem(state.item);
      state.ready = true;

      hydrateTextFields(state.normalized);
      initGallery(state.normalized);
      await initRelated(state.normalized);
      await initWishlist();
      await initCart();

      console.log('[PDP] Initialized ✓');

    } catch (e) {
      console.error('[PDP] Init failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    await init();
  }

})();
