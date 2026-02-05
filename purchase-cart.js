// ============================================
// PURCHASE CART SYSTEM
// Separate from reservation cart - for buying rental items
// ============================================

console.log('🛍️ [Purchase Cart] Loading...');

window.PurchaseCartManager = {
  STORAGE_KEY: 'dematerialized_purchase_cart',
  API_BASE: window.API_BASE_URL,
  _initialized: false,
  _creditBalance: 0,
  
  // ========== INITIALIZATION ==========
  
  async init() {
    if (this._initialized) return;
    console.log('🛍️ [Purchase Cart] Initializing...');
    
    this._initialized = true;
    this.updateCartBadge();
    
    // Fetch credit balance if authenticated
    await this.fetchCreditBalance();
  },
  
  // ========== CREDIT BALANCE ==========
  
  async fetchCreditBalance() {
    if (!window.auth0Client) return 0;
    
    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) return 0;
      
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${this.API_BASE}/private_clothing_items/donation_session/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this._creditBalance = data.credit_balance_cents || 0;
        console.log('🛍️ [Purchase Cart] Credit balance:', this.formatPrice(this._creditBalance));
      }
    } catch (err) {
      console.error('🛍️ [Purchase Cart] Error fetching credits:', err);
    }
    
    return this._creditBalance;
  },
  
  getCreditBalance() {
    return this._creditBalance;
  },
  
  // ========== LOCAL STORAGE METHODS ==========
  
  getCart() {
    try {
      const cart = localStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error('🛍️ [Purchase Cart] Error reading cart:', e);
      return [];
    }
  },
  
  saveCart(cart) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
      this.updateCartBadge();
      return true;
    } catch (e) {
      console.error('🛍️ [Purchase Cart] Error saving cart:', e);
      return false;
    }
  },
  
  // ========== CART OPERATIONS ==========
  
  getCartCount() {
    return this.getCart().length;
  },
  
  isInCart(rentalId) {
    const cart = this.getCart();
    return cart.some(item => item.rental_id === rentalId);
  },
  
  addToCart(item) {
    const cart = this.getCart();
    
    // Check if already in cart
    if (this.isInCart(item.rental_id)) {
      console.warn('🛍️ [Purchase Cart] Item already in cart');
      return { success: false, reason: 'already_in_cart' };
    }
    
    // Add item
    const cartItem = {
      rental_id: item.rental_id,
      clothing_item_id: item.clothing_item_id,
      sku: item.sku,
      name: item.name,
      brand: item.brand || '',
      size: item.size || '',
      colors: item.colors || '',
      image: item.image || '',
      retail_price_cents: item.retail_price_cents,
      purchase_price_cents: item.purchase_price_cents, // 50% off retail
      addedAt: new Date().toISOString()
    };
    
    cart.push(cartItem);
    this.saveCart(cart);
    
    console.log('✅ [Purchase Cart] Added:', item.name);
    return { success: true };
  },
  
  removeFromCart(rentalId) {
    let cart = this.getCart();
    const initialLength = cart.length;
    cart = cart.filter(item => item.rental_id !== rentalId);
    
    if (cart.length < initialLength) {
      this.saveCart(cart);
      console.log('✅ [Purchase Cart] Removed rental:', rentalId);
      return true;
    }
    return false;
  },
  
  clearCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadge();
    console.log('✅ [Purchase Cart] Cleared');
  },
  
  // ========== CART TOTALS ==========
  
  getSubtotal() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (item.purchase_price_cents || 0), 0);
  },
  
  calculateCheckout(creditsToApply = 0) {
    const subtotal = this.getSubtotal();
    const maxCredits = Math.min(creditsToApply, this._creditBalance, subtotal);
    const totalDue = Math.max(0, subtotal - maxCredits);
    
    return {
      subtotal_cents: subtotal,
      credits_applied_cents: maxCredits,
      total_due_cents: totalDue,
      needs_payment: totalDue > 0
    };
  },
  
  // ========== UI UPDATES ==========
  
  updateCartBadge() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll('[data-purchase-cart-count]');
    
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
    
    // Also update nav visibility
    const navCart = document.querySelector('[data-purchase-cart-nav]');
    if (navCart) {
      navCart.style.display = count > 0 ? 'flex' : 'none';
    }
  },
  
  // ========== FORMATTING ==========
  
  formatPrice(cents) {
    if (cents === null || cents === undefined) return '€0.00';
    return `€${(cents / 100).toFixed(2)}`;
  },
  
  // ========== CHECKOUT ==========
  
  async createOrder(creditsToApply = 0, shippingAddress = null) {
    if (!window.auth0Client) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const cart = this.getCart();
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }
    
    const checkout = this.calculateCheckout(creditsToApply);
    
    try {
      const token = await window.auth0Client.getTokenSilently();
      
      // Build URL with optional shipping_address query param
      let url = `${this.API_BASE}/private_clothing_items/orders`;
      const params = new URLSearchParams();
      
      if (shippingAddress) {
        params.set('shipping_address', shippingAddress);
      }
      
      // Add credits_applied as query param (backend may need to support this)
      if (checkout.credits_applied_cents > 0) {
        params.set('credits_applied_cents', checkout.credits_applied_cents);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Body is just array of clothing_item_ids
      const clothingItemIds = cart.map(item => item.clothing_item_id);
      
      console.log('🛍️ [Purchase Cart] Creating order:', { url, clothingItemIds, checkout });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clothingItemIds)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const order = await response.json();
      console.log('✅ [Purchase Cart] Order created:', order);
      
      // Check if payment is needed based on response
      const totalDue = order.total_amount_in_cents || checkout.total_due_cents;
      const needsPayment = totalDue > 0 && order.payment_status !== 'paid';
      
      return {
        success: true,
        order_id: order.id,
        needs_payment: needsPayment,
        total_due_cents: totalDue
      };
      
    } catch (err) {
      console.error('🛍️ [Purchase Cart] Order creation failed:', err);
      return { success: false, error: err.message };
    }
  },
  
  async createStripeCheckout(orderId, amountCents) {
    if (!window.auth0Client) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const token = await window.auth0Client.getTokenSilently();
      
      // Use the orders-specific Stripe endpoint
      const response = await fetch(`${this.API_BASE}/private_clothing_items/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/purchase-success?order_id=${orderId}`,
          cancel_url: `${window.location.origin}/my-rentals?cancelled=true`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      return { success: true, checkout_url: data.checkout_url };
      
    } catch (err) {
      console.error('🛍️ [Purchase Cart] Stripe checkout failed:', err);
      return { success: false, error: err.message };
    }
  },
  
  async processCheckout(creditsToApply = 0, shippingAddress = null) {
    // Step 1: Create order
    const orderResult = await this.createOrder(creditsToApply, shippingAddress);
    
    if (!orderResult.success) {
      return orderResult;
    }
    
    // Step 2: If payment needed, redirect to Stripe
    if (orderResult.needs_payment) {
      const stripeResult = await this.createStripeCheckout(
        orderResult.order_id,
        orderResult.total_due_cents
      );
      
      if (stripeResult.success) {
        // Clear cart before redirect
        this.clearCart();
        // Redirect to Stripe
        window.location.href = stripeResult.checkout_url;
        return { success: true, redirecting: true };
      } else {
        return stripeResult;
      }
    }
    
    // Step 3: No payment needed (fully covered by credits)
    this.clearCart();
    window.location.href = `/purchase-success?order_id=${orderResult.order_id}`;
    return { success: true, redirecting: true };
  }
};

// ============================================
// PURCHASE MODAL UI
// ============================================

window.PurchaseModal = {
  
  // Open purchase modal for a rental item
  open(rental) {
    console.log('🛍️ [Purchase Modal] Opening for rental:', rental.id);
    
    const ci = rental.clothing_item;
    if (!ci) {
      console.error('No clothing item data');
      return;
    }
    
    const retailPrice = ci.retail_price_cents || ci.retail_price * 100 || 0;
    const purchasePrice = Math.round(retailPrice * 0.5); // 50% off
    
    const imgUrl = this.getItemImage(rental);
    const brand = ci.brand?.brand_name || '';
    const name = ci.name || 'Unknown Item';
    const size = ci.size?.size || ci.size?.standard_size?.standard_size || '';
    const colors = ci.colors?.map(c => c.name).join(', ') || '';
    
    // Check if already in cart
    const isInCart = PurchaseCartManager.isInCart(rental.id);
    
    // Create modal HTML
    const modalHtml = `
      <div id="purchase-modal-backdrop" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
      "></div>
      <div id="purchase-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: #fff;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e5e5e5;
          ">
            <div style="font-size: 16px; font-weight: 500; font-family: 'Urbanist', sans-serif;">Purchase Item</div>
            <button onclick="PurchaseModal.close()" style="
              width: 32px;
              height: 32px;
              border: none;
              background: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
            ">×</button>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <!-- Item Image -->
            <div style="width: 100%; max-width: 240px; margin: 0 auto 20px; aspect-ratio: 3/4; background: #f5f5f5; overflow: hidden;">
              ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
            </div>
            
            <!-- Item Details -->
            <div style="text-align: center; margin-bottom: 20px;">
              ${brand ? `<div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${brand}</div>` : ''}
              <div style="font-size: 16px; font-weight: 500; color: #000; font-family: 'Urbanist', sans-serif;">${name}</div>
              ${colors ? `<div style="font-size: 13px; color: #666; margin-top: 6px;">${colors}</div>` : ''}
              ${size ? `<div style="font-size: 13px; color: #666;">Size: ${size}</div>` : ''}
            </div>
            
            <!-- Pricing -->
            <div style="background: #fdf2f8; padding: 16px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 13px; color: #666;">Retail Price:</span>
                <span style="font-size: 13px; color: #999; text-decoration: line-through;">${PurchaseCartManager.formatPrice(retailPrice)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 500; color: #be185d;">Your Price (50% off):</span>
                <span style="font-size: 18px; font-weight: 600; color: #be185d;">${PurchaseCartManager.formatPrice(purchasePrice)}</span>
              </div>
            </div>
            
            <!-- Info -->
            <div style="font-size: 12px; color: #666; margin-bottom: 20px; line-height: 1.5;">
              As a member, you can purchase any item you're currently renting at 50% off the retail price. 
              You can also use your store credits at checkout.
            </div>
            
            <!-- Action Button -->
            ${isInCart ? `
              <button onclick="PurchaseModal.removeAndClose(${rental.id})" style="
                width: 100%;
                padding: 14px;
                background: #fff;
                color: #000;
                border: 1px solid #000;
                font-family: 'Urbanist', sans-serif;
                font-size: 14px;
                cursor: pointer;
              ">Remove from Cart</button>
            ` : `
              <button onclick="PurchaseModal.addAndClose(${rental.id}, ${rental.clothing_item?.id || 0}, '${ci.sku || ''}', '${this.escapeHtml(name)}', '${this.escapeHtml(brand)}', '${this.escapeHtml(size)}', '${this.escapeHtml(colors)}', '${this.escapeHtml(imgUrl)}', ${retailPrice}, ${purchasePrice})" style="
                width: 100%;
                padding: 14px;
                background: #000;
                color: #fff;
                border: none;
                font-family: 'Urbanist', sans-serif;
                font-size: 14px;
                cursor: pointer;
              ">Add to Purchase Cart</button>
            `}
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    this.close();
    
    // Add to DOM
    const wrapper = document.createElement('div');
    wrapper.id = 'purchase-modal-wrapper';
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);
    document.body.style.overflow = 'hidden';
    
    // Close on backdrop click
    document.getElementById('purchase-modal-backdrop').addEventListener('click', () => this.close());
  },
  
  close() {
    const wrapper = document.getElementById('purchase-modal-wrapper');
    if (wrapper) {
      wrapper.remove();
      document.body.style.overflow = '';
    }
  },
  
  addAndClose(rentalId, clothingItemId, sku, name, brand, size, colors, image, retailPrice, purchasePrice) {
    PurchaseCartManager.addToCart({
      rental_id: rentalId,
      clothing_item_id: clothingItemId,
      sku: sku,
      name: name,
      brand: brand,
      size: size,
      colors: colors,
      image: image,
      retail_price_cents: retailPrice,
      purchase_price_cents: purchasePrice
    });
    
    this.close();
    
    // Show confirmation
    this.showToast('Item added to purchase cart!');
  },
  
  removeAndClose(rentalId) {
    PurchaseCartManager.removeFromCart(rentalId);
    this.close();
    this.showToast('Item removed from cart');
  },
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #000;
      color: #fff;
      padding: 12px 24px;
      font-family: 'Urbanist', sans-serif;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },
  
  getItemImage(rental) {
    if (!rental.clothing_item?.images?.length) return '';
    const frontImg = rental.clothing_item.images.find(img =>
      img.image_type === 'front' ||
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );
    return frontImg?.object_url || rental.clothing_item.images[0]?.object_url || '';
  },
  
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
};

// ============================================
// CHECKOUT MODAL
// ============================================

window.PurchaseCheckoutModal = {
  _creditsToApply: 0,
  
  async open() {
    console.log('🛍️ [Checkout] Opening...');
    
    const cart = PurchaseCartManager.getCart();
    if (cart.length === 0) {
      alert('Your purchase cart is empty');
      return;
    }
    
    // Refresh credit balance
    await PurchaseCartManager.fetchCreditBalance();
    const creditBalance = PurchaseCartManager.getCreditBalance();
    const subtotal = PurchaseCartManager.getSubtotal();
    
    // Default to applying max credits
    this._creditsToApply = Math.min(creditBalance, subtotal);
    
    const modalHtml = `
      <div id="checkout-modal-backdrop" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
      "></div>
      <div id="checkout-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: #fff;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e5e5e5;
          ">
            <div style="font-size: 18px; font-weight: 500; font-family: 'Urbanist', sans-serif;">Checkout</div>
            <button onclick="PurchaseCheckoutModal.close()" style="
              width: 32px;
              height: 32px;
              border: none;
              background: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
            ">×</button>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <!-- Cart Items -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                Items (${cart.length})
              </div>
              <div style="border: 1px solid #e5e5e5;">
                ${cart.map(item => `
                  <div style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0;">
                    <div style="width: 60px; height: 80px; background: #f5f5f5; flex-shrink: 0; overflow: hidden;">
                      ${item.image ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      ${item.brand ? `<div style="font-size: 10px; color: #666; text-transform: uppercase;">${item.brand}</div>` : ''}
                      <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                      ${item.size ? `<div style="font-size: 12px; color: #666;">Size: ${item.size}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 11px; color: #999; text-decoration: line-through;">${PurchaseCartManager.formatPrice(item.retail_price_cents)}</div>
                      <div style="font-size: 14px; font-weight: 500; color: #be185d;">${PurchaseCartManager.formatPrice(item.purchase_price_cents)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Credits Section -->
            ${creditBalance > 0 ? `
              <div style="margin-bottom: 24px; padding: 16px; background: #f8f8f8;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 14px; font-weight: 500;">Apply Store Credits</span>
                  <span style="font-size: 13px; color: #666;">Available: ${PurchaseCartManager.formatPrice(creditBalance)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="range" 
                    id="credit-slider" 
                    min="0" 
                    max="${Math.min(creditBalance, subtotal)}" 
                    value="${this._creditsToApply}"
                    oninput="PurchaseCheckoutModal.updateCredits(this.value)"
                    style="flex: 1; cursor: pointer;"
                  >
                  <span id="credit-display" style="font-size: 14px; font-weight: 500; min-width: 60px; text-align: right;">
                    -${PurchaseCartManager.formatPrice(this._creditsToApply)}
                  </span>
                </div>
              </div>
            ` : ''}
            
            <!-- Order Summary -->
            <div style="border-top: 2px solid #000; padding-top: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Subtotal</span>
                <span id="checkout-subtotal">${PurchaseCartManager.formatPrice(subtotal)}</span>
              </div>
              ${creditBalance > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #059669;">Store Credits</span>
                  <span id="checkout-credits" style="color: #059669;">-${PurchaseCartManager.formatPrice(this._creditsToApply)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 600; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5;">
                <span>Total Due</span>
                <span id="checkout-total">${PurchaseCartManager.formatPrice(subtotal - this._creditsToApply)}</span>
              </div>
            </div>
            
            <!-- Checkout Button -->
            <button id="checkout-btn" onclick="PurchaseCheckoutModal.processCheckout()" style="
              width: 100%;
              padding: 16px;
              background: #000;
              color: #fff;
              border: none;
              font-family: 'Urbanist', sans-serif;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            ">
              ${subtotal - this._creditsToApply > 0 ? 'Continue to Payment' : 'Complete Purchase'}
            </button>
            
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 12px;">
              All sales of rental items are final. Items cannot be returned but may be donated back for store credit.
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    this.close();
    
    // Add to DOM
    const wrapper = document.createElement('div');
    wrapper.id = 'checkout-modal-wrapper';
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);
    document.body.style.overflow = 'hidden';
    
    // Close on backdrop click
    document.getElementById('checkout-modal-backdrop').addEventListener('click', () => this.close());
  },
  
  close() {
    const wrapper = document.getElementById('checkout-modal-wrapper');
    if (wrapper) {
      wrapper.remove();
      document.body.style.overflow = '';
    }
  },
  
  updateCredits(value) {
    this._creditsToApply = parseInt(value) || 0;
    
    const subtotal = PurchaseCartManager.getSubtotal();
    const totalDue = subtotal - this._creditsToApply;
    
    // Update display
    document.getElementById('credit-display').textContent = `-${PurchaseCartManager.formatPrice(this._creditsToApply)}`;
    document.getElementById('checkout-credits').textContent = `-${PurchaseCartManager.formatPrice(this._creditsToApply)}`;
    document.getElementById('checkout-total').textContent = PurchaseCartManager.formatPrice(totalDue);
    document.getElementById('checkout-btn').textContent = totalDue > 0 ? 'Continue to Payment' : 'Complete Purchase';
  },
  
  async processCheckout() {
    const btn = document.getElementById('checkout-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    const result = await PurchaseCartManager.processCheckout(this._creditsToApply);
    
    if (!result.success && !result.redirecting) {
      btn.textContent = originalText;
      btn.disabled = false;
      alert(result.error || 'Checkout failed. Please try again.');
    }
  }
};

// ============================================
// ANIMATIONS
// ============================================

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes fadeOutDown {
    from {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    to {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  PurchaseCartManager.init();
});

// Expose to window for debugging
window.testPurchaseCart = function() {
  console.log('Cart:', PurchaseCartManager.getCart());
  console.log('Credits:', PurchaseCartManager.getCreditBalance());
  console.log('Subtotal:', PurchaseCartManager.formatPrice(PurchaseCartManager.getSubtotal()));
};

console.log('✅ [Purchase Cart] Loaded');
