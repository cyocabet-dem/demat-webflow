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

<!-- =============================================
     UPDATED MODAL SECTIONS FOR components.js
     Replace the matching sections in your file.
     Changes: all stroke="#000" → stroke="currentColor"
     ============================================= -->

<!-- Reservation Confirmation Modal -->
<div id="reservation-modal-backdrop" class="modal-backdrop"></div>
<div id="reservation-modal" class="modal-container">
  <div class="modal-header">
    <span class="modal-title">confirm your reservation</span>
    <button class="modal-close" onclick="closeReservationModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="modal-body">
    <div class="reservation-item-count-box">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
      <span id="reservation-item-count">2 items ready to reserve</span>
    </div>
    <div class="reservation-policy">
      <h4>before you confirm:</h4>
      <div class="policy-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>we'll notify you by email when your items are ready for pickup at our store, typically within one business day</span>
      </div>
      <div class="policy-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
        <span><a href="/contact-us" class="link-text-html">contact us</a> as soon as possible if you are unable to make it to your reservation. please note that a €5 cancellation / no-show fee may apply. see our <a href="/cancellation-policy" class="link-text-html">cancellation policy</a>.</span>
      </div>
    </div>
    <div id="reservation-error" class="modal-error"></div>
  </div>
  <div class="modal-footer">
    <button id="confirm-reservation-btn" class="btn-primary" onclick="confirmReservation()">confirm reservation</button>
    <button class="btn-secondary" onclick="closeReservationModal()">go back</button>
  </div>
</div>

<!-- Premium Upgrade Modal -->
<div id="upgrade-modal-backdrop" class="modal-backdrop"></div>
<div id="upgrade-modal" class="modal-container modal-centered">
  <div class="modal-header">
    <span class="modal-title">premium feature</span>
    <button class="modal-close" onclick="closeUpgradeModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div class="modal-body text-center">
    <div class="modal-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
    <h3 class="modal-heading">upgrade to premium</h3>
    <p class="modal-text">online reservations are available exclusively for premium members. upgrade your membership to reserve items online and try them on in-store.</p>
    <div class="benefits-box">
      <div class="benefits-title">premium benefits include:</div>
      <ul class="benefits-list">
        <li>rent up to 5 items at a time</li>
        <li>access the full collection (in-store / online)</li>
        <li>reserve items online to try in-store</li>
      </ul>
    </div>
  </div>
  <div class="modal-footer">
    <a href="/memberships" class="btn-primary" onclick="closeUpgradeModal()">view membership options</a>
    <button class="btn-secondary" onclick="closeUpgradeModal()">maybe later</button>
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
    <h3 class="modal-heading">reservation confirmed!</h3>
    <p class="modal-text">we'll notify you by email when your items are ready for pickup at our store.</p>
    <div class="reservation-id-box">
      <div class="reservation-id-label">reservation id</div>
      <div id="success-reservation-id" class="reservation-id-value"></div>
    </div>
    <p class="modal-subtext">see you soon!</p>
  </div>
  <div class="modal-footer">
    <button class="btn-primary" onclick="closeSuccessModal()">continue shopping</button>
    <a href="/reservations" class="btn-secondary" onclick="closeSuccessModal()">view my reservations</a>
  </div>
</div>
<!-- Reservation Detail Modal -->
<div id="reservation-detail-backdrop" class="modal-backdrop"></div>
<div id="reservation-detail-modal" class="modal-container modal-large">
  <div class="modal-header">
    <div>
      <span class="modal-label">reservation details</span>
      <div id="detail-modal-id" class="modal-title"></div>
    </div>
    <button class="modal-close" onclick="closeReservationDetailModal()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  <div id="detail-modal-content" class="modal-body modal-scroll"></div>
  <div class="modal-footer">
    <button class="btn-primary" onclick="closeReservationDetailModal()">close</button>
  </div>
</div>

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


// ============================================
// SITE-WIDE WISHLIST MANAGER
// Handles API calls, local storage, and UI updates
// for heart icons on clothing page, homepage, etc.
// ============================================

(function() {
  // Skip if already defined (e.g. by homepage inline script)
  if (window.WishlistManager) {
    console.log('💖 [Wishlist] WishlistManager already defined, skipping');
    return;
  }

  window.WishlistManager = {
    STORAGE_KEY: 'dematerialized_wishlist',
    API_BASE: window.API_BASE_URL || 'https://api.dematerialized.nl',
    _syncing: false,
    _initialized: false,
    _wishlistIds: new Set(),

    async init() {
      if (this._initialized) return;
      console.log('💖 [Wishlist] Initializing...');

      this._loadLocal();

      // Wait for auth0Client
      let attempts = 0;
      while (!window.auth0Client && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.auth0Client) {
        try {
          const isAuthenticated = await window.auth0Client.isAuthenticated();
          if (isAuthenticated) {
            console.log('💖 [Wishlist] User authenticated, syncing with API...');
            await this.syncWithAPI();
          }
        } catch (err) {
          console.error('💖 [Wishlist] Init error:', err);
        }
      }

      this._initialized = true;
      console.log('💖 [Wishlist] Initialized with', this._wishlistIds.size, 'items');
    },

    _loadLocal() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids)) {
            this._wishlistIds = new Set(ids.map(Number));
          }
        }
      } catch (err) {
        console.error('💖 [Wishlist] Error loading local:', err);
      }
    },

    _saveLocal() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this._wishlistIds)));
      } catch (err) {
        console.error('💖 [Wishlist] Error saving local:', err);
      }
    },

    async getToken() {
      try {
        if (window.auth0Client) {
          const isAuthenticated = await window.auth0Client.isAuthenticated();
          if (isAuthenticated) {
            return await window.auth0Client.getTokenSilently();
          }
        }
      } catch (err) {
        console.error('💖 [Wishlist] Token error:', err);
      }
      return null;
    },

    async fetchAPIWishlist() {
      const token = await this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${this.API_BASE}/private_clothing_items/wishlist/clothing_items`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('💖 [Wishlist] API fetch failed:', response.status);
          return null;
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.items || data.clothing_items || []);
        return items.map(item => Number(item.id || item.clothing_item_id));
      } catch (err) {
        console.error('💖 [Wishlist] API fetch error:', err);
        return null;
      }
    },

    async syncWithAPI() {
      if (this._syncing) return;
      this._syncing = true;

      try {
        const apiIds = await this.fetchAPIWishlist();
        if (apiIds !== null) {
          this._wishlistIds = new Set(apiIds);
          this._saveLocal();
          this.updateAllUI();
          console.log('💖 [Wishlist] Synced with API:', this._wishlistIds.size, 'items');
        }
      } catch (err) {
        console.error('💖 [Wishlist] Sync error:', err);
      } finally {
        this._syncing = false;
      }
    },

    isInWishlist(itemId) {
      return this._wishlistIds.has(Number(itemId));
    },

    async addToWishlist(itemId) {
      const id = Number(itemId);
      console.log('💖 [Wishlist] Adding:', id);

      // Optimistic local update
      this._wishlistIds.add(id);
      this._saveLocal();
      this.updateUI(id, true);

      const token = await this.getToken();
      if (token) {
        try {
          const response = await fetch(`${this.API_BASE}/private_clothing_items/wishlist/${id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.error('💖 [Wishlist] API add failed:', response.status);
            this._wishlistIds.delete(id);
            this._saveLocal();
            this.updateUI(id, false);
            return false;
          }

          console.log('✅ [Wishlist] Added to API:', id);
        } catch (err) {
          console.error('💖 [Wishlist] API add error:', err);
          this._wishlistIds.delete(id);
          this._saveLocal();
          this.updateUI(id, false);
          return false;
        }
      }

      return true;
    },

    async removeFromWishlist(itemId) {
      const id = Number(itemId);
      console.log('💖 [Wishlist] Removing:', id);

      // Optimistic local update
      this._wishlistIds.delete(id);
      this._saveLocal();
      this.updateUI(id, false);

      const token = await this.getToken();
      if (token) {
        try {
          const response = await fetch(`${this.API_BASE}/private_clothing_items/wishlist/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            console.error('💖 [Wishlist] API remove failed:', response.status);
            this._wishlistIds.add(id);
            this._saveLocal();
            this.updateUI(id, true);
            return false;
          }

          console.log('✅ [Wishlist] Removed from API:', id);
        } catch (err) {
          console.error('💖 [Wishlist] API remove error:', err);
          this._wishlistIds.add(id);
          this._saveLocal();
          this.updateUI(id, true);
          return false;
        }
      }

      return true;
    },

    async toggle(itemId) {
      if (this.isInWishlist(itemId)) {
        return await this.removeFromWishlist(itemId);
      } else {
        return await this.addToWishlist(itemId);
      }
    },

    // Update heart icon UI for a single item (works with both Webflow cards and custom cards)
    updateUI(itemId, isInWishlist) {
      const id = Number(itemId);

      // Webflow template cards: [data-item-id]
      document.querySelectorAll(`[data-item-id="${id}"]`).forEach(card => {
        const outline = card.querySelector('.heart-icon-outline-20px');
        const filled = card.querySelector('.heart-icon-filled-20px');
        if (outline) outline.style.display = isInWishlist ? 'none' : 'block';
        if (filled) filled.style.display = isInWishlist ? 'block' : 'none';
      });

      // Custom cards (homepage): [data-wishlist-id]
      document.querySelectorAll(`[data-wishlist-id="${id}"]`).forEach(btn => {
        if (isInWishlist) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    },

    // Update ALL heart icons on the page
    updateAllUI() {
      // Webflow template cards
      document.querySelectorAll('[data-item-id]').forEach(card => {
        const itemId = Number(card.getAttribute('data-item-id'));
        const isIn = this.isInWishlist(itemId);
        const outline = card.querySelector('.heart-icon-outline-20px');
        const filled = card.querySelector('.heart-icon-filled-20px');
        if (outline) outline.style.display = isIn ? 'none' : 'block';
        if (filled) filled.style.display = isIn ? 'block' : 'none';
      });

      // Custom cards (homepage)
      document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
        const itemId = Number(btn.getAttribute('data-wishlist-id'));
        if (this.isInWishlist(itemId)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  };

  // ============================================
  // updateWishlistIcons — called by clothing.js
  // after rendering each page of product cards.
  // Sets up click handlers + visual state.
  // ============================================

  window.updateWishlistIcons = function() {
    // Ensure WishlistManager is initialized
    if (!window.WishlistManager._initialized) {
      window.WishlistManager.init().then(() => {
        window.updateWishlistIcons();
      });
      return;
    }

    document.querySelectorAll('[data-item-id]').forEach(card => {
      const itemId = Number(card.getAttribute('data-item-id'));
      if (!itemId) return;

      const wrapper = card.querySelector('.div-wish-list-wrapper');
      if (!wrapper) return;

      // Skip if already wired up
      if (wrapper.hasAttribute('data-wishlist-bound')) return;
      wrapper.setAttribute('data-wishlist-bound', 'true');

      // Set initial visual state
      const isIn = window.WishlistManager.isInWishlist(itemId);
      const outline = card.querySelector('.heart-icon-outline-20px');
      const filled = card.querySelector('.heart-icon-filled-20px');
      if (outline) outline.style.display = isIn ? 'none' : 'block';
      if (filled) filled.style.display = isIn ? 'block' : 'none';

      // Attach click handler (captures to beat Webflow IX2)
      wrapper.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Check auth — prompt login if not authenticated
        if (window.auth0Client) {
          const isAuthenticated = await window.auth0Client.isAuthenticated();
          if (!isAuthenticated) {
            console.log('💖 [Wishlist] Not authenticated, prompting login...');
            try {
              await window.auth0Client.loginWithPopup();
              const nowAuthenticated = await window.auth0Client.isAuthenticated();
              if (!nowAuthenticated) return;
              await window.WishlistManager.syncWithAPI();
            } catch (err) {
              console.error('💖 [Wishlist] Login error:', err);
              return;
            }
          }
        }

        await window.WishlistManager.toggle(itemId);
      }, true); // capture phase to fire before IX2
    });
  };

  // Auto-initialize WishlistManager when auth is ready
  // (for pages that don't explicitly call init)
  function autoInit() {
    if (window.auth0Client || document.readyState === 'complete') {
      window.WishlistManager.init().then(() => {
        window.updateWishlistIcons();
      });
    } else {
      window.addEventListener('load', function() {
        setTimeout(() => {
          window.WishlistManager.init().then(() => {
            window.updateWishlistIcons();
          });
        }, 500);
      });
    }
  }

  // Kick off auto-init after a short delay to let auth.js load
  setTimeout(autoInit, 200);

  console.log('💖 [Wishlist] WishlistManager + updateWishlistIcons registered');
})();
