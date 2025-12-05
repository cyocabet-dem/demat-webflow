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
      console.log('👕 Rentals loaded:', rentals.length);
      
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

  getProductUrl(rental) {
    const sku = rental.clothing_item?.sku;
    return sku ? `/product?sku=${encodeURIComponent(sku)}` : '#';
  },

  renderActiveRentalCard(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const brand = ci?.brand?.brand_name || '';
    const name = ci?.name || 'Unknown Item';
    const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
    const colors = ci?.colors?.map(c => c.name).join(', ') || '';
    const productUrl = this.getProductUrl(rental);

    return `
      <div class="rental-card" style="display: flex; gap: 20px; margin-bottom: 24px;">
        <a href="${productUrl}" style="width: 180px; height: 240px; background: #f5f5f5; flex-shrink: 0; overflow: hidden; display: block;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </a>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 8px;">
          <a href="${productUrl}" style="font-size: 14px; font-weight: 500; color: #000; text-decoration: none;">${name}</a>
          ${colors ? `<div style="font-size: 13px; color: #666;">${colors}</div>` : ''}
          ${size ? `<div style="font-size: 13px; color: #666;">Size: ${size}</div>` : ''}
          <button onclick="RentalsManager.openPurchaseModal(${rental.id})" style="margin-top: 16px; padding: 10px 20px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer; width: fit-content;">
            Purchase Item
          </button>
        </div>
      </div>
    `;
  },

  renderHistoryItem(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const name = ci?.name || 'Unknown Item';
    const colors = ci?.colors?.map(c => c.name).join(', ') || '';
    const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
    const productUrl = this.getProductUrl(rental);

    return `
      <a href="${productUrl}" class="history-item" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f0f0f0; text-decoration: none; color: inherit;">
        <div style="width: 100px; height: 133px; background: #f5f5f5; flex-shrink: 0; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding-top: 4px;">
          <div style="font-size: 14px; font-weight: 500; color: #000;">${name}</div>
          ${colors ? `<div style="font-size: 13px; color: #666;">${colors}</div>` : ''}
          ${size ? `<div style="font-size: 13px; color: #666;">Size: ${size}</div>` : ''}
          <div style="font-size: 12px; color: #999; margin-top: auto;">
            Returned: ${this.formatDate(rental.rental_return_date)}
          </div>
        </div>
      </a>
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

    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeEl) activeEl.style.display = 'none';
    if (historyEl) historyEl.style.display = 'none';

    // Fetch both active and history
    const [activeRentals, allRentals] = await Promise.all([
      this.fetchRentals(false),
      this.fetchRentals(true)
    ]);

    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';

    // Render active rentals
    if (activeRentals && activeRentals.length > 0) {
      const activeList = document.getElementById('active-rentals-list');
      if (activeList) {
        activeList.innerHTML = activeRentals.map(r => this.renderActiveRentalCard(r)).join('');
      }
      if (activeEl) activeEl.style.display = 'block';
    }

    // Process history (returned rentals only)
    const returnedRentals = (allRentals || []).filter(r => r.status === 'Returned');
    
    // Sort by return date descending
    returnedRentals.sort((a, b) => new Date(b.rental_return_date) - new Date(a.rental_return_date));

    if (returnedRentals.length > 0) {
      const historyList = document.getElementById('history-rentals-list');
      if (historyList) {
        historyList.innerHTML = returnedRentals.map(r => this.renderHistoryItem(r)).join('');
      }
      if (historyEl) historyEl.style.display = 'block';
    }

    // Show empty state if nothing
    if ((!activeRentals || activeRentals.length === 0) && returnedRentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
    }

    console.log('👕 Rentals page rendered');
  },

  openPurchaseModal(rentalId) {
    console.log('👕 Open purchase modal for rental:', rentalId);
    // TODO: Implement purchase flow
    alert('Purchase flow coming soon! Rental ID: ' + rentalId);
  }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('rentals-container')) {
    console.log('👕 Rentals page detected, initializing...');

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