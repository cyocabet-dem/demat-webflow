// ============================================
// MY RENTALS PAGE — UPDATED
// Groups history by return date, multi-item modal
// Add to Page Body Code (or host on GitHub)
// ============================================

window.RentalsManager = {
  API_BASE: window.API_BASE_URL,
  _activeRentalsCache: null,
  _historyCache: null,

  // ── API ────────────────────────────────────
  async fetchRentals(includeHistory = false) {
    console.log('👕 Fetching rentals...', { includeHistory });

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
      const url = includeHistory
        ? `${this.API_BASE}/private_clothing_items/rentals?include_history=true`
        : `${this.API_BASE}/private_clothing_items/rentals`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Failed to fetch rentals:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('👕 Rentals fetched:', data.length);

      if (includeHistory) {
        this._historyCache = data;
      } else {
        this._activeRentalsCache = data;
      }

      return data;
    } catch (error) {
      console.error('Error fetching rentals:', error);
      return null;
    }
  },

  // ── Helpers ────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatDateKey(dateStr) {
    if (!dateStr) return 'unknown';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  formatPrice(cents) {
    return '€' + (cents / 100).toFixed(2).replace('.', ',');
  },

  getPurchasePrice(rental) {
    const retailPrice = rental.clothing_item?.retail_price_cents || 0;
    return Math.round(retailPrice * 0.5);
  },

  getItemImage(rental) {
    const ci = rental.clothing_item;
    if (ci?.images && ci.images.length > 0) {
      return ci.images[0].image_url || ci.images[0].url || '';
    }
    return '';
  },

  // ── Render: Active Rental Card ─────────────
  renderActiveRentalCard(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const brand = ci?.brand?.brand_name || '';
    const name = ci?.name || 'Unknown Item';
    const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
    const colors = ci?.colors?.map(c => c.name).join(', ') || '';
    const sku = ci?.sku || '';

    // Pricing
    const retailPrice = ci?.retail_price_cents || 0;
    const purchasePrice = this.getPurchasePrice(rental);
    const hasRetailPrice = retailPrice > 0;

    return `
      <div class="rental-card">
        <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </a>
        <div class="rental-card-content">
          ${brand ? `<div class="rental-card-brand">${brand}</div>` : ''}
          <div class="rental-card-name">${name}</div>
          ${colors ? `<div class="rental-card-detail">${colors}</div>` : ''}
          ${size ? `<div class="rental-card-detail">Size: ${size}</div>` : ''}
          <div class="rental-card-date">Rented: ${this.formatDate(rental.rental_start_date)}</div>
          
          ${hasRetailPrice ? `
            <div class="rental-card-purchase-price">
              <span class="price-label">Purchase price:</span>
              <span class="price-original">${this.formatPrice(retailPrice)}</span>
              <span class="price-discount">${this.formatPrice(purchasePrice)}</span>
              <span class="price-badge">50% off</span>
            </div>
          ` : ''}
          
          <div class="rental-card-actions">
            <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-link">View item</a>
            ${hasRetailPrice ? `
              <button onclick="RentalsManager.addToCart(${rental.id})" class="rental-card-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Add to Cart
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // ── Render: History Group (date-grouped) ───
  groupHistoryByDate(rentals) {
    const groups = {};
    rentals.forEach(r => {
      const dateKey = this.formatDateKey(r.rental_return_date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(r);
    });

    // Sort groups by date descending
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(key => ({
      dateKey: key,
      displayDate: this.formatDate(groups[key][0].rental_return_date),
      rentals: groups[key]
    }));
  },

  renderHistoryGroup(group) {
    const count = group.rentals.length;
    const itemLabel = count === 1 ? '1 item' : `${count} items`;
    const rentalIds = group.rentals.map(r => r.id).join(',');

    // Show up to 4 thumbnail images, stacked/overlapping
    const thumbs = group.rentals.slice(0, 4).map(r => {
      const imgUrl = this.getItemImage(r);
      const name = r.clothing_item?.name || 'Item';
      return `
        <div class="history-group-thumb">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="history-group" onclick="RentalsManager.openGroupModal('${group.dateKey}')">
        <div class="history-group-header">
          <div class="history-group-images">
            ${thumbs}
          </div>
          <div class="history-group-info">
            <div class="history-group-date">${group.displayDate}</div>
            <div class="history-group-count">${itemLabel}</div>
          </div>
          <div class="history-group-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </div>
        </div>
      </div>
    `;
  },

  // ── Render: Main Page ──────────────────────
  async renderRentalsPage() {
    const container = document.getElementById('rentals-container');
    const loadingEl = document.getElementById('rentals-loading');
    const emptyEl = document.getElementById('rentals-empty');
    const activeEl = document.getElementById('rentals-active');
    const historyEl = document.getElementById('rentals-history');
    const noActiveEl = document.getElementById('rentals-no-active');

    if (!container) {
      console.error('Rentals container not found');
      return;
    }

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeEl) activeEl.style.display = 'none';
    if (historyEl) historyEl.style.display = 'none';
    if (noActiveEl) noActiveEl.style.display = 'none';

    const [activeRentals, allRentals] = await Promise.all([
      this.fetchRentals(false),
      this.fetchRentals(true)
    ]);

    if (loadingEl) loadingEl.style.display = 'none';

    const hasActive = activeRentals && activeRentals.length > 0;
    const returnedRentals = (allRentals || []).filter(r => r.status === 'Returned');
    returnedRentals.sort((a, b) => new Date(b.rental_return_date) - new Date(a.rental_return_date));
    const hasHistory = returnedRentals.length > 0;

    // Case 1: No rentals at all
    if (!hasActive && !hasHistory) {
      if (emptyEl) emptyEl.style.display = 'block';
      console.log('👕 Rentals page rendered (empty)');
      return;
    }

    // Always show the active section (with either items or the no-active message)
    if (activeEl) activeEl.style.display = 'block';

    if (hasActive) {
      // Show active rental cards
      const activeList = document.getElementById('active-rentals-list');
      if (activeList) {
        activeList.innerHTML = activeRentals.map(r => this.renderActiveRentalCard(r)).join('');
      }
      if (noActiveEl) noActiveEl.style.display = 'none';
    } else {
      // No active rentals but has history — show the no-active message
      if (noActiveEl) noActiveEl.style.display = 'block';
    }

    // Show grouped history
    if (hasHistory) {
      const historyGroups = this.groupHistoryByDate(returnedRentals);
      const historyList = document.getElementById('history-rentals-list');
      if (historyList) {
        historyList.innerHTML = historyGroups.map(g => this.renderHistoryGroup(g)).join('');
      }
      if (historyEl) historyEl.style.display = 'block';
    }

    console.log('👕 Rentals page rendered');
  },

  // ── Modal: Grouped History ─────────────────
  openGroupModal(dateKey) {
    console.log('👕 Opening group modal for date:', dateKey);

    const rentals = (this._historyCache || []).filter(r =>
      r.status === 'Returned' && this.formatDateKey(r.rental_return_date) === dateKey
    );

    if (rentals.length === 0) {
      console.error('No rentals found for date:', dateKey);
      return;
    }

    const modal = document.getElementById('rental-detail-modal');
    const backdrop = document.getElementById('rental-detail-backdrop');
    const modalContent = document.getElementById('rental-modal-content');
    const modalTitle = document.querySelector('.rental-modal-title');

    if (!modal || !backdrop) {
      console.error('Modal elements not found.');
      return;
    }

    // Update modal title
    if (modalTitle) {
      modalTitle.textContent = rentals.length === 1 ? 'Rental details' : `Rental details · ${rentals.length} items`;
    }

    // Build modal content
    const displayDate = this.formatDate(rentals[0].rental_return_date);
    const rentedDate = this.formatDate(rentals[0].rental_start_date);

    // For single item, keep the existing single-item layout
    if (rentals.length === 1) {
      const rental = rentals[0];
      const ci = rental.clothing_item;
      const imgUrl = this.getItemImage(rental);
      const brand = ci?.brand?.brand_name || '';
      const name = ci?.name || 'Unknown Item';
      const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
      const colors = ci?.colors?.map(c => c.name).join(', ') || '';
      const sku = ci?.sku || '';

      if (modalContent) {
        modalContent.innerHTML = `
          <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-modal-image">
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
          </a>
          <div class="rental-modal-details">
            ${brand ? `<div class="rental-modal-brand">${brand}</div>` : ''}
            <div class="rental-modal-name">${name}</div>
            ${colors || size ? `<div class="rental-modal-meta">${colors}${colors && size ? ' · ' : ''}${size ? `Size: ${size}` : ''}</div>` : ''}
          </div>
          <div class="rental-modal-dates">
            <div>
              <div class="rental-modal-date-label">Rented</div>
              <div class="rental-modal-date-value">${rentedDate}</div>
            </div>
            <div>
              <div class="rental-modal-date-label">Returned</div>
              <div class="rental-modal-date-value">${displayDate}</div>
            </div>
          </div>
          <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-modal-btn">
            View item
          </a>
        `;
      }
    } else {
      // Multi-item grouped view
      const itemsHtml = rentals.map(rental => {
        const ci = rental.clothing_item;
        const imgUrl = this.getItemImage(rental);
        const brand = ci?.brand?.brand_name || '';
        const name = ci?.name || 'Unknown Item';
        const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
        const colors = ci?.colors?.map(c => c.name).join(', ') || '';
        const sku = ci?.sku || '';

        return `
          <div class="rental-modal-group-item">
            <div class="rental-modal-group-thumb">
              ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
            </div>
            <div class="rental-modal-group-details">
              ${brand ? `<div class="rental-modal-group-brand">${brand}</div>` : ''}
              <div class="rental-modal-group-name">${name}</div>
              ${colors || size ? `<div class="rental-modal-group-meta">${colors}${colors && size ? ' · ' : ''}${size ? `Size: ${size}` : ''}</div>` : ''}
              <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-modal-group-link" onclick="event.stopPropagation()">
                View item →
              </a>
            </div>
          </div>
        `;
      }).join('');

      if (modalContent) {
        modalContent.innerHTML = `
          ${itemsHtml}
          <div class="rental-modal-group-dates">
            <div>
              <div class="rental-modal-date-label">Rented</div>
              <div class="rental-modal-date-value">${rentedDate}</div>
            </div>
            <div>
              <div class="rental-modal-date-label">Returned</div>
              <div class="rental-modal-date-value">${displayDate}</div>
            </div>
          </div>
        `;
      }
    }

    backdrop.style.display = 'block';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  // Keep legacy method for backwards compatibility
  openHistoryModal(rentalId) {
    const rental = this._historyCache?.find(r => r.id === rentalId);
    if (!rental) return;
    const dateKey = this.formatDateKey(rental.rental_return_date);
    this.openGroupModal(dateKey);
  },

  closeModal() {
    const modal = document.getElementById('rental-detail-modal');
    const backdrop = document.getElementById('rental-detail-backdrop');
    if (modal) modal.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
    document.body.style.overflow = '';
  },

  // ── Cart integration (if available) ────────
  addToCart(rentalId) {
    if (window.PurchaseCart && typeof window.PurchaseCart.addItem === 'function') {
      const rental = this._activeRentalsCache?.find(r => r.id === rentalId);
      if (rental) {
        window.PurchaseCart.addItem(rental);
      }
    } else {
      console.log('Purchase cart not available');
    }
  }
};

// ── Global functions ─────────────────────────
window.closeRentalModal = function() {
  RentalsManager.closeModal();
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    RentalsManager.closeModal();
  }
});

document.addEventListener('click', function(e) {
  if (e.target.id === 'rental-detail-backdrop') {
    RentalsManager.closeModal();
  }
});

// ── Auto-initialize ──────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('rentals-container')) {
    console.log('👕 Rentals page detected');

    const initRentals = async () => {
      let attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.auth0Client) {
        const isAuth = await window.auth0Client.isAuthenticated();
        if (isAuth) {
          RentalsManager.renderRentalsPage();
        } else {
          const container = document.getElementById('rentals-container');
          if (container) {
            container.innerHTML = `
              <div class="rentals-signin">
                <h2 class="rentals-signin-title">Sign in to view your rentals</h2>
                <p class="rentals-signin-text">You need to be logged in to see your rentals.</p>
                <button onclick="openAuthModal()" class="rentals-signin-btn">
                  Sign In
                </button>
              </div>
            `;
          }
        }
      }
    };

    initRentals();
  }
});
