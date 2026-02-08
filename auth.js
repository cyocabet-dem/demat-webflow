// ============================================
// DEMATERIALIZED - AUTH.JS
// Updated: Simplified signup flow for in-store QR code
// Flow: Signup → Memberships → Payment → Onboarding Modal
// ============================================

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
        
        console.log('🔙 Return path was:', returnPath);
        
        // Clean up URL first
        window.history.replaceState({}, document.title, returnPath);
        
        // After successful login, check user status and handle redirect
        await checkUserStatusAndRedirect(returnPath);
      }
      
      // Update UI
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      console.log('Authentication status:', isAuthenticated);
      updateUI(isAuthenticated);
      
      if (isAuthenticated) {
        const user = await window.auth0Client.getUser();
        displayUserInfo(user);
        
        // Check user status on page load if already authenticated
        await checkUserStatus();
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
    }
  }

  // ============================================
  // CHECK USER STATUS (on page load)
  // Shows onboarding modal if:
  // - User HAS active membership
  // - User has NOT completed profile
  // - Modal hasn't been dismissed this session
  // Redirects to /memberships if:
  // - User does NOT have active membership
  // - User is not already on memberships page
  // ============================================
  async function checkUserStatus() {
    try {
      // Pages where we skip the redirect/modal logic
      const skipPages = ['/onboarding', '/profile', '/memberships', '/welcome-to-dematerialized', '/error-membership-signup'];
      const currentPath = window.location.pathname;
      
      if (skipPages.includes(currentPath)) {
        console.log('⏭️ On excluded page, skipping status check');
        return;
      }
      
      console.log('🔍 Checking user status...');
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
      
      // Store user data globally
      window.currentUserData = userData;
      
      // Check membership and profile status
      const hasActiveMembership = userData.membership && userData.membership.active;
      const hasCompletedProfile = userData.provided_information;
      const modalDismissed = sessionStorage.getItem('onboarding_modal_dismissed') === 'true';
      
      console.log('📋 User status:', {
        hasActiveMembership,
        hasCompletedProfile,
        modalDismissed,
        currentPath
      });
      
      // FLOW LOGIC:
      // 1. No membership → redirect to /memberships
      // 2. Has membership + incomplete profile + modal not dismissed → show modal
      // 3. Otherwise → do nothing
      
      if (!hasActiveMembership) {
        console.log('⚠️ User has no active membership - redirecting to /memberships');
        window.location.href = '/memberships';
        return;
      }
      
      if (hasActiveMembership && !hasCompletedProfile && !modalDismissed) {
        console.log('⚠️ User has membership but incomplete profile - showing onboarding modal');
        setTimeout(() => {
          showOnboardingModal();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // ============================================
  // CHECK USER STATUS AND REDIRECT (after login)
  // Called immediately after Auth0 callback
  // ============================================
  async function checkUserStatusAndRedirect(returnPath) {
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
      
      // Check membership status
      const hasActiveMembership = userData.membership && userData.membership.active;
      const hasCompletedProfile = userData.provided_information;
      
      console.log('📋 Post-login status:', {
        hasActiveMembership,
        hasCompletedProfile,
        returnPath
      });
      
      // FLOW LOGIC:
      // 1. No membership → redirect to /memberships (new users need to pay first)
      // 2. Has membership + incomplete profile → stay on page, modal will show
      // 3. Has membership + complete profile → stay on return path
      
      if (!hasActiveMembership) {
        console.log('🚀 User has no membership - redirecting to /memberships');
        window.location.href = '/memberships';
        return;
      }
      
      // User has membership - stay on current page
      // The checkUserStatus() call in initializeAuth0 will handle showing the modal
      console.log('✅ User has active membership, staying on:', returnPath);
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // Show onboarding modal
  function showOnboardingModal() {
    if (typeof window.openOnboardingModal === 'function') {
      window.openOnboardingModal();
    } else {
      console.warn('openOnboardingModal function not found');
    }
  }

  // Update UI based on auth state
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

  // Display user info in elements with data-auth attributes
  function displayUserInfo(user) {
    if (!user) return;
    
    // Try to get first name from API data if available
    let displayName = user.name || user.email || 'User';
    
    if (window.currentUserData && window.currentUserData.attributes) {
      const firstNameAttr = window.currentUserData.attributes.find(attr => attr.key === 'first_name');
      if (firstNameAttr && firstNameAttr.value) {
        displayName = firstNameAttr.value;
      }
    }
    
    document.querySelectorAll('[data-auth="user-name"]').forEach(el => {
      el.textContent = displayName;
    });
    document.querySelectorAll('[data-auth="user-email"]').forEach(el => {
      el.textContent = user.email || '';
    });
    document.querySelectorAll('[data-auth="user-picture"]').forEach(el => {
      if (user.picture) el.src = user.picture;
    });
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
    
    // Clear any session storage items
    sessionStorage.removeItem('onboarding_modal_dismissed');
    sessionStorage.removeItem('auth_return_path');
    
    await window.auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin + '/'
      }
    });
  }

  // API Calling Function (for testing)
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

  // Initialize Auth0
  initializeAuth0();
  
  // Connect buttons after a short delay
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
        console.log('Has active membership:', window.currentUserData?.membership?.active);
        console.log('Has completed profile:', window.currentUserData?.provided_information);
        console.log('Modal dismissed:', sessionStorage.getItem('onboarding_modal_dismissed'));
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
  
  // Expose functions globally
  window.checkUserStatus = checkUserStatus;
  window.login = login;
  window.logout = logout;
  
  console.log('Auth0 script loaded. Type debugAuth() in console for debug info.');
});
