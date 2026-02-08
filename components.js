// ============================================
// DEMATERIALIZED - INJECTED COMPONENTS
// Updated: Onboarding modal messaging for post-payment flow
// ============================================

(function() {
  console.log('📦 Loading components...');

  const componentsHTML = `
<!-- Cart Overlay Backdrop -->
<div id="cart-backdrop" class="cart-overlay-backdrop" onclick="closeCartOverlay()"></div>

<!-- Cart Overlay Panel -->
<div id="cart-overlay" class="cart-overlay">
  <div class="cart-overlay-header">
    <span class="cart-overlay-title">Your Cart</span>
    <button class="cart-overlay-close" onclick="closeCartOverlay()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="cart-overlay-subtitle">
    <span id="cart-overlay-count-text">0 of 10 items</span> — Reserve items to try on in store
  </div>
  <div class="cart-overlay-content">
    <div id="cart-overlay-empty" class="cart-overlay-empty">
      <div class="cart-overlay-empty-title">Your cart is empty</div>
      <p>Browse our collection and add items to reserve</p>
      <a href="/clothing" class="cart-overlay-empty-link" onclick="closeCartOverlay()">Shop Now</a>
    </div>
    <div id="cart-overlay-items" class="cart-overlay-items"></div>
  </div>
  <div id="cart-overlay-footer" class="cart-overlay-footer" style="display: none;">
    <div class="cart-overlay-count"><span id="cart-footer-count">0</span> items ready to reserve</div>
    <button id="cart-reserve-btn" class="cart-overlay-reserve-btn" onclick="handleReserveClick()">Reserve These Items</button>
  </div>
</div>

<!-- Reservation Confirmation Modal -->
<div id="reservation-modal-backdrop" class="modal-backdrop"></div>
<div id="reservation-modal" class="modal-container">
  <div class="modal-header">
    <span class="modal-title">Confirm Your Reservation</span>
    <button class="modal-close" onclick="closeReservationModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="modal-body">
    <div class="reservation-item-count-box">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
      <span id="reservation-item-count">2 items ready to reserve</span>
    </div>
    <div class="reservation-policy">
      <h4>Before you confirm:</h4>
      <div class="policy-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
        <span>Your reserved items will be ready for you to try on in our store within <strong>2 business days</strong>. We'll hold your items for up to <strong>3 business days</strong> from the ready date.</span>
      </div>
      <div class="policy-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>We'll notify you by email when your items are ready for pickup at our store.</span>
      </div>
      <div class="policy-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
        <span><a href="/contact-us" class="link-text-html">Contact us</a> as soon as possible if you are unable to make it to your reservation. Please note that a €5 cancellation / no-show fee may apply. See our <a href="/cancellation-policy" class="link-text-html">Cancellation Policy</a>.</span>
      </div>
    </div>
    <div id="reservation-error" class="modal-error"></div>
  </div>
  <div class="modal-footer">
    <button id="confirm-reservation-btn" class="btn-primary" onclick="confirmReservation()">Confirm Reservation</button>
    <button class="btn-secondary" onclick="closeReservationModal()">Go Back</button>
  </div>
</div>

<!-- Premium Upgrade Modal -->
<div id="upgrade-modal-backdrop" class="modal-backdrop"></div>
<div id="upgrade-modal" class="modal-container modal-centered">
  <div class="modal-header">
    <span class="modal-title">Premium Feature</span>
    <button class="modal-close" onclick="closeUpgradeModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="modal-body text-center">
    <div class="modal-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
    <h3 class="modal-heading">Upgrade to Premium</h3>
    <p class="modal-text">Online reservations are available exclusively for Premium members. Upgrade your membership to reserve items online and try them on in-store.</p>
    <div class="benefits-box">
      <div class="benefits-title">Premium benefits include:</div>
      <ul class="benefits-list">
        <li>Rent up to 5 items at a time</li>
        <li>Access the full collection (in-store / online)</li>
        <li>Reserve items online to try in-store</li>
      </ul>
    </div>
  </div>
  <div class="modal-footer">
    <a href="/memberships" class="btn-primary" onclick="closeUpgradeModal()">View Membership Options</a>
    <button class="btn-secondary" onclick="closeUpgradeModal()">Maybe Later</button>
  </div>
</div>

<!-- Reservation Success Modal -->
<div id="success-modal-backdrop" class="modal-backdrop" style="z-index: 10002;"></div>
<div id="success-modal" class="modal-container modal-centered" style="z-index: 10003;">
  <div class="modal-body text-center" style="padding-top: 40px;">
    <div class="success-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h3 class="modal-heading">Reservation Confirmed!</h3>
    <p class="modal-text">We'll notify you by email when your items are ready for pickup at our store.</p>
    <div class="reservation-id-box">
      <div class="reservation-id-label">Reservation ID</div>
      <div id="success-reservation-id" class="reservation-id-value"></div>
    </div>
    <p class="modal-subtext">See you soon!</p>
  </div>
  <div class="modal-footer">
    <button class="btn-primary" onclick="closeSuccessModal()">Continue Shopping</button>
    <a href="/reservations" class="btn-secondary" onclick="closeSuccessModal()">View My Reservations</a>
  </div>
</div>

<!-- Reservation Detail Modal -->
<div id="reservation-detail-backdrop" class="modal-backdrop"></div>
<div id="reservation-detail-modal" class="modal-container modal-large">
  <div class="modal-header">
    <div>
      <span class="modal-label">Reservation</span>
      <div id="detail-modal-id" class="modal-title"></div>
    </div>
    <button class="modal-close" onclick="closeReservationDetailModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div id="detail-modal-content" class="modal-body modal-scroll"></div>
  <div class="modal-footer">
    <button class="btn-primary" onclick="closeReservationDetailModal()">Close</button>
  </div>
</div>

<!-- Onboarding Modal - Updated for post-payment flow with new design system -->
<div class="onboarding-modal-overlay" id="onboardingModal">
  <div class="onboarding-modal-container" onclick="event.stopPropagation()">
    <div class="onboarding-modal-header">
      <h2 class="onboarding-modal-title">welcome to dematerialized!</h2>
      <p class="onboarding-modal-subtitle">one last step to get the most out of your membership</p>
    </div>
    <div class="onboarding-modal-body">
      <div class="onboarding-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <p class="onboarding-text">help us personalize your experience by telling us a bit about yourself — your sizes, style preferences, and contact info so we can notify you when items are ready.</p>
      <div class="onboarding-buttons-container">
        <button class="onboarding-button-primary" id="complete-profile-btn">complete profile</button>
        <button class="onboarding-button-secondary" id="onboarding-later-btn">i'll do this later</button>
      </div>
    </div>
  </div>
</div>
`;

  // Inject into body
  document.body.insertAdjacentHTML('beforeend', componentsHTML);
  console.log('✅ Components injected');
})();
