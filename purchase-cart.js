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

  // Toggle cart dropdown
  toggleCartDropdown() {
    const dropdown = document.getElementById('purchase-cart-dropdown');
    if (!dropdown) return;

    const isOpen = dropdown.style.display === 'block';
    if (isOpen) {
      dropdown.style.display = 'none';
    } else {
      this.renderDropdown();
      dropdown.style.display = 'block';
    }
  },

  // Render cart dropdown
  renderDropdown() {
    const dropdown = document.getElementById('purchase-cart-dropdown');
    if (!dropdown) return;

    if (this._items.length === 0) {
      dropdown.innerHTML = `
        <div class="cart-dropdown-empty">
          <p>Your cart is empty</p>
        </div>
      `;
      return;
    }

    const itemsHtml = this._items.map(item => `
      <div class="cart-dropdown-item">
        <div class="cart-dropdown-item-image">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        </div>
        <div class="cart-dropdown-item-info">
          <div class="cart-dropdown-item-name">${item.name}</div>
          <div class="cart-dropdown-item-price">${this.formatPrice(item.purchase_price_cents)}</div>
        </div>
        <button onclick="PurchaseCart.removeItem(${item.clothing_item_id}); PurchaseCart.renderDropdown();" class="cart-dropdown-item-remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('');

    dropdown.innerHTML = `
      <div class="cart-dropdown-header">
        <span>Your Cart (${this._items.length})</span>
      </div>
      <div class="cart-dropdown-items">
        ${itemsHtml}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-dropdown-total">
          <span>Total</span>
          <span>${this.formatPrice(this.getTotal())}</span>
        </div>
        <button onclick="PurchaseCart.openCheckoutModal()" class="cart-dropdown-checkout-btn">
          Checkout
        </button>
      </div>
    `;
  },

  // Open checkout modal
  openCheckoutModal() {
    // Close dropdown
    const dropdown = document.getElementById('purchase-cart-dropdown');
    if (dropdown) dropdown.style.display = 'none';

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

    this.renderCheckoutModal();

    // Show modal
    backdrop.classList.add('checkout-modal-backdrop-open');
    modal.classList.add('checkout-modal-open');
    document.body.style.overflow = 'hidden';
  },

  // Close checkout modal
  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const backdrop = document.getElementById('checkout-modal-backdrop');

    if (modal) modal.classList.remove('checkout-modal-open');
    if (backdrop) backdrop.classList.remove('checkout-modal-backdrop-open');
    document.body.style.overflow = '';
  },

  // Render checkout modal content
  renderCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    const items = this.getItems();
    const total = this.getTotal();

    const itemsHtml = items.map(item => `
      <div class="checkout-item">
        <div class="checkout-item-image">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
        </div>
        <div class="checkout-item-details">
          <div class="checkout-item-brand">${item.brand || ''}</div>
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-meta">${item.size ? `Size ${item.size}` : ''}</div>
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
          <h2>Checkout</h2>
          <button onclick="PurchaseCart.closeCheckoutModal()" class="checkout-modal-close">&times;</button>
        </div>
        
        <div class="checkout-modal-body">
          <div class="checkout-section">
            <div class="checkout-section-title">Items (${items.length})</div>
            <div class="checkout-items">
              ${itemsHtml}
            </div>
          </div>
          
          <div class="checkout-summary">
            <div class="checkout-summary-row">
              <span>Subtotal (50% off)</span>
              <span>${this.formatPrice(total)}</span>
            </div>
            <div class="checkout-summary-row checkout-summary-note">
              <span>Store credits applied at checkout</span>
            </div>
            <div class="checkout-summary-row checkout-summary-total">
              <span>Total</span>
              <span>${this.formatPrice(total)}</span>
            </div>
          </div>
        </div>
        
        <div class="checkout-modal-footer">
          <p class="checkout-info">Store credits will be applied automatically. Any remaining balance will be charged via Stripe.</p>
          <button onclick="PurchaseCart.processCheckout()" class="checkout-submit-btn" id="checkout-submit-btn">
            Complete Purchase
          </button>
        </div>
      </div>
    `;
  },

  // Process checkout
  async processCheckout() {
    if (this._isCheckingOut) return;
    this._isCheckingOut = true;

    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="checkout-spinner"></span> Processing...';
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

      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Step 1: Create the order
      console.log('🛒 Creating order...');
      const orderResponse = await fetch(`${this.API_BASE}/private_clothing_items/orders`, {
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
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create order');
      }

      const order = await orderResponse.json();
      console.log('🛒 Order created:', order);

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
      const checkoutResponse = await fetch(`${this.API_BASE}/private_clothing_items/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const checkoutData = await checkoutResponse.json();
      console.log('🛒 Checkout session created:', checkoutData);

      // Clear cart before redirecting
      this.clear();

      // Redirect to Stripe
      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.message || 'Something went wrong. Please try again.');
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Purchase';
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
          <h2>Purchase Complete!</h2>
          <p>Your items are now yours to keep.</p>
          ${creditsApplied > 0 ? `
            <div class="checkout-success-credits">
              <span>${this.formatPrice(creditsApplied)} in store credits applied</span>
            </div>
          ` : ''}
          <button onclick="PurchaseCart.closeCheckoutModal(); window.location.reload();" class="checkout-success-btn">
            Continue
          </button>
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
        --cart-green: #16a34a;
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
      }
      .purchase-cart-toggle {
        position: relative;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: var(--cart-gray-dark);
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

      /* Dropdown */
      #purchase-cart-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        z-index: 1000;
        margin-top: 8px;
        overflow: hidden;
      }
      .cart-dropdown-header {
        padding: 16px;
        border-bottom: 1px solid var(--cart-gray-light);
        font-weight: 600;
        color: var(--cart-gray-dark);
      }
      .cart-dropdown-items {
        max-height: 280px;
        overflow-y: auto;
      }
      .cart-dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--cart-gray-bg);
      }
      .cart-dropdown-item-image {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--cart-gray-bg);
        flex-shrink: 0;
      }
      .cart-dropdown-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cart-dropdown-item-info {
        flex: 1;
        min-width: 0;
      }
      .cart-dropdown-item-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--cart-gray-dark);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cart-dropdown-item-price {
        font-size: 13px;
        color: var(--cart-pink);
        font-weight: 600;
      }
      .cart-dropdown-item-remove {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: var(--cart-gray-medium);
        opacity: 0.6;
      }
      .cart-dropdown-item-remove:hover {
        opacity: 1;
        color: var(--cart-gray-dark);
      }
      .cart-dropdown-footer {
        padding: 16px;
        background: var(--cart-gray-bg);
      }
      .cart-dropdown-total {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--cart-gray-dark);
      }
      .cart-dropdown-checkout-btn {
        width: 100%;
        padding: 12px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .cart-dropdown-checkout-btn:hover {
        background: var(--cart-purple-dark);
      }
      .cart-dropdown-empty {
        padding: 32px 16px;
        text-align: center;
        color: var(--cart-gray-medium);
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
        font-size: 20px;
        font-weight: 600;
        color: var(--cart-gray-dark);
      }
      .checkout-modal-close {
        background: none;
        border: none;
        font-size: 28px;
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
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--cart-gray-medium);
        margin-bottom: 12px;
      }
      .checkout-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
      }
      .checkout-item {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .checkout-item-image {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--cart-gray-bg);
        flex-shrink: 0;
      }
      .checkout-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .checkout-item-details {
        flex: 1;
        min-width: 0;
      }
      .checkout-item-brand {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--cart-gray-medium);
      }
      .checkout-item-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--cart-gray-dark);
      }
      .checkout-item-meta {
        font-size: 12px;
        color: var(--cart-gray-medium);
      }
      .checkout-item-prices {
        text-align: right;
      }
      .checkout-item-original {
        display: block;
        font-size: 12px;
        color: var(--cart-gray-medium);
        text-decoration: line-through;
      }
      .checkout-item-final {
        font-size: 14px;
        font-weight: 600;
        color: var(--cart-pink);
      }
      .checkout-summary {
        background: var(--cart-gray-bg);
        border-radius: 12px;
        padding: 16px;
      }
      .checkout-summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--cart-gray-dark);
      }
      .checkout-summary-row:last-child {
        margin-bottom: 0;
      }
      .checkout-summary-note {
        font-size: 12px;
        color: var(--cart-gray-medium);
        font-style: italic;
      }
      .checkout-summary-total {
        font-weight: 600;
        font-size: 16px;
        padding-top: 8px;
        border-top: 1px solid var(--cart-gray-light);
        margin-top: 8px;
      }
      .checkout-modal-footer {
        padding: 20px 24px;
        border-top: 1px solid var(--cart-gray-light);
        background: var(--cart-gray-bg);
      }
      .checkout-info {
        font-size: 12px;
        color: var(--cart-gray-medium);
        margin: 0 0 16px 0;
        text-align: center;
      }
      .checkout-submit-btn {
        width: 100%;
        padding: 14px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 15px;
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
        color: var(--cart-green);
        margin-bottom: 16px;
      }
      .checkout-success h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: var(--cart-gray-dark);
      }
      .checkout-success p {
        margin: 0 0 24px 0;
        color: var(--cart-gray-medium);
      }
      .checkout-success-credits {
        background: var(--cart-pink-light);
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 24px;
        font-size: 14px;
        color: var(--cart-purple);
      }
      .checkout-success-btn {
        padding: 12px 32px;
        background: var(--cart-purple);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
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
