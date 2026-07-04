// ============================================
// LOCALIZATION (cart is fully JS-rendered, so .lang spans can't be used here)
// ============================================
function isNL() {
  if (window.DematI18n && window.DematI18n.isNL) return window.DematI18n.isNL();
  return (document.documentElement.lang || '').toLowerCase().indexOf('nl') === 0;
}
var PCART_T = {
  addedToCart:           { en: 'Added to cart', nl: 'toegevoegd aan winkelmand' },
  yourCart:              { en: 'your cart', nl: 'je winkelmand' },
  cartEmpty:             { en: 'your cart is empty', nl: 'je winkelmand is leeg' },
  total:                 { en: 'total', nl: 'totaal' },
  checkout:              { en: 'checkout', nl: 'afrekenen' },
  items:                 { en: 'items', nl: 'items' },
  subtotal:              { en: 'subtotal (50% off)', nl: 'subtotaal (50% korting)' },
  yourStoreCredits:      { en: 'your store credits', nl: 'jouw winkeltegoed' },
  creditsApplied:        { en: 'credits applied', nl: 'tegoed toegepast' },
  redirectInfo:          { en: "by clicking 'complete purchase' you will be redirected to our payment provider.", nl: "door op 'aankoop voltooien' te klikken word je doorgestuurd naar onze betaalprovider." },
  creditsCover:          { en: 'your credits cover this purchase!', nl: 'je tegoed dekt deze aankoop!' },
  completePurchase:      { en: 'complete purchase', nl: 'aankoop voltooien' },
  processing:            { en: 'processing...', nl: 'verwerken...' },
  purchaseSuccess:       { en: 'purchase successful!', nl: 'aankoop gelukt!' },
  viewHistoryInfo:       { en: 'you can view your purchase history in your account.', nl: 'je kunt je aankoopgeschiedenis in je account bekijken.' },
  inStoreCreditsApplied: { en: 'in store credits applied', nl: 'aan winkeltegoed toegepast' },
  viewPurchases:         { en: 'view my purchases', nl: 'bekijk mijn aankopen' },
  continueBrowsing:      { en: 'continue browsing', nl: 'verder winkelen' },
  authRequired:          { en: 'Authentication required', nl: 'authenticatie vereist' },
  signInRequired:        { en: 'Please sign in to complete your purchase', nl: 'log in om je aankoop te voltooien' },
  cartEmptyError:        { en: 'Your cart is empty', nl: 'je winkelmand is leeg' },
  createOrderFailed:     { en: 'Failed to create order', nl: 'bestelling aanmaken mislukt' },
  checkoutFailed:        { en: 'Failed to create checkout session', nl: 'afrekensessie aanmaken mislukt' },
  noCheckoutUrl:         { en: 'No checkout URL received', nl: 'geen afreken-URL ontvangen' },
  genericError:          { en: 'Something went wrong. Please try again.', nl: 'er ging iets mis. probeer het opnieuw.' },
  connectionError:       { en: 'Connection error \u2014 please check your internet and try again.', nl: 'verbindingsfout. controleer je internet en probeer opnieuw.' }
};
function t(key) {
  var e = PCART_T[key];
  return e ? (isNL() ? e.nl : e.en) : '';
}

// ============================================
// PURCHASE CART - SITE-WIDE
// Add to Site Footer Code (or host on GitHub)
// ============================================
window.PurchaseCart = {
  API_BASE: window.API_BASE_URL,
  _items: [],
  _isCheckingOut: false,
  init() {
    const saved = localStorage.getItem('demat_purchase_cart');
    if (saved) {
      try {
        this._items = JSON.parse(saved);
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
  hasItem(clothingItemId) {
    return this._items.some(item => item.clothing_item_id === clothingItemId);
  },
  addItem(item) {
    if (this.hasItem(item.clothing_item_id)) {
      return;
    }
    this._items.push(item);
    this.save();
    this.showAddedToast(item.name);
  },
  removeItem(clothingItemId) {
    const index = this._items.findIndex(item => item.clothing_item_id === clothingItemId);
    if (index > -1) {
      this._items.splice(index, 1);
      this.save();
    }
  },
  clear() {
    this._items = [];
    this.save();
  },
  getItems() {
    return [...this._items];
  },
  getTotal() {
    return this._items.reduce((sum, item) => sum + (item.purchase_price_cents || 0), 0);
  },
  formatPrice(cents) {
    if (cents === null || cents === undefined) return '€0,00';
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  },
  updateCartBadge() {
    const count = this._items.length;
    document.querySelectorAll('.purchase-cart-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.purchase-cart-nav').forEach(navItem => {
      navItem.style.display = count > 0 ? 'flex' : 'none';
    });
  },
  showAddedToast(itemName) {
    const existing = document.getElementById('cart-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${t('addedToCart')}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('cart-toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('cart-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },
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
    let backdrop = document.getElementById('purchase-cart-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'purchase-cart-backdrop';
      backdrop.className = 'cart-panel-backdrop';
      backdrop.onclick = () => this.closeCartPanel();
      document.body.appendChild(backdrop);
    }
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
  renderCartPanel() {
    const panel = document.getElementById('purchase-cart-panel');
    if (!panel) return;
    if (this._items.length === 0) {
      panel.innerHTML = `
        <div class="cart-panel-header">
          <span class="cart-panel-title">${t('yourCart')}</span>
          <button onclick="PurchaseCart.closeCartPanel()" class="cart-panel-close">&times;</button>
        </div>
        <div class="cart-panel-empty">
          <p>${t('cartEmpty')}</p>
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
        <span class="cart-panel-title">${t('yourCart')} (${this._items.length})</span>
        <button onclick="PurchaseCart.closeCartPanel()" class="cart-panel-close">&times;</button>
      </div>
      <div class="cart-panel-items">
        ${itemsHtml}
      </div>
      <div class="cart-panel-footer">
        <div class="cart-panel-total">
          <span>${t('total')}</span>
          <span>${this.formatPrice(this.getTotal())}</span>
        </div>
        <button onclick="PurchaseCart.openCheckoutModal()" class="cart-panel-checkout-btn">
          ${t('checkout')}
        </button>
      </div>
    `;
  },
  renderDropdown() {
    this.renderCartPanel();
  },
  async openCheckoutModal() {
    this.closeCartPanel();
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
    backdrop.classList.add('checkout-modal-backdrop-open');
    modal.classList.add('checkout-modal-open');
    document.body.style.overflow = 'hidden';
    await this.renderCheckoutModal();
  },
  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const backdrop = document.getElementById('checkout-modal-backdrop');
    if (modal) modal.classList.remove('checkout-modal-open');
    if (backdrop) backdrop.classList.remove('checkout-modal-backdrop-open');
    document.body.style.overflow = '';
  },
  async fetchCreditBalance() {
    try {
      if (!window.auth0Client) {
        return 0;
      }
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        return 0;
      }
      const token = await window.auth0Client.getTokenSilently();
      const apiBase = this.getApiBase();
      const url = `${apiBase}/private_clothing_items/donation_session/`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.credit_balance_cents || 0;
      } else {
        console.error('Failed to fetch credits:', response.status);
      }
    } catch (err) {
      console.error('Error fetching credit balance:', err);
    }
    return 0;
  },
  async renderCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    const items = this.getItems();
    const subtotal = this.getTotal();
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
          <h2>${t('checkout')}</h2>
          <button onclick="PurchaseCart.closeCheckoutModal()" class="checkout-modal-close">&times;</button>
        </div>
        
        <div class="checkout-modal-body">
          <div class="checkout-section">
            <div class="checkout-section-title">${t('items')} (${items.length})</div>
            <div class="checkout-items">
              ${itemsHtml}
            </div>
          </div>
          
          <div class="checkout-summary">
            <div class="checkout-summary-row">
              <span>${t('subtotal')}</span>
              <span>${this.formatPrice(subtotal)}</span>
            </div>
            <div class="checkout-summary-row">
              <span>${t('yourStoreCredits')}</span>
              <span>${this.formatPrice(creditBalance)}</span>
            </div>
            ${creditsToApply > 0 ? `
              <div class="checkout-summary-row checkout-credits-applied">
                <span>${t('creditsApplied')}</span>
                <span>-${this.formatPrice(creditsToApply)}</span>
              </div>
            ` : ''}
            <div class="checkout-summary-row checkout-summary-total">
              <span>${t('total')}</span>
              <span>${this.formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
        
        <div class="checkout-modal-footer">
          <p id="checkout-error-msg" class="checkout-error-msg" style="display:none;"></p>
          <p class="checkout-info">${finalTotal > 0 ? t('redirectInfo') : t('creditsCover')}</p>
          <button onclick="PurchaseCart.processCheckout()" class="checkout-submit-btn" id="checkout-submit-btn">
            ${t('completePurchase')}
          </button>
        </div>
      </div>
    `;
  },
  getApiBase() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    if (this.API_BASE) return this.API_BASE;
    const hostname = window.location.hostname;
    const isProduction = hostname === 'dematerialized.nl' || hostname === 'www.dematerialized.nl';
    return isProduction ? 'https://api.dematerialized.nl' : 'https://test-api.dematerialized.nl';
  },
  async processCheckout() {
    if (this._isCheckingOut) return;
    this._isCheckingOut = true;
    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="checkout-spinner"></span> ' + t('processing');
    }
    const errorEl = document.getElementById('checkout-error-msg');
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    try {
      if (!window.auth0Client) {
        throw new Error(t('authRequired'));
      }
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error(t('signInRequired'));
      }
      const token = await window.auth0Client.getTokenSilently();
      const items = this.getItems();
      const apiBase = this.getApiBase();
      if (items.length === 0) {
        throw new Error(t('cartEmptyError'));
      }
      const orderResponse = await fetch(`${apiBase}/private_clothing_items/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          clothing_item_ids: items.map(item => item.clothing_item_id),
          shipping_address: '',
          order_type: 'purchase'
        })
      });
      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('Order creation error response:', errorText);
        let errorDetail = t('createOrderFailed');
        try {
          const errorData = JSON.parse(errorText);
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
        }
        throw new Error(errorDetail);
      }
      const order = await orderResponse.json();
      if (order.total_amount_in_cents === 0 || order.payment_status === 'paid') {
        this.clear();
        this.closeCheckoutModal();
        this.showSuccessMessage(order);
        return;
      }
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/purchases?payment=success`;
      const cancelUrl = `${currentUrl}/purchases?payment=cancelled`;
      const checkoutResponse = await fetch(`${apiBase}/private_clothing_items/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          success_url: successUrl,
          cancel_url: cancelUrl
        })
      });
      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text();
        console.error('Checkout error response (raw):', errorText);
        let errorDetail = t('checkoutFailed');
        try {
          const errorData = JSON.parse(errorText);
          if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail;
          } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            errorDetail = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
          } else if (errorData.detail?.message) {
            errorDetail = errorData.detail.message;
          } else if (errorData.detail?.msg) {
            errorDetail = errorData.detail.msg;
          } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            errorDetail = JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorDetail = errorData.message;
          } else if (errorData.error) {
            errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
          }
        } catch (e) {
          errorDetail = errorText || t('checkoutFailed');
        }
        throw new Error(String(errorDetail));
      }
      const checkoutData = await checkoutResponse.json();
      this.clear();
      const redirectUrl = checkoutData.checkout_url || checkoutData.url || checkoutData.session_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error('No checkout URL in response. Full response:', checkoutData);
        throw new Error(t('noCheckoutUrl'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      let errorMessage = t('genericError');
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        const msg = error.message;
        errorMessage = (msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.')
          ? t('connectionError')
          : msg;
      } else if (error?.detail) {
        errorMessage = error.detail;
      }
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = t('completePurchase');
      }
    } finally {
      this._isCheckingOut = false;
    }
  },
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
          <h2>${t('purchaseSuccess')}</h2>
          <p>${t('viewHistoryInfo')}</p>
          ${creditsApplied > 0 ? `
            <div class="checkout-success-credits">
              <span>${this.formatPrice(creditsApplied)} ${t('inStoreCreditsApplied')}</span>
            </div>
          ` : ''}
          <div class="checkout-success-actions">
            <a href="${isNL() ? '/nl/purchases' : '/purchases'}" class="checkout-success-btn">${t('viewPurchases')}</a>
            <button onclick="PurchaseCart.closeCheckoutModal(); window.location.reload();" class="checkout-success-btn-secondary">${t('continueBrowsing')}</button>
          </div>
        </div>
      </div>
    `;
  },
  injectCartStyles() {
    if (document.getElementById('purchase-cart-styles')) return;
    const styles = document.createElement('style');
    styles.id = 'purchase-cart-styles';
    styles.textContent = `      :root {
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
    #purchase-cart-nav,
.purchase-cart-nav {
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
     #purchase-cart-badge,
.purchase-cart-badge {
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
      .checkout-error-msg {
        font-size: 14px;
        color: #c0392b;
        background: #fdf0ef;
        border: 1px solid #f5c6c2;
        border-radius: 6px;
        padding: 10px 14px;
        margin: 0 0 12px 0;
        text-align: center;
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
      }`;
    document.head.appendChild(styles);
  }
};
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('purchase-cart-dropdown');
  const navItem = document.getElementById('purchase-cart-nav');
  if (dropdown && dropdown.style.display === 'block') {
    if (!navItem?.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  PurchaseCart.init();
});
