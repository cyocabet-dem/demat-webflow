// ============================================
// RESERVATIONS PAGE FUNCTIONS
// ============================================

window.ReservationsManager = {
  API_BASE: 'https://api.dematerialized.nl',
  
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
  
  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    return `<span style="display: inline-block; padding: 4px 10px; background: ${style.bg}; color: ${style.color}; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px;">${style.label}</span>`;
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
      return imgUrl ? `<div style="width: 60px; height: 80px; background: #f5f5f5; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
        <img src="${imgUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
      </div>` : '';
    }).join('');
    
    const moreCount = itemCount > 3 ? `<div style="width: 60px; height: 80px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">+${itemCount - 3}</div>` : '';
    
    return `
      <div class="reservation-card" style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Reservation</div>
            <div style="font-size: 13px; color: #333; font-family: monospace;">#${reservation.hash_id?.substring(0, 8) || reservation.id}</div>
          </div>
          ${this.getStatusBadge(reservation.status)}
        </div>
        
        <!-- Dates -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; padding: 12px; background: #fafafa; border-radius: 6px;">
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
          <div style="padding: 16px; background: #fef3c7; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 16px;">
            No items in this reservation
          </div>
        `}
        
        <!-- Actions -->
        <div style="display: flex; gap: 12px;">
          <button onclick="ReservationsManager.viewReservation(${reservation.id})" style="flex: 1; padding: 10px 16px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer; border-radius: 4px;">
            View Details
          </button>
          ${reservation.status === 'pending' ? `
            <button onclick="ReservationsManager.cancelReservation(${reservation.id})" style="padding: 10px 16px; background: transparent; color: #666; border: 1px solid #ddd; font-family: 'Urbanist', sans-serif; font-size: 13px; cursor: pointer; border-radius: 4px;">
              Cancel
            </button>
          ` : ''}
        </div>
        
      </div>
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
    
    // Filter out reservations with no items (optional)
    const validReservations = reservations.filter(r => r.items && r.items.length > 0);
    
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
    // For now, open a modal or navigate to detail page
    // You can expand this to show a detail modal
    alert(`Viewing reservation #${reservationId} - Detail modal coming soon!`);
  },
  
  async cancelReservation(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    console.log('📋 Cancelling reservation:', reservationId);
    // TODO: Implement cancel API call
    alert('Cancel functionality coming soon!');
  }
};

// Auto-initialize on reservations page
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('reservations-container')) {
    console.log('📋 Reservations page detected, initializing...');
    
    // Wait for auth to be ready
    const initReservations = async () => {
      let attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (window.auth0Client) {
        const isAuth = await window.auth0Client.isAuthenticated();
        if (isAuth) {
          ReservationsManager.renderReservationsPage();
        } else {
          // Show login prompt
          const container = document.getElementById('reservations-container');
          if (container) {
            container.innerHTML = `
              <div style="text-align: center; padding: 60px 20px;">
                <h2 style="font-size: 20px; margin-bottom: 12px;">Sign in to view your reservations</h2>
                <p style="color: #666; margin-bottom: 20px;">You need to be logged in to see your reservations.</p>
                <button onclick="openAuthModal()" style="padding: 12px 24px; background: #000; color: #fff; border: none; font-family: 'Urbanist', sans-serif; cursor: pointer;">
                  Sign In
                </button>
              </div>
            `;
          }
        }
      }
    };
    
    initReservations();
  }
});
