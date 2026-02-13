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

<!-- ============================================ -->
<!-- MULTI-STEP ONBOARDING MODAL -->
<!-- Inline styles on structural elements to guarantee Webflow override -->
<!-- ============================================ -->
<div id="onboardingModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;padding:20px;backdrop-filter:blur(4px);margin:0;border:none;box-sizing:border-box;">
  <div id="onboardingModalInner" style="background:#fff;border-radius:16px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;padding:32px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.15);font-family:'Urbanist',sans-serif;margin:0 auto;box-sizing:border-box;" onclick="event.stopPropagation()">

    <!-- Progress Bar -->
    <div class="dm-ob-progress" style="display:flex;gap:16px;margin-bottom:32px;padding:0;">
      <div class="onboarding-progress-step active" data-step="1" style="flex:1;text-align:center;">
        <span class="onboarding-progress-label" style="display:block;font-size:14px;font-weight:500;color:#999;margin-bottom:8px;text-transform:lowercase;font-family:'Urbanist',sans-serif;">welcome</span>
        <div class="onboarding-progress-bar" style="height:3px;background:#e0e0e0;border-radius:2px;"></div>
      </div>
      <div class="onboarding-progress-step" data-step="2" style="flex:1;text-align:center;">
        <span class="onboarding-progress-label" style="display:block;font-size:14px;font-weight:500;color:#999;margin-bottom:8px;text-transform:lowercase;font-family:'Urbanist',sans-serif;">your info</span>
        <div class="onboarding-progress-bar" style="height:3px;background:#e0e0e0;border-radius:2px;"></div>
      </div>
      <div class="onboarding-progress-step" data-step="3" style="flex:1;text-align:center;">
        <span class="onboarding-progress-label" style="display:block;font-size:14px;font-weight:500;color:#999;margin-bottom:8px;text-transform:lowercase;font-family:'Urbanist',sans-serif;">your profile</span>
        <div class="onboarding-progress-bar" style="height:3px;background:#e0e0e0;border-radius:2px;"></div>
      </div>
    </div>

    <!-- STEP 1: Welcome -->
    <div class="onboarding-step active" data-step="1">
      <div style="min-height:300px;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;">
        <div style="margin-bottom:24px;">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="32" r="14" stroke="#6b2a5b" stroke-width="2.5" fill="#f0d4ec"/>
            <path d="M20 68c0-11 8.95-20 20-20s20 9 20 20" stroke="#6b2a5b" stroke-width="2.5" fill="#f0d4ec"/>
            <circle cx="35" cy="30" r="2" fill="#6b2a5b"/>
            <circle cx="45" cy="30" r="2" fill="#6b2a5b"/>
            <path d="M35 37c2 3 8 3 10 0" stroke="#6b2a5b" stroke-width="2" stroke-linecap="round" fill="none"/>
            <line x1="30" y1="14" x2="28" y2="8" stroke="#6b2a5b" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="12" x2="40" y2="5" stroke="#6b2a5b" stroke-width="2" stroke-linecap="round"/>
            <line x1="50" y1="14" x2="52" y2="8" stroke="#6b2a5b" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">welcome to the community!</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">you're now subscribed. let's quickly set up your profile for a better experience; you can adjust it later.</p>
        <button class="dm-ob-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 2: Name -->
    <div class="onboarding-step" data-step="2">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">what's your name?</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">so we know what to call you</p>
        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:8px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label class="dm-ob-label" for="onboarding-firstname">first name</label>
            <input type="text" id="onboarding-firstname" class="dm-ob-input" placeholder="first name">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label class="dm-ob-label" for="onboarding-lastname">last name</label>
            <input type="text" id="onboarding-lastname" class="dm-ob-input" placeholder="last name">
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="nextOnboardingStep()">continue</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 3: Contact & Address -->
    <div class="onboarding-step" data-step="3">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">contact & address</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">for delivery notifications and shipping</p>
        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:8px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label class="dm-ob-label" for="onboarding-phone">phone number</label>
            <input type="tel" id="onboarding-phone" class="dm-ob-input" placeholder="+31 6 1234 5678">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;position:relative;">
            <label class="dm-ob-label" for="onboarding-address-search">search your address</label>
            <input type="text" id="onboarding-address-search" class="dm-ob-input" placeholder="start typing your address..." oninput="searchOnboardingAddress()">
            <div id="onboarding-address-suggestions" class="onboarding-address-suggestions"></div>
          </div>
          <div class="dm-ob-input-row">
            <div style="display:flex;flex-direction:column;gap:4px;flex:2;">
              <label class="dm-ob-label" for="onboarding-street">street</label>
              <input type="text" id="onboarding-street" class="dm-ob-input" placeholder="street name">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-house-number">number</label>
              <input type="text" id="onboarding-house-number" class="dm-ob-input" placeholder="123">
            </div>
          </div>
          <div class="dm-ob-input-row">
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-unit">unit / apt</label>
              <input type="text" id="onboarding-unit" class="dm-ob-input" placeholder="optional">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-zipcode">postcode</label>
              <input type="text" id="onboarding-zipcode" class="dm-ob-input" placeholder="1234 AB">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-city">city</label>
              <input type="text" id="onboarding-city" class="dm-ob-input" placeholder="city">
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="nextOnboardingStep()">continue</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 4: Birthday -->
    <div class="onboarding-step" data-step="4">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">when's your birthday?</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">we might have a little surprise for you 🎂</p>
        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:8px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label class="dm-ob-label" for="onboarding-birthday">date of birth</label>
            <input type="date" id="onboarding-birthday" class="dm-ob-input">
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="nextOnboardingStep()">continue</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 5: Sizes -->
    <div class="onboarding-step" data-step="5">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">your sizes</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">helps us recommend the right pieces for you</p>
        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:8px;">
          <div class="dm-ob-input-row">
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-height">height (cm)</label>
              <input type="number" id="onboarding-height" class="dm-ob-input" placeholder="170">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-preferred-fit">preferred fit</label>
              <select id="onboarding-preferred-fit" class="dm-ob-input">
                <option value="">select</option>
                <option value="tight">tight</option>
                <option value="regular">regular</option>
                <option value="loose">loose</option>
                <option value="oversized">oversized</option>
              </select>
            </div>
          </div>
          <div class="dm-ob-input-row">
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-shirt-size">top size</label>
              <select id="onboarding-shirt-size" class="dm-ob-input">
                <option value="">select</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-pants-size">bottom size</label>
              <select id="onboarding-pants-size" class="dm-ob-input">
                <option value="">select</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
              <label class="dm-ob-label" for="onboarding-shoe-size">shoe size (EU)</label>
              <select id="onboarding-shoe-size" class="dm-ob-input">
                <option value="">select</option>
                <option value="36">36</option>
                <option value="37">37</option>
                <option value="38">38</option>
                <option value="39">39</option>
                <option value="40">40</option>
                <option value="41">41</option>
                <option value="42">42</option>
              </select>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="nextOnboardingStep()">continue</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 6: Body Type -->
    <div class="onboarding-step" data-step="6">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">body shape</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">helps us find the most flattering pieces for you</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:8px;">
          <button class="body-type-option dm-ob-body-btn" data-body-type="hourglass">
            <svg width="40" height="60" viewBox="0 0 40 60"><path d="M10 5 Q20 20 10 30 Q20 40 10 55 H30 Q20 40 30 30 Q20 20 30 5 Z" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="1.5"/></svg>
            <span>hourglass</span>
          </button>
          <button class="body-type-option dm-ob-body-btn" data-body-type="pear">
            <svg width="40" height="60" viewBox="0 0 40 60"><path d="M13 5 Q20 15 13 28 Q20 42 8 55 H32 Q20 42 27 28 Q20 15 27 5 Z" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="1.5"/></svg>
            <span>pear</span>
          </button>
          <button class="body-type-option dm-ob-body-btn" data-body-type="apple">
            <svg width="40" height="60" viewBox="0 0 40 60"><path d="M12 5 Q20 10 8 30 Q15 45 12 55 H28 Q25 45 32 30 Q20 10 28 5 Z" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="1.5"/></svg>
            <span>apple</span>
          </button>
          <button class="body-type-option dm-ob-body-btn" data-body-type="rectangle">
            <svg width="40" height="60" viewBox="0 0 40 60"><path d="M12 5 L10 55 H30 L28 5 Z" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="1.5"/></svg>
            <span>rectangle</span>
          </button>
          <button class="body-type-option dm-ob-body-btn" data-body-type="inverted-triangle">
            <svg width="40" height="60" viewBox="0 0 40 60"><path d="M8 5 Q20 15 27 28 Q20 42 28 55 H12 Q20 42 13 28 Q20 15 32 5 Z" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="1.5"/></svg>
            <span>inverted triangle</span>
          </button>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="nextOnboardingStep()">continue</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 7: Referral -->
    <div class="onboarding-step" data-step="7">
      <div style="min-height:300px;display:flex;flex-direction:column;">
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">how did you find us?</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">select all that apply</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="instagram"> instagram</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="tiktok"> tiktok</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="facebook"> facebook</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="google"> google search</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="friend"> a friend told me</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="walked-by"> walked by the store</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="event"> event or market</label>
          <label class="checkbox-option dm-ob-checkbox"><input type="checkbox" value="other"> other</label>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button class="dm-ob-btn-back" onclick="prevOnboardingStep()">back</button>
          <button class="dm-ob-btn-primary" style="flex:1;max-width:none;" onclick="submitOnboarding()">finish</button>
        </div>
        <button class="dm-ob-btn-skip" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>

    <!-- STEP 8: Complete -->
    <div class="onboarding-step" data-step="8">
      <div style="min-height:300px;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;">
        <div style="margin-bottom:24px;">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="30" fill="#f0d4ec" stroke="#6b2a5b" stroke-width="2.5"/>
            <polyline points="28 40 36 48 54 30" stroke="#6b2a5b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <h2 style="font-family:'Urbanist',sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-transform:lowercase;">you're all set!</h2>
        <p style="font-family:'Urbanist',sans-serif;font-size:15px;color:#666;margin:0 0 28px 0;line-height:1.5;">your profile is ready. time to explore the collection.</p>
        <button class="dm-ob-btn-primary" onclick="completeOnboarding()">start browsing</button>
      </div>
    </div>

  </div>
</div>
`;

  // ===== ONBOARDING STYLES =====
  // Using dm-ob- prefixed classes that Webflow can't conflict with
  // Plus onboarding-step which the JS in site-wide-footer.js depends on
  const onboardingStyles = document.createElement('style');
  onboardingStyles.id = 'dm-onboarding-styles';
  onboardingStyles.textContent = `
    /* Overlay show/hide - JS toggles is-visible */
    #onboardingModal.is-visible {
      display: flex !important;
    }
    body.onboarding-modal-open {
      overflow: hidden !important;
    }

    /* Steps show/hide */
    #onboardingModal .onboarding-step {
      display: none !important;
    }
    #onboardingModal .onboarding-step.active {
      display: block !important;
    }

    /* Progress bar state colors */
    #onboardingModal .onboarding-progress-step.active .onboarding-progress-label {
      color: #3d0c2e !important;
      font-weight: 700 !important;
    }
    #onboardingModal .onboarding-progress-step.active .onboarding-progress-bar {
      background: #3d0c2e !important;
    }
    #onboardingModal .onboarding-progress-step.completed .onboarding-progress-label {
      color: #6b2a5b !important;
    }
    #onboardingModal .onboarding-progress-step.completed .onboarding-progress-bar {
      background: #6b2a5b !important;
    }

    /* Primary button */
    .dm-ob-btn-primary {
      font-family: 'Urbanist', sans-serif !important;
      background: #3d0c2e !important;
      color: #fff !important;
      border: none !important;
      border-radius: 50px !important;
      padding: 14px 40px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      width: 100% !important;
      max-width: 300px !important;
      text-transform: lowercase !important;
      text-align: center !important;
      transition: background 0.2s !important;
      box-sizing: border-box !important;
    }
    .dm-ob-btn-primary:hover {
      background: #2a081f !important;
    }
    .dm-ob-btn-primary.loading {
      opacity: 0.7 !important;
      pointer-events: none !important;
    }

    /* Back button */
    .dm-ob-btn-back {
      font-family: 'Urbanist', sans-serif !important;
      background: none !important;
      border: 1.5px solid #ddd !important;
      border-radius: 50px !important;
      padding: 14px 28px !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      color: #333 !important;
      text-transform: lowercase !important;
      box-sizing: border-box !important;
    }
    .dm-ob-btn-back:hover {
      border-color: #999 !important;
    }

    /* Skip button */
    .dm-ob-btn-skip {
      font-family: 'Urbanist', sans-serif !important;
      background: none !important;
      border: none !important;
      color: #999 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      margin-top: 16px !important;
      padding: 8px !important;
      text-transform: lowercase !important;
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
      display: block !important;
      width: auto !important;
    }
    .dm-ob-btn-skip:hover {
      color: #666 !important;
    }

    /* Labels */
    .dm-ob-label {
      font-family: 'Urbanist', sans-serif !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #555 !important;
      text-transform: lowercase !important;
    }

    /* Inputs */
    .dm-ob-input {
      font-family: 'Urbanist', sans-serif !important;
      border: 1.5px solid #ddd !important;
      border-radius: 10px !important;
      padding: 12px 14px !important;
      font-size: 15px !important;
      color: #1a1a1a !important;
      background: #fafafa !important;
      outline: none !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .dm-ob-input:focus {
      border-color: #6b2a5b !important;
      background: #fff !important;
    }
    .dm-ob-input::placeholder {
      color: #bbb !important;
    }

    /* Input rows */
    .dm-ob-input-row {
      display: flex !important;
      gap: 12px !important;
    }

    /* Address suggestions */
    #onboardingModal .onboarding-address-suggestions {
      display: none !important;
      position: absolute !important;
      top: 100% !important;
      left: 0 !important;
      right: 0 !important;
      background: #fff !important;
      border: 1.5px solid #ddd !important;
      border-radius: 10px !important;
      margin-top: 4px !important;
      z-index: 10 !important;
      max-height: 200px !important;
      overflow-y: auto !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }
    #onboardingModal .onboarding-address-suggestions.active {
      display: block !important;
    }
    #onboardingModal .address-suggestion {
      padding: 10px 14px !important;
      font-size: 14px !important;
      cursor: pointer !important;
      font-family: 'Urbanist', sans-serif !important;
      color: #333 !important;
    }
    #onboardingModal .address-suggestion:hover {
      background: #f5f0f4 !important;
    }

    /* Body type buttons */
    .dm-ob-body-btn {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 16px 14px !important;
      border: 1.5px solid #ddd !important;
      border-radius: 12px !important;
      background: #fafafa !important;
      cursor: pointer !important;
      font-family: 'Urbanist', sans-serif !important;
      font-size: 13px !important;
      color: #555 !important;
      text-transform: lowercase !important;
      min-width: 80px !important;
      box-sizing: border-box !important;
    }
    .dm-ob-body-btn:hover {
      border-color: #6b2a5b !important;
    }
    .dm-ob-body-btn.selected {
      border-color: #3d0c2e !important;
      background: #f5f0f4 !important;
      color: #3d0c2e !important;
      font-weight: 600 !important;
    }

    /* Checkbox options */
    .dm-ob-checkbox {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 10px 14px !important;
      border: 1.5px solid #eee !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      font-family: 'Urbanist', sans-serif !important;
      font-size: 15px !important;
      color: #333 !important;
      text-transform: lowercase !important;
      box-sizing: border-box !important;
    }
    .dm-ob-checkbox:hover {
      border-color: #6b2a5b !important;
      background: #faf7f9 !important;
    }
    .dm-ob-checkbox input[type="checkbox"] {
      accent-color: #3d0c2e !important;
      width: 18px !important;
      height: 18px !important;
    }

    /* Mobile */
    @media (max-width: 600px) {
      #onboardingModalInner {
        padding: 24px 20px !important;
        max-height: 95vh !important;
        border-radius: 12px !important;
      }
      .dm-ob-input-row {
        flex-direction: column !important;
      }
      .dm-ob-body-btn {
        min-width: 70px !important;
        padding: 12px 10px !important;
      }
    }
  `;
  document.head.appendChild(onboardingStyles);

  // Remove any existing Webflow onboarding modal (prevents duplicate/conflict)
  const existingOnboarding = document.getElementById('onboardingModal');
  if (existingOnboarding) {
    console.log('🗑️ Removing existing Webflow onboarding modal to prevent conflict');
    existingOnboarding.remove();
  }

  // Inject into body
  document.body.insertAdjacentHTML('beforeend', componentsHTML);
  console.log('✅ Components injected');
})();
