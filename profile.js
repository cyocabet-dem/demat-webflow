// ============================================
// PROFILE PAGE - VUE APP
// ============================================

console.log('👤 [Profile] Script loading...');

// Auth Protection
(function checkAuth() {
  if (typeof window.auth0Client === 'undefined') {
    setTimeout(checkAuth, 100);
    return;
  }
  
  window.auth0Client.isAuthenticated()
    .then(isAuthenticated => {
      if (!isAuthenticated) {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/';
    });
})();

// Wait for Vue to load
function initProfileApp() {
  if (typeof Vue === 'undefined') {
    setTimeout(initProfileApp, 100);
    return;
  }
  
  const { createApp } = Vue;

  createApp({
    data() {
      return {
        loading: true,
        submitting: {
          personal: false,
          address: false,
          size: false
        },
        successMessages: {
          personal: '',
          address: '',
          size: ''
        },
        errorMessages: {
          personal: '',
          address: '',
          size: ''
        },
        
        // Address search
        addressSearch: '',
        addressResults: [],
        showAddressResults: false,
        addressDebounce: null,
        
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
      }
    },
    
    async mounted() {
      console.log('✅ [Profile] Vue app mounted');
      document.addEventListener('click', this.handleClickOutside);
      await this.loadUserData();
    },
    
    beforeUnmount() {
      document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
      handleClickOutside(event) {
        if (!this.showAddressResults) return;
        
        const formGroup = event.target.closest('.form-group');
        if (!formGroup || !formGroup.querySelector('input[placeholder*="Start typing"]')) {
          this.showAddressResults = false;
        }
      },
      
      async searchAddress() {
        const query = this.addressSearch.trim();
        
        if (query.length < 3) {
          this.addressResults = [];
          this.showAddressResults = false;
          return;
        }
        
        clearTimeout(this.addressDebounce);
        
        this.addressDebounce = setTimeout(async () => {
          try {
            const apiKey = 'ce61be62b3c344838d731909f625cfd1';
            const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&filter=countrycode:nl&limit=5`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              this.addressResults = data.features;
              this.showAddressResults = true;
            } else {
              this.addressResults = [];
              this.showAddressResults = false;
            }
          } catch (error) {
            console.error('[Profile] Address search error:', error);
          }
        }, 300);
      },
      parseApiError(errorData) {
        // Handle FastAPI validation error format
        if (errorData.detail && Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return `${fieldName}: ${err.msg}`;
            });
            return messages.join(', ');
        }
        
        // Handle string error
        if (typeof errorData.detail === 'string') {
            return errorData.detail;
        }
        
        // Fallback
        return 'Failed to update. Please try again.';
        },

      
      selectAddress(feature) {
        const props = feature.properties;
        
        this.addressSearch = props.formatted;
        this.formData.addressStreet = props.street || '';
        this.formData.addressHouseNumber = props.housenumber || '';
        this.formData.addressCity = props.city || '';
        this.formData.addressZipcode = props.postcode || '';
        
        this.showAddressResults = false;
      },
      
      async loadUserData() {
        try {
          while (!window.auth0Client) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const token = await window.auth0Client.getTokenSilently();
          const response = await fetch(`${window.API_BASE_URL}/users/me`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to load profile data');
          }
          
          const userData = await response.json();
          
          this.formData.email = userData.email || '';
          this.formData.dateOfBirth = userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '';
          this.formData.phoneNumber = userData.phone_number || '';
          this.formData.addressHouseNumber = userData.address_house_number || '';
          this.formData.addressZipcode = userData.address_zipcode || '';
          this.formData.addressCity = userData.address_city || '';

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
                this.formData[attrMap[attr.key]] = attr.value;
              }
            });
          }
          
          this.loading = false;
          
        } catch (error) {
          console.error('❌ [Profile] Error loading data:', error);
          this.errorMessages.personal = 'Failed to load profile data. Please refresh the page.';
          this.loading = false;
        }
      },
      
      clearMessages(section) {
        this.successMessages[section] = '';
        this.errorMessages[section] = '';
      },
      
    async updatePersonalInfo() {
    this.submitting.personal = true;
    this.clearMessages('personal');
    
    try {
        const token = await window.auth0Client.getTokenSilently();
        
        const customAttributes = [];
        if (this.formData.firstName) {
        customAttributes.push({ key: 'first_name', value: this.formData.firstName });
        }
        if (this.formData.lastName) {
        customAttributes.push({ key: 'last_name', value: this.formData.lastName });
        }
        
        const apiData = {
        phone_number: this.formData.phoneNumber || null,
        date_of_birth: this.formData.dateOfBirth || null,
        attributes: customAttributes
        };
        
        const response = await fetch(`${window.API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
        });
        
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(this.parseApiError(errorData));
        }
        
        this.successMessages.personal = '✓ Personal information updated!';
        setTimeout(() => this.successMessages.personal = '', 3000);
        
    } catch (error) {
        console.error('❌ [Profile] Error:', error);
        this.errorMessages.personal = error.message;
    } finally {
        this.submitting.personal = false;
    }
    },      

    async updateAddress() {
  this.submitting.address = true;
  this.clearMessages('address');
  
  try {
    const token = await window.auth0Client.getTokenSilently();
    
    const customAttributes = [];
    if (this.formData.addressStreet) {
      customAttributes.push({ key: 'address_street', value: this.formData.addressStreet });
    }
    if (this.formData.addressUnit) {
      customAttributes.push({ key: 'address_unit', value: this.formData.addressUnit });
    }
    
    const apiData = {
      address_house_number: this.formData.addressHouseNumber || null,
      address_zipcode: this.formData.addressZipcode || null,
      address_city: this.formData.addressCity || null,
      attributes: customAttributes
    };
    
    const response = await fetch(`${window.API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(this.parseApiError(errorData));
    }
    
    this.successMessages.address = '✓ Address updated!';
    setTimeout(() => this.successMessages.address = '', 3000);
    
  } catch (error) {
    console.error('❌ [Profile] Error:', error);
    this.errorMessages.address = error.message;
  } finally {
    this.submitting.address = false;
  }
},
async updateSizeProfile() {
  this.submitting.size = true;
  this.clearMessages('size');
  
  try {
    const token = await window.auth0Client.getTokenSilently();
    
    const customAttributes = [];
    if (this.formData.heightCm) {
      customAttributes.push({ key: 'height_cm', value: this.formData.heightCm });
    }
    if (this.formData.preferredFit) {
      customAttributes.push({ key: 'preferred_fit', value: this.formData.preferredFit });
    }
    if (this.formData.shirtSize) {
      customAttributes.push({ key: 'shirt_size', value: this.formData.shirtSize });
    }
    if (this.formData.pantsSize) {
      customAttributes.push({ key: 'pants_size', value: this.formData.pantsSize });
    }
    if (this.formData.shoeSize) {
      customAttributes.push({ key: 'shoe_size', value: this.formData.shoeSize });
    }
    
    const apiData = {
      attributes: customAttributes
    };
    
    const response = await fetch(`${window.API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(this.parseApiError(errorData));
    }
    
    this.successMessages.size = '✓ Size profile updated!';
    setTimeout(() => this.successMessages.size = '', 3000);
    
  } catch (error) {
    console.error('❌ [Profile] Error:', error);
    this.errorMessages.size = error.message;
  } finally {
    this.submitting.size = false;
  }
}

    }
  }).mount('#vue-profile-app');
  
  console.log('✅ [Profile] Vue app initialized');
}

initProfileApp();