// ============================================
// DONATIONS & STORE CREDIT PAGE FUNCTIONS
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  },
  
  formatCredits(cents) {
    if (cents === null || cents === undefined) return '€0.00';
    return `€${(cents / 100).toFixed(2)}`;
  },
  
  renderCreditBalanceCard() {
    const balance = this._creditBalance;
    
    return `
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #fff; padding: 32px; margin-bottom: 32px; position: relative; overflow: hidden;">
        
        <!-- Decorative elements -->
        <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -40px; right: 60px; width: 80px; height: 80px; border: 1px solid rgba(255,255,255,0.05); border-radius: 50%;"></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 16px;">Available Store Credit</div>
          
          <div style="font-size: 42px; font-weight: 600; letter-spacing: -1px; margin-bottom: 24px;">${this.formatCredits(balance)}</div>
          
          <div style="font-size: 13px; opacity: 0.7; line-height: 1.5;">
            Earn credits by donating your pre-loved clothing.<br>
            Use credits towards eligible purchases in store (online coming soon).
          </div>
        </div>
      </div>
    `;
  },
  
  renderDonationCard(session) {
    const itemCount = session.item_count || 0;
    const credits = session.total_credits_cents || 0;
    const notes = session.notes || '';
    const isActive = session.active;
    
    return `
      <div class="donation-card" style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; margin-bottom: 16px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Donation</div>
            <div style="font-size: 13px; color: #333; font-family: monospace;">#${session.hash_id?.substring(0, 8) || session.id}</div>
          </div>
          ${isActive 
            ? `<span style="display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Processing</span>`
            : `<span style="display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Complete</span>`
          }
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; padding: 12px; background: #fafafa;">
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Date</div>
            <div style="font-size: 13px; color: #333;">${this.formatDate(session.donated_date || session.started_at)}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Items</div>
            <div style="font-size: 13px; color: #333;">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Credits Earned</div>
            <div style="font-size: 13px; color: #065f46; font-weight: 500;">${this.formatCredits(credits)}</div>
          </div>
        </div>
        
        <!-- Notes Section (if present) -->
        ${notes ? `
          <div style="margin-bottom: 16px; padding: 12px; background: #f8f5f0; border-left: 3px solid #d4a574;">
            <div style="font-size: 10px; color: #8b7355; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>📝</span> Notes from Dematerialized
            </div>
            <div style="font-size: 13px; color: #5c4d3d; line-height: 1.5;">${this.escapeHtml(notes)}</div>
          </div>
        ` : ''}
        
        <!-- Actions -->
        <div style="display: flex; gap: 12px;">
          <button onclick="DonationsManager.viewDonation(${session.id})" style="flex: 1; padding: 10px 16px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer;">
            View Details
          </button>
        </div>
        
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
    
    const frontImg = item.images.find(img => 
      img.image_type === 'front' || 
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );
    
    return frontImg?.object_url || item.images[0]?.object_url || '';
  },
  
  renderDetailModalContent(session) {
    const items = session.clothing_items || [];
    const notes = session.notes || '';
    
    const itemsHtml = items.length > 0 ? items.map(item => {
      const imgUrl = this.getItemImage(item);
      const brand = item.brand?.brand_name || '';
      const name = item.name || 'Donated Item';
      const size = item.size?.size || item.size?.standard_size?.standard_size || '';
      const credits = this.getItemCredits(item);
      const sku = item.sku || '';
      const itemUrl = sku ? `/product?sku=${encodeURIComponent(sku)}` : '';
      
      return `
        <a href="${itemUrl}" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f0f0f0; text-decoration: none; color: inherit;${itemUrl ? ' cursor: pointer;' : ' pointer-events: none;'}">
          <div style="width: 80px; height: 107px; background: #f5f5f5; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 8px;">
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : '<div style="color: #ccc; font-size: 24px;">👕</div>'}
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            ${brand ? `<div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${brand}</div>` : ''}
            <div style="font-size: 14px; font-weight: 500; color: #000; line-height: 1.3;">${name}</div>
            ${size ? `<div style="font-size: 12px; color: #666;">Size: ${size}</div>` : ''}
            ${credits !== null ? `
              <div style="font-size: 12px; color: #065f46; margin-top: auto; font-weight: 500;">
                +${this.formatCredits(credits)} credit
              </div>
            ` : ''}
          </div>
        </a>
      `;
    }).join('') : '<div style="padding: 20px; text-align: center; color: #666;">Item details not available</div>';
    
    return `
      <!-- Status Banner -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fafafa; margin-bottom: 20px;">
        ${session.active 
          ? `<span style="display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Processing</span>
             <span style="font-size: 13px; color: #666;">We're reviewing your donated items</span>`
          : `<span style="display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Complete</span>
             <span style="font-size: 13px; color: #666;">Credits have been added to your account</span>`
        }
      </div>
      
      <!-- Summary -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Donation Summary</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Donation Date</div>
            <div style="font-size: 14px; color: #333;">${this.formatDate(session.donated_date || session.started_at)}</div>
          </div>
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Location</div>
            <div style="font-size: 14px; color: #333;">${session.location || 'In-store'}</div>
          </div>
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Items Donated</div>
            <div style="font-size: 14px; color: #333;">${session.item_count || 0} item${(session.item_count || 0) !== 1 ? 's' : ''}</div>
          </div>
          <div style="padding: 12px; background: #d1fae5;">
            <div style="font-size: 10px; color: #065f46; text-transform: uppercase; margin-bottom: 4px;">Total Credits</div>
            <div style="font-size: 14px; color: #065f46; font-weight: 600;">${this.formatCredits(session.total_credits_cents)}</div>
          </div>
        </div>
      </div>
      
      <!-- Notes (if present) -->
      ${notes ? `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f5f0; border-left: 3px solid #d4a574;">
          <div style="font-size: 12px; font-weight: 500; color: #8b7355; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📝</span> Notes from Dematerialized
          </div>
          <div style="font-size: 14px; color: #5c4d3d; line-height: 1.6;">${this.escapeHtml(notes)}</div>
        </div>
      ` : ''}
      
      <!-- Items -->
      <div>
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Donated Items</div>
        <div style="border-top: 1px solid #f0f0f0;">
          ${itemsHtml}
        </div>
      </div>
      
      <!-- How Credits Work -->
      <div style="margin-top: 24px; padding: 16px; background: #f8f8f8;">
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">How Store Credits Work</div>
        <div style="font-size: 13px; color: #666; line-height: 1.6;">
          Store credits can be used towards any material purchase at Dematerialized. Credits don't expire and can be combined with other payment methods.
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
    
    console.log('🎁 Elements found:', { container: !!container, loadingEl: !!loadingEl, emptyEl: !!emptyEl, contentEl: !!contentEl });
    
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
    
    console.log('🎁 Data received:', data);
    console.log('🎁 Credit balance:', this._creditBalance);
    console.log('🎁 Sessions count:', data?.sessions?.length);
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!data) {
      // Error state
      console.error('🎁 No data returned from fetchDonations');
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; background: #fef2f2;">
            <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
            <p style="color: #991b1b; font-size: 14px;">Unable to load donations. Please try again later.</p>
          </div>
        `;
        contentEl.style.display = 'block';
      }
      return;
    }
    
    const sessions = data.sessions || [];
    console.log('🎁 Processing sessions:', sessions.length);
    
    // Always show the credit balance card, even with no donations
    if (contentEl) {
      let html = this.renderCreditBalanceCard();
      
      if (sessions.length === 0) {
        // No donations yet, but show balance and empty state
        html += `
          <div style="text-align: center; padding: 40px 20px; background: #fafafa;">
            <h3 style="font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">No donations yet</h3>
            <p style="font-size: 14px; color: #666; margin: 0 0 20px 0; max-width: 300px; margin-left: auto; margin-right: auto;">
              Bring your pre-loved clothing to Dematerialized and earn store credits!
            </p>
            <a href="/about#donations" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-size: 14px;">
              Learn More
            </a>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Your Donations</div>
            <div style="font-size: 13px; color: #666;">${sessions.length} donation${sessions.length !== 1 ? 's' : ''}</div>
          </div>
        `;
        
        // Render donation cards
        html += sessions.map(s => this.renderDonationCard(s)).join('');
      }
      
      contentEl.innerHTML = html;
      contentEl.style.display = 'block';
      console.log('🎁 Content rendered, HTML length:', html.length);
    }
    
    console.log('🎁 Donations page rendered');
  },
  
  async viewDonation(sessionId) {
    console.log('🎁 View donation:', sessionId);
    
    // Ensure pricing categories are loaded
    await this.fetchPricingCategories();
    
    // First check cache
    let session = this._donationsCache?.find(s => s.id === sessionId);
    
    // If found but no clothing_items detail, fetch the full session
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
    
    // Set content
    if (modalId) {
      modalId.textContent = `#${session.hash_id?.substring(0, 8) || session.id}`;
    }
    
    if (modalContent) {
      modalContent.innerHTML = this.renderDetailModalContent(session);
    }
    
    // Show modal
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

// Auto-initialize on donations page
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('donations-container')) {
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
              <div style="text-align: center; padding: 60px 20px;">
                <h2 style="font-size: 20px; margin-bottom: 12px;">Sign in to view your donations</h2>
                <p style="color: #666; margin-bottom: 20px;">You need to be logged in to see your donation history and store credits.</p>
                <button onclick="openAuthModal()" style="padding: 12px 24px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; cursor: pointer;">
                  Sign In
                </button>
              </div>
            `;
          }
        }
      }
    };
    
    initDonations();
  }
});
