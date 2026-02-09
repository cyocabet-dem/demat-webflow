// ============================================
// PURCHASE CART - SITE-WIDE
// Add to Site Footer Code (or host on GitHub)
// ============================================

window.PurchaseCart = {
  API_BASE: window.API_BASE_URL,
  _items: [],
  _isCheckingOut: false,

  init() {
    // Load cart from localStorage
    const saved = localStorage.getItem('demat_purchase_cart');
    if (saved) {
      try {
        this._items = JSON.parse(saved);
        console.log('🛒 Cart loaded:', this._items.length, 'items');
      } catch (e) {
        this._items = [];
      }
    }
    this.updateCartBadge();
    this.injectCartStyles();
  },

  save() {
    localStorage.setItem('demat_purchase_cart', JSON.stringify(this._items));
    this.updateCartBadge();
  },

  // Check if item is in cart
  hasItem(clothingItemId) {
    return this._items.some(item => item.clothing_item_id === clothingItemId);
  },

  // Add item to cart
  addItem(item) {
    if (this.hasItem(item.clothing_item_id)) {
      console.log('🛒 Item already in cart:', item.name);
      return;
    }
    this._items.push(item);
    this.save();
    console.log('🛒 Added to cart:', item.name);
    this.showAddedToast(item.name);
  },

  // Remove item from cart
  removeItem(clothingItemId) {
    const index = this._items.findIndex(item => item.clothing_item_id === clothingItemId);
    if (index > -1) {
      const removed = this._items.splice(index, 1)[0];
      this.save();
      console.log('🛒 Removed from cart:', removed.name);
    }
  },

  // Clear cart
  clear() {
    this._items = [];
    this.save();
    console.log('🛒 Cart cleared');
  },

  // Get cart items
  getItems() {
    return [...this._items];
  },

  // Get cart total (purchase prices)
  getTotal() {
    return this._items.reduce((sum, item) => sum + (item.purchase_price_cents || 0), 0);
  },

  // Format price
  formatPrice(cents) {
    if (cents === null || cents === undefined) return '€0,00';
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  },

  // Update cart badge in navbar
  updateCartBadge() {
    const badge = document.getElementById('purchase-cart-badge');
    const navItem = document.getElementById('purchase-cart-nav');
    const count = this._items.length;
    
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (navItem) {
      navItem.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  // Show toast notification
  showAddedToast(itemName) {
    // Remove existing toast
    const existing = document.getElementById('cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Added to cart</span>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('cart-toast-visible'), 10);

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('cart-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // Toggle cart panel (slide in from left)
  toggleCartDropdown() {
    const panel = document.getElementById('purchase-cart-panel');
    const backdrop = document.getElementById('purchase-cart-backdrop');
    
    if (!panel || !backdrop) {
      this.createCartPanel();
      return;
    }

    const isOpen = panel.classList.contains('cart-panel-open');
    if (isOpen) {
      this.closeCartPanel();
    } else {
      this.openCartPanel();
    }
  },

  createCartPanel() {
    // Create backdrop
    let backdrop = document.getElementById('purchase-cart-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'purchase-cart-backdrop';
      backdrop.className = 'cart-panel-backdrop';
      backdrop.onclick = () => this.closeCartPanel();
      document.body.appendChild(backdrop);
    }

    // Create panel
    let panel = document.getElementById('purchase-cart-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'purchase-cart-panel';
      panel.className = 'cart-panel';
      document.body.appendChild(panel);
    }

    this.renderCartPanel();
    this.openCartPanel();
  },

  openCartPanel() {
    const panel = document.getElementById('purchase-cart-panel');
    const backdrop = document.getElementById('purchase-cart-backdrop');
    
    this.renderCartPanel();
    
    if (backdrop) backdrop.classList.add('cart-panel-backdrop-open');
    if (panel) panel.classList.add('cart-panel-open');
    document.body.style.overflow = 'hidden';
  },

  closeCartPanel() {
    const panel = document.getElementById('purchase-cart-panel');
    const backdrop = document.getElementById('purchase-cart-backdrop');
    
    if (panel) panel.classList.remove('cart-panel-open');
    if (backdrop) backdrop.classList.remove('cart-panel-backdrop-open');
    document.body.style.overflow = '';
  },

  // Render cart panel content
  renderCartPanel() {
    const panel = document.getElementById('purchase-cart-panel');
    if (!panel) return;

    if (this._items.length === 0) {
      panel.innerHTML = `
        <div class="cart-panel-header">
          <span class="cart-panel-title">your cart</span>
          <button onclick="PurchaseCart.closeCartPanel()" class="cart-panel-close">&times;</button>
        </div>
        <div class="cart-panel-empty">
          <p>your cart is empty</p>
        </div>
      `;
      return;
    }

    const itemsHtml = this._items.map(item => `
      <div class="cart-panel-item">
        <div class="cart-panel-item-image">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        </div>
        <div class="cart-panel-item-info">
          <div class="cart-panel-item-name">${item.name?.toLowerCase() || 'item'}</div>
          <div class="cart-panel-item-price">${this.formatPrice(item.purchase_price_cents)}</div>
        </div>
        <button onclick="PurchaseCart.removeItem(${item.clothing_item_id}); PurchaseCart.renderCartPanel(); if(window.RentalsManager) RentalsManager.renderRentalsPage();" class="cart-panel-item-remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('');

    panel.innerHTML = `
      <div class="cart-panel-header">
        <span class="cart-panel-title">your cart (${this._items.length})</span>
        <button onclick="PurchaseCart.closeCartPanel()" class="cart-panel-close">&times;</button>
      </div>
      <div class="cart-panel-items">
        ${itemsHtml}
      </div>
      <div class="cart-panel-footer">
        <div class="cart-panel-total">
          <span>total</span>
          <span>${this.formatPrice(this.getTotal())}</span>
        </div>
        <button onclick="PurchaseCart.openCheckoutModal()" class="cart-panel-checkout-btn">
          checkout
        </button>
      </div>
    `;
  },

  // Render cart dropdown (legacy - redirect to panel)
  renderDropdown() {
    this.renderCartPanel();
  },

  // Open checkout modal
  async openCheckoutModal() {
    // Close cart panel
    this.closeCartPanel();

    // Create modal if it doesn't exist
    let modal = document.getElementById('checkout-modal');
    let backdrop = document.getElementById('checkout-modal-backdrop');

    if (!modal) {
      backdrop = document.createElement('div');
      backdrop.id = 'checkout-modal-backdrop';
      backdrop.className = 'checkout-modal-backdrop';
      backdrop.onclick = () => this.closeCheckoutModal();
      document.body.appendChild(backdrop);

      modal = document.createElement('div');
      modal.id = 'checkout-modal';
      modal.className = 'checkout-modal';
      document.body.appendChild(modal);
    }

    // Show modal first with loading state
    backdrop.classList.add('checkout-modal-backdrop-open');
    modal.classList.add('checkout-modal-open');
    document.body.style.overflow = 'hidden';

    // Render content (fetches credit balance)
    await this.renderCheckoutModal();
  },

  // Close checkout modal
  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const backdrop = document.getElementById('checkout-modal-backdrop');

    if (modal) modal.classList.remove('checkout-modal-open');
    if (backdrop) backdrop.classList.remove('checkout-modal-backdrop-open');
    document.body.style.overflow = '';
  },

  // Fetch user's store credit balance
  async fetchCreditBalance() {
    try {
      if (!window.auth0Client) {
        console.log('👛 No auth0Client');
        return 0;
      }
      
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        console.log('👛 Not authenticated');
        return 0;
      }
      
      const token = await window.auth0Client.getTokenSilently();
      const apiBase = this.getApiBase();
      const url = `${apiBase}/private_clothing_items/donation_session/`;
      console.log('👛 Fetching credits from:', url);
      
      // Credit balance comes from the donation sessions endpoint
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('👛 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('👛 Credit balance cents:', data.credit_balance_cents);
        return data.credit_balance_cents || 0;
      } else {
        console.error('👛 Failed to fetch credits:', response.status);
      }
    } catch (err) {
      console.error('👛 Error fetching credit balance:', err);
    }
    return 0;
  },

  async renderCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    const items = this.getItems();
    const subtotal = this.getTotal();
    
    // Fetch credit balance
    const creditBalance = await this.fetchCreditBalance();
    const creditsToApply = Math.min(creditBalance, subtotal);
    const finalTotal = Math.max(0, subtotal - creditsToApply);

    const itemsHtml = items.map(item => `
      <div class="checkout-item">
        <div class="checkout-item-image">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        </div>
        <div class="checkout-item-details">
          <div class="checkout-item-name">${item.name?.toLowerCase() || 'item'}</div>
        </div>
        <div class="checkout-item-prices">
          <span class="checkout-item-original">${this.formatPrice(item.retail_price_cents)}</span>
          <span class="checkout-item-final">${this.formatPrice(item.purchase_price_cents)}</span>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="checkout-modal-container">
        <div class="checkout-modal-header">
          <h2>checkout</h2>
          <button onclick="PurchaseCart.closeCheckoutModal()" class="checkout-modal-close">&times;</button>
        </div>
        
        <div class="checkout-modal-body">
          <div class="checkout-section">
            <div class="checkout-section-title">items (${items.length})</div>
            <div class="checkout-items">
              ${itemsHtml}
            </div>
          </div>
          
          <div class="checkout-summary">
            <div class="checkout-summary-row">
              <span>subtotal (50% off)</span>
              <span>${this.formatPrice(subtotal)}</span>
            </div>
            <div class="checkout-summary-row">
              <span>your store credits</span>
              <span>${this.formatPrice(creditBalance)}</span>
            </div>
            ${creditsToApply > 0 ? `
              <div class="checkout-summary-row checkout-credits-applied">
                <span>credits applied</span>
                <span>-${this.formatPrice(creditsToApply)}</span>
              </div>
            ` : ''}
            <div class="checkout-summary-row checkout-summary-total">
              <span>total</span>
              <span>${this.formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
        
        <div class="checkout-modal-footer">
          <p class="checkout-info">${finalTotal > 0 ? "by clicking 'complete purchase' you will be redirected to our payment provider." : 'your credits cover this purchase!'}</p>
          <button onclick="PurchaseCart.processCheckout()" class="checkout-submit-btn" id="checkout-submit-btn">
            complete purchase
          </button>
        </div>
      </div>
    `;
  },

  // Get API base URL with fallback
  getApiBase() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    if (this.API_BASE) return this.API_BASE;
    
    // Fallback based on hostname
    const hostname = window.location.hostname;
    const isProduction = hostname === 'dematerialized.nl' || hostname === 'www.dematerialized.nl';
    return isProduction ? 'https://api.dematerialized.nl' : 'https://test-api.dematerialized.nl';
  },

  // Process checkout
  async processCheckout() {
    if (this._isCheckingOut) return;
    this._isCheckingOut = true;

    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="checkout-spinner"></span> processing...';
    }

    try {
      if (!window.auth0Client) {
        throw new Error('Authentication required');
      }

      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Please sign in to complete your purchase');
      }

      const token = await window.auth0Client.getTokenSilently();
      const items = this.getItems();
      const apiBase = this.getApiBase();

      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Step 1: Create the order
      console.log('🛒 Creating order...');
      const orderResponse = await fetch(`${apiBase}/private_clothing_items/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          clothing_item_ids: items.map(item => item.clothing_item_id),
          shipping_address: '',  // Not needed for rental purchases (pickup)
          order_type: 'purchase'
        })
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('🛒 Order creation error response:', errorText);
        let errorDetail = 'Failed to create order';
        try {
          const errorData = JSON.parse(errorText);
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
          // Response wasn't JSON
        }
        throw new Error(errorDetail);
      }

      const order = await orderResponse.json();
      console.log('🛒 Order created:', order);
      console.log('🛒 Order ID for checkout:', order.id);

      // Check if fully paid by credits
      if (order.total_amount_in_cents === 0 || order.payment_status === 'paid') {
        // Order complete! Clear cart and show success
        this.clear();
        this.closeCheckoutModal();
        this.showSuccessMessage(order);
        return;
      }

      // Step 2: Need to pay remaining balance via Stripe
      console.log('🛒 Creating Stripe checkout session...');
      const checkoutResponse = await fetch(`${apiBase}/private_clothing_items/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text();
        console.error('🛒 Checkout error response:', errorText);
        let errorDetail = 'Failed to create checkout session';
        try {
          const errorData = JSON.parse(errorText);
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
          // Response wasn't JSON
        }
        throw new Error(errorDetail);
      }

      const checkoutData = await checkoutResponse.json();
      console.log('🛒 Checkout session created:', checkoutData);
      console.log('🛒 Checkout URL:', checkoutData.checkout_url);

      // Clear cart before redirecting
      this.clear();

      // Redirect to Stripe - check multiple possible field names
      const redirectUrl = checkoutData.checkout_url || checkoutData.url || checkoutData.session_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error('🛒 No checkout URL in response. Full response:', checkoutData);
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      
      // Extract error message properly
      let errorMessage = 'Something went wrong. Please try again.';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      }
      
      alert(errorMessage);
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'complete purchase';
      }
    } finally {
      this._isCheckingOut = false;
    }
  },

  // Show success message
  showSuccessMessage(order) {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    const creditsApplied = order.credits_applied_cents || 0;

    modal.innerHTML = `
      <div class="checkout-modal-container">
        <div class="checkout-success">
          <div class="checkout-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16 10 10.5 15.5 8 13"></polyline>
            </svg>
          </div>
          <h2>purchase successful!</h2>
          <p>you can view your purchase history in your account.</p>
          ${creditsApplied > 0 ? `
            <div class="checkout-success-credits">
              <span>${this.formatPrice(creditsApplied)} in store credits applied</span>
            </div>
          ` : ''}
          <div class="checkout-success-actions">
            <a href="/purchases" class="checkout-success-btn">view my purchases</a>
            <button onclick="PurchaseCart.closeCheckoutModal(); window.location.reload();" class="checkout-success-btn-secondary">continue browsing</button>
          </div>
        </div>
      </div>
    `;
  },

  // Inject CSS styles
  injectCartStyles() {
    if (document.getElementById('purchase-cart-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'purchase-cart-styles';
    styles.textContent = `
      :root {
        --cart-purple: #4b073f;
        --cart-purple-dark: #3a052f;
        --cart-pink: #a92296;
        --cart-gray-dark: #24282d;
        --cart-gray-medium: #46535e;
        --cart-gray-light: #ced5da;
        --cart-gray-bg: #f6f8f9;
        --cart-pink-light: #fff4fe;
        --cart-navy: #04314d;
      }

      /* Toast */
      .cart-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--cart-purple);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .cart-toast-visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      /* Cart Nav */
      #purchase-cart-nav {
        position: relative;
        display: none;
        align-items: center;
      }
      .purchase-cart-toggle {
        position: relative;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: var(--cart-gray-dark);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .purchase-cart-toggle:hover {
        color: var(--cart-purple);
      }
      #purchase-cart-badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--cart-pink);
        color: white;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }

      /* Cart Panel Backdrop */
      .cart-panel-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .cart-panel-backdrop-open {
        opacity: 1;
        visibility: visible;
      }

      /* Cart Panel - Slide from Right */
      .cart-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 380px;
        max-width: 100%;
        background: white;
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: column;
        box-shadow: -4px 0 24px rgba(0,0,0,0.12);
      }
      .cart-panel-open {
        transform: translateX(0);
      }

      .cart-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--cart-gray-light);
      }
      .cart-panel-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--cart-gray-dark);
      }
      .cart-panel-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: var(--cart-gray-medium);
        line-height: 1;
        padding: 0;
      }
      .cart-panel-close:hover {
        color: var(--cart-gray-dark);
      }

      .cart-panel-items {
        flex: 1;
        overflow-y: auto;
        padding: 16px 24px;
      }
      .cart-panel-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid var(--cart-gray-bg);
      }
      .cart-panel-item:last-child {
        border-bottom: none;
      }
      .cart-panel-item-image {
        width: 70px;
        height: 90px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--cart-gray-bg);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }
      .cart-panel-item-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .cart-panel-item-info {
        flex: 1;
        min-width: 0;
      }
      .cart-panel-item-name {
        font-size: 18px;
        font-weight: 500;
        color: var(--cart-gray-dark);
        margin-bottom: 4px;
      }
      .cart-panel-item-price {
        font-size: 18px;
        color: var(--cart-pink);
        font-weight: 600;
      }
      .cart-panel-item-remove {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: var(--cart-gray-medium);
        opacity: 0.6;
        flex-shrink: 0;
      }
      .cart-panel-item-remove:hover {
        opacity: 1;
        color: var(--cart-gray-dark);
      }

      .cart-panel-footer {
        padding: 20px 24px;
        background: var(--cart-gray-bg);
        border-top: 1px solid var(--cart-gray-light);
      }
      .cart-panel-total {
        display: flex;
        justify-content: space-between;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--cart-gray-dark);
      }
      .cart-panel-checkout-btn {
        width: 100%;
        padding: 16px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .cart-panel-checkout-btn:hover {
        background: var(--cart-purple-dark);
      }

      .cart-panel-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        color: var(--cart-gray-medium);
        font-size: 18px;
      }

      /* Mobile - Full screen cart */
      @media (max-width: 600px) {
        .cart-panel {
          width: 100%;
        }
      }


      /* Checkout Modal */
      .checkout-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .checkout-modal-backdrop-open {
        opacity: 1;
        visibility: visible;
      }
      .checkout-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow: hidden;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
      }
      .checkout-modal-open {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }
      .checkout-modal-container {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
      }
      .checkout-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--cart-gray-light);
      }
      .checkout-modal-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--cart-gray-dark);
      }
      .checkout-modal-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: var(--cart-gray-medium);
        line-height: 1;
        padding: 0;
      }
      .checkout-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      .checkout-section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--cart-gray-medium);
        margin-bottom: 16px;
      }
      .checkout-items {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }
      .checkout-item {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .checkout-item-image {
        width: 70px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--cart-gray-bg);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }
      .checkout-item-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .checkout-item-details {
        flex: 1;
        min-width: 0;
      }
      .checkout-item-name {
        font-size: 18px;
        font-weight: 500;
        color: var(--cart-gray-dark);
      }
      .checkout-item-prices {
        text-align: right;
      }
      .checkout-item-original {
        display: block;
        font-size: 16px;
        color: var(--cart-gray-medium);
        text-decoration: line-through;
      }
      .checkout-item-final {
        font-size: 18px;
        font-weight: 600;
        color: var(--cart-pink);
      }
      .checkout-summary {
        background: var(--cart-gray-bg);
        border-radius: 12px;
        padding: 20px;
      }
      .checkout-summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 18px;
        color: var(--cart-gray-dark);
      }
      .checkout-summary-row:last-child {
        margin-bottom: 0;
      }
      .checkout-credits-applied {
        color: var(--cart-pink);
      }
      .checkout-summary-total {
        font-weight: 600;
        font-size: 20px;
        padding-top: 12px;
        border-top: 1px solid var(--cart-gray-light);
        margin-top: 12px;
      }
      .checkout-modal-footer {
        padding: 20px 24px;
        border-top: 1px solid var(--cart-gray-light);
        background: var(--cart-gray-bg);
      }
      .checkout-info {
        font-size: 14px;
        color: var(--cart-gray-medium);
        margin: 0 0 16px 0;
        text-align: center;
      }
      .checkout-submit-btn {
        width: 100%;
        padding: 16px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .checkout-submit-btn:hover:not(:disabled) {
        background: var(--cart-purple-dark);
      }
      .checkout-submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .checkout-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Success State */
      .checkout-success {
        padding: 48px 24px;
        text-align: center;
      }
      .checkout-success-icon {
        color: #16a34a;
        margin-bottom: 16px;
      }
      .checkout-success h2 {
        margin: 0 0 8px 0;
        font-size: 28px;
        color: var(--cart-gray-dark);
      }
      .checkout-success p {
        margin: 0 0 24px 0;
        font-size: 18px;
        color: var(--cart-gray-medium);
      }
      .checkout-success-credits {
        background: var(--cart-pink-light);
        padding: 14px 18px;
        border-radius: 8px;
        margin-bottom: 24px;
        font-size: 16px;
        color: var(--cart-purple);
      }
      .checkout-success-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }
      .checkout-success-btn {
        display: inline-block;
        padding: 14px 36px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        text-align: center;
      }
      .checkout-success-btn:hover {
        background: var(--cart-purple-dark);
        color: white;
      }
      .checkout-success-btn-secondary {
        background: transparent;
        border: none;
        color: var(--cart-gray-medium);
        font-size: 16px;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
        padding: 8px;
      }
      .checkout-success-btn-secondary:hover {
        color: var(--cart-purple);
      }
    `;
    document.head.appendChild(styles);
  }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('purchase-cart-dropdown');
  const navItem = document.getElementById('purchase-cart-nav');
  
  if (dropdown && dropdown.style.display === 'block') {
    if (!navItem?.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PurchaseCart.init();
});
