// ============================================
// RESERVATIONS PAGE FUNCTIONS
// ============================================

window.ReservationsManager = {
  API_BASE: 'https://api.dematerialized.nl',
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
      'pending': { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      'ready': { bg: '#d1fae5', color: '#065f46', label: 'Ready for Pickup' },
      'completed': { bg: '#e0e7ff', color: '#3730a3', label: 'Completed' },
      'cancelled': { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
      'expired': { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' }
    };
    
    const style = statusStyles[status] || statusStyles['pending'];
    return `<span style="display: inline-block; padding: 4px 10px; background: ${style.bg}; color: ${style.color}; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${style.label}</span>`;
  },
  
  getItemImage(item) {
    if (!item.clothing_item?.images?.length) return '';
    
    const frontImg = item.clothing_item.images.find(img => 
      img.image_type === 'front' || 
      (img.image_name && img.image_name.toLowerCase().includes('front'))
    );
    
    return frontImg?.object_url || item.clothing_item.images[0]?.object_url || '';
  },
  
  renderReservationCard(reservation) {
    const itemCount = reservation.items?.length || 0;
    const hasItems = itemCount > 0;
    
    // Get first 3 item images for preview
    const previewImages = (reservation.items || []).slice(0, 3).map(item => {
      const imgUrl = this.getItemImage(item);
      return imgUrl ? `<div style="width: 60px; height: 80px; background: #f5f5f5; overflow: hidden; flex-shrink: 0;">
        <img src="${imgUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
      </div>` : '';
    }).join('');
    
    const moreCount = itemCount > 3 ? `<div style="width: 60px; height: 80px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">+${itemCount - 3}</div>` : '';
    
    return `
      <div class="reservation-card" style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; margin-bottom: 16px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Reservation</div>
            <div style="font-size: 13px; color: #333; font-family: monospace;">#${reservation.hash_id?.substring(0, 8) || reservation.id}</div>
          </div>
          ${this.getStatusBadge(reservation.status)}
        </div>
        
        <!-- Dates -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; padding: 12px; background: #fafafa;">
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Requested</div>
            <div style="font-size: 13px; color: #333;">${this.formatDate(reservation.request_date)}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Ready by</div>
            <div style="font-size: 13px; color: #333;">${this.formatDate(reservation.ready_for_pickup_date)}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">Pickup by</div>
            <div style="font-size: 13px; color: #333; font-weight: 500;">${this.formatDate(reservation.reservation_due_date)}</div>
          </div>
        </div>
        
        <!-- Items Preview -->
        ${hasItems ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
            <div style="display: flex; gap: 8px; overflow-x: auto;">
              ${previewImages}
              ${moreCount}
            </div>
          </div>
        ` : `
          <div style="padding: 16px; background: #fef3c7; font-size: 13px; color: #92400e; margin-bottom: 16px;">
            No items in this reservation
          </div>
        `}
        
        <!-- Actions -->
        <div style="display: flex; gap: 12px;">
          <button onclick="ReservationsManager.viewReservation(${reservation.id})" style="flex: 1; padding: 10px 16px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer;">
            View Details
          </button>
          ${reservation.status === 'pending' ? `
            <button onclick="ReservationsManager.cancelReservation(${reservation.id})" style="padding: 10px 16px; background: transparent; color: #666; border: 1px solid #ddd; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer;">
              Cancel
            </button>
          ` : ''}
        </div>
        
      </div>
    `;
  },
  
  renderDetailModalContent(reservation) {
    const items = reservation.items || [];
    
    const itemsHtml = items.map(item => {
      const ci = item.clothing_item;
      const imgUrl = this.getItemImage(item);
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
            <div style="font-size: 14px; font-weight: 500; color: #000; line-height: 1.3;">${name}</div>
            ${size ? `<div style="font-size: 12px; color: #666;">Size: ${size}</div>` : ''}
            <div style="font-size: 11px; color: #999; margin-top: auto;">
              ${item.picked_up ? '<span style="color: #065f46;">✓ Picked up</span>' : '<span style="color: #92400e;">Awaiting pickup</span>'}
            </div>
            <a href="/product?sku=${encodeURIComponent(sku)}" style="font-size: 11px; color: #000; text-decoration: underline; margin-top: 4px;">View item</a>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <!-- Status Banner -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fafafa; margin-bottom: 20px;">
        ${this.getStatusBadge(reservation.status)}
        <span style="font-size: 13px; color: #666;">
          ${reservation.status === 'pending' ? 'Your items are being prepared' : ''}
          ${reservation.status === 'ready' ? 'Your items are ready for pickup!' : ''}
          ${reservation.status === 'completed' ? 'This reservation has been completed' : ''}
          ${reservation.status === 'cancelled' ? 'This reservation was cancelled' : ''}
        </span>
      </div>
      
      <!-- Dates -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Reservation Details</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Requested</div>
            <div style="font-size: 14px; color: #333;">${this.formatDate(reservation.request_date)}</div>
          </div>
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Ready for Pickup</div>
            <div style="font-size: 14px; color: #333;">${this.formatDate(reservation.ready_for_pickup_date)}</div>
          </div>
          <div style="padding: 12px; background: #fef3c7;">
            <div style="font-size: 10px; color: #92400e; text-transform: uppercase; margin-bottom: 4px;">Pickup Deadline</div>
            <div style="font-size: 14px; color: #92400e; font-weight: 500;">${this.formatDate(reservation.reservation_due_date)}</div>
          </div>
          <div style="padding: 12px; background: #fafafa;">
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Items</div>
            <div style="font-size: 14px; color: #333;">${items.length} item${items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
      
      <!-- Items -->
      <div>
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Reserved Items</div>
        <div style="border-top: 1px solid #f0f0f0;">
          ${itemsHtml || '<div style="padding: 20px; text-align: center; color: #666;">No items in this reservation</div>'}
        </div>
      </div>
      
      <!-- Pickup Location -->
      <div style="margin-top: 24px; padding: 16px; background: #f8f8f8;">
        <div style="font-size: 12px; font-weight: 500; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Pickup Location</div>
        <div style="font-size: 14px; color: #333; line-height: 1.5;">
          Dematerialized<br>
          Lange Putstraat 4<br>
          5211 KN 's-Hertogenbosch
        </div>
      </div>
      
      <!-- Cancel button for pending -->
      ${reservation.status === 'pending' ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
          <button onclick="ReservationsManager.cancelReservation(${reservation.id})" style="width: 100%; padding: 12px 16px; background: transparent; color: #991b1b; border: 1px solid #fca5a5; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer;">
            Cancel Reservation
          </button>
        </div>
      ` : ''}
    `;
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
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (listEl) listEl.style.display = 'none';
    
    const reservations = await this.fetchReservations();
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!reservations || reservations.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    
    // Filter out reservations with no items
    const validReservations = reservations.filter(r => r.items && r.items.length > 0);
    
    if (validReservations.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    
    // Sort by date (newest first)
    validReservations.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
    
    // Render reservations
    if (listEl) {
      listEl.innerHTML = validReservations.map(r => this.renderReservationCard(r)).join('');
      listEl.style.display = 'block';
    }
    
    console.log('📋 Reservations page rendered');
  },
  
  viewReservation(reservationId) {
    console.log('📋 View reservation:', reservationId);
    
    // Find reservation in cache
    const reservation = this._reservationsCache?.find(r => r.id === reservationId);
    
    if (!reservation) {
      console.error('Reservation not found in cache');
      return;
    }
    
    const modal = document.getElementById('reservation-detail-modal');
    const backdrop = document.getElementById('reservation-detail-backdrop');
    const modalId = document.getElementById('detail-modal-id');
    const modalContent = document.getElementById('detail-modal-content');
    
    if (!modal || !backdrop) {
      console.error('Detail modal not found');
      return;
    }
    
    // Set content
    if (modalId) {
      modalId.textContent = `#${reservation.hash_id?.substring(0, 8) || reservation.id}`;
    }
    
    if (modalContent) {
