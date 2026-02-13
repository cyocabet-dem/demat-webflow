// ============================================
// PURCHASES PAGE
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

  // Get status class
  getStatusClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'completed') return 'status-paid';
    if (s === 'pending') return 'status-pending';
    if (s === 'processing') return 'status-processing';
    if (s === 'failed' || s === 'cancelled') return 'status-failed';
    return 'status-pending';
  },

  // Get item image URL
  getItemImage(item) {
    if (!item) return null;
    
    // Check for images array
    if (item.images && item.images.length > 0) {
      // Find front image by image_type field
      const frontImage = item.images.find(img => img.image_type === 'front') || item.images[0];
      return frontImage?.object_url || null;
    }
    
    // Check for direct image_url
    if (item.image_url) return item.image_url;
    
    return null;
  },

  // Render a single order card
  renderOrderCard(order) {
    const orderId = order.hash_id || order.id || 'unknown';
    const shortId = typeof orderId === 'string' ? orderId.substring(0, 8) : orderId;
    const status = order.payment_status || order.status || 'pending';
    const statusClass = this.getStatusClass(status);
    const createdDate = this.formatDate(order.order_date);
    
    const items = order.items || [];
    const itemCount = items.length;
    const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;
    
    const total = order.total_amount_in_cents || 0;

    // Render item thumbnails (up to 4)
    const itemsHtml = items.slice(0, 4).map(item => {
      // clothing_item contains the full item data
      const clothingItem = item.clothing_item || {};
      const imgUrl = this.getItemImage(clothingItem);
      const name = clothingItem.name?.toLowerCase() || 'item';
      return `
        <div class="purchase-item">
          <div class="purchase-item-image">
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
          </div>
          <div class="purchase-item-name">${name}</div>
        </div>
      `;
    }).join('');

    const moreItems = items.length > 4 ? `<div class="purchase-item-more">+${items.length - 4} more</div>` : '';

    return `
      <div class="purchase-card">
        <div class="purchase-card-header">
          <div class="purchase-card-info">
            <span class="purchase-card-label">order</span>
            <span class="purchase-card-id">#${shortId}</span>
          </div>
          <span class="purchase-card-status ${statusClass}">${status.toLowerCase()}</span>
        </div>
        
        <div class="purchase-card-details">
          <div class="purchase-detail">
            <span class="purchase-detail-label">date</span>
            <span class="purchase-detail-value">${createdDate}</span>
          </div>
          <div class="purchase-detail">
            <span class="purchase-detail-label">items</span>
            <span class="purchase-detail-value">${itemLabel}</span>
          </div>
          <div class="purchase-detail">
            <span class="purchase-detail-label">total</span>
            <span class="purchase-detail-value">${this.formatPrice(total)}</span>
          </div>
        </div>
        
        ${items.length > 0 ? `
          <div class="purchase-card-items">
            <div class="purchase-items-title">items purchased</div>
            <div class="purchase-items-grid">
              ${itemsHtml}
              ${moreItems}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Render the purchases page
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

      // Render orders
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
