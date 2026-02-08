// ============================================
// ONBOARDING MODAL - HTML INJECTION
// Add this to GitHub and reference via script tag
// ============================================

(function() {
  'use strict';
  
  const onboardingModalHTML = `
<!-- MULTI-STEP ONBOARDING MODAL -->
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
        <h2 class="onboarding-title">welcome to the community!</h2>
        <p class="onboarding-subtitle">you're now subscribed. let's quickly set up your profile for a better experience; you can adjust it later.</p>
        <button class="onboarding-btn-primary" onclick="nextOnboardingStep()">continue</button>
        <button class="onboarding-btn-secondary" onclick="skipOnboarding()">i'll do this later</button>
      </div>
    </div>
    
    <!-- Step 2: Name Only -->
    <div class="onboarding-step" data-step="2">
      <div class="onboarding-content">
        <h2 class="onboarding-title">what's your name?</h2>
        <p class="onboarding-subtitle">let's get to know each other.</p>
        
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
        <p class="onboarding-subtitle">where can we reach you?</p>
        
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
        <p class="onboarding-subtitle">share your birthday if you love surprises!</p>
        
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
        <p class="onboarding-subtitle">this helps us recommend items that fit you perfectly.</p>
        
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
        <p class="onboarding-subtitle">this information helps optimize your experience and support the community; you can change it anytime.</p>
        
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
        <h2 class="onboarding-title">how did you hear about dematerialized?</h2>
        <p class="onboarding-subtitle">we're curious to know what brought you to us.</p>
        
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

  // Inject HTML into body when DOM is ready
  function injectOnboardingModal() {
    // Check if already injected
    if (document.getElementById('onboardingModal')) {
      console.log('🎓 Onboarding modal already exists, skipping injection');
      return;
    }
    
    // Create container and inject HTML
    const container = document.createElement('div');
    container.innerHTML = onboardingModalHTML;
    
    // Append to body
    document.body.appendChild(container.firstElementChild);
    
    console.log('🎓 Onboarding modal HTML injected into DOM');
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOnboardingModal);
  } else {
    injectOnboardingModal();
  }
  
})();
