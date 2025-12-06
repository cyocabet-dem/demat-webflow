// ============================================
// ACCOUNT PAGE - UNIFIED VUE APP
// ============================================

console.log('📱 [Account] Loading unified account app...');

(function() {
  const API_BASE = window.API_BASE_URL;
  
  // Wait for Vue and Auth0
  function waitForDependencies(callback) {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (typeof Vue !== 'undefined' && window.auth0Client) {
        callback();
      } else if (attempts < 100) {
        setTimeout(check, 50);
      } else {
        console.error('📱 [Account] Dependencies not loaded');
      }
    };
    check();
  }

  function initAccountApp() {
    const container = document.getElementById('account-app');
    if (!container) {
      console.log('📱 [Account] No #account-app found, skipping init');
      return;
    }

    console.log('📱 [Account] Initializing Vue app...');
    
    const { createApp } = Vue;

    const app = createApp({
      data() {
        return {
          // Navigation
          activeTab: 'profile',
          tabs: [
            { id: 'profile', label: 'Profile', icon: 'user' },
            { id: 'rentals', label: 'My Rentals', icon: 'shirt' },
            { id: 'reservations', label: 'Reservations', icon: 'calendar' },
            { id: 'donations', label: 'Donations & Credits', icon: 'gift' },
            { id: 'purchases', label: 'Purchases', icon: 'shopping-bag' },
            { id: 'membership', label: 'Membership', icon: 'crown' }
          ],
          
          // Auth state
          isAuthenticated: false,
          
          // Loading states
          loading: {
            profile: true,
            rentals: true,
            reservations: true,
            membership: true
          },
          
          // ========== PROFILE DATA ==========
          profile: {
            submitting: { personal: false, address: false, size: false },
            success: { personal: '', address: '', size: '' },
            error: { personal: '', address: '', size: '' },
            addressSearch: '',
            addressResults: [],
            showAddressResults: false,
            formData: {
              firstName: '',
              lastName: '',
              email: '',
              dateOfBirth: '',
              phoneNumber: '',
              addressStreet: '',
              addressHouseNumber: '',
              addressUnit: '',
              addressZipcode: '',
              addressCity: '',
              heightCm: '',
              preferredFit: '',
              shirtSize: '',
              pantsSize: '',
              shoeSize: ''
            }
          },
          
          // ========== RENTALS DATA ==========
          rentals: {
            active: [],
            history: []
          },
          
          // ========== RESERVATIONS DATA ==========
          reservations: {
            list: []
          },
          
          // ========== MEMBERSHIP DATA ==========
          membership: {
            hasMembership: false,
            name: '',
            startedAt: '',
            rentalItemsAtATime: 0,
            collectionAccess: ''
          },
          
          // ========== MODALS ==========
          modals: {
            rentalDetail: { show: false, rental: null },
            reservationDetail: { show: false, reservation: null }
          }
        };
      },

      computed: {
        hasActiveRentals() {
          return this.rentals.active.length > 0;
        },
        hasRentalHistory() {
          return this.rentals.history.length > 0;
        },
        hasReservations() {
          return this.reservations.list.length > 0;
        }
      },

      async mounted() {
        console.log('📱 [Account] Vue app mounted');
        
        // Handle hash routing
        this.handleHashChange();
        window.addEventListener('hashchange', this.handleHashChange);
        
        // Check auth and load data
        await this.checkAuth();
      },

      beforeUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);
      },

      methods: {
        // ========== NAVIGATION ==========
        
        handleHashChange() {
          const hash = window.location.hash.slice(1) || 'profile';
          const validTab = this.tabs.find(t => t.id === hash);
          if (validTab) {
            this.activeTab = hash;
          } else {
            this.activeTab = 'profile';
            window.location.hash = 'profile';
          }
        },
        
        switchTab(tabId) {
          this.activeTab = tabId;
          window.location.hash = tabId;
        },

        // ========== AUTH ==========
        
        async checkAuth() {
          try {
            this.isAuthenticated = await window.auth0Client.isAuthenticated();
            
            if (!this.isAuthenticated) {
              console.log('📱 [Account] Not authenticated, redirecting...');
              window.location.href = '/';
              return;
            }
            
            // Load all data
            await Promise.all([
              this.loadProfile(),
              this.loadRentals(),
              this.loadReservations(),
              this.loadMembership()
            ]);
            
          } catch (err) {
            console.error('📱 [Account] Auth check failed:', err);
            window.location.href = '/';
          }
        },
        
        async getToken() {
          return await window.auth0Client.getTokenSilently();
        },

        // ========== PROFILE METHODS ==========
        
        async loadProfile() {
          this.loading.profile = true;
          try {
            const token = await this.getToken();
            const response = await fetch(`${API_BASE}/users/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load profile');
            
            const userData = await response.json();
            
            this.profile.formData.email = userData.email || '';
            this.profile.formData.dateOfBirth = userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '';
            this.profile.formData.phoneNumber = userData.phone_number || '';
            this.profile.formData.addressHouseNumber = userData.address_house_number || '';
            this.profile.formData.addressZipcode = userData.address_zipcode || '';
            this.profile.formData.addressCity = userData.address_city || '';

            if (userData.attributes) {
              const attrMap = {
                'first_name': 'firstName',
                'last_name': 'lastName',
                'address_street': 'addressStreet',
                'address_unit': 'addressUnit',
                'height_cm': 'heightCm',
                'preferred_fit': 'preferredFit',
                'shirt_size': 'shirtSize',
                'pants_size': 'pantsSize',
                'shoe_size': 'shoeSize'
              };
              
              userData.attributes.forEach(attr => {
                if (attrMap[attr.key]) {
                  this.profile.formData[attrMap[attr.key]] = attr.value;
                }
              });
            }
            
          } catch (err) {
            console.error('📱 [Account] Profile load error:', err);
            this.profile.error.personal = 'Failed to load profile data';
          } finally {
            this.loading.profile = false;
          }
        },
        
        async searchAddress() {
          const query = this.profile.addressSearch.trim();
          if (query.length < 3) {
            this.profile.addressResults = [];
            this.profile.showAddressResults = false;
            return;
          }
          
          try {
            const apiKey = 'ce61be62b3c344838d731909f625cfd1';
            const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&filter=countrycode:nl&limit=5`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.features?.length > 0) {
              this.profile.addressResults = data.features;
              this.profile.showAddressResults = true;
            } else {
              this.profile.addressResults = [];
              this.profile.showAddressResults = false;
            }
          } catch (err) {
            console.error('📱 [Account] Address search error:', err);
          }
        },
        
        selectAddress(feature) {
          const props = feature.properties;
          this.profile.addressSearch = props.formatted;
          this.profile.formData.addressStreet = props.street || '';
          this.profile.formData.addressHouseNumber = props.housenumber || '';
          this.profile.formData.addressCity = props.city || '';
          this.profile.formData.addressZipcode = props.postcode || '';
          this.profile.showAddressResults = false;
        },
        
        parseApiError(errorData) {
          if (errorData.detail && Array.isArray(errorData.detail)) {
            return errorData.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return `${fieldName}: ${err.msg}`;
            }).join(', ');
          }
          if (typeof errorData.detail === 'string') return errorData.detail;
          return 'Failed to update. Please try again.';
        },
        
        clearProfileMessages(section) {
          this.profile.success[section] = '';
          this.profile.error[section] = '';
        },
        
        async updatePersonalInfo() {
          this.profile.submitting.personal = true;
          this.clearProfileMessages('personal');
          
          try {
            const token = await this.getToken();
            const customAttributes = [];
            
            if (this.profile.formData.firstName) {
              customAttributes.push({ key: 'first_name', value: this.profile.formData.firstName });
            }
            if (this.profile.formData.lastName) {
              customAttributes.push({ key: 'last_name', value: this.profile.formData.lastName });
            }
            
            const response = await fetch(`${API_BASE}/users/me`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone_number: this.profile.formData.phoneNumber || null,
                date_of_birth: this.profile.formData.dateOfBirth || null,
                attributes: customAttributes
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(this.parseApiError(errorData));
            }
            
            this.profile.success.personal = '✓ Personal information updated!';
            setTimeout(() => this.profile.success.personal = '', 3000);
            
          } catch (err) {
            this.profile.error.personal = err.message;
          } finally {
            this.profile.submitting.personal = false;
          }
        },
        
        async updateAddress() {
          this.profile.submitting.address = true;
          this.clearProfileMessages('address');
          
          try {
            const token = await this.getToken();
            const customAttributes = [];
            
            if (this.profile.formData.addressStreet) {
              customAttributes.push({ key: 'address_street', value: this.profile.formData.addressStreet });
            }
            if (this.profile.formData.addressUnit) {
              customAttributes.push({ key: 'address_unit', value: this.profile.formData.addressUnit });
            }
            
            const response = await fetch(`${API_BASE}/users/me`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                address_house_number: this.profile.formData.addressHouseNumber || null,
                address_zipcode: this.profile.formData.addressZipcode || null,
                address_city: this.profile.formData.addressCity || null,
                attributes: customAttributes
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(this.parseApiError(errorData));
            }
            
            this.profile.success.address = '✓ Address updated!';
            setTimeout(() => this.profile.success.address = '', 3000);
            
          } catch (err) {
            this.profile.error.address = err.message;
          } finally {
            this.profile.submitting.address = false;
          }
        },
        
        async updateSizeProfile() {
          this.profile.submitting.size = true;
          this.clearProfileMessages('size');
          
          try {
            const token = await this.getToken();
            const customAttributes = [];
            
            const sizeFields = ['heightCm', 'preferredFit', 'shirtSize', 'pantsSize', 'shoeSize'];
            const keyMap = {
              heightCm: 'height_cm',
              preferredFit: 'preferred_fit',
              shirtSize: 'shirt_size',
              pantsSize: 'pants_size',
              shoeSize: 'shoe_size'
            };
            
            sizeFields.forEach(field => {
              if (this.profile.formData[field]) {
                customAttributes.push({ key: keyMap[field], value: this.profile.formData[field] });
              }
            });
            
            const response = await fetch(`${API_BASE}/users/me`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ attributes: customAttributes })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(this.parseApiError(errorData));
            }
            
            this.profile.success.size = '✓ Size profile updated!';
            setTimeout(() => this.profile.success.size = '', 3000);
            
          } catch (err) {
            this.profile.error.size = err.message;
          } finally {
            this.profile.submitting.size = false;
          }
        },

        // ========== RENTALS METHODS ==========
        
        async loadRentals() {
          this.loading.rentals = true;
          try {
            const token = await this.getToken();
            
            const [activeRes, historyRes] = await Promise.all([
              fetch(`${API_BASE}/private_clothing_items/rentals`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }),
              fetch(`${API_BASE}/private_clothing_items/rentals?include_history=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
            ]);
            
            if (activeRes.ok) {
              this.rentals.active = await activeRes.json();
            }
            
            if (historyRes.ok) {
              const allRentals = await historyRes.json();
              this.rentals.history = allRentals
                .filter(r => r.status === 'Returned')
                .sort((a, b) => new Date(b.rental_return_date) - new Date(a.rental_return_date));
            }
            
          } catch (err) {
            console.error('📱 [Account] Rentals load error:', err);
          } finally {
            this.loading.rentals = false;
          }
        },
        
        getRentalImage(rental) {
          if (!rental.clothing_item?.images?.length) return '';
          const frontImg = rental.clothing_item.images.find(img =>
            img.image_type === 'front' || img.image_name?.toLowerCase().includes('front')
          );
          return frontImg?.object_url || rental.clothing_item.images[0]?.object_url || '';
        },
        
        openRentalModal(rental) {
          this.modals.rentalDetail.rental = rental;
          this.modals.rentalDetail.show = true;
          document.body.style.overflow = 'hidden';
        },
        
        closeRentalModal() {
          this.modals.rentalDetail.show = false;
          this.modals.rentalDetail.rental = null;
          document.body.style.overflow = '';
        },
        
        goToProduct(sku) {
          window.location.href = `/product?sku=${encodeURIComponent(sku)}`;
        },

        // ========== RESERVATIONS METHODS ==========
        
        async loadReservations() {
          this.loading.reservations = true;
          try {
            const token = await this.getToken();
            const response = await fetch(`${API_BASE}/private_clothing_items/reservations`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              this.reservations.list = data
                .filter(r => r.items?.length > 0)
                .sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
            }
            
          } catch (err) {
            console.error('📱 [Account] Reservations load error:', err);
          } finally {
            this.loading.reservations = false;
          }
        },
        
        getReservationItemImage(item) {
          if (!item.clothing_item?.images?.length) return '';
          const frontImg = item.clothing_item.images.find(img =>
            img.image_type === 'front' || img.image_name?.toLowerCase().includes('front')
          );
          return frontImg?.object_url || item.clothing_item.images[0]?.object_url || '';
        },
        
        getStatusStyle(status) {
          const styles = {
            'pending': { bg: '#fef3c7', color: '#92400e' },
            'ready': { bg: '#d1fae5', color: '#065f46' },
            'completed': { bg: '#e0e7ff', color: '#3730a3' },
            'cancelled': { bg: '#fee2e2', color: '#991b1b' },
            'expired': { bg: '#f3f4f6', color: '#6b7280' }
          };
          return styles[status] || styles['pending'];
        },
        
        getStatusLabel(status) {
          const labels = {
            'pending': 'Pending',
            'ready': 'Ready for Pickup',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'expired': 'Expired'
          };
          return labels[status] || 'Pending';
        },
        
        openReservationModal(reservation) {
          this.modals.reservationDetail.reservation = reservation;
          this.modals.reservationDetail.show = true;
          document.body.style.overflow = 'hidden';
        },
        
        closeReservationModal() {
          this.modals.reservationDetail.show = false;
          this.modals.reservationDetail.reservation = null;
          document.body.style.overflow = '';
        },

        // ========== MEMBERSHIP METHODS ==========
        
        async loadMembership() {
          this.loading.membership = true;
          try {
            const token = await this.getToken();
            const response = await fetch(`${API_BASE}/users/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              const userData = await response.json();
              
              if (userData.membership?.active) {
                this.membership.hasMembership = true;
                this.membership.name = userData.membership.name;
                this.membership.startedAt = userData.started_at;
                this.membership.rentalItemsAtATime = userData.membership.rental_items_at_a_time;
                this.membership.collectionAccess = userData.membership.collection_access;
              } else {
                this.membership.hasMembership = false;
              }
            }
            
          } catch (err) {
            console.error('📱 [Account] Membership load error:', err);
          } finally {
            this.loading.membership = false;
          }
        },

        // ========== UTILITY METHODS ==========
        
        formatDate(dateString) {
          if (!dateString) return 'N/A';
          return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        },
        
        formatDateUS(dateString) {
          if (!dateString) return 'N/A';
          return new Date(dateString).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });
        }
      }
    });

    app.mount('#account-app');
    console.log('📱 [Account] Vue app mounted successfully');
  }

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDependencies(initAccountApp));
  } else {
    waitForDependencies(initAccountApp);
  }
})();