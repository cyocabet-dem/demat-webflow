// ============================================
// MY RENTALS PAGE - UPDATED WITH NEW STYLING
// Add to Page Body Code
// ============================================

window.RentalsManager = {
  API_BASE: window.API_BASE_URL,
  _activeRentalsCache: null,
  _historyCache: null,

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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch rentals:', response.status);
        return null;
      }

      const rentals = await response.json();
      console.log('👕 Rentals loaded:', rentals);
      
      if (includeHistory) {
        this._historyCache = rentals;
      } else {
        this._activeRentalsCache = rentals;
      }
      
      return rentals;

    } catch (err) {
      console.error('Error fetching rentals:', err);
      return null;
    }
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  getItemImage(rental) {
    if (!rental.clothing_item?.images?.length) return '';

    const frontImg = rental.clothing_item.images.find(img =>
      img.image_type === 'front' ||
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );

    return frontImg?.object_url || rental.clothing_item.images[0]?.object_url || '';
  },

  goToProduct(sku, event) {
    if (event) event.stopPropagation();
    if (sku) {
      window.location.href = '/product?sku=' + encodeURIComponent(sku);
    }
  },

  renderActiveRentalCard(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const brand = ci?.brand?.brand_name || '';
    const name = ci?.name || 'Unknown Item';
    const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
    const colors = ci?.colors?.map(c => c.name).join(', ') || '';
    const sku = ci?.sku || '';

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
          <div class="rental-card-actions">
            <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-link">View item</a>
            <button onclick="RentalsManager.openPurchaseModal(${rental.id})" class="rental-card-btn">
              Purchase Item
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryItem(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const name = ci?.name || 'Unknown Item';
    const returnDate = this.formatDate(rental.rental_return_date);

    return `
      <div onclick="RentalsManager.openHistoryModal(${rental.id})" class="history-item">
        <div class="history-item-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
        <div class="history-item-info">
          <div class="history-item-date">${returnDate}</div>
          <div class="history-item-count">1 item</div>
        </div>
        <div class="history-item-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </div>
      </div>
    `;
  },

  async renderRentalsPage() {
    const container = document.getElementById('rentals-container');
    const loadingEl = document.getElementById('rentals-loading');
    const emptyEl = document.getElementById('rentals-empty');
    const activeEl = document.getElementById('rentals-active');
    const historyEl = document.getElementById('rentals-history');

    if (!container) {
      console.error('Rentals container not found');
      return;
    }

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeEl) activeEl.style.display = 'none';
    if (historyEl) historyEl.style.display = 'none';

    const [activeRentals, allRentals] = await Promise.all([
      this.fetchRentals(false),
      this.fetchRentals(true)
    ]);

    if (loadingEl) loadingEl.style.display = 'none';

    if (activeRentals && activeRentals.length > 0) {
      const activeList = document.getElementById('active-rentals-list');
      if (activeList) {
        activeList.innerHTML = activeRentals.map(r => this.renderActiveRentalCard(r)).join('');
      }
      if (activeEl) activeEl.style.display = 'block';
    }

    const returnedRentals = (allRentals || []).filter(r => r.status === 'Returned');
    returnedRentals.sort((a, b) => new Date(b.rental_return_date) - new Date(a.rental_return_date));

    if (returnedRentals.length > 0) {
      const historyList = document.getElementById('history-rentals-list');
      if (historyList) {
        historyList.innerHTML = returnedRentals.map(r => this.renderHistoryItem(r)).join('');
      }
      if (historyEl) historyEl.style.display = 'block';
    }

    if ((!activeRentals || activeRentals.length === 0) && returnedRentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
    }

    console.log('👕 Rentals page rendered');
  },

  openHistoryModal(rentalId) {
    console.log('👕 Opening history modal for rental:', rentalId);
    
    const rental = this._historyCache?.find(r => r.id === rentalId);
    if (!rental) {
      console.error('Rental not found in cache');
      return;
    }

    const modal = document.getElementById('rental-detail-modal');
    const backdrop = document.getElementById('rental-detail-backdrop');
    const modalContent = document.getElementById('rental-modal-content');

    if (!modal || !backdrop) {
      console.error('Modal elements not found. Make sure the modal HTML is in your page.');
      return;
    }

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
            <div class="rental-modal-date-value">${this.formatDate(rental.rental_start_date)}</div>
          </div>
          <div>
            <div class="rental-modal-date-label">Returned</div>
            <div class="rental-modal-date-value">${this.formatDate(rental.rental_return_date)}</div>
          </div>
        </div>
        <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-modal-btn">
          View Item
        </a>
      `;
    }

    backdrop.style.display = 'block';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('rental-detail-modal');
    const backdrop = document.getElementById('rental-detail-backdrop');
    if (modal) modal.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
    document.body.style.overflow = '';
  },

  openPurchaseModal(rentalId) {
    console.log('👕 Purchase rental:', rentalId);
    alert('Purchase flow coming soon!');
  }
};

// Global close function
window.closeRentalModal = function() {
  RentalsManager.closeModal();
};

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    RentalsManager.closeModal();
  }
});

// Close on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.id === 'rental-detail-backdrop') {
    RentalsManager.closeModal();
  }
});

// Auto-initialize
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
