// ============================================
// PURCHASES PAGE — UPDATED
// Add to Page Body Code (or host on GitHub)
// ============================================

window.PurchasesManager = {
  _ordersCache: null,

  // Get API base URL with fallback
  getApiBase() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const hostname = window.location.hostname;
    const isProduction = hostname === 'dematerialized.nl' || hostname === 'www.dematerialized.nl';
    return isProduction ? 'https://api.dematerialized.nl' : 'https://test-api.dematerialized.nl';
  },

  // Fetch orders from API
  async fetchOrders() {
    console.log('🛍️ Fetching orders...');

    if (!window.auth0Client) {
      console.error('Auth0 not initialized');
      return null;
    }

    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated');
        return null;
      }

      const token = await window.auth0Client.getTokenSilently();
      const apiBase = this.getApiBase();

      const response = await fetch(`${apiBase}/private_clothing_items/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch orders:', response.status);
        return null;
      }

      const orders = await response.json();
      console.log('🛍️ Orders loaded:', orders.length);
      this._ordersCache = orders;
      return orders;

    } catch (err) {
      console.error('Error fetching orders:', err);
      return null;
    }
  },

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'n/a';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toLowerCase();
  },

  // Format price
  formatPrice(cents) {
    if (cents === null || cents === undefined) return '€0,00';
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  },

  // Get item image URL
  getItemImage(item) {
    if (!item) return null;

    // Check for images array
    if (item.images && item.images.length > 0) {
      const frontImage = item.images.find(img => img.image_type === 'front') || item.images[0];
      return frontImage?.object_url || null;
    }

    // Check for direct image_url
    if (item.image_url) return item.image_url;

    return null;
  },

  // ── Render: Compact Order Card ─────────────
  renderOrderCard(order) {
    const orderId = order.hash_id || order.id || 'unknown';
    const shortId = typeof orderId === 'string' ? orderId.substring(0, 8) : orderId;
    const items = order.items || [];
    const itemCount = items.length;
    const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;
    // Show subtotal (sum of item prices) on the card, not just the card charge
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price_in_cents || 0), 0);
    const total = order.subtotal_cents || calculatedSubtotal || order.total_amount_in_cents || 0;
    const orderDate = this.formatDate(order.order_date);
    const maxThumbs = 3;
    const extraCount = itemCount - maxThumbs;

    // Render overlapping thumbnails (up to 3)
    const thumbs = items.slice(0, maxThumbs).map((item, index) => {
      const clothingItem = item.clothing_item || {};
      const imgUrl = this.getItemImage(clothingItem);
      const name = clothingItem.name?.toLowerCase() || 'item';
      return `
        <div class="purchase-group-thumb" style="z-index: ${maxThumbs - index}; left: ${index * 28}px;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
      `;
    }).join('');

    const moreIndicator = extraCount > 0 ? `
      <div class="purchase-group-more-badge" style="left: ${(Math.min(itemCount, maxThumbs) * 28) - 6}px;">
        +${extraCount}
      </div>
    ` : '';

    const imageWidth = Math.min(itemCount, maxThumbs) * 28 + 30;

    return `
      <div class="purchase-group" onclick="PurchasesManager.openOrderModal('${orderId}')">
        <div class="purchase-group-header">
          <div class="purchase-group-images" style="width: ${imageWidth}px;">
            ${thumbs}
            ${moreIndicator}
          </div>
          <div class="purchase-group-info">
            <div class="purchase-group-summary">${itemLabel} purchased on ${orderDate}</div>
            <div class="purchase-group-meta">#${shortId} · ${this.formatPrice(total)}</div>
          </div>
          <div class="purchase-group-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </div>
        </div>
      </div>
    `;
  },

  // ── Modal: Order Detail ────────────────────
  openOrderModal(orderId) {
    console.log('🛍️ Opening order modal for:', orderId);

    const orders = this._ordersCache || [];
    const order = orders.find(o => {
      const oId = o.hash_id || o.id || '';
      return String(oId) === String(orderId);
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    const modal = document.getElementById('purchase-detail-modal');
    const backdrop = document.getElementById('purchase-detail-backdrop');
    const modalContent = document.getElementById('purchase-modal-content');

    if (!modal || !backdrop || !modalContent) {
      console.error('Modal elements not found');
      return;
    }

    const items = order.items || [];
    const shortId = typeof (order.hash_id || order.id) === 'string'
      ? (order.hash_id || order.id).substring(0, 8)
      : (order.hash_id || order.id);

    // Set modal header with title + order #
    const headerEl = document.querySelector('.purchase-modal-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="purchase-modal-header-info">
          <div class="purchase-modal-title">purchase details</div>
          <div class="purchase-modal-subtitle">#${shortId}</div>
        </div>
        <button class="purchase-modal-close" onclick="PurchasesManager.closeOrderModal()">&times;</button>
      `;
    }

    // Build items HTML
    const itemsHtml = items.map(item => {
      const clothingItem = item.clothing_item || {};
      const imgUrl = this.getItemImage(clothingItem);
      const name = clothingItem.name?.toLowerCase() || 'item';
      const sku = clothingItem.sku || '';
      const priceCents = item.price_in_cents || 0;

      // Try to get retail price from the item or clothing item
      const retailCents = item.retail_price_cents
        || clothingItem.retail_price_cents
        || clothingItem.pricing_category?.retail_price_cents
        || null;

      return `
        <div class="purchase-modal-item-card">
          <div class="purchase-modal-item-image">
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
          </div>
          <div class="purchase-modal-item-info">
            <div class="purchase-modal-item-name">${name}</div>
            <div class="purchase-modal-item-price">${this.formatPrice(priceCents)}${retailCents ? ` <span class="purchase-modal-item-retail">${this.formatPrice(retailCents)}</span>` : ''}</div>
            ${sku ? `<a href="/product?sku=${encodeURIComponent(sku)}" class="purchase-modal-item-link">view item →</a>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Build payment breakdown
    // Calculate subtotal from item prices (more reliable than subtotal_cents which may be 0)
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price_in_cents || 0), 0);
    const subtotal = order.subtotal_cents || calculatedSubtotal;
    const totalCharged = order.total_amount_in_cents || 0;
    // Credits: use API value if available, otherwise derive from subtotal - total
    const creditsApplied = order.credits_applied_cents || Math.max(0, subtotal - totalCharged);

    let paymentHtml = `
      <div class="purchase-modal-payment">
        <div class="purchase-modal-payment-title">payment</div>
        <div class="purchase-modal-payment-row">
          <span>subtotal (50% off)</span>
          <span>${this.formatPrice(subtotal)}</span>
        </div>
    `;

    if (creditsApplied > 0) {
      paymentHtml += `
        <div class="purchase-modal-payment-row credits">
          <span>store credits applied</span>
          <span>-${this.formatPrice(creditsApplied)}</span>
        </div>
      `;
    }

    paymentHtml += `
        <div class="purchase-modal-payment-row total">
          <span>total charged</span>
          <span>${this.formatPrice(totalCharged)}</span>
        </div>
    `;

    // Payment method indicator
    if (creditsApplied > 0 && totalCharged > 0) {
      paymentHtml += `
        <div class="purchase-modal-payment-method">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 18V6"/>
          </svg>
          <span>${this.formatPrice(creditsApplied)} store credits + ${this.formatPrice(totalCharged)} card</span>
        </div>
      `;
    } else if (creditsApplied > 0 && totalCharged === 0) {
      paymentHtml += `
        <div class="purchase-modal-payment-method">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 18V6"/>
          </svg>
          <span>fully paid with store credits</span>
        </div>
      `;
    } else {
      paymentHtml += `
        <div class="purchase-modal-payment-method">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <span>paid with card</span>
        </div>
      `;
    }

    paymentHtml += `</div>`;

    // Assemble modal content
    const status = (order.payment_status || 'paid').toLowerCase();

    modalContent.innerHTML = `
      <div class="purchase-modal-status-banner">
        <span class="purchase-modal-status">${status}</span>
        <span>this order has been ${status}</span>
      </div>

      <div class="purchase-modal-details-title">order details</div>
      <div class="purchase-modal-details-grid">
        <div class="purchase-modal-detail-card">
          <span class="purchase-modal-detail-label">date</span>
          <span class="purchase-modal-detail-value">${this.formatDate(order.order_date)}</span>
        </div>
        <div class="purchase-modal-detail-card">
          <span class="purchase-modal-detail-label">items</span>
          <span class="purchase-modal-detail-value">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div class="purchase-modal-items-title">items purchased</div>
      ${itemsHtml}

      ${paymentHtml}
    `;

    // Open modal
    backdrop.classList.add('open');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeOrderModal() {
    const modal = document.getElementById('purchase-detail-modal');
    const backdrop = document.getElementById('purchase-detail-backdrop');

    if (modal) modal.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  },

  // ── Render the purchases page ──────────────
  async renderPurchasesPage() {
    console.log('🛍️ Rendering purchases page...');

    const loadingEl = document.getElementById('purchases-loading');
    const signinEl = document.getElementById('purchases-signin');
    const emptyEl = document.getElementById('purchases-empty');
    const contentEl = document.getElementById('purchases-content');
    const listEl = document.getElementById('purchases-list');

    try {
      // Show loading
      if (loadingEl) loadingEl.style.display = 'flex';
      if (signinEl) signinEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'none';

      // Check authentication
      if (!window.auth0Client) {
        console.log('Waiting for Auth0...');
        if (loadingEl) loadingEl.style.display = 'none';
        if (signinEl) signinEl.style.display = 'flex';
        return;
      }

      try {
        const isAuthenticated = await window.auth0Client.isAuthenticated();
        if (!isAuthenticated) {
          if (loadingEl) loadingEl.style.display = 'none';
          if (signinEl) signinEl.style.display = 'flex';
          return;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (loadingEl) loadingEl.style.display = 'none';
        if (signinEl) signinEl.style.display = 'flex';
        return;
      }

      // Fetch orders
      console.log('🛍️ Fetching orders...');
      const allOrders = await this.fetchOrders();
      console.log('🛍️ Orders fetched:', allOrders);

      // Filter to only show paid/completed orders
      const orders = (allOrders || []).filter(order => {
        const paymentStatus = (order.payment_status || '').toLowerCase();
        const status = (order.status || '').toLowerCase();
        return paymentStatus === 'paid' || status === 'completed';
      });
      console.log('🛍️ Paid orders:', orders.length);

      // Hide loading
      if (loadingEl) loadingEl.style.display = 'none';

      if (!orders || orders.length === 0) {
        console.log('🛍️ No orders found, showing empty state');
        if (emptyEl) emptyEl.style.display = 'flex';
        return;
      }

      // Sort orders by date descending (newest first)
      orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

      // Render compact order cards
      console.log('🛍️ Rendering', orders.length, 'orders...');
      if (listEl) {
        listEl.innerHTML = orders.map(order => this.renderOrderCard(order)).join('');
      }

      if (contentEl) contentEl.style.display = 'block';
      console.log('🛍️ Purchases page rendered');

    } catch (err) {
      console.error('🛍️ Error rendering purchases page:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
    }
  }
};

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.id === 'purchase-detail-backdrop') {
    PurchasesManager.closeOrderModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    PurchasesManager.closeOrderModal();
  }
});

// Initialize on page load
function initPurchasesPage() {
  if (!document.getElementById('purchases-container')) {
    console.log('🛍️ Not on purchases page, skipping init');
    return;
  }

  console.log('🛍️ Purchases page detected, initializing...');

  const initPurchases = async () => {
    let attempts = 0;
    while (!window.auth0Client && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.auth0Client) {
      console.log('🛍️ Auth0 client found, checking authentication...');
      try {
        const isAuth = await window.auth0Client.isAuthenticated();
        console.log('🛍️ Is authenticated:', isAuth);
        if (isAuth) {
          // Check membership status first
          try {
            const token = await window.auth0Client.getTokenSilently();
            const apiBase = PurchasesManager.getApiBase();
            const userResponse = await fetch(`${apiBase}/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();

              if (!userData.stripe_id) {
                const loadingEl = document.getElementById('purchases-loading');
                const noMembershipEl = document.getElementById('purchases-no-membership');
                const contactEl = document.getElementById('purchases-contact');

                if (loadingEl) loadingEl.style.display = 'none';
                if (noMembershipEl) noMembershipEl.style.display = 'flex';
                if (contactEl) contactEl.style.display = 'none';
                return;
              }
            }
          } catch (err) {
            console.error('Error checking membership:', err);
          }

          // Has membership — render purchases
          await PurchasesManager.renderPurchasesPage();
        } else {
          const loadingEl = document.getElementById('purchases-loading');
          const signinEl = document.getElementById('purchases-signin');
          if (loadingEl) loadingEl.style.display = 'none';
          if (signinEl) signinEl.style.display = 'flex';
        }
      } catch (err) {
        console.error('🛍️ Error during init:', err);
        const loadingEl = document.getElementById('purchases-loading');
        const emptyEl = document.getElementById('purchases-empty');
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'flex';
      }
    } else {
      console.log('🛍️ Auth0 client not found after 50 attempts');
      const loadingEl = document.getElementById('purchases-loading');
      const signinEl = document.getElementById('purchases-signin');
      if (loadingEl) loadingEl.style.display = 'none';
      if (signinEl) signinEl.style.display = 'flex';
    }
  };

  initPurchases();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPurchasesPage);
} else {
  initPurchasesPage();
}
