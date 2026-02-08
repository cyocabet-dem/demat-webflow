// ============================================
// DEMATERIALIZED - SITE-WIDE FOOTER JS
// Updated: Multi-step onboarding modal
// Flow: Signup → Memberships → Payment → Multi-step Onboarding
// ============================================

console.log("🎯 Filter menu script loading...");

(function() {
  const hostname = window.location.hostname;
  const isProduction = hostname === 'dematerialized.nl' 
                    || hostname === 'www.dematerialized.nl';
  
  window.API_BASE_URL = isProduction 
    ? 'https://api.dematerialized.nl'
    : 'https://test-api.dematerialized.nl';
  
  console.log('is_production', isProduction);
  console.log('hostname', hostname);
  console.log('api base url', window.API_BASE_URL);
  console.log(`[${isProduction ? 'PROD' : 'DEV'}] API: ${window.API_BASE_URL}`);
})();


document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM loaded - Initializing filter menu");
  const body = document.body;
  const openers = document.querySelectorAll("[data-filter-open]");
  const closers = document.querySelectorAll("[data-filter-close]");
  console.log("Found filter openers:", openers.length);
  console.log("Found filter closers:", closers.length);
  
  const open = () => {
    console.log("🔓 Opening filter");
    body.classList.add("filter-open");
  };
  const close = () => {
    console.log("🔒 Closing filter");
    body.classList.remove("filter-open");
  };
  
  openers.forEach(el => el.addEventListener("click", open));
  closers.forEach(el => el.addEventListener("click", close));
  console.log("✅ Filter menu initialized");
});

// Modal Control Scripts
console.log("🚀 Modal scripts loading...");

// ===== AUTH MODAL FUNCTIONS =====
function openAuthModal() {
  console.log("🔥 openAuthModal() CALLED!");
  
  const modal = document.getElementById('authModal');
  console.log("Modal found:", !!modal);
  
  if (!modal) {
    console.error("❌ CRITICAL ERROR: Modal element with id 'authModal' NOT FOUND!");
    console.log("All elements with IDs:", Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }
  
  modal.classList.add('is-visible');
  document.body.classList.add('auth-modal-open');
  
  console.log("✅ Modal should now be VISIBLE!");
  console.log("Modal display style:", window.getComputedStyle(modal).display);
}

function closeAuthModal() {
  console.log("🔒 closeAuthModal() called");
  
  const modal = document.getElementById('authModal');
  if (!modal) {
    console.error("❌ ERROR: Modal element not found when trying to close!");
    return;
  }
  
  modal.classList.remove('is-visible');
  document.body.classList.remove('auth-modal-open');
  
  console.log("✅ Auth modal closed");
}

// Make auth functions globally accessible
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

console.log("✅ Auth modal functions registered on window object");

// Wait for DOM and connect auth modal controls
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔌 Connecting modal controls...");
  
  setTimeout(function() {
    // ===== AUTH MODAL CONTROLS =====
    
    // Close button
    const authCloseBtn = document.getElementById('close-modal-btn');
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', function(e) {
        console.log("❌ Close button clicked");
        e.preventDefault();
        closeAuthModal();
      });
    }
    
    // Overlay click
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.addEventListener('click', function(e) {
        if (e.target.id === 'authModal') {
          console.log("👆 Clicked overlay - closing auth modal");
          closeAuthModal();
        }
      });
    }
    
    // Connect navbar login buttons (not the modal buttons)
    const navLoginButtons = document.querySelectorAll('[data-auth-action="login"]:not(#modal-login-btn)');
    console.log("Found navbar login buttons:", navLoginButtons.length);
    
    navLoginButtons.forEach((btn, i) => {
      console.log(`Connecting navbar button ${i + 1}:`, btn.textContent.trim());
      
      btn.addEventListener('click', function(e) {
        console.log("🖱️ Navbar login button clicked!");
        e.preventDefault();
        openAuthModal();
      });
    });
    
    // Connect SIGNUP buttons
    const signupButtons = document.querySelectorAll('[data-auth-action="signup"]');
    console.log("Found signup buttons:", signupButtons.length);
    
    signupButtons.forEach((btn, i) => {
      console.log(`Connecting signup button ${i + 1}:`, btn.textContent.trim());
      
      btn.addEventListener('click', async function(e) {
        console.log("🖱️ Signup button clicked!");
        e.preventDefault();
        
        if (!window.auth0Client) {
          console.error("❌ Auth0 client not initialized yet");
          alert("Please wait a moment and try again");
          return;
        }
        
        console.log("🔐 Redirecting to Auth0 signup...");
        try {
          await window.auth0Client.loginWithRedirect({
            authorizationParams: {
              screen_hint: 'signup'
            }
          });
        } catch (error) {
          console.error("❌ Signup redirect failed:", error);
          alert("Signup failed. Please try again.");
        }
      });
    });
    
    console.log("✅ Auth modal controls connected");
  }, 500);
});

// Escape key handling for auth modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const authModal = document.getElementById('authModal');
    if (authModal && authModal.classList.contains('is-visible')) {
      console.log("⎋ Escape pressed - closing auth modal");
      closeAuthModal();
    }
  }
});

// Debug helper - check everything after page loads
window.addEventListener('load', function() {
  console.log("═══════════════════════════════════");
  console.log("📄 PAGE FULLY LOADED - RUNNING DIAGNOSTICS");
  console.log("═══════════════════════════════════");
  
  // Check auth modal
  const authModal = document.getElementById('authModal');
  console.log("1️⃣ Auth modal element exists:", !!authModal);
  
  if (authModal) {
    console.log("   Auth modal computed display:", window.getComputedStyle(authModal).display);
    console.log("   Auth modal computed z-index:", window.getComputedStyle(authModal).zIndex);
  } else {
    console.error("   ❌ AUTH MODAL NOT FOUND - Make sure your Webflow component with id='authModal' exists!");
  }
  
  // Check onboarding modal
  const onboardingModal = document.getElementById('onboardingModal');
  console.log("2️⃣ Onboarding modal element exists:", !!onboardingModal);
  
  if (onboardingModal) {
    console.log("   Onboarding modal computed display:", window.getComputedStyle(onboardingModal).display);
    console.log("   Onboarding modal computed z-index:", window.getComputedStyle(onboardingModal).zIndex);
  } else {
    console.warn("   ⚠️ ONBOARDING MODAL NOT FOUND - You need to add this as a Webflow component!");
  }
  
  // Check for login buttons
  const onclickButtons = document.querySelectorAll('[onclick*="openAuthModal"]');
  const dataAttrButtons = document.querySelectorAll('[data-auth-action="login"]');
  
  console.log("3️⃣ Login buttons found:");
  console.log("   With onclick='openAuthModal()':", onclickButtons.length);
  console.log("   With data-auth-action='login':", dataAttrButtons.length);
  
  console.log("═══════════════════════════════════");
  console.log("💡 TIP: Type testAuthModal() or testOnboardingModal() to test");
  console.log("═══════════════════════════════════");
});

// Test functions you can call from console
window.testAuthModal = function() {
  console.log("🧪 TEST: Opening auth modal...");
  openAuthModal();
};

window.testOnboardingModal = function() {
  console.log("🧪 TEST: Opening onboarding modal...");
  if (window.openOnboardingModal) {
    openOnboardingModal();
  } else {
    console.error("Onboarding modal not initialized");
  }
};

console.log("✅ All modal scripts loaded successfully!");


// ============================================
// NOTE: User status checking is handled by auth.js
// auth.js calls checkUserStatus() which handles:
// - Redirecting users without membership to /memberships
// - Showing onboarding modal for users with membership but incomplete profile
// ============================================


// ============================================
// AUTH UI CONTROLLER
// ============================================
console.log("🔐 Auth UI controller loading...");

function updateAuthUI(isAuthenticated) {
  console.log("🔄 Updating auth UI. Is authenticated:", isAuthenticated);
  
  // Hide all auth-dependent elements first
  document.querySelectorAll('[data-auth]').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show only the relevant elements
  const showSelector = isAuthenticated ? '[data-auth="logged-in"]' : '[data-auth="logged-out"]';
  document.querySelectorAll(showSelector).forEach(el => {
    el.style.display = 'block';
  });
  
  console.log("✅ Auth UI updated");
}

window.updateAuthUI = updateAuthUI;

console.log("✅ Auth UI controller ready");


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
    
    console.log('🛒 [Cart] Initializing...');
    
    // Wait for auth0Client
    let attempts = 0;
    while (!window.auth0Client && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.auth0Client) {
      console.log('🛒 [Cart] Auth not available, using sessionStorage only');
      this._initialized = true;
      this.updateCartBadge();
      return;
    }
    
    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('🛒 [Cart] User authenticated, syncing with API...');
        await this.syncWithAPI();
      } else {
        console.log('🛒 [Cart] User not authenticated, using sessionStorage');
      }
    } catch (err) {
      console.error('🛒 [Cart] Init error:', err);
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
      console.error('🛒 [Cart] Token error:', err);
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
        console.error('🛒 [Cart] API fetch failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('🛒 [Cart] API cart loaded:', data);
      
      return Array.isArray(data) ? data : (data.items || data.clothing_items || []);
    } catch (err) {
      console.error('🛒 [Cart] API fetch error:', err);
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
        console.error('🛒 [Cart] API add failed:', response.status);
        return false;
      }
      
      console.log('✅ [Cart] Added to API:', itemId);
      return true;
    } catch (err) {
      console.error('🛒 [Cart] API add error:', err);
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
        console.error('🛒 [Cart] API remove failed:', response.status);
        return false;
      }
      
      console.log('✅ [Cart] Removed from API:', itemId);
      return true;
    } catch (err) {
      console.error('🛒 [Cart] API remove error:', err);
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
        console.log('🛒 [Cart] Could not fetch API cart, keeping local');
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
          console.warn('🛒 [Cart] Max items reached, skipping upload of:', item.name);
          break;
        }
        
        console.log('🛒 [Cart] Uploading local item to API:', item.name);
        const success = await this.addToAPI(item.id);
        
        if (success) {
          mergedMap.set(item.id, item);
        }
      }
      
      const mergedCart = Array.from(mergedMap.values());
      this.saveLocalCart(mergedCart);
      
      console.log('✅ [Cart] Sync complete. Items:', mergedCart.length);
      
    } catch (err) {
      console.error('🛒 [Cart] Sync error:', err);
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
        console.error('🛒 [Cart] Failed to add to API');
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
    
    console.log('✅ Added to cart:', item.name);
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
      console.log('✅ Removed from cart:', itemId);
      return true;
    }
    return false;
  },
  
  clearCart() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadge();
    console.log('✅ Cart cleared');
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
  
  async fetch() {
    if (this._cache && this._cacheTime && (Date.now() - this._cacheTime < this.CACHE_DURATION)) {
      console.log('👤 Using cached membership data');
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
        console.error('👤 Failed to fetch user:', response.status);
        return null;
      }
      
      const userData = await response.json();
      console.log('👤 User data fetched:', userData);
      
      this._cache = userData;
      this._cacheTime = Date.now();
      
      return userData;
    } catch (err) {
      console.error('👤 Error fetching user:', err);
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
  
  async canReserveOnline() {
    console.log("👤 Checking if user can reserve online...");
    console.log("His membership is premium:", await this.isPremium())
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

async function openCartOverlay() {
  console.log('🛒 openCartOverlay() called');
  
  const overlay = document.getElementById('cart-overlay');
  const backdrop = document.getElementById('cart-backdrop');
  
  if (!overlay || !backdrop) {
    console.error('❌ Cart overlay elements not found!');
    return;
  }
  
  ensureMobileFooterSpacer();
  
  backdrop.style.display = 'block';
  overlay.style.transform = 'translateX(0)';
  document.body.style.overflow = 'hidden';
  
  renderCartOverlay();
  
  if (window.CartManager && await CartManager.isUserAuthenticated()) {
    console.log('🛒 Syncing cart with API...');
    await CartManager.syncWithAPI();
    renderCartOverlay();
  }
  
  console.log('✅ Cart overlay opened');
}

function closeCartOverlay() {
  console.log('🛒 closeCartOverlay() called');
  
  const overlay = document.getElementById('cart-overlay');
  const backdrop = document.getElementById('cart-backdrop');
  
  if (overlay) overlay.style.transform = 'translateX(100%)';
  if (backdrop) backdrop.style.display = 'none';
  
  document.body.style.overflow = '';
  console.log('✅ Cart overlay closed');
}

function renderCartOverlay() {
  console.log('🛒 renderCartOverlay() called');
  
  const cart = CartManager.getCart();
  const itemsContainer = document.getElementById('cart-overlay-items');
  const emptyState = document.getElementById('cart-overlay-empty');
  const footer = document.getElementById('cart-overlay-footer');
  const countText = document.getElementById('cart-overlay-count-text');
  const footerCount = document.getElementById('cart-footer-count');
  
  if (!itemsContainer || !emptyState || !footer || !countText || !footerCount) {
    console.error('❌ Some cart overlay elements not found');
    return;
  }
  
  countText.textContent = `${cart.length} of 5 items`;
  footerCount.textContent = cart.length;
  
  if (cart.length === 0) {
    emptyState.style.display = 'block';
    itemsContainer.innerHTML = '';
    footer.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  footer.style.display = 'block';
  
  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-overlay-item" onclick="goToCartItem('${item.sku}')" style="display: flex; gap: 16px; cursor: pointer; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
      <div class="cart-overlay-item-image" style="width: 80px; height: 107px; background-color: #f0f0f0; flex-shrink: 0; overflow: hidden;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain; padding: 6px; box-sizing: border-box;">` : ''}
      </div>
      <div class="cart-overlay-item-details" style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding-top: 4px;">
        ${item.brand ? `<div class="cart-overlay-item-brand" style="font-family: 'Urbanist', sans-serif; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${item.brand}</div>` : ''}
        <div class="cart-overlay-item-name" style="font-family: 'Urbanist', sans-serif; font-size: 14px; font-weight: 500; color: #000; line-height: 1.3;">${item.name}</div>
        ${item.size ? `<div class="cart-overlay-item-size" style="font-family: 'Urbanist', sans-serif; font-size: 12px; color: #666;">Size: ${item.size}</div>` : ''}
        <button class="cart-overlay-item-remove" onclick="removeCartOverlayItem(event, ${item.id})" style="background: none; border: none; cursor: pointer; font-family: 'Urbanist', sans-serif; font-size: 11px; color: #999; padding: 0; margin-top: auto; text-align: left; width: fit-content;">Remove</button>
      </div>
    </div>
  `).join('');
  
  console.log('✅ Cart rendered with', cart.length, 'items');
}

function goToCartItem(sku) {
  closeCartOverlay();
  window.location.href = `/product?sku=${encodeURIComponent(sku)}`;
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
  
  console.log('✅ Mobile footer spacer added to cart overlay');
}


// ============================================
// RESERVATION MODAL FUNCTIONS
// ============================================

function openReservationModal() {
  console.log('📋 Opening reservation modal');
  
  const modal = document.getElementById('reservation-modal');
  const backdrop = document.getElementById('reservation-modal-backdrop');
  const itemCount = document.getElementById('reservation-item-count');
  const errorEl = document.getElementById('reservation-error');
  
  if (!modal || !backdrop) {
    console.error('❌ Reservation modal not found');
    return;
  }
  
  const cart = CartManager.getCart();
  if (itemCount) {
    itemCount.textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''} ready to reserve`;
  }
  
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
  
  console.log('✅ Reservation modal opened');
}

function closeReservationModal() {
  console.log('📋 Closing reservation modal');
  
  const modal = document.getElementById('reservation-modal');
  const backdrop = document.getElementById('reservation-modal-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  
  console.log('✅ Reservation modal closed');
}

async function confirmReservation() {
  console.log('📋 Confirming reservation...');
  
  const btn = document.getElementById('confirm-reservation-btn');
  const errorEl = document.getElementById('reservation-error');
  
  if (!btn) return;
  
  btn.disabled = true;
  btn.textContent = 'Creating Reservation...';
  btn.style.opacity = '0.7';
  
  if (errorEl) {
    errorEl.style.display = 'none';
  }
  
  try {
    if (!window.auth0Client) {
      throw new Error('Authentication not available');
    }
    
    const token = await window.auth0Client.getTokenSilently();
    
    console.log('📤 Calling reservation API...');
    
    const cart = CartManager.getCart();
    const clothingItemIds = cart.map(item => item.id);

    console.log('📤 Creating reservation with items:', clothingItemIds);

    const response = await fetch(`${window.API_BASE_URL}/private_clothing_items/reservations`, {
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
      console.error('❌ API Error Response:', errorData);
      
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
    
    const reservation = await response.json();
    console.log('✅ Reservation created:', reservation);
    
    CartManager.clearCart();
    renderCartOverlay();

    closeReservationModal();
    closeCartOverlay();
    
    showReservationSuccess(reservation);
    
  } catch (err) {
    console.error('❌ Reservation error:', err);
    
    if (errorEl) {
      errorEl.textContent = err.message || 'Failed to create reservation. Please try again.';
      errorEl.style.display = 'block';
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm Reservation';
    btn.style.opacity = '1';
  }
}

function showReservationSuccess(reservation) {
  console.log('🎉 Showing success modal');
  
  const modal = document.getElementById('success-modal');
  const backdrop = document.getElementById('success-modal-backdrop');
  const reservationIdEl = document.getElementById('success-reservation-id');
  
  if (!modal || !backdrop) {
    console.warn('Success modal not found, using alert fallback');
    alert(`Reservation confirmed! ID: ${reservation.hash_id || reservation.id}`);
    return;
  }
  
  if (reservationIdEl) {
    reservationIdEl.textContent = reservation.hash_id || reservation.id;
  }
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
}

function closeSuccessModal() {
  console.log('🎉 Closing success modal');
  
  const modal = document.getElementById('success-modal');
  const backdrop = document.getElementById('success-modal-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

window.closeSuccessModal = closeSuccessModal;

async function handleReserveClick() {
  console.log('🛒 Reserve button clicked');
  
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
  console.log('⭐ Opening upgrade modal');
  
  const modal = document.getElementById('upgrade-modal');
  const backdrop = document.getElementById('upgrade-modal-backdrop');
  
  if (!modal || !backdrop) {
    console.error('❌ Upgrade modal not found');
    return;
  }
  
  backdrop.style.display = 'block';
  modal.style.display = 'block';
}

function closeUpgradeModal() {
  console.log('⭐ Closing upgrade modal');
  
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
    console.log('✅ Cart click handler attached');
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
  console.log('🧪 Testing cart overlay...');
  openCartOverlay();
};

window.testReservationModal = function() {
  console.log('🧪 Testing reservation modal...');
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
    console.log('✅ Cart overlay moved to body');
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
        console.log('🛒 Cart icon clicked (backup handler)');
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
      console.log('✅ Backup cart click handler attached');
    }
  }, 1500);
});


// Cart handler - using capture phase for all pages
(function() {
  console.log('🛒 [Site-wide] Cart script starting...');
  
  function setupCart() {
    console.log('🛒 [Site-wide] Setting up cart...');
    
    const backdrop = document.getElementById('cart-backdrop');
    const overlay = document.getElementById('cart-overlay');
    
    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
      console.log('🛒 [Site-wide] Backdrop moved to body');
    }
    if (overlay && overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
      console.log('🛒 [Site-wide] Overlay moved to body');
    }
    
    console.log('🛒 [Site-wide] Cart setup complete');
  }
  
  function handleCartClick(e) {
    const cartTrigger = e.target.closest('[data-cart-trigger]');
    if (cartTrigger) {
      console.log('🛒 [Site-wide] Cart trigger activated!');
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
        console.error('🛒 [Site-wide] openCartOverlay not found!');
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
  console.log('🎫 Membership handler initializing (capture phase)...');
  
  document.addEventListener('click', async function(e) {
    const button = e.target.closest('[data-membership]');
    
    if (!button) return;
    
    console.log('🎫 CAPTURED membership button click!');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const membershipName = button.getAttribute('data-membership');
    console.log('🎫 Membership name:', membershipName);
    
    const API_BASE = window.API_BASE_URL;
    
    if (!window.auth0Client) {
      console.error('🎫 Auth0 not initialized');
      alert('Please wait a moment and try again');
      return;
    }
    
    const isAuthenticated = await window.auth0Client.isAuthenticated();
    console.log('🎫 Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('🎫 Not authenticated, saving action and opening auth modal');
      sessionStorage.setItem('postLoginAction', JSON.stringify({
        type: 'membership_signup',
        membershipName: membershipName
      }));
      openAuthModal();
      return;
    }
    
    const originalHTML = button.innerHTML;
    button.innerHTML = 'Loading...';
    button.style.pointerEvents = 'none';
    button.style.opacity = '0.7';
    
    try {
      const token = await window.auth0Client.getTokenSilently();
      console.log('🎫 Got token, creating checkout session...');
      
      const requestBody = {
        membership_name: membershipName,
        success_url: `${window.location.origin}/welcome-to-dematerialized`,
        cancel_url: `${window.location.origin}/error-membership-signup`
      };
      console.log('🎫 Request body:', requestBody);
      
      const response = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🎫 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🎫 API error:', errorData);
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎫 Checkout URL:', data.checkout_url);
      window.location.href = data.checkout_url;
      
    } catch (error) {
      console.error('🎫 Checkout error:', error);
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
          console.log('🎫 Post-login: triggering membership signup for:', parsed.membershipName);
          sessionStorage.removeItem('postLoginAction');
          
          setTimeout(() => {
            const button = document.querySelector(`[data-membership="${parsed.membershipName}"]`);
            if (button) {
              console.log('🎫 Found button, clicking...');
              button.click();
            } else {
              console.error('🎫 Button not found for:', parsed.membershipName);
            }
          }, 1500);
        }
      }
    } catch (err) {
      console.error('🎫 Post-login check error:', err);
    }
  }
  
  setTimeout(checkPostLoginAction, 1000);
  
  console.log('🎫 Membership handler ready (capture phase)');
})();

// Add safe area styles for iOS
function addSafeAreaStyles() {
  if (document.getElementById('safe-area-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'safe-area-styles';
  style.textContent = `
    #cart-overlay {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    #cart-overlay-footer {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  `;
  document.head.appendChild(style);
  console.log('✅ Safe area styles added');
}

addSafeAreaStyles();


// ============================================
// NAVBAR SCROLL HIDE/SHOW
// ============================================
(function() {
  console.log('🧭 Navbar scroll handler loading...');
  
  let ticking = false;
  const SCROLL_THRESHOLD = 50;
  let navLinksHeight = 0;
  
  function updateNavLinks() {
    const navLinks = document.querySelector('.div-nav-links-wrapper');
    if (!navLinks) {
      console.warn('🧭 .div-nav-links-wrapper not found');
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
      
      console.log('✅ Navbar scroll handler initialized, height:', navLinksHeight);
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
  console.log('🎓 Multi-step onboarding initializing...');
  
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
    console.log('🎓 Opening onboarding modal');
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
    console.log('🎓 Closing onboarding modal');
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.remove('is-visible');
      document.body.classList.remove('onboarding-modal-open');
    }
  };
  
  window.showOnboardingModal = window.openOnboardingModal;
  
  // ===== NAVIGATION =====
  
  window.nextOnboardingStep = function() {
    console.log('🎓 Next step from', currentStep);
    
    // Collect data from current step before advancing
    collectStepData(currentStep);
    
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
      updateProgress();
    }
  };
  
  window.prevOnboardingStep = function() {
    console.log('🎓 Previous step from', currentStep);
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
      updateProgress();
    }
  };
  
  window.skipOnboarding = function() {
    console.log('🎓 Skipping onboarding');
    sessionStorage.setItem('onboarding_modal_dismissed', 'true');
    closeOnboardingModal();
  };
  
  function showStep(step) {
    console.log('🎓 Showing step', step);
    
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
        console.error('🎓 Address search error:', error);
      }
    }, 300);
  };
  
  window.selectOnboardingAddress = function(index) {
    const feature = window._onboardingAddressResults?.[index];
    if (!feature) return;
    
    const props = feature.properties;
    console.log('🎓 Selected address properties:', props);
    
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
    
    console.log('🎓 Parsed address - Street:', street, 'House:', houseNumber, 'Postcode:', props.postcode, 'City:', props.city);
    
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
        console.log('🎓 Collected name:', formData.firstName, formData.lastName);
        break;
        
      case 3: // Contact & Address
        formData.phoneNumber = document.getElementById('onboarding-phone')?.value || '';
        formData.addressStreet = document.getElementById('onboarding-street')?.value || '';
        formData.addressHouseNumber = document.getElementById('onboarding-house-number')?.value || '';
        formData.addressUnit = document.getElementById('onboarding-unit')?.value || '';
        formData.addressZipcode = document.getElementById('onboarding-zipcode')?.value || '';
        formData.addressCity = document.getElementById('onboarding-city')?.value || '';
        console.log('🎓 Collected contact/address:', formData.phoneNumber, formData.addressCity);
        break;
        
      case 4: // Birthday
        formData.dateOfBirth = document.getElementById('onboarding-birthday')?.value || '';
        console.log('🎓 Collected birthday:', formData.dateOfBirth);
        break;
        
      case 5: // Size profile
        formData.heightCm = document.getElementById('onboarding-height')?.value || '';
        formData.preferredFit = document.getElementById('onboarding-preferred-fit')?.value || '';
        formData.shirtSize = document.getElementById('onboarding-shirt-size')?.value || '';
        formData.pantsSize = document.getElementById('onboarding-pants-size')?.value || '';
        formData.shoeSize = document.getElementById('onboarding-shoe-size')?.value || '';
        console.log('🎓 Collected sizes:', formData.heightCm, formData.shirtSize);
        break;
        
      case 6: // Body type
        const selectedBodyType = document.querySelector('.body-type-option.selected');
        formData.bodyType = selectedBodyType?.getAttribute('data-body-type') || '';
        console.log('🎓 Collected body type:', formData.bodyType);
        break;
        
      case 7: // Referral sources
        formData.referralSources = Array.from(document.querySelectorAll('.checkbox-option input:checked'))
          .map(el => el.value);
        console.log('🎓 Collected referral sources:', formData.referralSources);
        break;
    }
  }
  
  // ===== SUBMIT =====
  
  window.submitOnboarding = async function() {
    console.log('🎓 Submitting onboarding data...');
    
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
      
      console.log('🎓 Sending payload:', payload);
      
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
        console.error('🎓 API error:', errorData);
        // Don't block the user, just log the error and continue
        console.warn('🎓 Profile update failed, but continuing to completion');
      } else {
        console.log('🎓 Profile updated successfully');
      }
      
      // Move to completion step regardless
      currentStep = 8;
      showStep(8);
      updateProgress();
      
    } catch (error) {
      console.error('🎓 Submit error:', error);
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
    console.log('🎓 Completing onboarding');
    sessionStorage.setItem('onboarding_completed', 'true');
    closeOnboardingModal();
    
    // Redirect to rentals page
    window.location.href = '/rentals';
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
  
  console.log('🎓 Multi-step onboarding ready');
})();
