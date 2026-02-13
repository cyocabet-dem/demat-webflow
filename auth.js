document.addEventListener('DOMContentLoaded', function() {

  // --- Auth0 Configuration ---
  const auth0Config = {
    domain: 'dev-rgs24jdzcvdydd77.eu.auth0.com',
    clientId: 'o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV',
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  };
  const API_URL = window.API_BASE_URL || 'https://api.dematerialized.nl';
  window.auth0Client = null;

  async function initializeAuth0() {
    try {
      console.log('Starting Auth0 initialization...');
      window.auth0Client = await auth0.createAuth0Client({
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        
        authorizationParams: {
          redirect_uri: window.location.origin + '/',
          audience: 'https://api.dematerialized.nl/'
        },

        cacheLocation: auth0Config.cacheLocation,
        useRefreshTokens: auth0Config.useRefreshTokens
      });
      
      console.log('Auth0 client created successfully');
      
      // Handle redirect
      const query = window.location.search;
      if (query.includes("code=") && query.includes("state=")) {
        console.log('📨 Handling Auth0 redirect callback...');
        await window.auth0Client.handleRedirectCallback();
        
        // Get the return path that was stored before login
        const returnPath = sessionStorage.getItem('auth_return_path') || '/';
        sessionStorage.removeItem('auth_return_path');
        
        console.log('🔙 Returning to:', returnPath);
        
        // Clean up URL and redirect to return path
        window.history.replaceState({}, document.title, returnPath);
        
        // After successful login, check user status and redirect if needed (ONE TIME)
        await checkUserStatusAndRedirect();
      }
      
      // Update UI
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      console.log('Authentication status:', isAuthenticated);
      updateUI(isAuthenticated);
      
      if (isAuthenticated) {
        const user = await window.auth0Client.getUser();
        displayUserInfo(user);
        
        // Check user status on page load (for onboarding modal only - NO redirects)
        await checkUserStatus();
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
    }
  }

  // ============================================
  // CHECK USER STATUS (every page load, already authenticated)
  // Only shows onboarding modal. No redirects.
  // ============================================
  async function checkUserStatus() {
    try {
      // Pages where we skip the onboarding modal
      const skipPages = ['/onboarding', '/complete-your-profile', '/profile', '/memberships', '/error-membership-signup'];
      if (skipPages.includes(window.location.pathname)) {
        console.log('⏭️ On excluded page, skipping onboarding check');
        return;
      }

      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user status:', response.status);
        return;
      }
      
      const userData = await response.json();
      console.log('User data:', userData);
      
      // Store user data globally for easy access
      window.currentUserData = userData;
      
      const hasActiveMembership = !!userData.stripe_id;
      const hasCompletedProfile = userData.provided_information;
      const modalDismissed = sessionStorage.getItem('onboarding_modal_dismissed') === 'true';
      
      console.log('📋 User status:', { hasActiveMembership, hasCompletedProfile, modalDismissed });
      
      // Show onboarding modal if:
      // 1. Has membership (stripe_id exists)
      // 2. Profile not completed
      // 3. Modal not dismissed this session
      if (hasActiveMembership && !hasCompletedProfile && !modalDismissed) {
        console.log('⚠️ Has membership but incomplete profile - showing onboarding modal');
        setTimeout(function() { showOnboardingModal(); }, 500);
      }
      
      // Update display with first name
      displayFirstName();
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // ============================================
  // CHECK USER STATUS AFTER LOGIN (runs ONCE after Auth0 callback)
  // No membership → redirect to /memberships
  // ============================================
  async function checkUserStatusAndRedirect() {
    try {
      console.log('🔍 Checking user status after login...');
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user status:', response.status);
        return;
      }
      
      const userData = await response.json();
      console.log('User data after login:', userData);
      
      // Store user data globally
      window.currentUserData = userData;
      
      const hasActiveMembership = !!userData.stripe_id;
      
      if (!hasActiveMembership) {
        console.log('🚀 No membership - redirecting to /memberships');
        window.location.href = '/memberships';
        return;
      }
      
      console.log('✅ User has membership, staying on current page');
      
      // Update display with first name
      displayFirstName();
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // Show onboarding modal
  function showOnboardingModal() {
    if (typeof window.openOnboardingModal === 'function') {
      window.openOnboardingModal();
    }
  }

  // Update UI
  function updateUI(isAuthenticated) {
    const loggedInElements = document.querySelectorAll('[data-auth="logged-in"]');
    const loggedOutElements = document.querySelectorAll('[data-auth="logged-out"]');
    
     loggedInElements.forEach(el => {
    el.style.display = isAuthenticated ? 'block' : 'none';
  });
  
  loggedOutElements.forEach(el => {
    el.style.display = !isAuthenticated ? 'block' : 'none';
  });
  }

  // Display user info
  function displayUserInfo(user) {
    if (!user) return;
    document.querySelectorAll('[data-auth="user-name"]').forEach(el => {
      el.textContent = user.name || user.email || 'User';
    });
    document.querySelectorAll('[data-auth="user-email"]').forEach(el => {
      el.textContent = user.email || '';
    });
    document.querySelectorAll('[data-auth="user-picture"]').forEach(el => {
      if (user.picture) el.src = user.picture;
    });
  }

  // Display first name from API data
  function displayFirstName() {
    if (!window.currentUserData) return;
    
    const attributes = window.currentUserData.attributes || [];
    const firstNameAttr = attributes.find(attr => attr.key === 'first_name');
    const firstName = firstNameAttr?.value || '';
    
    if (firstName) {
      document.querySelectorAll('[data-auth="user-name"]').forEach(el => {
        el.textContent = firstName;
      });
      console.log('👤 Displaying first name:', firstName);
    }
  }

  // Login - Store current path before redirecting
  async function login() {
    if (!window.auth0Client) return;
    
    // Store current path so we can return here after login
    sessionStorage.setItem('auth_return_path', window.location.pathname);
    console.log('💾 Stored return path:', window.location.pathname);
    
    await window.auth0Client.loginWithRedirect();
  }

  // Logout
  async function logout() {
    if (!window.auth0Client) return;
    sessionStorage.removeItem('onboarding_modal_dismissed');
    await window.auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin + '/'
      }
    });
  }

  // API Calling Function
  async function callApi() {
    console.log("Attempting to call API...");
    try {
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "API failed");
      console.log("API Response:", data);
      alert("API call successful! Check the console.");
    } catch (e) {
      console.error("API call failed", e);
      alert(`API call failed: ${e.message}`);
    }
  }

  // Initialize and connect buttons
  initializeAuth0();
  
  setTimeout(() => {
    // Connect login/logout by data-attribute
    document.querySelectorAll('[data-auth-action="login"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), login()));
    });
    document.querySelectorAll('[data-auth-action="logout"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), logout()));
    });

    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) loginBtn.addEventListener('click', e => (e.preventDefault(), login()));

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', e => (e.preventDefault(), logout()));

    const apiBtn = document.getElementById('btn-call-api');
    if (apiBtn) apiBtn.addEventListener('click', e => (e.preventDefault(), callApi()));

  }, 100);
  
  // Debug helper
  window.debugAuth = async function() { 
    console.log('=== Auth Debug Info ===');
    console.log('Auth0 Client exists:', !!window.auth0Client);
    if (window.auth0Client) {
      const isAuth = await window.auth0Client.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      if (isAuth) {
        const user = await window.auth0Client.getUser();
        console.log('User:', user);
        console.log('User Data from API:', window.currentUserData);
        try {
          const token = await window.auth0Client.getTokenSilently();
          console.log('Access Token:', token.substring(0, 20) + "...");
        } catch(e) {
          console.error("Could not get token", e);
        }
      }
    }
    console.log('Stored return path:', sessionStorage.getItem('auth_return_path'));
  };
  
  // Expose check function globally
  window.checkUserStatus = checkUserStatus;
  
  console.log('Auth0 script loaded. Type debugAuth() in console for debug info.');
});
