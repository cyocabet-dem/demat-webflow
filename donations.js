// ============================================
// DONATIONS & STORE CREDIT PAGE FUNCTIONS
// Updated to match rentals page design system
// ============================================

window.DonationsManager = {
  API_BASE: window.API_BASE_URL,
  _donationsCache: null,
  _creditBalance: 0,
  _pricingCategories: null,
  
  async fetchPricingCategories() {
    if (this._pricingCategories) return this._pricingCategories;
    
    try {
      const response = await fetch(`${this.API_BASE}/clothing_items/pricing_categories`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        this._pricingCategories = await response.json();
        console.log('🎁 Pricing categories loaded:', this._pricingCategories.length);
      }
    } catch (err) {
      console.error('Error fetching pricing categories:', err);
    }
    
    return this._pricingCategories;
  },
  
  getItemCredits(item) {
    if (!this._pricingCategories || !item.category?.pricing_group) return null;
    
    const pricingGroup = item.category.pricing_group;
    const isFastFashion = item.brand?.is_fast_fashion || false;
    
    const match = this._pricingCategories.find(pc => 
      pc.display_name === pricingGroup && pc.is_fast_fashion === isFastFashion
    );
    
    return match?.store_credits_cents ?? null;
  },
  
  async fetchDonations() {
    console.log('🎁 Fetching donations...');
    
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
      
      const response = await fetch(`${this.API_BASE}/private_clothing_items/donation_session/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch donations:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('🎁 Donations loaded:', data.sessions?.length || 0);
      this._donationsCache = data.sessions || [];
      this._creditBalance = data.credit_balance_cents || 0;
      return data;
      
    } catch (err) {
      console.error('Error fetching donations:', err);
      return null;
    }
  },
  
  formatDate(dateString) {
    if (!dateString) return 'n/a';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).toLowerCase();
  },
  
  formatCredits(cents) {
    if (cents === null || cents === undefined) return '€0.00';
    return `€${(cents / 100).toFixed(2)}`;
  },
  
  renderCreditBalanceCard() {
    const balance = this._creditBalance;
    
    return `
      <div class="donations-balance-card">
        <div class="donations-balance-decor-1"></div>
        <div class="donations-balance-decor-2"></div>
        <div class="donations-balance-inner">
          <div class="donations-balance-label">available store credit</div>
          <div class="donations-balance-amount">${this.formatCredits(balance)}</div>
          <div class="donations-balance-desc">
            earn credits by donating your pre-loved clothing.<br>
            use credits towards eligible purchases in store (online coming soon).
          </div>
        </div>
      </div>
    `;
  },
  
  renderDonationCard(session) {
    const itemCount = session.item_count || 0;
    const credits = session.total_credits_cents || 0;
    const notes = session.notes || '';
    const isComplete = !!session.ended_at;
    
    return `
      <div class="donation-card">
        
        <!-- Header -->
        <div class="donation-card-header">
          <div>
            <div class="donation-card-id-label">donation</div>
            <div class="donation-card-id">#${session.hash_id?.substring(0, 8) || session.id}</div>
          </div>
          ${isComplete 
            ? `<span class="donation-badge donation-badge-complete">complete</span>`
            : `<span class="donation-badge donation-badge-processing">processing</span>`
          }
        </div>
        
        <!-- Stats Grid -->
        <div class="donation-card-stats">
          <div>
            <div class="donation-card-stat-label">date</div>
            <div class="donation-card-stat-value">${this.formatDate(session.donated_date || session.started_at)}</div>
          </div>
          <div>
            <div class="donation-card-stat-label">items</div>
            <div class="donation-card-stat-value">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div class="donation-card-stat-label">credits earned</div>
            <div class="donation-card-stat-value donation-card-stat-value--credits">${this.formatCredits(credits)}</div>
          </div>
        </div>
        
        <!-- Notes Section (if present) -->
        ${notes ? `
          <div class="donation-card-notes">
            <div class="donation-card-notes-label">notes from dematerialized</div>
            <div class="donation-card-notes-text">${this.escapeHtml(notes)}</div>
          </div>
        ` : ''}
        
        <!-- Actions -->
        <button onclick="DonationsManager.viewDonation(${session.id})" class="donation-card-btn">
          view details
        </button>
        
      </div>
    `;
  },
  
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  getItemImage(item) {
    if (!item.images?.length) return '';
    
    // Sort by image_key to prioritize front images
    const sorted = [...item.images].sort((a, b) => {
      const keyA = (a.image_key || a.image_name || '').toLowerCase();
      const keyB = (b.image_key || b.image_name || '').toLowerCase();
      return keyA.localeCompare(keyB);
    });
    
    const frontImg = sorted.find(img => 
      img.image_type === 'front' || 
      (img.image_key && img.image_key.toLowerCase().includes('front')) ||
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );
    
    return frontImg?.object_url || sorted[0]?.object_url || '';
  },
  
  renderDetailModalContent(session) {
    const items = session.clothing_items || [];
    const notes = session.notes || '';
    const isComplete = !!session.ended_at;
    
    const itemsHtml = items.length > 0 ? items.map(item => {
      const imgUrl = this.getItemImage(item);
      const name = (item.name || 'donated item').toLowerCase();
      const credits = this.getItemCredits(item);
      const sku = item.sku || '';
      const itemUrl = sku ? `/product?sku=${encodeURIComponent(sku)}` : '';
      
      return `
        <${itemUrl ? `a href="${itemUrl}"` : 'div'} class="donation-modal-item"${!itemUrl ? ' style="cursor: default;"' : ''}>
          <div class="donation-modal-item-img">
            ${imgUrl 
              ? `<img src="${imgUrl}" alt="${name}">` 
              : '<div class="donation-modal-item-placeholder">👕</div>'}
          </div>
          <div class="donation-modal-item-details">
            <div class="donation-modal-item-name">${name}</div>
            ${credits !== null ? `
              <div class="donation-modal-item-credits">
                +${this.formatCredits(credits)} credit
              </div>
            ` : ''}
            ${itemUrl ? `<span class="donation-modal-item-link">view item →</span>` : ''}
          </div>
        </${itemUrl ? 'a' : 'div'}>
      `;
    }).join('') : '<div style="padding: 20px; text-align: center; color: var(--gray-medium);">item details not available</div>';
    
    return `
      <!-- Status Banner -->
      <div class="donation-modal-status">
        ${isComplete 
          ? `<span class="donation-badge donation-badge-complete">complete</span>
             <span class="donation-modal-status-text">credits have been added to your account</span>`
          : `<span class="donation-badge donation-badge-processing">processing</span>
             <span class="donation-modal-status-text">we're reviewing your donated items</span>`
        }
      </div>
      
      <!-- Summary -->
      <div>
        <div class="donation-modal-summary-title">donation summary</div>
        <div class="donation-modal-summary-grid">
          <div class="donation-modal-summary-item">
            <div class="donation-modal-summary-label">donation date</div>
            <div class="donation-modal-summary-value">${this.formatDate(session.donated_date || session.started_at)}</div>
          </div>
          <div class="donation-modal-summary-item">
            <div class="donation-modal-summary-label">location</div>
            <div class="donation-modal-summary-value">${(session.location || 'in-store').toLowerCase()}</div>
          </div>
          <div class="donation-modal-summary-item">
            <div class="donation-modal-summary-label">items accepted</div>
            <div class="donation-modal-summary-value">${session.item_count || 0} item${(session.item_count || 0) !== 1 ? 's' : ''}</div>
          </div>
          <div class="donation-modal-summary-item donation-modal-summary-item--highlight">
            <div class="donation-modal-summary-label">total credits</div>
            <div class="donation-modal-summary-value donation-modal-summary-value--credits">${this.formatCredits(session.total_credits_cents)}</div>
          </div>
        </div>
      </div>
      
      <!-- Notes (if present) -->
      ${notes ? `
        <div class="donation-modal-notes">
          <div class="donation-modal-notes-label">notes from dematerialized</div>
          <div class="donation-modal-notes-text">${this.escapeHtml(notes)}</div>
        </div>
      ` : ''}
      
      <!-- Items -->
      <div>
        <div class="donation-modal-items-title">donated items</div>
        ${itemsHtml}
      </div>
      
      <!-- How Credits Work -->
      <div class="donation-modal-info">
        <div class="donation-modal-info-title">how store credits work</div>
        <div class="donation-modal-info-text">
          store credits can be used towards any material purchase at dematerialized. credits don't expire and can be combined with other payment methods.
        </div>
      </div>
    `;
  },
  
  async renderDonationsPage() {
    console.log('🎁 renderDonationsPage called');
    
    const container = document.getElementById('donations-container');
    const loadingEl = document.getElementById('donations-loading');
    const emptyEl = document.getElementById('donations-empty');
    const contentEl = document.getElementById('donations-content');
    
    if (!container) {
      console.error('Donations container not found');
      return;
    }
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    
    // Fetch pricing categories and donations
    await this.fetchPricingCategories();
    const data = await this.fetchDonations();
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!data) {
      console.error('🎁 No data returned from fetchDonations');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="donations-error">
            <div class="donations-error-icon">⚠️</div>
            <p class="donations-error-text">unable to load donations. please try again later.</p>
          </div>
        `;
        contentEl.style.display = 'block';
      }
      return;
    }
    
    const sessions = data.sessions || [];
    
    if (contentEl) {
      let html = this.renderCreditBalanceCard();
      
      if (sessions.length === 0) {
        html += `
          <div class="donations-empty">
            <h3 class="donations-empty-title">no donations yet</h3>
            <p class="donations-empty-text">
              bring your pre-loved clothing to dematerialized and earn store credits!
            </p>
            <a href="/about#donations" class="donations-empty-btn">learn more</a>
          </div>
        `;
      } else {
        // Sort by date (newest first)
        sessions.sort((a, b) => {
          const dateA = new Date(a.donated_date || a.started_at);
          const dateB = new Date(b.donated_date || b.started_at);
          return dateB - dateA;
        });
        
        // Section header
        html += `
          <div class="donations-section-header">
            <div class="donations-section-title">your donations</div>
            <div class="donations-section-count">${sessions.length} donation${sessions.length !== 1 ? 's' : ''}</div>
          </div>
        `;
        
        // Render donation cards
        html += sessions.map(s => this.renderDonationCard(s)).join('');
      }
      
      contentEl.innerHTML = html;
      contentEl.style.display = 'block';
    }
    
    console.log('🎁 Donations page rendered');
  },
  
  async viewDonation(sessionId) {
    console.log('🎁 View donation:', sessionId);
    
    await this.fetchPricingCategories();
    
    let session = this._donationsCache?.find(s => s.id === sessionId);
    
    if (!session || !session.clothing_items || session.clothing_items.length === 0) {
      try {
        const token = await window.auth0Client.getTokenSilently();
        const response = await fetch(`${this.API_BASE}/private_clothing_items/donation_session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          session = await response.json();
        }
      } catch (err) {
        console.error('Error fetching donation details:', err);
      }
    }
    
    if (!session) {
      console.error('Donation session not found');
      return;
    }
    
    const modal = document.getElementById('donation-detail-modal');
    const backdrop = document.getElementById('donation-detail-backdrop');
    const modalId = document.getElementById('donation-modal-id');
    const modalContent = document.getElementById('donation-modal-content');
    
    if (!modal || !backdrop) {
      console.error('Detail modal not found');
      return;
    }
    
    if (modalId) {
      modalId.textContent = `#${session.hash_id?.substring(0, 8) || session.id}`;
    }
    
    if (modalContent) {
      modalContent.innerHTML = this.renderDetailModalContent(session);
    }
    
    backdrop.style.display = 'block';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

// Close detail modal function
function closeDonationDetailModal() {
  const modal = document.getElementById('donation-detail-modal');
  const backdrop = document.getElementById('donation-detail-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
}

window.closeDonationDetailModal = closeDonationDetailModal;

// Escape key handler and backdrop click
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const detailModal = document.getElementById('donation-detail-modal');
    if (detailModal && detailModal.style.display === 'flex') {
      closeDonationDetailModal();
      return;
    }
  }
});

document.addEventListener('click', function(e) {
  if (e.target.id === 'donation-detail-backdrop') {
    closeDonationDetailModal();
  }
});

// Auto-initialize
(function() {
  function init() {
    if (!document.getElementById('donations-container')) return;
    
    console.log('🎁 Donations page detected, initializing...');
    
    const initDonations = async () => {
      let attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (window.auth0Client) {
        const isAuth = await window.auth0Client.isAuthenticated();
        if (isAuth) {
          DonationsManager.renderDonationsPage();
        } else {
          const container = document.getElementById('donations-container');
          if (container) {
            container.innerHTML = `
              <div class="donations-signin">
                <h2 class="donations-signin-title">sign in to view your donations</h2>
                <p class="donations-signin-text">you need to be logged in to see your donation history and store credits.</p>
                <button onclick="openAuthModal()" class="donations-signin-btn">sign in</button>
              </div>
            `;
          }
        }
      }
    };
    
    initDonations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
