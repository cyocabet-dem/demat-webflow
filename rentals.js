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

  getStatusBadge(status) {
    const statusStyles = {
      'Active': { bg: '#d1fae5', color: '#065f46', label: 'Active' },
      'Returned': { bg: '#e0e7ff', color: '#3730a3', label: 'Returned' },
      'Overdue': { bg: '#fee2e2', color: '#991b1b', label: 'Overdue' },
      'Cancelled': { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
      'Unpaid': { bg: '#fef3c7', color: '#92400e', label: 'Unpaid' }
    };

    const style = statusStyles[status] || statusStyles['Active'];
    return `<span style="display: inline-block; padding: 4px 10px; background: ${style.bg}; color: ${style.color}; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${style.label}</span>`;
  },

  getItemImage(rental) {
    if (!rental.clothing_item?.images?.length) return '';

    const frontImg = rental.clothing_item.images.find(img =>
      img.image_type === 'front' ||
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );

    return frontImg?.object_url || rental.clothing_item.images[0]?.object_url || '';
  },

  renderActiveRentalCard(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const brand = ci?.brand?.brand_name || '';
    const name = ci?.name || 'Unknown Item';
    const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
    const sku = ci?.sku || '';
    const colors = ci?.colors?.map(c => c.name).join(', ') || '';

    return `
      <div class="rental-card" style="background: #fff; border: 1px solid #e5e5e5; padding: 16px; display: flex; gap: 16px;">
        <div style="width: 100px; height: 133px; background: #f5f5f5; flex-shrink: 0; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
          ${brand ? `<div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${brand}</div>` : ''}
          <div style="font-size: 14px; font-weight: 500; color: #000;">${name}</div>
          ${colors ? `<div style="font-size: 12px; color: #666;">${colors}</div>` : ''}
          ${size ? `<div style="font-size: 12px; color: #666;">Size: ${size}</div>` : ''}
          <div style="font-size: 11px; color: #999; margin-top: 4px;">Rented: ${this.formatDate(rental.rental_start_date)}</div>
          <div style="margin-top: auto; display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="/product?sku=${encodeURIComponent(sku)}" style="font-size: 12px; color: #000; text-decoration: underline;">View item</a>
            <button onclick="RentalsManager.openPurchaseModal(${rental.id})" style="padding: 8px 16px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 12px; cursor: pointer;">
              Purchase Item
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryGroup(rentals, date) {
    const previewImages = rentals.slice(0, 3).map(rental => {
      const imgUrl = this.getItemImage(rental);
      return imgUrl ? `<img src="${imgUrl}" alt="" style="width: 60px; height: 80px; object-fit: cover; background: #f5f5f5;">` : '';
    }).join('');

    const moreCount = rentals.length > 3 ? `<div style="width: 60px; height: 80px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">+${rentals.length - 3}</div>` : '';

    return `
      <div class="history-group" style="background: #fff; border: 1px solid #e5e5e5; padding: 16px; margin-bottom: 12px; cursor: pointer;" onclick="RentalsManager.viewHistoryGroup('${date}')">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="display: flex; gap: 8px; flex: 1; overflow-x: auto;">
            ${previewImages}
            ${moreCount}
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 13px; font-weight: 500; color: #000;">${this.formatDate(date)}</div>
            <div style="font-size: 12px; color: #666;">${rentals.length} item${rentals.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="color: #999;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </div>
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
    const returnedRentals = (allRentals || []).filter(r => r.status === 'Returned' && r.rental_return_date);
    
    if (returnedRentals.length > 0) {
      // Group by return date
      const grouped = {};
      returnedRentals.forEach(rental => {
        const date = rental.rental_return_date.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(rental);
      });

      // Sort dates descending
      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

      const historyList = document.getElementById('history-rentals-list');
      if (historyList) {
        historyList.innerHTML = sortedDates.map(date => this.renderHistoryGroup(grouped[date], date)).join('');
      }
      if (historyEl) historyEl.style.display = 'block';
    }

    // Show empty state if nothing
    if ((!activeRentals || activeRentals.length === 0) && returnedRentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
    }

    console.log('👕 Rentals page rendered');
  },

  viewHistoryGroup(date) {
    console.log('👕 View history group:', date);
    
    const rentals = (this._historyCache || []).filter(r => 
      r.rental_return_date && r.rental_return_date.startsWith(date)
    );

    if (rentals.length === 0) return;

    const modal = document.getElementById('rental-history-modal');
    const backdrop = document.getElementById('rental-history-backdrop');
    const modalDate = document.getElementById('history-modal-date');
    const modalContent = document.getElementById('history-modal-content');

    if (!modal || !backdrop) {
      console.error('History modal not found');
      return;
    }

    if (modalDate) {
      modalDate.textContent = this.formatDate(date);
    }

    if (modalContent) {
      modalContent.innerHTML = rentals.map(rental => {
        const ci = rental.clothing_item;
        const imgUrl = this.getItemImage(rental);
        const brand = ci?.brand?.brand_name || '';
        const name = ci?.name || 'Unknown Item';
        const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
        const sku = ci?.sku || '';

        return `
          <div style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
            <div style="width: 80px; height: 107px; background: #f5f5f5; flex-shrink: 0; overflow: hidden;">
              ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              ${brand ? `<div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${brand}</div>` : ''}
              <div style="font-size: 14px; font-weight: 500; color: #000;">${name}</div>
              ${size ? `<div style="font-size: 12px; color: #666;">Size: ${size}</div>` : ''}
              <div style="font-size: 11px; color: #999; margin-top: auto;">
                ${this.formatDate(rental.rental_start_date)} - ${this.formatDate(rental.rental_return_date)}
              </div>
              <a href="/product?sku=${encodeURIComponent(sku)}" style="font-size: 11px; color: #000; text-decoration: underline; margin-top: 4px;">View item</a>
            </div>
          </div>
        `;
      }).join('');
    }

    backdrop.style.display = 'block';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  openPurchaseModal(rentalId) {
    console.log('👕 Open purchase modal for rental:', rentalId);
    // TODO: Implement purchase flow
    alert('Purchase flow coming soon! Rental ID: ' + rentalId);
  }
};

// Close history modal
function closeRentalHistoryModal() {
  const modal = document.getElementById('rental-history-modal');
  const backdrop = document.getElementById('rental-history-backdrop');

  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
}

window.closeRentalHistoryModal = closeRentalHistoryModal;

// Escape key and backdrop click handlers
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const historyModal = document.getElementById('rental-history-modal');
    if (historyModal && historyModal.style.display === 'flex') {
      closeRentalHistoryModal();
      return;
    }
  }
});

document.addEventListener('click', function(e) {
  if (e.target.id === 'rental-history-backdrop') {
    closeRentalHistoryModal();
  }
});

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