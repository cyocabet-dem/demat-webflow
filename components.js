// ============================================
// DEMATERIALIZED - INJECTED COMPONENTS
// ============================================

(function() {
  console.log('📦 Loading components...');

  const componentsHTML = `
<!-- Cart Overlay Backdrop -->
<div id="cart-backdrop" class="cart-overlay-backdrop" onclick="closeCartOverlay()"></div>

<!-- Cart Overlay Panel -->
<div id="cart-overlay" class="cart-overlay">
  <div class="cart-overlay-header">
    <span class="cart-overlay-title">your cart (<span id="cart-overlay-header-count">0</span>)</span>
    <button class="cart-overlay-close" onclick="closeCartOverlay()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="cart-overlay-subtitle">
    <span id="cart-overlay-count-text">0 of 5 items</span> — reserve items to try on in store
  </div>
  <div class="cart-overlay-content">
    <div id="cart-overlay-empty" class="cart-overlay-empty">
      <div class="cart-overlay-empty-title">your cart is empty</div>
      <p>browse our collection and add items to reserve</p>
      <a href="/clothing" class="cart-overlay-empty-link" onclick="closeCartOverlay()">shop now</a>
    </div>
    <div id="cart-overlay-items" class="cart-overlay-items"></div>
  </div>
  <div id="cart-overlay-footer" class="cart-overlay-footer" style="display: none;">
    <div class="cart-overlay-count"><span id="cart-footer-count">0</span> items ready to reserve</div>
    <button id="cart-reserve-btn" class="cart-overlay-reserve-btn" onclick="handleReserveClick()">reserve these items</button>
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

// ============================================
// FILTER PANEL COMPONENT - add to componentsHTML
// No brand filter. Size always visible.
// ============================================

/* PASTE THIS HTML INTO YOUR componentsHTML STRING IN components.js: */

/*

<!-- ============================================ -->
<!-- FILTER PANEL - Slide-out from right           -->
<!-- ============================================ -->
<div id="filter-panel-backdrop" class="filter-panel-backdrop"></div>
<div id="filter-panel" class="filter-panel">
  <div class="filter-panel-header">
    <div class="filter-panel-header-left">
      <span class="filter-panel-title">filters</span>
      <span id="filter-active-count" class="filter-active-count" style="display: none;">0</span>
    </div>
    <button class="filter-panel-close" id="filter-panel-close-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="filter-panel-body" id="filter-panel-body">

    <!-- Category — always visible -->
    <div class="filter-section" data-section="category">
      <button class="filter-section-header" data-toggle="category">
        <span class="filter-section-title">category</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="category"></div>
    </div>

    <!-- Type (subcategory) — shows when category selected -->
    <div class="filter-section" data-section="subcategory" id="filter-section-subcategory" style="display: none;">
      <button class="filter-section-header" data-toggle="subcategory">
        <span class="filter-section-title">type</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="subcategory"></div>
    </div>

    <!-- Size — always visible (profile mode: XS-XXL / specific mode: actual sizes) -->
    <div class="filter-section" data-section="size" id="filter-section-size">
      <button class="filter-section-header" data-toggle="size">
        <span class="filter-section-title">size</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="size"></div>
    </div>

    <!-- Color — always visible -->
    <div class="filter-section" data-section="color">
      <button class="filter-section-header" data-toggle="color">
        <span class="filter-section-title">color</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="color"></div>
    </div>

    <!-- Sleeve Length — auto-shows if items have this attribute -->
    <div class="filter-section" data-section="sleeve_length" id="filter-section-sleeve_length" style="display: none;">
      <button class="filter-section-header" data-toggle="sleeve_length">
        <span class="filter-section-title">sleeve length</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="sleeve_length"></div>
    </div>

    <!-- Rise — auto-shows -->
    <div class="filter-section" data-section="rise" id="filter-section-rise" style="display: none;">
      <button class="filter-section-header" data-toggle="rise">
        <span class="filter-section-title">rise</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="rise"></div>
    </div>

    <!-- Length — auto-shows -->
    <div class="filter-section" data-section="length" id="filter-section-length" style="display: none;">
      <button class="filter-section-header" data-toggle="length">
        <span class="filter-section-title">length</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="length"></div>
    </div>

    <!-- Material — auto-shows -->
    <div class="filter-section" data-section="material" id="filter-section-material" style="display: none;">
      <button class="filter-section-header" data-toggle="material">
        <span class="filter-section-title">material</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="material"></div>
    </div>

    <!-- Fit — auto-shows -->
    <div class="filter-section" data-section="fit" id="filter-section-fit" style="display: none;">
      <button class="filter-section-header" data-toggle="fit">
        <span class="filter-section-title">fit</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="fit"></div>
    </div>

    <!-- Pattern — auto-shows -->
    <div class="filter-section" data-section="pattern" id="filter-section-pattern" style="display: none;">
      <button class="filter-section-header" data-toggle="pattern">
        <span class="filter-section-title">pattern</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="pattern"></div>
    </div>

    <!-- Neckline — auto-shows -->
    <div class="filter-section" data-section="neckline" id="filter-section-neckline" style="display: none;">
      <button class="filter-section-header" data-toggle="neckline">
        <span class="filter-section-title">neckline</span>
        <svg class="filter-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="filter-section-content is-open" data-list="neckline"></div>
    </div>

  </div>
  <div class="filter-panel-footer">
    <button class="filter-panel-reset" id="filter-panel-reset-btn">reset all</button>
    <button class="filter-panel-apply" id="filter-panel-apply-btn">show results</button>
  </div>
</div>

*/


<!-- ============================================ -->
<!-- MULTI-STEP ONBOARDING MODAL -->
<!-- 8 Steps: Welcome, Name, Contact/Address, Birthday, Sizes, Body Type, Referral, Complete -->
<!-- ============================================ -->
<div id="onboardingModal" class="onboarding-modal-overlay">
  <div class="onboarding-modal-container">
    
    <!-- Progress Bar -->
    <div class="onboarding-progress">
      <div class="onboarding-progress-step" data-step="1">
        <span class="progress-label">welcome</span>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
      <div class="onboarding-progress-step" data-step="2">
        <span class="progress-label">your info</span>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
      <div class="onboarding-progress-step" data-step="3">
        <span class="progress-label">your profile</span>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
    </div>
    
    <!-- Step 1: Welcome -->
    <div class="onboarding-step active" data-step="1">
      <div class="onboarding-content">
        <div class="onboarding-icon">
          <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 20C45 20 35 35 35 50C35 65 45 75 60 75C75 75 85 65 85 50C85 35 75 20 60 20Z" fill="#E8D4E8" stroke="#4b073f" stroke-width="2"/>
            <path d="M40 75L35 100H85L80 75" stroke="#4b073f" stroke-width="2" fill="#E8D4E8"/>
            <circle cx="50" cy="45" r="3" fill="#4b073f"/>
            <circle cx="70" cy="45" r="3" fill="#4b073f"/>
            <path d="M50 58C50 58 55 65 60 65C65 65 70 58 70 58" stroke="#4b073f" stroke-width="2" fill="none"/>
            <path d="M30 30L25 20M90 30L95 20M45 15L50 5M75 15L70 5" stroke="#4b073f" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="onboarding-title">welcome to the club!</h2>
        <p class="onboarding-subtitle">you're now a member of our shared closet. let's quickly set up your profile for a better experience; you can adjust it later.</p>
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-secondary" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>
    
    <!-- Step 2: Name Only -->
    <div class="onboarding-step" data-step="2">
      <div class="onboarding-content">
        <h2 class="onboarding-title">what's your name?</h2>
        <p class="onboarding-subtitle">so we know what to call you</p>
        
        <div class="onboarding-form">
          <div class="onboarding-input-group">
            <label class="onboarding-label">first name</label>
            <input type="text" id="onboarding-firstname" class="onboarding-input" placeholder="enter your first name">
          </div>
          <div class="onboarding-input-group">
            <label class="onboarding-label">last name</label>
            <input type="text" id="onboarding-lastname" class="onboarding-input" placeholder="enter your last name">
          </div>
        </div>
        
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 3: Contact & Address -->
    <div class="onboarding-step" data-step="3">
      <div class="onboarding-content">
        <h2 class="onboarding-title">contact & address</h2>
        <p class="onboarding-subtitle">so we know where to reach you</p>
        
        <div class="onboarding-form">
          <div class="onboarding-input-group">
            <label class="onboarding-label">phone number</label>
            <input type="tel" id="onboarding-phone" class="onboarding-input" placeholder="+31 6 1234 5678">
          </div>
          
          <div class="onboarding-input-group">
            <label class="onboarding-label">find your address</label>
            <input type="text" id="onboarding-address-search" class="onboarding-input" placeholder="start typing your address...">
            <div id="onboarding-address-suggestions" class="address-suggestions"></div>
          </div>
          
          <div class="onboarding-input-group">
            <label class="onboarding-label">street</label>
            <input type="text" id="onboarding-street" class="onboarding-input" placeholder="street name">
          </div>
          
          <div class="onboarding-form-row">
            <div class="onboarding-input-group">
              <label class="onboarding-label">house number</label>
              <input type="text" id="onboarding-house-number" class="onboarding-input" placeholder="123">
            </div>
            <div class="onboarding-input-group">
              <label class="onboarding-label">apt / unit</label>
              <input type="text" id="onboarding-unit" class="onboarding-input" placeholder="optional">
            </div>
          </div>
          
          <div class="onboarding-form-row">
            <div class="onboarding-input-group">
              <label class="onboarding-label">postal code</label>
              <input type="text" id="onboarding-zipcode" class="onboarding-input" placeholder="1234 AB">
            </div>
            <div class="onboarding-input-group">
              <label class="onboarding-label">city</label>
              <input type="text" id="onboarding-city" class="onboarding-input" placeholder="city">
            </div>
          </div>
        </div>
        
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 4: Birthday -->
    <div class="onboarding-step" data-step="4">
      <div class="onboarding-content">
        <h2 class="onboarding-title">your birthday</h2>
        <p class="onboarding-subtitle">so you can receive special treatment</p>
        
        <div class="onboarding-form">
          <div class="onboarding-input-group">
            <label class="onboarding-label">date of birth</label>
            <input type="date" id="onboarding-birthday" class="onboarding-input">
          </div>
        </div>
        
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 5: Size Profile -->
    <div class="onboarding-step" data-step="5">
      <div class="onboarding-content">
        <h2 class="onboarding-title">your sizes</h2>
        <p class="onboarding-subtitle">so we can make sure to have plenty of options that fit you</p>
        
        <div class="onboarding-form">
          <div class="onboarding-form-row">
            <div class="onboarding-input-group">
              <label class="onboarding-label">height (cm)</label>
              <input type="number" id="onboarding-height" class="onboarding-input" placeholder="175">
            </div>
            <div class="onboarding-input-group">
              <label class="onboarding-label">preferred fit</label>
              <select id="onboarding-preferred-fit" class="onboarding-input">
                <option value="">select fit...</option>
                <option value="Slim">slim</option>
                <option value="Regular">regular</option>
                <option value="Oversized">oversized</option>
              </select>
            </div>
          </div>
          
          <div class="onboarding-form-row">
            <div class="onboarding-input-group">
              <label class="onboarding-label">typical shirt size</label>
              <input type="text" id="onboarding-shirt-size" class="onboarding-input" placeholder="M, L, XL">
            </div>
            <div class="onboarding-input-group">
              <label class="onboarding-label">typical pants size</label>
              <input type="text" id="onboarding-pants-size" class="onboarding-input" placeholder="32, 34, 36">
            </div>
          </div>
          
          <div class="onboarding-input-group">
            <label class="onboarding-label">shoe size</label>
            <input type="text" id="onboarding-shoe-size" class="onboarding-input" placeholder="42, 43, 44">
          </div>
        </div>
        
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 6: Body Type -->
    <div class="onboarding-step" data-step="6">
      <div class="onboarding-content">
        <h2 class="onboarding-title">your body type</h2>
        <p class="onboarding-subtitle">so we can help you find pieces that make you look good, and feel good</p>
        
        <div class="onboarding-body-types">
          <button class="body-type-option" data-body-type="triangle">
            <div class="body-type-icon">
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                <path d="M20 30 L15 70 L45 70 L40 30 Z" fill="#F9DC5C" stroke="#333" stroke-width="1.5"/>
                <path d="M15 30 Q5 35 8 45" stroke="#333" stroke-width="1.5" fill="none"/>
                <path d="M45 30 Q55 35 52 45" stroke="#333" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="body-type-label">triangle</span>
          </button>
          
          <button class="body-type-option" data-body-type="inverted-triangle">
            <div class="body-type-icon">
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                <path d="M10 30 L20 70 L40 70 L50 30 Z" fill="#FFBE98" stroke="#333" stroke-width="1.5"/>
                <path d="M10 30 Q0 35 3 45" stroke="#333" stroke-width="1.5" fill="none"/>
                <path d="M50 30 Q60 35 57 45" stroke="#333" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="body-type-label">inverted triangle</span>
          </button>
          
          <button class="body-type-option" data-body-type="rectangle">
            <div class="body-type-icon">
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                <path d="M18 30 L18 70 L42 70 L42 30 Z" fill="#E8D4E8" stroke="#333" stroke-width="1.5"/>
                <path d="M18 30 Q8 35 11 45" stroke="#333" stroke-width="1.5" fill="none"/>
                <path d="M42 30 Q52 35 49 45" stroke="#333" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="body-type-label">rectangle</span>
          </button>
          
          <button class="body-type-option" data-body-type="oval">
            <div class="body-type-icon">
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                <ellipse cx="30" cy="50" rx="18" ry="22" fill="#FFB5B5" stroke="#333" stroke-width="1.5"/>
                <path d="M12 40 Q2 45 5 55" stroke="#333" stroke-width="1.5" fill="none"/>
                <path d="M48 40 Q58 45 55 55" stroke="#333" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="body-type-label">oval</span>
          </button>
          
          <button class="body-type-option" data-body-type="hourglass">
            <div class="body-type-icon">
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                <path d="M12 30 Q30 45 12 70 L48 70 Q30 45 48 30 Z" fill="#B8E0D2" stroke="#333" stroke-width="1.5"/>
                <path d="M12 30 Q2 35 5 45" stroke="#333" stroke-width="1.5" fill="none"/>
                <path d="M48 30 Q58 35 55 45" stroke="#333" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="body-type-label">hourglass</span>
          </button>
        </div>
        
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 7: How did you hear about us -->
    <div class="onboarding-step" data-step="7">
      <div class="onboarding-content">
        <h2 class="onboarding-title">how did you hear about demat?</h2>
        <p class="onboarding-subtitle">so we know which of our efforts are actually paying off</p>
        
        <div class="onboarding-checkboxes">
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="instagram">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">instagram</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="tiktok">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">tiktok</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="facebook">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">facebook</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="pinterest">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">pinterest</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="friends-family">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">friends or family</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="google">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">google search</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="influencer">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">influencer</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" name="referral" value="other">
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">other</span>
          </label>
        </div>
        
        <button class="onboarding-btn-primary" onclick="submitOnboarding()">continue</button>
        <button class="onboarding-btn-back" onclick="prevOnboardingStep()">back</button>
      </div>
    </div>
    
    <!-- Step 8: Complete -->
    <div class="onboarding-step" data-step="8">
      <div class="onboarding-content">
        <div class="onboarding-icon">
          <!-- Clothes Hanger Icon -->
          <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Hook at top -->
            <path d="M60 15 C60 15 60 25 60 30 C60 35 55 40 50 40 C45 40 40 35 40 30 C40 25 45 20 50 20" 
                  stroke="#4b073f" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- Main hanger body -->
            <path d="M60 40 L15 75 L15 82 L60 60 L105 82 L105 75 L60 40 Z" 
                  fill="#E8D4E8" stroke="#4b073f" stroke-width="2.5" stroke-linejoin="round"/>
            <!-- Decorative sparkles -->
            <path d="M25 50 L20 45 M95 50 L100 45 M30 35 L25 30 M90 35 L95 30" 
                  stroke="#4b073f" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Small accent lines on hanger -->
            <path d="M40 58 L60 48 L80 58" stroke="#4b073f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="onboarding-title">thank you!</h2>
        <p class="onboarding-subtitle">your profile is now complete. time to go shopping!</p>
        <button class="onboarding-btn-primary" onclick="completeOnboarding()">start shopping</button>
      </div>
    </div>
    
  </div>
</div>
`;

  // Inject into body
  document.body.insertAdjacentHTML('beforeend', componentsHTML);
  console.log('✅ Components injected');
})();
