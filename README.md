# Dematerialized Webflow Scripts

Scripts and styles for the Dematerialized website running on Webflow.

## 📁 What's in this repo

| File | Purpose |
|------|---------|
| `styles.css` | All custom CSS (modals, cart, filters, etc.) |
| `components.js` | Injects HTML for modals (cart, reservation, upgrade, etc.) |
| `auth.js` | Auth0 authentication + onboarding logic |
| `site-wide-footer.js` | Cart, reservations, membership handlers |
| `clothing.js` | Clothing page specific functionality |
| `reservations.js` | Reservations page specific functionality |

---

## 🔧 Webflow Setup

### 1. Head Code (Site Settings → Custom Code → Head)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600&display=swap" rel="stylesheet">

<script>
  const hostname = window.location.hostname;
  const isProduction = hostname === 'dematerialized.nl' || hostname === 'www.dematerialized.nl';
  
  window.API_BASE_URL = isProduction 
    ? 'https://api.dematerialized.nl'
    : 'https://test-api.dematerialized.nl';
    
  window.CDN_BRANCH = isProduction ? 'main' : 'test';
  
  console.log(`[${isProduction ? 'PROD' : 'DEV'}] API: ${window.API_BASE_URL}, CDN: ${window.CDN_BRANCH}`);
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css">
```

> ⚠️ **Note:** The stylesheet uses `@main` directly because CSS needs to load before page render. The JS files use dynamic branching.

### 2. Footer Code (Site Settings → Custom Code → Footer)

```html
<script src="https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js"></script>
<script>
  (function() {
    const branch = window.CDN_BRANCH || 'main';
    const base = 'https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@' + branch;
    
    ['components.js', 'auth.js', 'site-wide-footer.js'].forEach(function(file) {
      var s = document.createElement('script');
      s.src = base + '/' + file;
      document.body.appendChild(s);
    });
  })();
</script>
```

### 3. Page-Specific Scripts

For the **Clothing page**, add to page settings footer:
```html
<script src="https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/clothing.js"></script>
```

For the **Reservations page**, add to page settings footer:
```html
<script src="https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/reservations.js"></script>
```

---

## 🌿 Branches

| Branch | Used by | Purpose |
|--------|---------|---------|
| `main` | dematerialized.nl | Production |
| `test` | dematerialized-24fc59.webflow.io | Testing |

### How it works

- When you visit `dematerialized.nl` → loads scripts from `main` branch
- When you visit the Webflow staging URL → loads scripts from `test` branch

---

## ✏️ Making Changes

### Quick edits
1. Go to the file on GitHub
2. Click the pencil icon (Edit)
3. Make your changes
4. Select which branch to commit to:
   - `test` → test on staging first
   - `main` → goes live immediately

### Proper workflow
1. Make changes on `test` branch
2. Test on staging site (dematerialized-24fc59.webflow.io)
3. When happy, create a Pull Request from `test` → `main`
4. Merge to go live

### Cache
When you push changes, GitHub Actions automatically clears the CDN cache. Changes should appear within 1-2 minutes.

If changes don't appear:
1. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. Check browser console for the version being loaded

---

## 🐛 Debugging

Open browser console (`F12` or `Cmd + Option + I`) and look for:

```
[PROD] API: https://api.dematerialized.nl, CDN: main
```
or
```
[DEV] API: https://test-api.dematerialized.nl, CDN: test
```

### Useful console commands

```javascript
// Check auth status
debugAuth()

// Test modals
testAuthModal()
testOnboardingModal()
testCart()

// Check cart contents
CartManager.getCart()
```

---

## 📋 Webflow Elements Reference

These `data-` attributes are used to connect Webflow elements to the scripts:

| Attribute | Purpose |
|-----------|---------|
| `data-auth="logged-in"` | Show only when user is logged in |
| `data-auth="logged-out"` | Show only when user is logged out |
| `data-auth-action="login"` | Triggers login on click |
| `data-auth-action="logout"` | Triggers logout on click |
| `data-auth-action="signup"` | Triggers signup on click |
| `data-cart-trigger` | Opens cart overlay on click |
| `data-cart-count` | Displays cart item count |
| `data-membership="Basic"` | Triggers Basic membership checkout |
| `data-membership="Premium"` | Triggers Premium membership checkout |
| `data-filter-open` | Opens filter menu |
| `data-filter-close` | Closes filter menu |

---

## 🆘 Need Help?

If something breaks:
1. Check browser console for red errors
2. Make sure you're on the right branch
3. Try hard refresh
4. Ask Edward or Courtney 😊