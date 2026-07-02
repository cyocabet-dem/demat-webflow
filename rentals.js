// ============================================
// MY RENTALS PAGE - WITH PURCHASE FUNCTIONALITY
// Host on GitHub or add to Page Body Code
// ============================================

window.RentalsManager = {
  API_BASE: window.API_BASE_URL,
  _activeRentalsCache: null,
  _historyCache: null,
  _pricingCategories: null,
  _returnAllowance: null,
  _returnSelection: null,

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
    return date.toLocaleDateString('en-GB', {
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
    const name = ci?.name?.toLowerCase() || 'unknown item';
    const sku = ci?.sku || '';
    
    // Pricing
    const retailPrice = this.getRetailPrice(ci);
    const purchasePrice = this.getPurchasePrice(ci);
    const hasPrice = retailPrice && purchasePrice;
    
    // Cart state
    const inCart = this.isInCart(ci?.id);

    // Return state — item is on its way back to us.
    const inReturn = this.isInReturn(rental);

    return `
      <div class="rental-card">
        <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" loading="lazy">` : ''}
        </a>
        <div class="rental-card-content">
          <div class="rental-card-name">${name}${inReturn ? ' <span class="rr-status-pill">in return</span>' : ''}</div>
          <div class="rental-card-date">rented on ${this.formatDate(rental.rental_start_date)}</div>

          ${(!inReturn && hasPrice) ? `
            <div class="rental-card-purchase-section">
              <div class="rental-card-purchase-label">want to keep it?</div>
              <div class="rental-card-purchase-prices">
                <span class="price-original">${this.formatPrice(retailPrice)}</span>
                <span class="price-discount">${this.formatPrice(purchasePrice)}</span>
                <span class="price-badge">50% off</span>
              </div>
            </div>
          ` : ''}

          <div class="rental-card-actions">
            ${(!inReturn && hasPrice) ? `
              ${inCart ? `
                <button onclick="RentalsManager.removeFromCart(${ci.id})" class="rental-card-btn rental-card-btn-in-cart">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  in cart
                </button>
              ` : `
                <button onclick="RentalsManager.addToCart(${rental.id})" class="rental-card-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  add to cart
                </button>
              `}
            ` : ''}
            <a href="/product?sku=${encodeURIComponent(sku)}" class="rental-card-link">view item</a>
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryItem(rental) {
    const ci = rental.clothing_item;
    const imgUrl = this.getItemImage(rental);
    const name = ci?.name?.toLowerCase() || 'unknown item';
    const sku = ci?.sku || '';

    return `
      <a href="/product?sku=${encodeURIComponent(sku)}" class="history-modal-item">
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
      dateLabel = `purchased on ${group.displayDate}`;
    } else if (returnedCount === count) {
      dateLabel = `returned on ${group.displayDate}`;
    } else {
      dateLabel = `${returnedCount} returned & ${purchasedCount} purchased on ${group.displayDate}`;
    }

    const itemLabel = count === 1 ? '1 item' : `${count} items`;

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
        modalTitle.textContent = `${rentals.length} item${rentals.length !== 1 ? 's' : ''} purchased`;
      } else if (returnedCount === rentals.length) {
        modalTitle.textContent = rentals.length === 1 
          ? 'rental details' 
          : `${rentals.length} items returned`;
      } else {
        modalTitle.textContent = `${returnedCount} returned & ${purchasedCount} purchased`;
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

  // ── Returns (home-delivery members only) ──────────────────
  // Eligibility + allowance come from GET /returns/allowance. The backend is
  // always the source of truth; the button/labels here are cosmetic. Local
  // members get `applicable: false` and see nothing new.
  async fetchReturnAllowance() {
    if (!window.auth0Client) return null;
    try {
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${this.API_BASE}/returns/allowance`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!response.ok) {
        console.error('Failed to fetch return allowance:', response.status);
        this._returnAllowance = null;
        return null;
      }
      this._returnAllowance = await response.json();
      return this._returnAllowance;
    } catch (err) {
      console.error('Error fetching return allowance:', err);
      this._returnAllowance = null;
      return null;
    }
  },

  isInReturn(rental) {
    return (rental?.clothing_item?.status || '').toLowerCase() === 'in return';
  },

  // Currently-rented items that can still be sent back (not already in return).
  selectableReturnItems() {
    return (this._activeRentalsCache || []).filter(r => r.clothing_item && !this.isInReturn(r));
  },

  // Places the "request return" button + "N returns left" line next to the
  // "currently renting" heading. Reuses the page's own button style (.rental-card-btn).
  renderReturnControls() {
    const activeSection = document.getElementById('rentals-active');
    if (!activeSection) return;
    const titleEl = activeSection.querySelector('.rentals-section-title');
    if (!titleEl) return;

    const allowance = this._returnAllowance;
    // Home-delivery members always get the button (local members are the only
    // ones who see nothing). It attaches inside #rentals-active, so it's only
    // visible once that section is — i.e. when the member has any rentals.
    const shouldShow = !!(allowance && allowance.applicable);

    let controls = document.getElementById('rentals-return-controls');
    if (!shouldShow) {
      if (controls) controls.remove();
      return;
    }

    // Wrap the heading so the title and controls share one row.
    let header = activeSection.querySelector('.rr-active-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'rr-active-header';
      titleEl.parentNode.insertBefore(header, titleEl);
      header.appendChild(titleEl);
    }
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'rentals-return-controls';
      controls.className = 'rr-controls';
      header.appendChild(controls);
    }

    const remaining = allowance.returnsRemaining;
    const used = remaining <= 0;
    const resetDate = this.formatDate(allowance.resetDate);
    const leftLabel = remaining === 1 ? '1 return left this month' : `${remaining} returns left this month`;

    controls.innerHTML = `
      <button type="button" id="rentals-request-return-btn" class="rental-card-btn"
        onclick="RentalsManager.openReturnModal()" ${used ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
        </svg>
        request return
      </button>
      ${used
        ? `<p class="rr-returns-left">you've used your returns this month — resets on ${resetDate}</p>`
        : `<p class="rr-returns-left">${leftLabel}</p>`}
    `;
  },

  openReturnModal() {
    const allowance = this._returnAllowance;
    if (!allowance || !allowance.applicable || allowance.returnsRemaining <= 0) return;

    this._returnSelection = new Set();
    this._renderReturnStep('select');

    const modal = document.getElementById('rental-detail-modal');
    const backdrop = document.getElementById('rental-detail-backdrop');
    if (!modal || !backdrop) { console.error('Modal elements not found.'); return; }
    modal.classList.add('rental-modal-open');
    backdrop.classList.add('rental-modal-backdrop-open');
    document.body.style.overflow = 'hidden';
  },

  _setModalTitle(text) {
    const t = document.querySelector('.rental-modal-title');
    if (t) t.textContent = text;
  },

  _renderReturnStep(step, errorMsg) {
    const content = document.getElementById('rental-modal-content');
    if (!content) return;
    if (step === 'select') {
      this._setModalTitle('request a return');
      content.innerHTML = this._returnSelectHTML();
    } else if (step === 'confirm') {
      this._setModalTitle('confirm your return');
      content.innerHTML = this._returnConfirmHTML(errorMsg);
    }
  },

  // Step 1 — select items. Rows echo the active-rentals cards (.rental-card).
  _returnSelectHTML() {
    const items = this.selectableReturnItems();
    if (items.length === 0) {
      const hasActive = (this._activeRentalsCache || []).length > 0;
      const emptyMsg = hasActive
        ? 'all your current rentals are already on their way back.'
        : "you don't have any items to return right now.";
      return `
        <p class="rr-intro">${emptyMsg}</p>
        <div class="rr-actions">
          <button type="button" class="rental-card-btn" onclick="closeRentalModal()">close</button>
        </div>`;
    }

    const rows = items.map(r => {
      const ci = r.clothing_item;
      const imgUrl = this.getItemImage(r);
      const name = ci?.name?.toLowerCase() || 'unknown item';
      const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
      const tag = ci?.rfid_id || ci?.sku || '';
      const checked = this._returnSelection.has(ci.id) ? 'checked' : '';
      return `
        <label class="rr-select-row">
          <input type="checkbox" class="rr-checkbox" value="${ci.id}" ${checked}
            onchange="RentalsManager.toggleReturnItem(${ci.id}, this.checked)">
          <div class="rental-card">
            <div class="rental-card-image">
              ${imgUrl ? `<img src="${imgUrl}" alt="${name}" loading="lazy">` : ''}
            </div>
            <div class="rental-card-content">
              <div class="rental-card-name">${name}</div>
              ${size ? `<div class="rental-card-date">size ${size.toLowerCase()}</div>` : ''}
              ${tag ? `<div class="rental-card-date">tag ${tag}</div>` : ''}
            </div>
          </div>
        </label>`;
    }).join('');

    return `
      <p class="rr-intro">select the items you'd like to send back.</p>
      <div class="rr-select-list">${rows}</div>
      <div class="rr-actions">
        <button type="button" id="rr-select-next" class="rental-card-btn" onclick="RentalsManager.goToReturnConfirm()">
          continue
        </button>
      </div>`;
  },

  toggleReturnItem(itemId, checked) {
    if (!this._returnSelection) this._returnSelection = new Set();
    if (checked) this._returnSelection.add(itemId);
    else this._returnSelection.delete(itemId);
    const warn = document.getElementById('rr-select-warn');
    if (warn && this._returnSelection.size > 0) warn.remove();
  },

  goToReturnConfirm() {
    // Guard: block submitting zero items.
    if (!this._returnSelection || this._returnSelection.size === 0) {
      const list = document.querySelector('.rr-select-list');
      if (list && !document.getElementById('rr-select-warn')) {
        const warn = document.createElement('p');
        warn.id = 'rr-select-warn';
        warn.className = 'rr-error';
        warn.textContent = 'please select at least one item to return.';
        list.parentNode.insertBefore(warn, list.nextSibling);
      }
      return;
    }
    this._renderReturnStep('confirm');
  },

  // Step 2 — confirm. Recap of the selected items + what happens next.
  _returnConfirmHTML(errorMsg) {
    const ids = Array.from(this._returnSelection);
    const items = (this._activeRentalsCache || []).filter(r => r.clothing_item && ids.includes(r.clothing_item.id));
    const rows = items.map(r => {
      const ci = r.clothing_item;
      const imgUrl = this.getItemImage(r);
      const name = ci?.name?.toLowerCase() || 'unknown item';
      const size = ci?.size?.size || ci?.size?.standard_size?.standard_size || '';
      return `
        <div class="rr-recap-item">
          <div class="rr-recap-thumb">${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}</div>
          <div class="rr-recap-info">
            <div class="rental-card-name">${name}</div>
            ${size ? `<div class="rental-card-date">size ${size.toLowerCase()}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="rr-recap-list">${rows}</div>
      <div class="rr-note">you'll get one postnl qr code to drop off — no printer needed.</div>
      ${errorMsg ? `<p class="rr-error">${errorMsg}</p>` : ''}
      <div class="rr-actions">
        <a class="rental-card-link" onclick="RentalsManager._renderReturnStep('select')">back</a>
        <button type="button" id="rr-confirm-btn" class="rental-card-btn" onclick="RentalsManager.submitReturn()">
          confirm return
        </button>
      </div>`;
  },

  // Step 3 — submit to POST /returns with the page's Auth0 token, then show the QR.
  async submitReturn() {
    const ids = Array.from(this._returnSelection || []);
    if (ids.length === 0) return; // guard: zero items

    const btn = document.getElementById('rr-confirm-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="rr-spin"></span> creating your return…`;
    }

    try {
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${this.API_BASE}/returns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ itemIds: ids })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('Return request failed:', response.status, data);
        const detail = data && data.detail;
        let message;
        if (detail && typeof detail === 'object' && detail.message) {
          // Allowance rejection — surface the backend message (incl. reset date).
          message = detail.message;
        } else if (typeof detail === 'string') {
          message = detail;
        } else {
          message = "we couldn't create your return right now. please try again.";
        }
        // Keep the selection, stay on confirm, show the error, restore the button.
        this._renderReturnStep('confirm', String(message).toLowerCase());
        return;
      }

      // Success — update the page without a full reload.
      this._markItemsInReturn(ids);
      if (this._returnAllowance && typeof this._returnAllowance.returnsRemaining === 'number') {
        this._returnAllowance.returnsRemaining = Math.max(0, this._returnAllowance.returnsRemaining - 1);
        this._returnAllowance.returnsUsed = (this._returnAllowance.returnsUsed || 0) + 1;
      }
      this._rerenderActive();
      this._renderReturnDone(data);

    } catch (err) {
      console.error('Error creating return:', err);
      this._renderReturnStep('confirm', 'something went wrong. please try again.');
    }
  },

  _markItemsInReturn(ids) {
    (this._activeRentalsCache || []).forEach(r => {
      if (r.clothing_item && ids.includes(r.clothing_item.id)) {
        r.clothing_item.status = 'In Return';
      }
    });
  },

  _rerenderActive() {
    const activeList = document.getElementById('active-rentals-list');
    if (activeList && this._activeRentalsCache) {
      activeList.innerHTML = this._activeRentalsCache.map(r => this.renderActiveRentalCard(r)).join('');
    }
    this.renderReturnControls();
  },

  _renderReturnDone(data) {
    this._setModalTitle('your return is ready');
    const content = document.getElementById('rental-modal-content');
    if (!content) return;

    const ref = data?.returnReference || '';
    const qr = data?.qr || '';
    const tracking = data?.trackingUrl || '';
    const items = Array.isArray(data?.items) ? data.items : [];

    // `qr` is a URL (not base64) and may be null while the carrier processes —
    // MyParcel also emails it, so fall back to the reference + a note.
    const qrBlock = qr
      ? `<a class="rr-qr" href="${qr}" target="_blank" rel="noopener">
           <img class="rr-qr-img" src="${qr}" alt="your postnl return qr code" onerror="this.style.display='none'">
         </a>
         <a class="rental-card-link" href="${qr}" target="_blank" rel="noopener">open qr code</a>`
      : `<p class="rr-intro">your qr code is on its way to your inbox — we'll email it to you shortly.</p>`;

    const itemsBlock = items.length
      ? `<div class="rr-recap-list">${items.map(it => `
          <div class="rr-recap-item">
            <div class="rr-recap-info">
              <div class="rental-card-name">${(it.name || '').toLowerCase()}</div>
              ${it.tag ? `<div class="rental-card-date">tag ${it.tag}</div>` : ''}
            </div>
          </div>`).join('')}</div>`
      : '';

    content.innerHTML = `
      <div class="rr-done">
        <p class="rr-intro">drop your items at any postnl point — no printer needed. just show this qr code.</p>
        ${qrBlock}
        ${ref ? `<div class="rr-ref"><span class="rr-ref-label">reference</span> ${ref}</div>` : ''}
        ${tracking ? `<a class="rental-card-link" href="${tracking}" target="_blank" rel="noopener">track your return</a>` : ''}
        ${itemsBlock}
        <div class="rr-actions">
          <button type="button" class="rental-card-btn" onclick="closeRentalModal()">done</button>
        </div>
      </div>`;
  },

  // Supplemental styles for the return flow. New classes only for elements with
  // no existing equivalent; everything else reuses the page's own classes and
  // CSS variables (no hardcoded brand colours, no duplicated shared styles).
  injectReturnStyles() {
    if (document.getElementById('rr-return-styles')) return;
    const style = document.createElement('style');
    style.id = 'rr-return-styles';
    style.textContent = `
      .rr-active-header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
      .rr-active-header .rentals-section-title{margin-bottom:0;}
      .rr-controls{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
      .rr-returns-left{font-size:16px;color:var(--gray-medium);margin:0;text-align:right;}
      #rentals-request-return-btn:disabled{opacity:.5;cursor:not-allowed;}
      #rentals-request-return-btn:disabled:hover{background:var(--purple);}
      .rr-intro{font-size:16px;color:var(--gray-medium);line-height:1.5;margin:0 0 20px 0;}
      .rr-select-list{display:flex;flex-direction:column;gap:12px;}
      .rr-select-row{display:flex;align-items:flex-start;gap:14px;cursor:pointer;}
      .rr-select-row .rental-card{flex:1;margin-bottom:0;}
      .rr-checkbox{width:20px;height:20px;margin-top:22px;flex-shrink:0;accent-color:var(--purple);cursor:pointer;}
      .rr-select-row input:checked + .rental-card{border-color:var(--purple);box-shadow:0 2px 12px rgba(75,7,63,0.08);}
      .rr-actions{display:flex;align-items:center;gap:16px;margin-top:24px;flex-wrap:wrap;}
      .rr-actions .rental-card-link{cursor:pointer;}
      .rr-recap-list{display:flex;flex-direction:column;}
      .rr-recap-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-light);}
      .rr-recap-item:last-child{border-bottom:none;}
      .rr-recap-thumb{width:52px;height:64px;border-radius:10px;overflow:hidden;background:var(--gray-very-light);flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:4px;}
      .rr-recap-thumb img{max-width:100%;max-height:100%;object-fit:contain;}
      .rr-recap-info{min-width:0;}
      .rr-note{background:var(--pink-light);color:var(--purple);border-radius:8px;padding:14px;font-size:16px;line-height:1.5;margin-top:16px;}
      .rr-error{background:#fff4f4;border:1px solid #f3c9c9;color:#a12424;border-radius:8px;padding:12px 14px;font-size:16px;line-height:1.5;margin-top:16px;}
      .rr-spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;}
      .rr-status-pill{display:inline-block;vertical-align:middle;margin-left:8px;font-size:12px;font-weight:600;color:var(--gray-medium);background:var(--gray-very-light);border:1px solid var(--gray-light);border-radius:10px;padding:3px 10px;letter-spacing:.3px;}
      .rr-done{text-align:center;}
      .rr-done .rr-intro{margin-bottom:20px;}
      .rr-done .rental-card-link{display:inline-block;margin-top:12px;}
      .rr-done .rr-actions{justify-content:center;}
      .rr-qr{display:block;}
      .rr-qr-img{width:220px;height:220px;object-fit:contain;border:1px solid var(--gray-light);border-radius:12px;padding:8px;background:#fff;display:block;margin:0 auto;}
      .rr-ref{font-size:16px;color:var(--gray-dark);margin-top:16px;}
      .rr-ref-label{color:var(--gray-medium);}
      .rr-done .rr-recap-list{text-align:left;margin-top:16px;}
    `;
    document.head.appendChild(style);
  },

  async renderRentalsPage() {

    this.injectReturnStyles();

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

    // Return controls next to "currently renting" (home-delivery members only).
    await this.fetchReturnAllowance();
    this.renderReturnControls();

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
                <h2 class="rentals-signin-title">sign in to view your rentals</h2>
                <p class="rentals-signin-text">you need to be logged in to see your rentals.</p>
                <button onclick="openAuthModal()" class="rentals-signin-btn">sign in</button>
              </div>
            `;
          }
        }
      }
    };

    initRentals();
  }
});
