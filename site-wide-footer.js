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

// ===== ONBOARDING MODAL FUNCTIONS =====
function openOnboardingModal() {
  console.log("🎓 openOnboardingModal() CALLED!");
  
  const modal = document.getElementById('onboardingModal');
  if (!modal) {
    console.error("❌ Onboarding modal not found!");
    return;
  }
  
  modal.classList.add('is-visible');
  document.body.classList.add('onboarding-modal-open');
  console.log("✅ Onboarding modal opened");
}

function closeOnboardingModal() {
  console.log("🔒 closeOnboardingModal() called");
  
  const modal = document.getElementById('onboardingModal');
  if (!modal) return;
  
  modal.classList.remove('is-visible');
  document.body.classList.remove('onboarding-modal-open');
  console.log("✅ Onboarding modal closed");
}

// Make functions globally accessible
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.openOnboardingModal = openOnboardingModal;
window.closeOnboardingModal = closeOnboardingModal;

console.log("✅ Modal functions registered on window object");

// Wait for DOM and connect all controls
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
    
    // ===== ONBOARDING MODAL CONTROLS =====
    
    // "I'll do this later" button
    const onboardingLaterBtn = document.getElementById('onboarding-later-btn');
    if (onboardingLaterBtn) {
      onboardingLaterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.setItem('onboarding_modal_dismissed', 'true');  // ADD THIS
        closeOnboardingModal();
      });
    }
    
    console.log("✅ All modal controls connected");
  }, 500); // Wait for auth0Client to initialize
});

// Escape key handling for both modals
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const authModal = document.getElementById('authModal');
    const onboardingModal = document.getElementById('onboardingModal');
    
    if (authModal && authModal.classList.contains('is-visible')) {
      console.log("⎋ Escape pressed - closing auth modal");
      closeAuthModal();
    }
    
    if (onboardingModal && onboardingModal.classList.contains('is-visible')) {
      console.log("⎋ Escape pressed - closing onboarding modal");
      closeOnboardingModal();
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
  openOnboardingModal();
};

console.log("✅ All modal scripts loaded successfully!");


// NEW: Added by Courtney on 25/11/25
console.log("🔐 Auth UI controller loading...");

// Function to update UI based on authentication state
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

// Make it globally accessible so your auth.js can call it
window.updateAuthUI = updateAuthUI;

console.log("✅ Auth UI controller ready");


// ============================================
// CART UTILITIES (API + sessionStorage hybrid)
// ============================================
window.CartManager = {
  STORAGE_KEY: 'dematerialized_cart',
  MAX_ITEMS: 10,
  API_BASE: window.API_BASE_URL,
  _syncing: false,
  _initialized: false,
  
  // ========== INITIALIZATION ==========
  
  // Initialize cart - call this on page load
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
  
  // Fetch cart from API
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
      
      // Handle response format - adjust if needed
      return Array.isArray(data) ? data : (data.items || data.clothing_items || []);
    } catch (err) {
      console.error('🛒 [Cart] API fetch error:', err);
      return null;
    }
  },
  
  // Add item to API
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
  
  // Remove item from API
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
  
  // Sync sessionStorage with API (merge strategy)
  async syncWithAPI() {
    if (this._syncing) return;
    this._syncing = true;
    
    try {
      // Get both sources
      const localCart = this.getLocalCart();
      const apiCart = await this.fetchAPICart();
      
      if (apiCart === null) {
        console.log('🛒 [Cart] Could not fetch API cart, keeping local');
        this._syncing = false;
        return;
      }
      
      // Build merged cart
      const mergedMap = new Map();
      
    // Add API items first (these are authoritative)
    apiCart.forEach(item => {
      // Extract front image from images array
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
      
      // Find local items not in API (need to upload)
      const localOnlyItems = localCart.filter(
        localItem => !apiCart.some(apiItem => apiItem.id === localItem.id)
      );
      
      // Upload local-only items to API (respecting max limit)
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
      
      // Save merged cart to sessionStorage
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
  
  // Get all cart items
  getCart() {
    return this.getLocalCart();
  },
  
  // Get cart count
  getCartCount() {
    return this.getLocalCart().length;
  },
  
  // Check if item is in cart
  isInCart(itemId) {
    const cart = this.getLocalCart();
    return cart.some(item => item.id === itemId);
  },
  
  // Add item to cart
  async addToCart(item) {
    const cart = this.getLocalCart();
    
    // Check max limit
    if (cart.length >= this.MAX_ITEMS) {
      console.warn('Cart is full (max 10 items)');
      return { success: false, reason: 'max_items' };
    }
    
    // Check if already in cart
    if (this.isInCart(item.id)) {
      console.warn('Item already in cart');
      return { success: false, reason: 'already_in_cart' };
    }
    
    // If authenticated, add to API first
    const isAuth = await this.isUserAuthenticated();
    if (isAuth) {
      const apiSuccess = await this.addToAPI(item.id);
      if (!apiSuccess) {
        console.error('🛒 [Cart] Failed to add to API');
        // Continue anyway to add to local storage
      }
    }
    
    // Add item to local storage
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
  
  // Remove item from cart
  async removeFromCart(itemId) {
    let cart = this.getLocalCart();
    const initialLength = cart.length;
    cart = cart.filter(item => item.id !== itemId);
    
    if (cart.length < initialLength) {
      // If authenticated, remove from API too
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
  
  // Clear entire cart (local only - for after reservation)
  clearCart() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadge();
    console.log('✅ Cart cleared');
  },
  
  // Update cart badge in navbar
  updateCartBadge() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll('[data-cart-count]');
    
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// Initialize cart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  CartManager.init();
});

// ============================================
// USER MEMBERSHIP HELPER
// ============================================
window.UserMembership = {
  _cache: null,
  _cacheTime: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  API_BASE: window.API_BASE_URL,
  
  PREMIUM_ID: 6,
  BASIC_ID: 7,
  
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
  
  async isPremium() {
    const membershipId = await this.getMembershipId();
    return membershipId === this.PREMIUM_ID;
  },
  
  async isBasic() {
    const membershipId = await this.getMembershipId();
    return membershipId === this.BASIC_ID;
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
// CART OVERLAY FUNCTIONS (updated for async API)
// ============================================

async function openCartOverlay() {
  console.log('🛒 openCartOverlay() called');
  
  const overlay = document.getElementById('cart-overlay');
  const backdrop = document.getElementById('cart-backdrop');
  
  if (!overlay || !backdrop) {
    console.error('❌ Cart overlay elements not found!');
    return;
  }
  
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
  
  countText.textContent = `${cart.length} of 10 items`;
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
  
  // Update item count
  const cart = CartManager.getCart();
  if (itemCount) {
    itemCount.textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''} ready to reserve`;
  }
  
  // Hide any previous errors
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
  
  // Show modal
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
  
  // Disable button and show loading
  btn.disabled = true;
  btn.textContent = 'Creating Reservation...';
  btn.style.opacity = '0.7';
  
  // Hide previous errors
  if (errorEl) {
    errorEl.style.display = 'none';
  }
  
  try {
    // Get auth token
    if (!window.auth0Client) {
      throw new Error('Authentication not available');
    }
    
    const token = await window.auth0Client.getTokenSilently();
    
    console.log('📤 Calling reservation API...');
    
  // Get item IDs from cart
  const cart = CartManager.getCart();
  const clothingItemIds = cart.map(item => item.id);

  console.log('📤 Creating reservation with items:', clothingItemIds);

  // Create reservation via API
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
    
    // Handle different error formats
    let errorMessage = `Reservation failed (${response.status})`;
    
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
      // Handle nested error objects (e.g., { detail: { message: "..." } })
      errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
    } else if (typeof errorData.message === 'string') {
      errorMessage = errorData.message;
    } else if (Array.isArray(errorData.detail)) {
      // Handle validation errors array (FastAPI format)
      errorMessage = errorData.detail.map(e => e.msg || e.message || String(e)).join(', ');
    }
    
    throw new Error(errorMessage);
  }
    
    const reservation = await response.json();
    console.log('✅ Reservation created:', reservation);
    
// Clear the cart (both local and we don't need to clear API since items are now reserved)
CartManager.clearCart();
renderCartOverlay(); // Re-render to show empty state

// Close modals
closeReservationModal();
closeCartOverlay();
    
    // Show success - you could redirect to a confirmation page instead
    showReservationSuccess(reservation);
    
  } catch (err) {
    console.error('❌ Reservation error:', err);
    
    // Show error in modal
    if (errorEl) {
      errorEl.textContent = err.message || 'Failed to create reservation. Please try again.';
      errorEl.style.display = 'block';
    }
  } finally {
    // Re-enable button
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

// Updated handleReserveClick - checks membership before showing confirmation modal
async function handleReserveClick() {
  console.log('🛒 Reserve button clicked');
  
  if (!window.auth0Client) {
    console.error('Auth0 not initialized');
    return;
  }
  
  const isAuthenticated = await window.auth0Client.isAuthenticated();
  
  if (!isAuthenticated) {
    // User needs to log in first
    closeCartOverlay();
    openAuthModal();
    return;
  }
  
  // Check if user has Premium membership
  const canReserve = await UserMembership.canReserveOnline();
  
  if (!canReserve) {
    // Show upgrade modal for Basic members
    console.log('⭐ User is not Premium, showing upgrade modal');
    openUpgradeModal();
    return;
  }
  
  // User is Premium - show confirmation modal
  openReservationModal();
}

// Make functions globally accessible
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
    // Close upgrade modal first if open
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal && upgradeModal.style.display === 'block') {
      closeUpgradeModal();
      return;
    }
    
    // Close reservation modal if open
    const reservationModal = document.getElementById('reservation-modal');
    if (reservationModal && reservationModal.style.display === 'block') {
      closeReservationModal();
      return;
    }
    
    // Then check cart overlay
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

// Move cart overlay to body (keep your existing code)
function moveCartToBody() {
  const backdrop = document.getElementById('cart-backdrop');
  const overlay = document.getElementById('cart-overlay');
  
  if (backdrop && backdrop.parentElement !== document.body) {
    document.body.appendChild(backdrop);
  }
  if (overlay && overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }
  
  // Also move reservation modal
  const resBackdrop = document.getElementById('reservation-modal-backdrop');
  const resModal = document.getElementById('reservation-modal');
  
  if (resBackdrop && resBackdrop.parentElement !== document.body) {
    document.body.appendChild(resBackdrop);
  }
  if (resModal && resModal.parentElement !== document.body) {
    document.body.appendChild(resModal);
  }
  // Also move reservation detail modal
const detailBackdrop = document.getElementById('reservation-detail-backdrop');
const detailModal = document.getElementById('reservation-detail-modal');

if (detailBackdrop && detailBackdrop.parentElement !== document.body) {
  document.body.appendChild(detailBackdrop);
}
if (detailModal && detailModal.parentElement !== document.body) {
  document.body.appendChild(detailModal);
}
  // Also move upgrade modal
  const upgradeBackdrop = document.getElementById('upgrade-modal-backdrop');
  const upgradeModal = document.getElementById('upgrade-modal');
  
  if (upgradeBackdrop && upgradeBackdrop.parentElement !== document.body) {
    document.body.appendChild(upgradeBackdrop);
  }
  if (upgradeModal && upgradeModal.parentElement !== document.body) {
    document.body.appendChild(upgradeModal);
  }
  
  if (backdrop && overlay) {
    console.log('✅ Cart overlay moved to body');
    return true;
  }
// Also move success modal
const successBackdrop = document.getElementById('success-modal-backdrop');
const successModal = document.getElementById('success-modal');

if (successBackdrop && successBackdrop.parentElement !== document.body) {
  document.body.appendChild(successBackdrop);
}
if (successModal && successModal.parentElement !== document.body) {
  document.body.appendChild(successModal);
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

// Backup click handler (keep your existing code)
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
    
    // Move cart to body
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
      
      // Ensure cart is in body
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
  
  // Use capture phase for both click and touch
  document.addEventListener('click', handleCartClick, true);
  document.addEventListener('touchend', handleCartClick, true);
  
  // Run setup at multiple times
  setTimeout(setupCart, 100);
  setTimeout(setupCart, 500);
  setTimeout(setupCart, 1500);
  window.addEventListener('load', function() {
    setTimeout(setupCart, 500);
  });
})();

(function() {
  const redirectMap = {
    '/profile': '/account#profile',
    '/profile.html': '/account#profile',
    '/my-rentals': '/account#rentals',
    '/my-rentals.html': '/account#rentals',
    '/reservations': '/account#reservations',
    '/reservations.html': '/account#reservations',
    '/donations-credits': '/account#donations',
    '/donations-credits.html': '/account#donations',
    '/purchases': '/account#purchases',
    '/purchases.html': '/account#purchases',
    '/my-membership': '/account#membership',
    '/my-membership.html': '/account#membership'
  };
  
  const path = window.location.pathname;
  
  if (redirectMap[path]) {
    console.log('📱 [Account] Redirecting to unified account page...');
    window.location.replace(redirectMap[path]);
  }
})();

// Membership signup handler
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎫 Membership script loading...');
  
  const API_BASE = window.API_BASE_URL;

  const buttons = document.querySelectorAll('[data-membership]');
  console.log('🎫 Found membership buttons:', buttons.length);
    
  buttons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('🎫 Button clicked:', this.getAttribute('data-membership'));
      
      if (!window.auth0Client) {
        console.error('🎫 Auth0 not initialized yet');
        alert('Please wait a moment and try again');
        return;
      }
      
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      
      if (!isAuthenticated) {
        sessionStorage.setItem('postLoginAction', JSON.stringify({
          type: 'membership_signup',
          membership: this.getAttribute('data-membership')
        }));
        openAuthModal();
        return;
      }
      
      const membershipName = this.getAttribute('data-membership');
      
      if (!membershipName) {
        console.error('🎫 No membership name found');
        return;
      }
      
      const originalText = this.textContent;
      this.textContent = 'Loading...';
      this.style.pointerEvents = 'none';
      
      try {
        const token = await window.auth0Client.getTokenSilently();
        
        const response = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            membership_name: membershipName,
            success_url: `${window.location.origin}/welcome-to-dematerialized`,
            cancel_url: `${window.location.origin}/error-membership-signup`
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }
        
        const data = await response.json();
        window.location.href = data.checkout_url;
        
      } catch (error) {
        console.error('🎫 Checkout error:', error);
        alert('Something went wrong. Please try again.');
        this.textContent = originalText;
        this.style.pointerEvents = 'auto';
      }
    });
  });
  // Handle post-login redirect
  async function checkPostLoginAction() {
    if (!window.auth0Client) {
      setTimeout(checkPostLoginAction, 500);
      return;
    }
    
    const action = sessionStorage.getItem('postLoginAction');
    if (action) {
      const parsed = JSON.parse(action);
      if (parsed.type === 'membership_signup') {
        sessionStorage.removeItem('postLoginAction');
        const button = document.querySelector(`[data-membership="${parsed.membership}"]`);
        if (button) {
          setTimeout(() => button.click(), 500);
        }
      }
    }
  }
  
  checkPostLoginAction();
  console.log('🎫 Membership script loaded');
});
