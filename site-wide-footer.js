// ============================================
// DEMATERIALIZED - SITE-WIDE FOOTER JS
// Updated: Multi-step onboarding modal
// Flow: Signup → Memberships → Payment → Multi-step Onboarding
// ============================================


(function() {
  const hostname = window.location.hostname;
  const isProduction = hostname === 'dematerialized.nl' 
                    || hostname === 'www.dematerialized.nl';
  
  window.API_BASE_URL = isProduction 
    ? 'https://api.dematerialized.nl'
    : 'https://test-api.dematerialized.nl';
  
})();

// ============================================
// I18N HELPER - locale detection for custom code embeds
// ============================================
window.DematI18n = window.DematI18n || {};
window.DematI18n.isNL = function () {
  return (document.documentElement.lang || '').toLowerCase().indexOf('nl') === 0;
};

// Prefix an internal path with /nl on the Dutch locale (for JS-driven navigation)
window.DematI18n.localizePath = function (path) {
  if (!path || typeof path !== 'string') return path;
  if (!window.DematI18n.isNL()) return path;
  if (path.charAt(0) !== '/') return path;                   // only internal absolute paths
  if (path.charAt(1) === '/') return path;                   // protocol-relative //cdn...
  if (path === '/nl' || path.indexOf('/nl/') === 0) return path; // already localized
  return '/nl' + path;
};
// Localize static internal links inside custom embeds (Webflow only rewrites its own native links)
window.DematI18n.localizeHrefs = function (root) {
  if (!window.DematI18n.isNL()) return;
  var scope = root || document;
  scope.querySelectorAll('a[href^="/"]').forEach(function (a) {
    var href = a.getAttribute('href');
    var localized = window.DematI18n.localizePath(href);
    if (localized !== href) a.setAttribute('href', localized);
  });
};
(function () {
  function run() { window.DematI18n.localizeHrefs(document); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const openers = document.querySelectorAll("[data-filter-open]");
  const closers = document.querySelectorAll("[data-filter-close]");
  
  const open = () => {
    body.classList.add("filter-open");
  };
  const close = () => {
    body.classList.remove("filter-open");
  };
  
  openers.forEach(el => el.addEventListener("click", open));
  closers.forEach(el => el.addEventListener("click", close));
});

// Modal Control Scripts

// ===== AUTH MODAL FUNCTIONS =====
function openAuthModal() {
  
  const modal = document.getElementById('authModal');
  
  if (!modal) {
    console.error("CRITICAL ERROR: Modal element with id 'authModal' NOT FOUND!");
    return;
  }
  
  modal.classList.add('is-visible');
  document.body.classList.add('auth-modal-open');
  
}

function closeAuthModal() {
  
  const modal = document.getElementById('authModal');
  if (!modal) {
    console.error("ERROR: Modal element not found when trying to close!");
    return;
  }
  
  modal.classList.remove('is-visible');
  document.body.classList.remove('auth-modal-open');
  
}

// Make auth functions globally accessible
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;


// Wait for DOM and connect auth modal controls
document.addEventListener('DOMContentLoaded', function() {
  
  setTimeout(function() {
    // ===== AUTH MODAL CONTROLS =====
    
    // Close button
    const authCloseBtn = document.getElementById('close-modal-btn');
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeAuthModal();
      });
    }
    
    // Overlay click
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.addEventListener('click', function(e) {
        if (e.target.id === 'authModal') {
          closeAuthModal();
        }
      });
    }
    
    // Connect navbar login buttons (not the modal buttons)
    const navLoginButtons = document.querySelectorAll('[data-auth-action="login"]:not(#modal-login-btn)');
    
    navLoginButtons.forEach((btn, i) => {
      
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openAuthModal();
      });
    });
    
    // Connect SIGNUP buttons
    const signupButtons = document.querySelectorAll('[data-auth-action="signup"]');
    
    signupButtons.forEach((btn, i) => {
      
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!window.auth0Client) {
          console.error("Auth0 client not initialized yet");
          alert("Please wait a moment and try again");
          return;
        }
        
        try {
          await window.auth0Client.loginWithRedirect({
            authorizationParams: {
              screen_hint: 'signup'
            }
          });
        } catch (error) {
          console.error("Signup redirect failed:", error);
          alert("Signup failed. Please try again.");
        }
      });
    });
    
  }, 500);
});

// Escape key handling for auth modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const authModal = document.getElementById('authModal');
    if (authModal && authModal.classList.contains('is-visible')) {
      closeAuthModal();
    }
  }
});

// Debug helper - check everything after page loads
window.addEventListener('load', function() {
  
  // Check auth modal
  const authModal = document.getElementById('authModal');
  
  if (!authModal) {
    console.error("AUTH MODAL NOT FOUND - Make sure your Webflow component with id='authModal' exists!");
  }
  
  // Check onboarding modal
  const onboardingModal = document.getElementById('onboardingModal');
  
  if (!onboardingModal) {
    console.warn("ONBOARDING MODAL NOT FOUND - You need to add this as a Webflow component!");
  }
});

// Test functions you can call from console
window.testAuthModal = function() {
  openAuthModal();
};

window.testOnboardingModal = function() {
  if (window.openOnboardingModal) {
    openOnboardingModal();
  } else {
    console.error("Onboarding modal not initialized");
  }
};

// ============================================
// NOTE: User status checking is handled by auth.js
// auth.js calls checkUserStatus() which handles:
// - Redirecting users without membership to /memberships
// - Showing onboarding modal for users with membership but incomplete profile
// ============================================


// ============================================
// AUTH UI CONTROLLER
// ============================================

function updateAuthUI(isAuthenticated) {
  
  // Hide all auth-dependent elements first
  document.querySelectorAll('[data-auth]').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show only the relevant elements
  const showSelector = isAuthenticated ? '[data-auth="logged-in"]' : '[data-auth="logged-out"]';
  document.querySelectorAll(showSelector).forEach(el => {
    el.style.display = 'block';
  });
  
}

window.updateAuthUI = updateAuthUI;

// ============================================
// DYNAMIC BANNER SPACING - keep container-top-padding flush with navbar
// ============================================
(function() {
  function getVisibleNavbar() {
    var desktop = document.querySelector('.navbar-desktop');
    var mobile = document.querySelector('.top-navbar-mobile');
    
    if (mobile && window.getComputedStyle(mobile).display !== 'none') return mobile;
    if (desktop && window.getComputedStyle(desktop).display !== 'none') return desktop;
    return desktop || mobile;
  }

  function adjustBannerSpacing() {
    var navbar = getVisibleNavbar();
    var container = document.querySelector('.container-top-padding');
    if (!navbar || !container) return;

    var height = navbar.offsetHeight;
    if (height > 0) {
      container.style.paddingTop = height + 'px';
    }
  }

  // Run multiple times to catch late-loading content
  document.addEventListener('DOMContentLoaded', adjustBannerSpacing);
  window.addEventListener('load', adjustBannerSpacing);
  window.addEventListener('resize', adjustBannerSpacing);
  setTimeout(adjustBannerSpacing, 100);
  setTimeout(adjustBannerSpacing, 500);
  setTimeout(adjustBannerSpacing, 1000);
})();

// ============================================
// HIDE "JOIN NOW" FOR ACTIVE MEMBERS
// ============================================
(function() {
  let checks = 0;
  const interval = setInterval(() => {
    checks++;
    const user = window.currentUserData;
    if (user) {
      if (user.stripe_id) {
        const joinButton = document.getElementById('join-now-container');
        const joinNavLink = document.querySelector('.navbar-links.hidden.pink');
        if (joinButton) joinButton.style.display = 'none';
        if (joinNavLink) joinNavLink.style.display = 'none';
      }
      clearInterval(interval);
    }
    if (checks > 50) clearInterval(interval);
  }, 100);
})();

// ============================================
// CART UTILITIES (API + sessionStorage hybrid)
// ============================================
window.CartManager = {
  STORAGE_KEY: 'dematerialized_cart',
  MAX_ITEMS: 5,
  API_BASE: window.API_BASE_URL,
  _syncing: false,
  _initialized: false,
  
  // ========== INITIALIZATION ==========
  
  async init() {
    if (this._initialized) return;
    
    
    // Wait for auth0Client
    let attempts = 0;
    while (!window.auth0Client && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.auth0Client) {
      this._initialized = true;
      this.updateCartBadge();
      return;
    }
    
    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      
      if (isAuthenticated) {
        await this.syncWithAPI();
      }
    } catch (err) {
      console.error('[Cart] Init error:', err);
    }
    
    this._initialized = true;
    this.updateCartBadge();
  },
  
  // ========== API HELPERS ==========
  
  async getToken() {
    if (!window.auth0Client) return null;
    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) return null;
      return await window.auth0Client.getTokenSilently();
    } catch (err) {
      console.error('[Cart] Token error:', err);
      return null;
    }
  },
  
  async isUserAuthenticated() {
    if (!window.auth0Client) return false;
    try {
      return await window.auth0Client.isAuthenticated();
    } catch {
      return false;
    }
  },
  
  async fetchAPICart() {
    const token = await this.getToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/clothing_items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('[Cart] API fetch failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      return Array.isArray(data) ? data : (data.items || data.clothing_items || []);
    } catch (err) {
      console.error('[Cart] API fetch error:', err);
      return null;
    }
  },
  
  async addToAPI(itemId) {
    const token = await this.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('[Cart] API add failed:', response.status);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('[Cart] API add error:', err);
      return false;
    }
  },
  
  async removeFromAPI(itemId) {
    const token = await this.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('[Cart] API remove failed:', response.status);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('[Cart] API remove error:', err);
      return false;
    }
  },
  
  // ========== SYNC LOGIC ==========
  
  async syncWithAPI() {
    if (this._syncing) return;
    this._syncing = true;
    
    try {
      const localCart = this.getLocalCart();
      const apiCart = await this.fetchAPICart();
      
      if (apiCart === null) {
        this._syncing = false;
        return;
      }
      
      const mergedMap = new Map();
      
      apiCart.forEach(item => {
        let frontImage = '';
        if (item.images && item.images.length > 0) {
          const frontImg = item.images.find(img => 
            img.image_type === 'front' || 
            (img.image_name && img.image_name.toLowerCase().includes('front'))
          );
          frontImage = frontImg?.object_url || item.images[0]?.object_url || '';
        }
        
        mergedMap.set(item.id, {
          id: item.id,
          sku: item.sku,
          name: item.name,
          brand: item.brand?.brand_name || item.brand || '',
          size: item.size?.size || item.size || '',
          image: frontImage || item.front_image || item.frontImage || item.image || '',
          addedAt: item.started_at || new Date().toISOString()
        });
      });
      
      const localOnlyItems = localCart.filter(
        localItem => !apiCart.some(apiItem => apiItem.id === localItem.id)
      );
      
      for (const item of localOnlyItems) {
        if (mergedMap.size >= this.MAX_ITEMS) {
          console.warn('[Cart] Max items reached, skipping upload of:', item.name);
          break;
        }
        
        const success = await this.addToAPI(item.id);
        
        if (success) {
          mergedMap.set(item.id, item);
        }
      }
      
      const mergedCart = Array.from(mergedMap.values());
      this.saveLocalCart(mergedCart);
      
      
    } catch (err) {
      console.error('[Cart] Sync error:', err);
    }
    
    this._syncing = false;
    this.updateCartBadge();
  },
  
  // ========== LOCAL STORAGE METHODS ==========
  
  getLocalCart() {
    try {
      const cart = sessionStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  },
  
  saveLocalCart(cart) {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
      this.updateCartBadge();
      return true;
    } catch (e) {
      console.error('Error saving cart:', e);
      return false;
    }
  },
  
  // ========== PUBLIC METHODS ==========
  
  getCart() {
    return this.getLocalCart();
  },
  
  getCartCount() {
    return this.getLocalCart().length;
  },
  
  isInCart(itemId) {
    const cart = this.getLocalCart();
    return cart.some(item => item.id === itemId);
  },
  
  async addToCart(item) {
    const cart = this.getLocalCart();
    
    if (cart.length >= this.MAX_ITEMS) {
      console.warn('Cart is full (max 5 items)');
      return { success: false, reason: 'max_items' };
    }
    
    if (this.isInCart(item.id)) {
      console.warn('Item already in cart');
      return { success: false, reason: 'already_in_cart' };
    }
    
    const isAuth = await this.isUserAuthenticated();
    if (isAuth) {
      const apiSuccess = await this.addToAPI(item.id);
      if (!apiSuccess) {
        console.error('[Cart] Failed to add to API');
      }
    }
    
    const cartItem = {
      id: item.id,
      sku: item.sku,
      name: item.name,
      brand: item.brand?.brand_name || item.brand || '',
      size: item.size?.size || item.size || '',
      image: item.front_image || item.frontImage || item.image || '',
      addedAt: new Date().toISOString()
    };
    
    cart.push(cartItem);
    this.saveLocalCart(cart);
    
    return { success: true };
  },
  
  async removeFromCart(itemId) {
    let cart = this.getLocalCart();
    const initialLength = cart.length;
    cart = cart.filter(item => item.id !== itemId);
    
    if (cart.length < initialLength) {
      const isAuth = await this.isUserAuthenticated();
      if (isAuth) {
        await this.removeFromAPI(itemId);
      }
      
      this.saveLocalCart(cart);
      return true;
    }
    return false;
  },
  
  clearCart() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadge();
  },
  
  updateCartBadge() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll('[data-cart-count]');
    
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  CartManager.init();
});


// ============================================
// USER MEMBERSHIP HELPER
// ============================================
window.UserMembership = {
  _cache: null,
  _cacheTime: null,
  CACHE_DURATION: 5 * 60 * 1000,
  API_BASE: window.API_BASE_URL,
  premium_name: 'Premium',
  basic_name: 'Basic',
  
  // Shipping membership names
  SHIPPING_MEMBERSHIPS: [
    '5 items, 1 shipment per month',
    '5 items per shipment, 2 shipments per month'
  ],
  
  async fetch() {
    if (this._cache && this._cacheTime && (Date.now() - this._cacheTime < this.CACHE_DURATION)) {
      return this._cache;
    }
    
    try {
      if (!window.auth0Client) return null;
      
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) return null;
      
      const token = await window.auth0Client.getTokenSilently();
      
      const response = await fetch(`${this.API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user:', response.status);
        return null;
      }
      
      const userData = await response.json();
      
      this._cache = userData;
      this._cacheTime = Date.now();
      
      return userData;
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  },
  
  async getMembershipId() {
    const user = await this.fetch();
    return user?.membership_id || user?.membership?.id || null;
  },

  async getMembershipName() {
    const user = await this.fetch();
    return user?.membership?.name || null;
  },
  
  async isPremium() {
    const membershipName = await this.getMembershipName();
    return membershipName === this.premium_name;
  },
  
  async isBasic() {
    const membershipName = await this.getMembershipName();
    return membershipName === this.basic_name;
  },
  
  async isShippingMember() {
    const membershipName = await this.getMembershipName();
    const isShipping = this.SHIPPING_MEMBERSHIPS.includes(membershipName);
    return isShipping;
  },
  
  async isLocalMember() {
    const membershipName = await this.getMembershipName();
    if (!membershipName) return false;
    return !this.SHIPPING_MEMBERSHIPS.includes(membershipName);
  },
  
  async canReserveOnline() {
    return await this.isPremium();
  },
  
  clearCache() {
    this._cache = null;
    this._cacheTime = null;
  }
};


// ============================================
// CART OVERLAY FUNCTIONS
// ============================================

// Track cart flow type globally so renderCartOverlay can use it
let _cartFlowType = null; // null = unknown/not logged in, 'local', or 'shipping'

async function openCartOverlay() {
  
  const overlay = document.getElementById('cart-overlay');
  const backdrop = document.getElementById('cart-backdrop');
  
  if (!overlay || !backdrop) {
    console.error('Cart overlay elements not found!');
    return;
  }
  
  // Add class to body to hide bottom navbar
  document.body.classList.add('cart-open');
  
  backdrop.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  
  // Reset flow type until we know
  _cartFlowType = null;
  renderCartOverlay();
  
  if (window.CartManager && await CartManager.isUserAuthenticated()) {
    await CartManager.syncWithAPI();
    
    // Determine membership type for cart language
    const isShipping = await UserMembership.isShippingMember();
    _cartFlowType = isShipping ? 'shipping' : 'local';
    
    renderCartOverlay();
  }
  
}

function closeCartOverlay() {
  
  const overlay = document.getElementById('cart-overlay');
  const backdrop = document.getElementById('cart-backdrop');
  
  // Remove class from body
  document.body.classList.remove('cart-open');
  
  // Reset cart flow type
  _cartFlowType = null;
  
  if (overlay) overlay.classList.remove('is-open');
  if (backdrop) backdrop.classList.remove('is-open');
  
  document.body.style.overflow = '';
}

// ============================================
// renderCartOverlay
// ============================================

function renderCartOverlay() {
  
  const cart = CartManager.getCart();
  const itemsContainer = document.getElementById('cart-overlay-items');
  const emptyState = document.getElementById('cart-overlay-empty');
  const footer = document.getElementById('cart-overlay-footer');
  const headerCount = document.getElementById('cart-overlay-header-count');
  const subtitleDiv = document.querySelector('.cart-overlay-subtitle');
  const footerCountDiv = document.querySelector('.cart-overlay-count');
  const reserveBtn = document.getElementById('cart-reserve-btn');
  
  if (!itemsContainer || !emptyState || !footer) {
    console.error('Core cart overlay elements not found');
    return;
  }
  
  if (headerCount) headerCount.textContent = cart.length;
  
  // Update subtitle
  if (subtitleDiv) {
    if (cart.length === 0 && !_cartFlowType) {
      subtitleDiv.style.display = 'none';
    } else {
      subtitleDiv.style.display = '';
      if (_cartFlowType === 'shipping') {
        subtitleDiv.innerHTML = `<span id="cart-overlay-count-text">${cart.length} of 5 items</span> — select items for your shipment`;
      } else if (_cartFlowType === 'local') {
        subtitleDiv.innerHTML = `<span id="cart-overlay-count-text">${cart.length} of 5 items</span> — reserve items to try on in store`;
      } else {
        subtitleDiv.innerHTML = `<span id="cart-overlay-count-text">${cart.length} of 5 items</span>`;
      }
    }
  }
  
  // Update footer button text
  if (reserveBtn) {
    if (_cartFlowType === 'shipping') {
      reserveBtn.textContent = 'borrow these items';
    } else {
      reserveBtn.textContent = 'reserve these items';
    }
  }
  
  // Update footer count text
  if (footerCountDiv) {
    if (_cartFlowType === 'shipping') {
      footerCountDiv.innerHTML = `<span id="cart-footer-count">${cart.length}</span> item${cart.length !== 1 ? 's' : ''} selected for shipment`;
    } else {
      footerCountDiv.innerHTML = `<span id="cart-footer-count">${cart.length}</span> item${cart.length !== 1 ? 's' : ''} ready to reserve`;
    }
  }
  
  // Update empty state text
  const emptyText = emptyState.querySelector('p');
  if (emptyText) {
    if (_cartFlowType === 'shipping') {
      emptyText.textContent = 'browse our collection and add items to borrow';
    } else {
      emptyText.textContent = 'browse our collection and add items to reserve';
    }
  }
  
  if (cart.length === 0) {
    emptyState.style.display = 'block';
    itemsContainer.innerHTML = '';
    footer.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  footer.style.display = 'block';
  
  // Clean render - no inline styles, matches purchase cart layout
  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-overlay-item" onclick="goToCartItem('${item.sku}')">
      <div class="cart-overlay-item-image">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
      </div>
      <div class="cart-overlay-item-details">
        <div class="cart-overlay-item-name">${item.name.toLowerCase()}</div>
      </div>
      <button class="cart-overlay-item-remove" onclick="removeCartOverlayItem(event, ${item.id})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
  
}


function goToCartItem(sku) {
  closeCartOverlay();
  window.location.href = window.DematI18n.localizePath('/product?sku=' + encodeURIComponent(sku));
}

async function removeCartOverlayItem(event, itemId) {
  event.stopPropagation();
  
  const itemEl = event.target.closest('.cart-overlay-item');
  if (itemEl) {
    itemEl.style.opacity = '0.5';
    itemEl.style.pointerEvents = 'none';
  }
  
  await CartManager.removeFromCart(itemId);
  renderCartOverlay();
}

function ensureMobileFooterSpacer() {
  const overlay = document.getElementById('cart-overlay');
  if (!overlay) return;
  
  if (overlay.querySelector('.mobile-footer-spacer')) return;
  
  const spacer = document.createElement('div');
  spacer.className = 'mobile-footer-spacer';
  overlay.appendChild(spacer);
  
}


// ============================================
// RESERVATION / RENTAL MODAL FUNCTIONS
// Adapts language and API endpoint based on membership type:
// - Local members: "reserve" → POST /private_clothing_items/reservations
// - Shipping members: "confirm rental" → POST /private_clothing_items/reservations (workaround until dedicated rental endpoint exists)
// ============================================

// Track current flow type for the modal
let _currentFlowType = 'reservation'; // 'reservation' or 'rental'

async function openReservationModal() {
  
  const modal = document.getElementById('reservation-modal');
  const backdrop = document.getElementById('reservation-modal-backdrop');
  const itemCount = document.getElementById('reservation-item-count');
  const errorEl = document.getElementById('reservation-error');
  
  if (!modal || !backdrop) {
    console.error('Reservation modal not found');
    return;
  }
  
  const cart = CartManager.getCart();
  
  // Determine flow type based on membership
  const isShipping = await UserMembership.isShippingMember();
  _currentFlowType = isShipping ? 'rental' : 'reservation';
  
  // Update modal text based on flow type
  const modalTitle = modal.querySelector('.modal-title, .reservation-modal-title, h2, h3');
  const confirmBtn = document.getElementById('confirm-reservation-btn');
  
  if (isShipping) {
    // Rental flow language
    if (itemCount) {
      itemCount.textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''} selected for your shipment`;
    }
    if (modalTitle) {
      modalTitle.textContent = 'confirm your shipment';
    }
    if (confirmBtn) {
      confirmBtn.textContent = 'confirm rental';
    }
    
    // Add shipping note if not already present
    let shippingNote = modal.querySelector('.shipping-note');
    if (!shippingNote) {
      shippingNote = document.createElement('p');
      shippingNote.className = 'shipping-note';
      shippingNote.style.cssText = 'font-size: 14px; color: #46535e; margin-top: 8px; font-family: Urbanist, sans-serif;';
      const insertTarget = itemCount?.parentElement || modal.querySelector('.reservation-modal-body');
      if (insertTarget) insertTarget.appendChild(shippingNote);
    }
    shippingNote.textContent = 'these items will be shipped to your address on file.';
    shippingNote.style.display = 'block';
    
    // Update "before you confirm" policy items for shipping flow
    const policyItems = modal.querySelectorAll('.policy-item');
    if (policyItems.length >= 1) {
      const firstText = policyItems[0].querySelector('p, span, div:not(svg)');
      if (firstText && firstText.tagName !== 'SVG') {
        firstText.textContent = 'we\'ll notify you by email when your items have been shipped, along with a tracking code. items typically arrive within 1-3 business days.';
      }
    }
    if (policyItems.length >= 2) {
      const secondText = policyItems[1].querySelector('p, span, div:not(svg)');
      if (secondText && secondText.tagName !== 'SVG') {
        secondText.innerHTML = '<a href="/contact-us" class="link-text-html">contact us</a> if you have any questions or would like to make a change to your order.';
      }
    }
    
  } else {
    // Reservation flow language (default)
    if (itemCount) {
      itemCount.textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''} ready to reserve`;
    }
    if (modalTitle) {
      modalTitle.textContent = 'confirm reservation';
    }
    if (confirmBtn) {
      confirmBtn.textContent = 'confirm reservation';
    }
    
    // Hide shipping note if present
    const shippingNote = modal.querySelector('.shipping-note');
    if (shippingNote) shippingNote.style.display = 'none';
    
    // Restore original policy items for reservation flow
    const policyItems = modal.querySelectorAll('.policy-item');
    if (policyItems.length >= 1) {
      const firstText = policyItems[0].querySelector('p, span, div:not(svg)');
      if (firstText && firstText.tagName !== 'SVG') {
        firstText.textContent = 'we\'ll notify you by email when your items are ready for pickup at our store, typically within one business day';
      }
    }
    if (policyItems.length >= 2) {
      const secondText = policyItems[1].querySelector('p, span, div:not(svg)');
      if (secondText && secondText.tagName !== 'SVG') {
        secondText.innerHTML = '<a href="/contact-us" class="link-text-html">contact us</a> as soon as possible if you are unable to make it to your reservation. please note that a €5 cancellation / no-show fee may apply. see our <a href="/cancellation-policy" class="link-text-html">cancellation policy</a>.';
      }
    }
  }
  
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
  
if (window.DematI18n) window.DematI18n.localizeHrefs(modal);
  backdrop.style.display = 'block';
  modal.style.display = 'block';
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
  
}

function closeReservationModal() {
  
  const modal = document.getElementById('reservation-modal');
  const backdrop = document.getElementById('reservation-modal-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  
}

async function confirmReservation() {
  
  const btn = document.getElementById('confirm-reservation-btn');
  const errorEl = document.getElementById('reservation-error');
  
  if (!btn) return;
  
  const isRental = _currentFlowType === 'rental';
  const actionLabel = isRental ? 'Rental' : 'Reservation';
  
  btn.disabled = true;
  btn.textContent = isRental ? 'creating rental...' : 'creating reservation...';
  btn.style.opacity = '0.7';
  
  if (errorEl) {
    errorEl.style.display = 'none';
  }
  
  try {
    if (!window.auth0Client) {
      throw new Error('Authentication not available');
    }
    
    const token = await window.auth0Client.getTokenSilently();
    const cart = CartManager.getCart();
    
    let result;
    
    if (isRental) {
      // SHIPPING MEMBER WORKAROUND: Use reservations endpoint for now
      // TODO: Switch to dedicated rental endpoint once Edward builds POST /private_clothing_items/rentals
      const clothingItemIds = cart.map(item => item.id);
      const endpoint = `${window.API_BASE_URL}/private_clothing_items/reservations`;
      

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          clothing_item_ids: clothingItemIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Shipment API Error Response:', errorData);
        
        let errorMessage = `Shipment failed (${response.status})`;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => e.msg || e.message || String(e)).join(', ');
        }
        
        throw new Error(errorMessage);
      }
      
      result = await response.json();
      
    } else {
      // RESERVATION FLOW: Single call with all item IDs (existing behavior)
      const clothingItemIds = cart.map(item => item.id);
      const endpoint = `${window.API_BASE_URL}/private_clothing_items/reservations`;
      

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          clothing_item_ids: clothingItemIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Reservation API Error Response:', errorData);
        
        let errorMessage = `Reservation failed (${response.status})`;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => e.msg || e.message || String(e)).join(', ');
        }
        
        throw new Error(errorMessage);
      }
      
      result = await response.json();
    }
    
    CartManager.clearCart();
    renderCartOverlay();

    closeReservationModal();
    closeCartOverlay();
    
    showReservationSuccess(result, isRental);
    
  } catch (err) {
    console.error(`${actionLabel} error:`, err);
    
    if (errorEl) {
      errorEl.textContent = err.message || `Failed to create ${_currentFlowType}. Please try again.`;
      errorEl.style.display = 'block';
    }
  } finally {
    btn.disabled = false;
    btn.textContent = isRental ? 'confirm rental' : 'confirm reservation';
    btn.style.opacity = '1';
  }
}

function showReservationSuccess(result, isRental) {
  
  const modal = document.getElementById('success-modal');
  const backdrop = document.getElementById('success-modal-backdrop');
  const reservationIdEl = document.getElementById('success-reservation-id');
  
  if (!modal || !backdrop) {
    console.warn('Success modal not found, using alert fallback');
    const label = isRental ? 'Rental' : 'Reservation';
    alert(`${label} confirmed!`);
    return;
  }
  
  // Update success modal text based on flow type
  const successTitle = modal.querySelector('.modal-heading, h2, h3');
  const successMessage = modal.querySelector('.modal-text');
  const idLabel = modal.querySelector('.reservation-id-label');
  const subtext = modal.querySelector('.modal-subtext');
  const viewLink = modal.querySelector('.modal-footer .btn-secondary');
  
  if (isRental) {
    if (successTitle) successTitle.textContent = 'shipment confirmed!';
    if (successMessage) successMessage.textContent = 'your items are being prepared. you\'ll receive an email with a tracking code as soon as we\'ve shipped them.';
    if (idLabel) idLabel.textContent = 'shipment id';
    if (subtext) subtext.textContent = 'happy borrowing!';
    if (viewLink) {
      viewLink.textContent = 'view my rentals';
      viewLink.setAttribute('href', window.DematI18n.localizePath('/my-rentals'));
    }
  } else {
    if (successTitle) successTitle.textContent = 'reservation confirmed!';
    if (successMessage) successMessage.textContent = 'you\'ll receive an email when your items are ready and waiting for you at our showroom.';
    if (idLabel) idLabel.textContent = 'reservation id';
    if (subtext) subtext.textContent = 'see you soon!';
    if (viewLink) {
      viewLink.textContent = 'view my reservations';
      viewLink.setAttribute('href', window.DematI18n.localizePath('/reservations'));
    }
  }
  
  if (reservationIdEl) {
    reservationIdEl.textContent = result.hash_id || result.id;
  }
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
}

function closeSuccessModal() {
  
  const modal = document.getElementById('success-modal');
  const backdrop = document.getElementById('success-modal-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

window.closeSuccessModal = closeSuccessModal;

async function handleReserveClick() {
  
  if (!window.auth0Client) {
    console.error('Auth0 not initialized');
    return;
  }
  
  const isAuthenticated = await window.auth0Client.isAuthenticated();
  
  if (!isAuthenticated) {
    closeCartOverlay();
    openAuthModal();
    return;
  }
  
  openReservationModal();
}

window.openCartOverlay = openCartOverlay;
window.closeCartOverlay = closeCartOverlay;
window.removeCartOverlayItem = removeCartOverlayItem;
window.openReservationModal = openReservationModal;
window.closeReservationModal = closeReservationModal;
window.confirmReservation = confirmReservation;


// ============================================
// UPGRADE MODAL FUNCTIONS
// ============================================

function openUpgradeModal() {
  
  const modal = document.getElementById('upgrade-modal');
  const backdrop = document.getElementById('upgrade-modal-backdrop');
  
  if (!modal || !backdrop) {
    console.error('Upgrade modal not found');
    return;
  }
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
}

function closeUpgradeModal() {
  
  const modal = document.getElementById('upgrade-modal');
  const backdrop = document.getElementById('upgrade-modal-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

window.openUpgradeModal = openUpgradeModal;
window.closeUpgradeModal = closeUpgradeModal;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const cartIcon = document.querySelector('[data-cart-trigger]');
  if (cartIcon) {
    cartIcon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openCartOverlay();
    });
  }
});

// Escape key handling
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal && upgradeModal.style.display === 'block') {
      closeUpgradeModal();
      return;
    }
    
    const reservationModal = document.getElementById('reservation-modal');
    if (reservationModal && reservationModal.style.display === 'block') {
      closeReservationModal();
      return;
    }
    
    const overlay = document.getElementById('cart-overlay');
    if (overlay && overlay.style.transform === 'translateX(0px)') {
      closeCartOverlay();
    }
  }
});

// Close modals on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.id === 'reservation-modal-backdrop') {
    closeReservationModal();
  }
  if (e.target.id === 'upgrade-modal-backdrop') {
    closeUpgradeModal();
  }
  if (e.target.id === 'success-modal-backdrop') {
    closeSuccessModal();
  }
});

window.testCart = function() {
  openCartOverlay();
};

window.testReservationModal = function() {
  openReservationModal();
};

// Move cart overlay to body
function moveCartToBody() {
  const backdrop = document.getElementById('cart-backdrop');
  const overlay = document.getElementById('cart-overlay');
  
  if (backdrop && backdrop.parentElement !== document.body) {
    document.body.appendChild(backdrop);
  }
  if (overlay && overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  const resBackdrop = document.getElementById('reservation-modal-backdrop');
  const resModal = document.getElementById('reservation-modal');
  
  if (resBackdrop && resBackdrop.parentElement !== document.body) {
    document.body.appendChild(resBackdrop);
  }
  if (resModal && resModal.parentElement !== document.body) {
    document.body.appendChild(resModal);
  }
  
  const detailBackdrop = document.getElementById('reservation-detail-backdrop');
  const detailModal = document.getElementById('reservation-detail-modal');

  if (detailBackdrop && detailBackdrop.parentElement !== document.body) {
    document.body.appendChild(detailBackdrop);
  }
  if (detailModal && detailModal.parentElement !== document.body) {
    document.body.appendChild(detailModal);
  }
  
  const upgradeBackdrop = document.getElementById('upgrade-modal-backdrop');
  const upgradeModal = document.getElementById('upgrade-modal');
  
  if (upgradeBackdrop && upgradeBackdrop.parentElement !== document.body) {
    document.body.appendChild(upgradeBackdrop);
  }
  if (upgradeModal && upgradeModal.parentElement !== document.body) {
    document.body.appendChild(upgradeModal);
  }
  
  const successBackdrop = document.getElementById('success-modal-backdrop');
  const successModal = document.getElementById('success-modal');

  if (successBackdrop && successBackdrop.parentElement !== document.body) {
    document.body.appendChild(successBackdrop);
  }
  if (successModal && successModal.parentElement !== document.body) {
    document.body.appendChild(successModal);
  }
  
  if (backdrop && overlay) {
    return true;
  }
  return false;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(moveCartToBody, 100);
    setTimeout(moveCartToBody, 500);
    setTimeout(moveCartToBody, 1000);
  });
} else {
  setTimeout(moveCartToBody, 100);
  setTimeout(moveCartToBody, 500);
  setTimeout(moveCartToBody, 1000);
}

window.addEventListener('load', function() {
  setTimeout(moveCartToBody, 100);
});

// Backup click handler
window.addEventListener('load', function() {
  setTimeout(function() {
    const cartIcon = document.querySelector('[data-cart-trigger]');
    if (cartIcon) {
      const newCartIcon = cartIcon.cloneNode(true);
      cartIcon.parentNode.replaceChild(newCartIcon, cartIcon);
      
      newCartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const backdrop = document.getElementById('cart-backdrop');
        const overlay = document.getElementById('cart-overlay');
        if (backdrop && backdrop.parentElement !== document.body) {
          document.body.appendChild(backdrop);
        }
        if (overlay && overlay.parentElement !== document.body) {
          document.body.appendChild(overlay);
        }
        
        openCartOverlay();
      });
    }
  }, 1500);
});


// Cart handler - using capture phase for all pages
(function() {
  
  function setupCart() {
    
    const backdrop = document.getElementById('cart-backdrop');
    const overlay = document.getElementById('cart-overlay');
    
    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
    }
    if (overlay && overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }
    
  }
  
  function handleCartClick(e) {
     // Skip purchase cart clicks - let them handle their own onclick
    if (e.target.closest('[data-purchase-cart]')) return;
    
    const cartTrigger = e.target.closest('[data-cart-trigger]');
    if (cartTrigger) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const bd = document.getElementById('cart-backdrop');
      const ov = document.getElementById('cart-overlay');
      if (bd && bd.parentElement !== document.body) document.body.appendChild(bd);
      if (ov && ov.parentElement !== document.body) document.body.appendChild(ov);
      
      if (typeof openCartOverlay === 'function') {
        openCartOverlay();
      } else {
        console.error('[Site-wide] openCartOverlay not found!');
      }
    }
  }
  
  document.addEventListener('click', handleCartClick, true);
  document.addEventListener('touchend', handleCartClick, true);
  
  setTimeout(setupCart, 100);
  setTimeout(setupCart, 500);
  setTimeout(setupCart, 1500);
  window.addEventListener('load', function() {
    setTimeout(setupCart, 500);
  });
})();


// ============================================
// MEMBERSHIP SIGNUP HANDLER
// Uses capture phase to catch clicks before anything else
// ============================================
(function() {
  
  document.addEventListener('click', async function(e) {
    const button = e.target.closest('[data-membership]');
    
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const membershipName = button.getAttribute('data-membership');

    // Dedupe: when the post-login replay re-clicks the button, the real user
    // click already pushed to dataLayer before the auth modal opened.
    const isPostLoginReplay = button.dataset.gtmPostLoginReplay === '1';
    if (isPostLoginReplay) {
      delete button.dataset.gtmPostLoginReplay;
    }

    const pushCheckoutClick = () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'membership_checkout_click',
        membership_name: membershipName,
        membership_price: parseFloat(button.getAttribute('data-price'))
      });
    };

    const API_BASE = window.API_BASE_URL;

    if (!window.auth0Client) {
      console.error('Auth0 not initialized');
      alert('Please wait a moment and try again');
      return;
    }

    const isAuthenticated = await window.auth0Client.isAuthenticated();

    if (!isAuthenticated) {
      if (!isPostLoginReplay) pushCheckoutClick();
      sessionStorage.setItem('postLoginAction', JSON.stringify({
        type: 'membership_signup',
        membershipName: membershipName
      }));
      openAuthModal();
      return;
    }

    if (!isPostLoginReplay) pushCheckoutClick();

    const originalHTML = button.innerHTML;
    button.innerHTML = 'Loading...';
    button.style.pointerEvents = 'none';
    button.style.opacity = '0.7';
    
    try {
      const token = await window.auth0Client.getTokenSilently();
      
      const requestBody = {
        membership_name: membershipName,
        success_url: `${window.location.origin}/welcome-to-dematerialized`,
        cancel_url: `${window.location.origin}/error-membership-signup`
      };
      
      const response = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      window.location.href = data.checkout_url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong: ' + error.message);
      button.innerHTML = originalHTML;
      button.style.pointerEvents = 'auto';
      button.style.opacity = '1';
    }
  }, true);
  
  // Post-login handler
  async function checkPostLoginAction() {
    if (!window.auth0Client) {
      setTimeout(checkPostLoginAction, 500);
      return;
    }
    
    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) return;
      
      const action = sessionStorage.getItem('postLoginAction');
      if (action) {
        const parsed = JSON.parse(action);
        if (parsed.type === 'membership_signup') {
          sessionStorage.removeItem('postLoginAction');
          
          setTimeout(() => {
            const button = document.querySelector(`[data-membership="${parsed.membershipName}"]`);
            if (button) {
              button.dataset.gtmPostLoginReplay = '1';
              button.click();
            } else {
              console.error('Button not found for:', parsed.membershipName);
            }
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Post-login check error:', err);
    }
  }
  
  setTimeout(checkPostLoginAction, 1000);
  
})();

// ============================================
// NAVBAR SCROLL HIDE/SHOW
// ============================================
(function() {
  
  let ticking = false;
  const SCROLL_THRESHOLD = 50;
  let navLinksHeight = 0;
  
  function updateNavLinks() {
    const navLinks = document.querySelector('.div-nav-links-wrapper');
    if (!navLinks) {
      console.warn('.div-nav-links-wrapper not found');
      return;
    }
    
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > SCROLL_THRESHOLD) {
      navLinks.style.opacity = '0';
      navLinks.style.maxHeight = '0';
      navLinks.style.overflow = 'hidden';
      navLinks.style.marginTop = '0';
      navLinks.style.marginBottom = '0';
      navLinks.style.paddingTop = '0';
      navLinks.style.paddingBottom = '0';
      navLinks.style.pointerEvents = 'none';
    } else {
      navLinks.style.opacity = '1';
      navLinks.style.maxHeight = navLinksHeight + 'px';
      navLinks.style.overflow = 'visible';
      navLinks.style.marginTop = '';
      navLinks.style.marginBottom = '';
      navLinks.style.paddingTop = '';
      navLinks.style.paddingBottom = '';
      navLinks.style.pointerEvents = 'auto';
    }
    
    ticking = false;
  }
  
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateNavLinks);
      ticking = true;
    }
  }
  
  function initNavScroll() {
    const navLinks = document.querySelector('.div-nav-links-wrapper');
    if (navLinks) {
      navLinksHeight = navLinks.offsetHeight;
      
      navLinks.style.transition = 'opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
      navLinks.style.maxHeight = navLinksHeight + 'px';
      
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScroll);
  } else {
    initNavScroll();
  }
})();


// ============================================
// MULTI-STEP ONBOARDING MODAL
// 8 Steps: Welcome, Name, Contact/Address, Birthday, Sizes, Body Type, Referral, Complete
// Data structure matches profile.js approach
// ============================================
(function() {
  
  // Geoapify API key (same as profile page)
  const GEOAPIFY_KEY = 'ce61be62b3c344838d731909f625cfd1';
  
  // State
  let currentStep = 1;
  const totalSteps = 8;
  let addressDebounce = null;
  
  const formData = {
    // Personal info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    // Address
    addressFull: '',  // Backup: full address from search field
    addressStreet: '',
    addressHouseNumber: '',
    addressUnit: '',
    addressZipcode: '',
    addressCity: '',
    // Birthday
    dateOfBirth: '',
    // Size profile
    heightCm: '',
    preferredFit: '',
    shirtSize: '',
    pantsSize: '',
    shoeSize: '',
    // Body type (attribute)
    bodyType: '',
    // Referral sources (attribute - stored as comma-separated)
    referralSources: []
  };
  
  // Step to progress section mapping
  // Steps 1 = welcome, Steps 2-4 = your info, Steps 5-8 = your profile
  const stepToProgress = {
    1: 1,  // Welcome -> welcome
    2: 2,  // Name -> your info
    3: 2,  // Contact/Address -> your info
    4: 2,  // Birthday -> your info
    5: 3,  // Sizes -> your profile
    6: 3,  // Body type -> your profile
    7: 3,  // Referral -> your profile
    8: 3   // Complete -> your profile
  };
  
  // ===== MODAL FUNCTIONS =====
  
  window.openOnboardingModal = function() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.add('is-visible');
      document.body.classList.add('onboarding-modal-open');
      currentStep = 1;
      showStep(1);
      updateProgress();
    }
  };
  
  window.closeOnboardingModal = function() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.remove('is-visible');
      document.body.classList.remove('onboarding-modal-open');
    }
  };
  
  window.showOnboardingModal = window.openOnboardingModal;
  
  // ===== NAVIGATION =====
  
  window.nextOnboardingStep = function() {
    
    // Collect data from current step before advancing
    collectStepData(currentStep);
    
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
      updateProgress();
    }
  };
  
  window.prevOnboardingStep = function() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
      updateProgress();
    }
  };
  
  window.skipOnboarding = function() {
    sessionStorage.setItem('onboarding_modal_dismissed', 'true');
    closeOnboardingModal();
  };
  
  function showStep(step) {
    
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(el => {
      el.classList.remove('active');
    });
    
    // Show current step
    const stepEl = document.querySelector(`.onboarding-step[data-step="${step}"]`);
    if (stepEl) {
      stepEl.classList.add('active');
    }
  }
  
  function updateProgress() {
    const progressSection = stepToProgress[currentStep];
    
    document.querySelectorAll('.onboarding-progress-step').forEach(el => {
      const stepNum = parseInt(el.getAttribute('data-step'));
      el.classList.remove('active', 'completed');
      
      if (stepNum < progressSection) {
        el.classList.add('completed');
      } else if (stepNum === progressSection) {
        el.classList.add('active');
      }
    });
  }
  
  // ===== ADDRESS AUTOCOMPLETE =====
  
  window.searchOnboardingAddress = async function() {
    const input = document.getElementById('onboarding-address-search');
    const suggestionsContainer = document.getElementById('onboarding-address-suggestions');
    
    if (!input || !suggestionsContainer) return;
    
    const query = input.value.trim();
    
    if (query.length < 3) {
      suggestionsContainer.classList.remove('active');
      suggestionsContainer.innerHTML = '';
      return;
    }
    
    clearTimeout(addressDebounce);
    
    addressDebounce = setTimeout(async () => {
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}&filter=countrycode:nl&limit=5`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          suggestionsContainer.innerHTML = data.features.map((feature, index) => `
            <div class="address-suggestion" onclick="selectOnboardingAddress(${index})" data-index="${index}">
              ${feature.properties.formatted}
            </div>
          `).join('');
          suggestionsContainer.classList.add('active');
          
          // Store features for selection
          window._onboardingAddressResults = data.features;
        } else {
          suggestionsContainer.classList.remove('active');
          suggestionsContainer.innerHTML = '';
        }
      } catch (error) {
        console.error('Address search error:', error);
      }
    }, 300);
  };
  
  window.selectOnboardingAddress = function(index) {
    const feature = window._onboardingAddressResults?.[index];
    if (!feature) return;
    
    const props = feature.properties;
    
    // Update input fields
    const searchInput = document.getElementById('onboarding-address-search');
    const streetInput = document.getElementById('onboarding-street');
    const houseNumberInput = document.getElementById('onboarding-house-number');
    const zipcodeInput = document.getElementById('onboarding-zipcode');
    const cityInput = document.getElementById('onboarding-city');
    
    // Set the search field to formatted address
    if (searchInput) searchInput.value = props.formatted || '';
    
    // Try to get street from various possible properties
    let street = props.street || props.road || props.name || '';
    
    // Try to get house number from various possible properties
    let houseNumber = props.housenumber || props.house_number || '';
    
    // If we have address_line1, try to parse street and number from it
    if ((!street || !houseNumber) && props.address_line1) {
      const addressLine1 = props.address_line1;
      // Dutch format is usually "Street Name 123" or "Street Name 123a"
      const match = addressLine1.match(/^(.+?)\s+(\d+\s*\w*)$/);
      if (match) {
        if (!street) street = match[1];
        if (!houseNumber) houseNumber = match[2];
      } else if (!street) {
        street = addressLine1;
      }
    }
    
    // If still no street/number, try parsing from formatted
    if ((!street || !houseNumber) && props.formatted) {
      // formatted is usually "Street Name 123, PostalCode City, Country"
      const firstPart = props.formatted.split(',')[0];
      if (firstPart) {
        const match = firstPart.trim().match(/^(.+?)\s+(\d+\s*\w*)$/);
        if (match) {
          if (!street) street = match[1];
          if (!houseNumber) houseNumber = match[2];
        }
      }
    }
    
    // Set the values
    if (streetInput) streetInput.value = street;
    if (houseNumberInput) houseNumberInput.value = houseNumber;
    if (zipcodeInput) zipcodeInput.value = props.postcode || '';
    if (cityInput) cityInput.value = props.city || props.town || props.municipality || '';
    
    
    // Hide suggestions
    const suggestionsContainer = document.getElementById('onboarding-address-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.classList.remove('active');
      suggestionsContainer.innerHTML = '';
    }
  };
  
  // ===== DATA COLLECTION =====
  
  function collectStepData(step) {
    switch(step) {
      case 2: // Name only
        formData.firstName = document.getElementById('onboarding-firstname')?.value || '';
        formData.lastName = document.getElementById('onboarding-lastname')?.value || '';
        break;
        
      case 3: // Contact & Address
        formData.phoneNumber = document.getElementById('onboarding-phone')?.value || '';
        formData.addressFull = document.getElementById('onboarding-address-search')?.value || '';
        formData.addressStreet = document.getElementById('onboarding-street')?.value || '';
        formData.addressHouseNumber = document.getElementById('onboarding-house-number')?.value || '';
        formData.addressUnit = document.getElementById('onboarding-unit')?.value || '';
        formData.addressZipcode = document.getElementById('onboarding-zipcode')?.value || '';
        formData.addressCity = document.getElementById('onboarding-city')?.value || '';
        break;
        
      case 4: // Birthday
        formData.dateOfBirth = document.getElementById('onboarding-birthday')?.value || '';
        break;
        
      case 5: // Size profile
        formData.heightCm = document.getElementById('onboarding-height')?.value || '';
        formData.preferredFit = document.getElementById('onboarding-preferred-fit')?.value || '';
        formData.shirtSize = document.getElementById('onboarding-shirt-size')?.value || '';
        formData.pantsSize = document.getElementById('onboarding-pants-size')?.value || '';
        formData.shoeSize = document.getElementById('onboarding-shoe-size')?.value || '';
        break;
        
      case 6: // Body type
        const selectedBodyType = document.querySelector('.body-type-option.selected');
        formData.bodyType = selectedBodyType?.getAttribute('data-body-type') || '';
        break;
        
      case 7: // Referral sources
        formData.referralSources = Array.from(document.querySelectorAll('.checkbox-option input:checked'))
          .map(el => el.value);
        break;
    }
  }
  
  // ===== SUBMIT =====
  
  window.submitOnboarding = async function() {
    
    // Collect data from current step
    collectStepData(currentStep);
    
    const btn = document.querySelector('.onboarding-step[data-step="7"] .onboarding-btn-primary');
    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }
    
    try {
      if (!window.auth0Client) {
        throw new Error('Authentication not available');
      }
      
      const token = await window.auth0Client.getTokenSilently();
      
      // Build attributes array (matching profile.js approach)
      const customAttributes = [];
      
      if (formData.firstName) {
        customAttributes.push({ key: 'first_name', value: formData.firstName });
      }
      if (formData.lastName) {
        customAttributes.push({ key: 'last_name', value: formData.lastName });
      }
      if (formData.addressStreet) {
        customAttributes.push({ key: 'address_street', value: formData.addressStreet });
      }
      if (formData.addressFull) {
        customAttributes.push({ key: 'address_full', value: formData.addressFull });
      }
      if (formData.addressUnit) {
        customAttributes.push({ key: 'address_unit', value: formData.addressUnit });
      }
      if (formData.heightCm) {
        customAttributes.push({ key: 'height_cm', value: formData.heightCm });
      }
      if (formData.preferredFit) {
        customAttributes.push({ key: 'preferred_fit', value: formData.preferredFit });
      }
      if (formData.shirtSize) {
        customAttributes.push({ key: 'shirt_size', value: formData.shirtSize });
      }
      if (formData.pantsSize) {
        customAttributes.push({ key: 'pants_size', value: formData.pantsSize });
      }
      if (formData.shoeSize) {
        customAttributes.push({ key: 'shoe_size', value: formData.shoeSize });
      }
      if (formData.bodyType) {
        customAttributes.push({ key: 'body_type', value: formData.bodyType });
      }
      if (formData.referralSources.length > 0) {
        customAttributes.push({ key: 'referral_sources', value: formData.referralSources.join(',') });
      }
      
      // Build the API payload (matching profile.js approach)
      const payload = {
        provided_information: true,
        attributes: customAttributes
      };
      
      // Direct API fields
      if (formData.phoneNumber) {
        payload.phone_number = formData.phoneNumber;
      }
      if (formData.dateOfBirth) {
        payload.date_of_birth = formData.dateOfBirth;
      }
      if (formData.addressHouseNumber) {
        payload.address_house_number = formData.addressHouseNumber;
      }
      if (formData.addressZipcode) {
        payload.address_zipcode = formData.addressZipcode;
      }
      if (formData.addressCity) {
        payload.address_city = formData.addressCity;
      }
      
      
      const response = await fetch(`${window.API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        // Don't block the user, just log the error and continue
        console.warn('Profile update failed, but continuing to completion');
      }

      // Move to completion step regardless
      currentStep = 8;
      showStep(8);
      updateProgress();
      
    } catch (error) {
      console.error('Submit error:', error);
      // Still show completion - don't block the user
      currentStep = 8;
      showStep(8);
      updateProgress();
    } finally {
      if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    }
  };
  
  window.completeOnboarding = function() {
    sessionStorage.setItem('onboarding_completed', 'true');
    closeOnboardingModal();
    
    // Redirect to clothing page
   window.location.href = window.DematI18n.localizePath('/clothing');
  };
  
  // ===== EVENT LISTENERS =====
  
  function setupEventListeners() {
    // Body type selection (single select)
    document.addEventListener('click', function(e) {
      const bodyTypeBtn = e.target.closest('.body-type-option');
      if (bodyTypeBtn) {
        document.querySelectorAll('.body-type-option').forEach(el => {
          el.classList.remove('selected');
        });
        bodyTypeBtn.classList.add('selected');
      }
    });
    
    // Address search input
    document.addEventListener('input', function(e) {
      if (e.target.id === 'onboarding-address-search') {
        searchOnboardingAddress();
      }
    });
    
    // Close address suggestions when clicking outside
    document.addEventListener('click', function(e) {
      const suggestionsContainer = document.getElementById('onboarding-address-suggestions');
      const searchInput = document.getElementById('onboarding-address-search');
      
      if (suggestionsContainer && suggestionsContainer.classList.contains('active')) {
        if (!e.target.closest('.onboarding-input-group') || 
            (e.target !== searchInput && !e.target.classList.contains('address-suggestion'))) {
          suggestionsContainer.classList.remove('active');
        }
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('onboardingModal');
        if (modal && modal.classList.contains('is-visible')) {
          skipOnboarding();
        }
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }
  
})();
