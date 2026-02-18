// ============================================
// RESERVATIONS PAGE FUNCTIONS
// Updated to match design system
// ============================================

window.ReservationsManager = {
  API_BASE: window.API_BASE_URL,
  _reservationsCache: null,
  
  async fetchReservations() {
    console.log('📋 Fetching reservations...');
    
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
      
      const response = await fetch(`${this.API_BASE}/private_clothing_items/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch reservations:', response.status);
        return null;
      }
      
      const reservations = await response.json();
      console.log('📋 Reservations loaded:', reservations.length);
      this._reservationsCache = reservations;
      return reservations;
      
    } catch (err) {
      console.error('Error fetching reservations:', err);
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
  
  getStatusBadge(status) {
    const styles = {
      'pending':   { cls: 'reservation-badge-pending', label: 'pending' },
      'ready':     { cls: 'reservation-badge-ready', label: 'ready for pickup' },
      'completed': { cls: 'reservation-badge-completed', label: 'completed' },
      'cancelled': { cls: 'reservation-badge-cancelled', label: 'cancelled' },
      'expired':   { cls: 'reservation-badge-expired', label: 'expired' }
    };
    const s = styles[status] || styles['pending'];
    return '<span class="reservation-badge ' + s.cls + '">' + s.label + '</span>';
  },
  
  getStatusText(status) {
    const texts = {
      'pending': 'your items are being prepared',
      'ready': 'your items are ready for pickup!',
      'completed': 'this reservation has been completed',
      'cancelled': 'this reservation was cancelled',
      'expired': 'this reservation has expired'
    };
    return texts[status] || '';
  },
  
  getItemImage(item) {
    if (!item.clothing_item?.images?.length) return '';
    
    const sorted = [...item.clothing_item.images].sort((a, b) => {
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
  
  renderReservationCard(reservation) {
    const itemCount = reservation.items?.length || 0;
    const hasItems = itemCount > 0;
    
    const previewImages = (reservation.items || []).slice(0, 4).map(item => {
      const imgUrl = this.getItemImage(item);
      return '<div class="reservation-card-thumb">' +
        (imgUrl ? '<img src="' + imgUrl + '" alt="">' : '') +
      '</div>';
    }).join('');
    
    const moreCount = itemCount > 4 
      ? '<div class="reservation-card-thumb-more">+' + (itemCount - 4) + '</div>' 
      : '';
    
    return '<div class="reservation-card">' +
      '<div class="reservation-card-header">' +
        '<div>' +
          '<div class="reservation-card-id-label">reservation</div>' +
          '<div class="reservation-card-id">#' + (reservation.hash_id?.substring(0, 8) || reservation.id) + '</div>' +
        '</div>' +
        this.getStatusBadge(reservation.status) +
      '</div>' +
      '<div class="reservation-card-stats">' +
        '<div>' +
          '<div class="reservation-card-stat-label">requested</div>' +
          '<div class="reservation-card-stat-value">' + this.formatDate(reservation.request_date) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="reservation-card-stat-label">ready by</div>' +
          '<div class="reservation-card-stat-value">' + this.formatDate(reservation.ready_for_pickup_date) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="reservation-card-stat-label">pickup by</div>' +
          '<div class="reservation-card-stat-value reservation-card-stat-value--highlight">' + this.formatDate(reservation.reservation_due_date) + '</div>' +
        '</div>' +
      '</div>' +
      (hasItems ? 
        '<div class="reservation-card-items-label">' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + '</div>' +
        '<div class="reservation-card-items-preview">' + previewImages + moreCount + '</div>'
        :
        '<div class="reservation-card-no-items">no items in this reservation</div>'
      ) +
      '<button onclick="ReservationsManager.viewReservation(' + reservation.id + ')" class="reservation-card-btn">view details</button>' +
    '</div>';
  },
  
  renderDetailModalContent(reservation) {
    const items = reservation.items || [];
    
    const itemsHtml = items.map(item => {
      const ci = item.clothing_item;
      const imgUrl = this.getItemImage(item);
      const name = (ci?.name || 'unknown item').toLowerCase();
      const sku = ci?.sku || '';
      const itemUrl = sku ? '/product?sku=' + encodeURIComponent(sku) : '';
      
      const tag = itemUrl ? 'a' : 'div';
      const hrefAttr = itemUrl ? ' href="' + itemUrl + '"' : ' style="cursor: default;"';
      
      return '<' + tag + hrefAttr + ' class="reservation-modal-item">' +
        '<div class="reservation-modal-item-img">' +
          (imgUrl ? '<img src="' + imgUrl + '" alt="' + name + '">' : '') +
        '</div>' +
        '<div class="reservation-modal-item-details">' +
          '<div class="reservation-modal-item-name">' + name + '</div>' +
          '<div class="reservation-modal-item-status ' + (item.picked_up ? 'reservation-modal-item-status--picked-up' : 'reservation-modal-item-status--awaiting') + '">' +
            (item.picked_up ? '✓ picked up' : 'awaiting pickup') +
          '</div>' +
          (itemUrl ? '<span class="reservation-modal-item-link">view item →</span>' : '') +
        '</div>' +
      '</' + tag + '>';
    }).join('');
    
    return '<div class="reservation-modal-status">' +
        this.getStatusBadge(reservation.status) +
        '<span class="reservation-modal-status-text">' + this.getStatusText(reservation.status) + '</span>' +
      '</div>' +
      '<div>' +
        '<div class="reservation-modal-summary-title">reservation details</div>' +
        '<div class="reservation-modal-summary-grid">' +
          '<div class="reservation-modal-summary-item">' +
            '<div class="reservation-modal-summary-label">requested</div>' +
            '<div class="reservation-modal-summary-value">' + this.formatDate(reservation.request_date) + '</div>' +
          '</div>' +
          '<div class="reservation-modal-summary-item">' +
            '<div class="reservation-modal-summary-label">ready for pickup</div>' +
            '<div class="reservation-modal-summary-value">' + this.formatDate(reservation.ready_for_pickup_date) + '</div>' +
          '</div>' +
          '<div class="reservation-modal-summary-item reservation-modal-summary-item--highlight">' +
            '<div class="reservation-modal-summary-label">pickup deadline</div>' +
            '<div class="reservation-modal-summary-value reservation-modal-summary-value--highlight">' + this.formatDate(reservation.reservation_due_date) + '</div>' +
          '</div>' +
          '<div class="reservation-modal-summary-item">' +
            '<div class="reservation-modal-summary-label">items</div>' +
            '<div class="reservation-modal-summary-value">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="reservation-modal-items-title">reserved items</div>' +
        (itemsHtml || '<div style="padding: 20px; text-align: center; color: #46535e;">no items in this reservation</div>') +
      '</div>' +
      '<div class="reservation-modal-location">' +
        '<div class="reservation-modal-location-title">pickup location</div>' +
        '<div class="reservation-modal-location-text">' +
          'dematerialized<br>' +
          'lange putstraat 4<br>' +
          "5211 kn 's-hertogenbosch" +
        '</div>' +
      '</div>';
  },
  
  // Find modal elements - works with old Webflow modal structure
  _getModalElements() {
    var modal = document.getElementById('reservation-detail-modal');
    var backdrop = document.getElementById('reservation-detail-backdrop');
    
    var modalId = null;
    var modalContent = null;
    
    if (modal) {
      // Find the title element (could be .modal-title or new ID)
      modalId = modal.querySelector('.modal-title');
      // Find the content/body area inside THIS modal
      modalContent = modal.querySelector('.modal-body') 
        || modal.querySelector('#detail-modal-content')
        || modal.querySelector('#reservation-modal-content');
    }
    
    console.log('📋 Modal elements found:', {
      modal: !!modal, backdrop: !!backdrop, 
      modalId: !!modalId, modalContent: !!modalContent,
      modalClasses: modal?.className
    });
    
    return { modal: modal, backdrop: backdrop, modalId: modalId, modalContent: modalContent };
  },
  
  async renderReservationsPage() {
    const container = document.getElementById('reservations-container');
    const loadingEl = document.getElementById('reservations-loading');
    const emptyEl = document.getElementById('reservations-empty');
    const listEl = document.getElementById('reservations-list');
    
    if (!container) {
      console.error('Reservations container not found');
      return;
    }
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (listEl) listEl.style.display = 'none';
    
    const reservations = await this.fetchReservations();
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!reservations || reservations.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    
    const validReservations = reservations.filter(r => r.items && r.items.length > 0);
    
    if (validReservations.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    
    validReservations.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
    
    if (listEl) {
      let html = '<div class="reservations-section-header">' +
          '<div class="reservations-section-title">your reservations</div>' +
          '<div class="reservations-section-count">' + validReservations.length + ' reservation' + (validReservations.length !== 1 ? 's' : '') + '</div>' +
        '</div>';
      html += validReservations.map(r => this.renderReservationCard(r)).join('');
      listEl.innerHTML = html;
      listEl.style.display = 'block';
    }
    
    console.log('📋 Reservations page rendered');
  },
  
  viewReservation(reservationId) {
    console.log('📋 View reservation:', reservationId);
    
    const reservation = this._reservationsCache?.find(r => r.id === reservationId);
    
    if (!reservation) {
      console.error('Reservation not found in cache');
      return;
    }
    
    const { modal, backdrop, modalId, modalContent } = this._getModalElements();
    
    if (!modal || !backdrop) {
      console.error('Detail modal not found');
      return;
    }
    
    // Add redesign class for CSS overrides on old modal structure
    modal.classList.add('reservation-modal-redesigned');
    
    if (modalId) {
      modalId.textContent = '#' + (reservation.hash_id?.substring(0, 8) || reservation.id);
    }
    
    if (modalContent) {
      modalContent.innerHTML = this.renderDetailModalContent(reservation);
    }
    
    // Hide old footer/close button if it exists
    const oldFooter = modal.querySelector('.modal-footer');
    if (oldFooter) oldFooter.style.display = 'none';
    
    // Update old label if it exists
    const oldLabel = modal.querySelector('.modal-label');
    if (oldLabel) oldLabel.textContent = 'reservation details';
    
    backdrop.style.display = 'block';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

function closeReservationDetailModal() {
  var modal = document.getElementById('reservation-detail-modal');
  var backdrop = document.getElementById('reservation-detail-backdrop');
  
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
}

window.closeReservationDetailModal = closeReservationDetailModal;

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var detailModal = document.getElementById('reservation-detail-modal');
    if (detailModal && detailModal.style.display === 'flex') {
      closeReservationDetailModal();
      return;
    }
  }
});

document.addEventListener('click', function(e) {
  if (e.target.id === 'reservation-detail-backdrop') {
    closeReservationDetailModal();
  }
});

// Auto-initialize
(function() {
  function init() {
    if (!document.getElementById('reservations-container')) return;
    
    console.log('📋 Reservations page detected, initializing...');
    
    var initReservations = async function() {
      var attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(function(resolve) { setTimeout(resolve, 100); });
        attempts++;
      }
      
      if (window.auth0Client) {
        var isAuth = await window.auth0Client.isAuthenticated();
        if (isAuth) {
          // Check membership status first
          try {
            var token = await window.auth0Client.getTokenSilently();
            var userResponse = await fetch(window.API_BASE_URL + '/users/me', {
              headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
              }
            });

            if (userResponse.ok) {
              var userData = await userResponse.json();
              
              if (!userData.stripe_id) {
                // No membership
                var loadingEl = document.getElementById('reservations-loading');
                var noMembershipEl = document.getElementById('reservations-no-membership');
                
                if (loadingEl) loadingEl.style.display = 'none';
                if (noMembershipEl) noMembershipEl.style.display = 'flex';
                return;
              }
            }
          } catch (err) {
            console.error('Error checking membership:', err);
          }

          // Has membership — render reservations as normal
          ReservationsManager.renderReservationsPage();
        } else {
          var container = document.getElementById('reservations-container');
          if (container) {
            container.innerHTML = '<div class="reservations-signin">' +
              '<h2 class="reservations-signin-title">sign in to view your reservations</h2>' +
              '<p class="reservations-signin-text">you need to be logged in to see your reservations.</p>' +
              '<button onclick="openAuthModal()" class="reservations-signin-btn">sign in</button>' +
            '</div>';
          }
        }
      }
    };
    
    initReservations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
