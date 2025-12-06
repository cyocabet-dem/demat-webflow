// ============================================
// MY RENTALS PAGE FUNCTIONS
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
      <div class="rental-card" style="display: flex; gap: 20px; margin-bottom: 24px; padding: 20px; border: 1px solid #e5e5e5;">
        <a href="/product?sku=${encodeURIComponent(sku)}" style="width: 140px; height: 187px; background: #f5f5f5; flex-shrink: 0; overflow: hidden; display: block;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </a>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          ${brand ? `<div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${brand}</div>` : ''}
          <div style="font-size: 14px; font-weight: 500; color: #000;">${name}</div>
          ${colors ? `<div style="font-size: 13px; color: #666;">${colors}</div>` : ''}
          ${size ? `<div style="font-size: 13px; color: #666;">Size: ${size}</div>` : ''}
          <div style="font-size: 12px; color: #999; margin-top: 4px;">Rented: ${this.formatDate(rental.rental_start_date)}</div>
          <div style="margin-top: auto; display: flex; gap: 12px; align-items: center;">
            <a href="/product?sku=${encodeURIComponent(sku)}" style="font-size: 13px; color: #000; text-decoration: underline;">View item</a>
            <button onclick="RentalsManager.openPurchaseModal(${rental.id})" style="padding: 8px 16px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 12px; cursor: pointer;">
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
      <div onclick="RentalsManager.openHistoryModal(${rental.id})" class="history-item" style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e5e5; margin-bottom: 12px; cursor: pointer;">
        <div style="width: 80px; height: 107px; background: #f5f5f5; flex-shrink: 0; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="font-size: 14px; font-weight: 500; color: #000;">${returnDate}</div>
          <div style="font-size: 13px; color: #666;">1 item</div>
        </div>
        <div style="color: #999;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
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
        <a href="/product?sku=${encodeURIComponent(sku)}" style="display: block; width: 100%; max-width: 280px; margin: 0 auto 20px; aspect-ratio: 3/4; background: #f5f5f5; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </a>
        <div style="text-align: center; margin-bottom: 20px;">
          ${brand ? `<div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${brand}</div>` : ''}
          <div style="font-size: 16px; font-weight: 500; color: #000;">${name}</div>
          ${colors ? `<div style="font-size: 13px; color: #666; margin-top: 6px;">${colors}</div>` : ''}
          ${size ? `<div style="font-size: 13px; color: #666;">Size: ${size}</div>` : ''}
        </div>
        <div style="background: #fafafa; padding: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Rented</div>
            <div style="font-size: 13px; color: #333;">${this.formatDate(rental.rental_start_date)}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Returned</div>
            <div style="font-size: 13px; color: #333;">${this.formatDate(rental.rental_return_date)}</div>
          </div>
        </div>
        <a href="/product?sku=${encodeURIComponent(sku)}" style="display: block; width: 100%; padding: 12px; background: #000; color: #fff; text-align: center; text-decoration: none; font-family: 'Urbanist', sans-serif; font-size: 13px;">
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
              <div style="text-align: center; padding: 60px 20px;">
                <h2 style="font-size: 20px; margin-bottom: 12px;">Sign in to view your rentals</h2>
                <p style="color: #666; margin-bottom: 20px;">You need to be logged in to see your rentals.</p>
                <button onclick="openAuthModal()" style="padding: 12px 24px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; cursor: pointer;">
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