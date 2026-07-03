// ============================================
// LOCALIZATION (page content is JS-rendered, so .lang spans can't be used here)
// ============================================
function isNL() {
  if (window.DematI18n && window.DematI18n.isNL) return window.DematI18n.isNL();
  return (document.documentElement.lang || '').toLowerCase().indexOf('nl') === 0;
}

var RENTALS_T = {
  unknownItem:    { en: 'unknown item', nl: 'onbekend item' },
  rentedOn:       { en: 'rented on', nl: 'gehuurd op' },
  wantToKeep:     { en: 'want to keep it?', nl: 'wil je het houden?' },
  percentOff:     { en: '50% off', nl: '50% korting' },
  inCart:         { en: 'in cart', nl: 'in winkelmand' },
  addToCartLabel: { en: 'add to cart', nl: 'toevoegen aan winkelmand' },
  viewItem:       { en: 'view item', nl: 'bekijk item' },
  purchasedOn:    { en: 'purchased on', nl: 'gekocht op' },
  returnedOn:     { en: 'returned on', nl: 'geretourneerd op' },
  returnedWord:   { en: 'returned', nl: 'geretourneerd' },
  purchasedWord:  { en: 'purchased', nl: 'gekocht' },
  onWord:         { en: 'on', nl: 'op' },
  rentalDetails:  { en: 'rental details', nl: 'huurgegevens' },
  priceError:     { en: 'Unable to determine price for this item. Please try again later.', nl: 'kan de prijs van dit item niet bepalen. probeer het later opnieuw.' },
  addError:       { en: 'Unable to add to cart. Please refresh the page and try again.', nl: 'kan niet aan winkelmand toevoegen. ververs de pagina en probeer opnieuw.' },
  signinTitle:    { en: 'sign in to view your rentals', nl: 'log in om je verhuur te bekijken' },
  signinText:     { en: 'you need to be logged in to see your rentals.', nl: 'je moet ingelogd zijn om je verhuur te zien.' },
  signin:         { en: 'sign in', nl: 'inloggen' }
};
function t(key) {
  var e = RENTALS_T[key];
  return e ? (isNL() ? e.nl : e.en) : '';
}
// Pluralization helper ('item' is invariant in both languages)
function itemsWord(n) { return isNL() ? 'items' : (n === 1 ? 'item' : 'items'); }

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

    if (!window.auth0Client) {
      console.error('Auth0 not initialized');
      return null;
    }

    try {
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      if (!isAuthenticated) {
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
    return date.toLocaleDateString(isNL() ? 'nl-NL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toLowerCase();
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
      window.location.href = (isNL() ? '/nl/product' : '/product') + '?sku=' + encodeURIComponent(sku);
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
      alert(t('priceError'));
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
      alert(t('addError'));
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
    const name = ci?.name?.toLowerCase() || t('unknownItem');
    const sku = ci?.sku || '';
    
    // Pricing
    const retailPrice = this.getRetailPrice(ci);
    const purchasePrice = this.getPurchasePrice(ci);
    const hasPrice = retailPrice && purchasePrice;
    
    // Cart state
    const inCart = this.isInCart(ci?.id);

    return `
      <div class="rental-card">
        <a href="${isNL() ? '/nl/product' : '/product'}?sku=${encodeURIComponent(sku)}" class="rental-card-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" loading="lazy">` : ''}
        </a>
        <div class="rental-card-content">
          <div class="rental-card-name">${name}</div>
          <div class="rental-card-date">${t('rentedOn')} ${this.formatDate(rental.rental_start_date)}</div>
          
          ${hasPrice ? `
            <div class="rental-card-purchase-section">
              <div class="rental-card-purchase-label">${t('wantToKeep')}</div>
              <div class="rental-card-purchase-prices">
                <span class="price-original">${this.formatPrice(retailPrice)}</span>
                <span class="price-discount">${this.formatPrice(purchasePrice)}</span>
                <span class="price-badge">${t('percentOff')}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="rental-card-actions">
            ${hasPrice ? `
              ${inCart ? `
                <button onclick="RentalsManager.removeFromCart(${ci.id})" class="rental-card-btn rental-card-btn-in-cart">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  ${t('inCart')}
                </button>
              ` : `
                <button onclick="RentalsManager.addToCart(${rental.id})" class="rental-card-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  ${t('addToCartLabel')}
                </button>
              `}
            ` : ''}
            <a href="${isNL() ? '/nl/product' : '/product'}?sku=${encodeURIComponent(sku)}" class="rental-card-link">${t('viewItem')}</a>
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryItem(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const name = ci?.name?.toLowerCase() || t('unknownItem');
    const sku = ci?.sku || '';

    return `
      <a href="${isNL() ? '/nl/product' : '/product'}?sku=${encodeURIComponent(sku)}" class="history-modal-item">
        <div class="history-modal-item-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
        <div class="history-modal-item-info">
          <div class="history-modal-item-name">${name}</div>
        </div>
      </a>
    `;
  },

  // ── Date Grouping for History ───
  formatDateKey(dateString) {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  },

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
    const maxThumbs = 3;
    const extraCount = count - maxThumbs;

    const purchasedCount = group.rentals.filter(r => 
      r.clothing_item?.status?.toLowerCase() === 'sold'
    ).length;
    const returnedCount = count - purchasedCount;

    // Build the date label
    let dateLabel;
    if (purchasedCount === count) {
      dateLabel = t('purchasedOn') + ' ' + group.displayDate;
    } else if (returnedCount === count) {
      dateLabel = t('returnedOn') + ' ' + group.displayDate;
    } else {
      dateLabel = returnedCount + ' ' + t('returnedWord') + ' & ' + purchasedCount + ' ' + t('purchasedWord') + ' ' + t('onWord') + ' ' + group.displayDate;
    }

    const itemLabel = count + ' ' + itemsWord(count);

    const thumbs = group.rentals.slice(0, maxThumbs).map((r, index) => {
      const imgUrl = this.getItemImage(r);
      const name = r.clothing_item?.name || 'item';
      return `
        <div class="history-group-thumb" style="z-index: ${maxThumbs - index}; left: ${index * 28}px;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
        </div>
      `;
    }).join('');

    const moreIndicator = extraCount > 0 ? `
      <div class="history-group-more-badge" style="left: ${(Math.min(count, maxThumbs) * 28) - 6}px;">
        +${extraCount}
      </div>
    ` : '';

    const imageWidth = Math.min(count, maxThumbs) * 28 + 30;

    return `
      <div class="history-group" onclick="RentalsManager.openGroupModal('${group.dateKey}')">
        <div class="history-group-header">
          <div class="history-group-images" style="width: ${imageWidth}px;">
            ${thumbs}
            ${moreIndicator}
          </div>
          <div class="history-group-info">
            <div class="history-group-date">${dateLabel}</div>
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

  // ── Modal: Grouped History ─────────────────
  openGroupModal(dateKey) {

    const rentals = (this._historyCache || []).filter(r =>
      (r.status === 'Returned' || r.rental_return_date) && this.formatDateKey(r.rental_return_date) === dateKey
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
      const purchasedCount = rentals.filter(r => 
        r.clothing_item?.status?.toLowerCase() === 'sold'
      ).length;
      const returnedCount = rentals.length - purchasedCount;

      if (purchasedCount === rentals.length) {
        modalTitle.textContent = rentals.length + ' ' + itemsWord(rentals.length) + ' ' + t('purchasedWord');
      } else if (returnedCount === rentals.length) {
        modalTitle.textContent = rentals.length === 1 
          ? t('rentalDetails') 
          : rentals.length + ' ' + itemsWord(rentals.length) + ' ' + t('returnedWord');
      } else {
        modalTitle.textContent = returnedCount + ' ' + t('returnedWord') + ' & ' + purchasedCount + ' ' + t('purchasedWord');
      }
    }

    // Render items in modal
    if (modalContent) {
      modalContent.innerHTML = `
        <div class="history-modal-items">
          ${rentals.map(r => this.renderHistoryItem(r)).join('')}
        </div>
      `;
    }

    // Show modal
    modal.classList.add('rental-modal-open');
    backdrop.classList.add('rental-modal-backdrop-open');
    document.body.style.overflow = 'hidden';
  },

  async renderRentalsPage() {

    const loadingEl = document.getElementById('rentals-loading');
    const emptyEl = document.getElementById('rentals-empty');
    const activeSection = document.getElementById('rentals-active');
    const historySection = document.getElementById('rentals-history');
    const activeList = document.getElementById('active-rentals-list');
    const historyList = document.getElementById('history-rentals-list');
    const noActiveEl = document.getElementById('rentals-no-active');

    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeSection) activeSection.style.display = 'none';
    if (historySection) historySection.style.display = 'none';
    if (noActiveEl) noActiveEl.style.display = 'none';

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

    // Split into active and returned
    const activeRentals = rentals.filter(r => r.active && !r.rental_return_date);
    const returnedRentals = rentals.filter(r => !r.active || r.rental_return_date);
    
    // Sort returned rentals by date descending
    returnedRentals.sort((a, b) => new Date(b.rental_return_date) - new Date(a.rental_return_date));

    // Cache for modal access
    this._activeRentalsCache = activeRentals;
    this._historyCache = returnedRentals;

    // Always show active section if we have any rentals
    if (activeSection) activeSection.style.display = 'block';

    // Render active rentals or show "no active" message
    if (activeRentals.length > 0 && activeList) {
      activeList.innerHTML = activeRentals.map(r => this.renderActiveRentalCard(r)).join('');
      if (noActiveEl) noActiveEl.style.display = 'none';
    } else {
      if (activeList) activeList.innerHTML = '';
      if (noActiveEl) noActiveEl.style.display = 'flex';
    }

    // Render grouped history
    if (returnedRentals.length > 0 && historyList && historySection) {
      const historyGroups = this.groupHistoryByDate(returnedRentals);
      historyList.innerHTML = historyGroups.map(g => this.renderHistoryGroup(g)).join('');
      historySection.style.display = 'block';
    }

    // Show empty state only if NO rentals at all
    if (activeRentals.length === 0 && returnedRentals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      if (activeSection) activeSection.style.display = 'none';
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

    const initRentals = async () => {
      let attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.auth0Client) {
        const isAuth = await window.auth0Client.isAuthenticated();
        if (isAuth) {
          // Check membership status first
          try {
            const token = await window.auth0Client.getTokenSilently();
            const userResponse = await fetch(`${window.API_BASE_URL}/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              
              if (!userData.stripe_id) {
                // No membership — show the no-membership state
                const loadingEl = document.getElementById('rentals-loading');
                const noMembershipEl = document.getElementById('rentals-no-membership');
                const contactEl = document.getElementById('rentals-contact');
                
                if (loadingEl) loadingEl.style.display = 'none';
                if (noMembershipEl) noMembershipEl.style.display = 'flex';
                if (contactEl) contactEl.style.display = 'none';
                return;
              }
            }
          } catch (err) {
            console.error('Error checking membership:', err);
          }

          // Has membership — render rentals as normal
          RentalsManager.renderRentalsPage();
        } else {
          const container = document.getElementById('rentals-container');
          if (container) {
            container.innerHTML = `
              <div class="rentals-signin">
                <h2 class="rentals-signin-title">${t('signinTitle')}</h2>
                <p class="rentals-signin-text">${t('signinText')}</p>
                <button onclick="openAuthModal()" class="rentals-signin-btn">${t('signin')}</button>
              </div>
            `;
          }
        }
      }
    };

    initRentals();
  }
});
