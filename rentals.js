// ============================================
// MY RENTALS PAGE - WITH PURCHASE FUNCTIONALITY
// Host on GitHub or add to Page Body Code
// ============================================

window.RentalsManager = {
  API_BASE: window.API_BASE_URL,
  _activeRentalsCache: null,
  _historyCache: null,
  _pricingCategories: null,

  // Fetch pricing categories for price lookup
  async fetchPricingCategories() {
    if (this._pricingCategories) return this._pricingCategories;
    
    try {
      const response = await fetch(`${this.API_BASE}/clothing_items/pricing_categories`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        this._pricingCategories = await response.json();
        console.log('💰 Pricing categories loaded:', this._pricingCategories.length);
      }
    } catch (err) {
      console.error('Error fetching pricing categories:', err);
    }
    
    return this._pricingCategories;
  },

  // Get retail price for an item based on pricing category
  getRetailPrice(clothingItem) {
    if (!this._pricingCategories || !clothingItem?.category?.pricing_group) return null;
    
    const pricingGroup = clothingItem.category.pricing_group;
    const isFastFashion = clothingItem.brand?.is_fast_fashion || false;
    
    const match = this._pricingCategories.find(pc => 
      pc.display_name === pricingGroup && pc.is_fast_fashion === isFastFashion
    );
    
    return match?.retail_price_cents || null;
  },

  // Calculate purchase price (50% off retail)
  getPurchasePrice(clothingItem) {
    const retailPrice = this.getRetailPrice(clothingItem);
    if (!retailPrice) return null;
    return Math.round(retailPrice * 0.5);
  },

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

  formatPrice(cents) {
    if (cents === null || cents === undefined) return '€0.00';
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
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

  // Check if item is already in cart
  isInCart(clothingItemId) {
    if (!window.PurchaseCart) return false;
    return window.PurchaseCart.hasItem(clothingItemId);
  },

  // Add rental item to purchase cart
  addToCart(rentalId) {
    const rental = this._activeRentalsCache?.find(r => r.id === rentalId);
    if (!rental) {
      console.error('Rental not found:', rentalId);
      return;
    }

    const ci = rental.clothing_item;
    if (!ci) {
      console.error('No clothing item data for rental:', rentalId);
      return;
    }

    const retailPrice = this.getRetailPrice(ci);
    const purchasePrice = this.getPurchasePrice(ci);

    if (!retailPrice) {
      console.error('Could not determine price for item:', ci.sku);
      alert('Unable to determine price for this item. Please try again later.');
      return;
    }

    const cartItem = {
      clothing_item_id: ci.id,
      rental_id: rental.id,
      sku: ci.sku || '',
      name: ci.name || 'Unknown Item',
      brand: ci.brand?.brand_name || '',
      image_url: this.getItemImage(rental),
      size: ci.size?.size || ci.size?.standard_size?.standard_size || '',
      colors: ci.colors?.map(c => c.name).join(', ') || '',
      retail_price_cents: retailPrice,
      purchase_price_cents: purchasePrice
    };

    if (window.PurchaseCart) {
      window.PurchaseCart.addItem(cartItem);
      // Re-render to update button state
      this.renderRentalsPage();
    } else {
      console.error('PurchaseCart not available');
      alert('Unable to add to cart. Please refresh the page and try again.');
    }
  },

  // Remove item from cart
  removeFromCart(clothingItemId) {
    if (window.PurchaseCart) {
      window.PurchaseCart.removeItem(clothingItemId);
      // Re-render to update button state
      this.renderRentalsPage();
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
    
    // Pricing
    const retailPrice = this.getRetailPrice(ci);
    const purchasePrice = this.getPurchasePrice(ci);
    const hasPrice = retailPrice && purchasePrice;
    
    // Cart state
    const inCart = this.isInCart(ci?.id);

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
          
          ${hasPrice ? `
            <div class="rental-card-purchase-section">
              <div class="rental-card-purchase-label">Want to keep it?</div>
              <div class="rental-card-purchase-prices">
                <span class="price-original">${this.formatPrice(retailPrice)}</span>
                <span class="price-discount">${this.formatPrice(purchasePrice)}</span>
                <span class="price-badge">50% off</span>
              </div>
            </div>
          ` : ''}
          
          <div class="rental-card-actions">
            <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-link">View item</a>
            ${hasPrice ? `
              ${inCart ? `
                <button onclick="RentalsManager.removeFromCart(${ci.id})" class="rental-card-btn rental-card-btn-in-cart">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  In Cart
                </button>
              ` : `
                <button onclick="RentalsManager.addToCart(${rental.id})" class="rental-card-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </button>
              `}
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryItem(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const name = ci?.name || 'Unknown Item';
    const brand = ci?.brand?.brand_name || '';
    const sku = ci?.sku || '';
    const returnDate = this.formatDate(rental.rental_return_date);

    return `
      <a href="/product?sku=${encodeURIComponent(sku)}" class="history-item">
        <div class="history-item-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
        <div class="history-item-content">
          ${brand ? `<div class="history-item-brand">${brand}</div>` : ''}
          <div class="history-item-name">${name}</div>
          <div class="history-item-date">Returned: ${returnDate}</div>
        </div>
      </a>
    `;
  },

  async renderRentalsPage() {
    console.log('👕 Rendering rentals page...');

    const loadingEl = document.getElementById('rentals-loading');
    const emptyEl = document.getElementById('rentals-empty');
    const activeSection = document.getElementById('rentals-active');
    const historySection = document.getElementById('rentals-history');
    const activeList = document.getElementById('active-rentals-list');
    const historyList = document.getElementById('history-rentals-list');

    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeSection) activeSection.style.display = 'none';
    if (historySection) historySection.style.display = 'none';

    // Fetch pricing categories first
    await this.fetchPricingCategories();

    // Fetch rentals with history
    const rentals = await this.fetchRentals(true);

    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';

    if (!rentals || rentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      return;
    }

    // Split into active and history
    const activeRentals = rentals.filter(r => r.active && !r.rental_return_date);
    const historyRentals = rentals.filter(r => !r.active || r.rental_return_date);

    // Cache active rentals for cart functionality
    this._activeRentalsCache = activeRentals;

    // Render active rentals
    if (activeRentals.length > 0 && activeList && activeSection) {
      activeList.innerHTML = activeRentals.map(r => this.renderActiveRentalCard(r)).join('');
      activeSection.style.display = 'block';
    }

    // Render history
    if (historyRentals.length > 0 && historyList && historySection) {
      historyList.innerHTML = historyRentals.map(r => this.renderHistoryItem(r)).join('');
      historySection.style.display = 'block';
    }

    // Show empty state if no active rentals
    if (activeRentals.length === 0 && historyRentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
    }
  }
};

// Global function for modal close (if needed)
window.closeRentalModal = function() {
  const modal = document.getElementById('rental-detail-modal');
  const backdrop = document.getElementById('rental-detail-backdrop');
  if (modal) modal.classList.remove('rental-modal-open');
  if (backdrop) backdrop.classList.remove('rental-modal-backdrop-open');
  document.body.style.overflow = '';
};

// Close on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.id === 'rental-detail-backdrop') {
    closeRentalModal();
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
                <button onclick="openAuthModal()" class="rentals-signin-btn">Sign In</button>
              </div>
            `;
          }
        }
      }
    };

    initRentals();
  }
});
