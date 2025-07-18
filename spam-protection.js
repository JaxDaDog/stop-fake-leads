(function() {
    'use strict';
    
    // Stop Fake Leads Protection System
    const StopFakeLeads = {
        config: {
            apiKey: null,
            apiEndpoint: window.location.origin + '/.netlify/edge-functions/validate',
            debug: true
        },
        
        behaviorData: {
            pageLoadTime: Date.now(),
            mouseMovements: 0,
            keystrokes: 0,
            clicks: 0,
            scrolls: 0
        },
        
        init: function() {
            this.log('🛡️ Stop Fake Leads Protection Activated');
            this.generateApiKey();
            this.setupFormProtection();
            this.trackBehavior();
        },
        
        generateApiKey: function() {
            let apiKey = localStorage.getItem('sfl_api_key');
            if (!apiKey) {
                // Try to generate via API first
                fetch('/.netlify/edge-functions/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'standard' })
                })
                .then(response => response.json())
                .then(data => {
                    apiKey = data.apiKey;
                    localStorage.setItem('sfl_api_key', apiKey);
                    this.config.apiKey = apiKey;
                    this.log('🔑 New API key generated:', apiKey);
                })
                .catch(error => {
                    console.warn('API key generation failed, using fallback:', error);
                    // Fallback to client-side generation
                    const timestamp = Date.now();
                    const random = Math.random().toString(36).substring(2, 15);
                    apiKey = `sfl_${timestamp}_${random}`;
                    localStorage.setItem('sfl_api_key', apiKey);
                    this.config.apiKey = apiKey;
                    this.log('🔑 Fallback API key generated:', apiKey);
                });
            } else {
                this.config.apiKey = apiKey;
                this.log('🔑 Using existing API key:', apiKey);
            }
            return apiKey;
        },
        
        setupFormProtection: function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => this.protectForm(form));
            
            // Watch for dynamically added forms
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                            forms.forEach(form => this.protectForm(form));
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        },
        
        protectForm: function(form) {
            if (form.dataset.sflProtected) return;
            
            form.dataset.sflProtected = 'true';
            this.log('🔒 Protecting form:', form.id || 'unnamed');
            
            // Add honeypot
            this.addHoneypot(form);
            
            // Track interactions
            this.trackFormInteraction(form);
            
            // Override submission
            form.addEventListener('submit', (e) => this.handleSubmit(e, form));
        },
        
        addHoneypot: function(form) {
            if (form.querySelector('.sfl-honeypot')) return;
            
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website';
            honeypot.className = 'sfl-honeypot sfl-honeypot-hidden';
            honeypot.tabIndex = -1;
            honeypot.autocomplete = 'off';
            
            form.appendChild(honeypot);
            this.log('🍯 Added honeypot to form');
        },
        
        trackBehavior: function() {
            document.addEventListener('mousemove', () => this.behaviorData.mouseMovements++);
            document.addEventListener('keydown', () => this.behaviorData.keystrokes++);
            document.addEventListener('click', () => this.behaviorData.clicks++);
            document.addEventListener('scroll', () => this.behaviorData.scrolls++);
        },
        
        trackFormInteraction: function(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    if (!form.dataset.sflFirstFocus) {
                        form.dataset.sflFirstFocus = Date.now().toString();
                    }
                });
            });
        },
        
        handleSubmit: function(e, form) {
            e.preventDefault();
            this.log('📝 Form submission intercepted');
            
            const formData = this.collectFormData(form);
            const validationData = this.prepareValidationData(form, formData);
            
            this.validateSubmission(validationData)
                .then(result => {
                    if (result.allowed) {
                        this.log('✅ Submission ALLOWED', result);
                        this.showSuccess('Form submitted successfully! ✅');
                    } else {
                        this.log('🚫 Submission BLOCKED', result);
                        // Show success to user (don't reveal the block)
                        this.showSuccess('Form submitted successfully! ✅');
                    }
                    form.reset();
                })
                .catch(error => {
                    this.log('❌ Validation error:', error);
                    this.showSuccess('Form submitted successfully! ✅');
                    form.reset();
                });
        },
        
        collectFormData: function(form) {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        },
        
        prepareValidationData: function(form, formData) {
            const now = Date.now();
            const firstFocus = parseInt(form.dataset.sflFirstFocus) || now;
            const submissionSpeed = now - firstFocus;
            
            return {
                apiKey: this.config.apiKey,
                formData: formData,
                metadata: {
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer,
                    url: window.location.href,
                    submissionSpeed: submissionSpeed,
                    behaviorData: this.behaviorData
                },
                honeypotValue: formData.website || ''
            };
        },
        
        validateSubmission: function(data) {
            return fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            });
        },
        
        showSuccess: function(message) {
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 600;
            `;
            successDiv.textContent = message;
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        },
        
        log: function(message, data) {
            if (this.config.debug) {
                console.log('[Stop Fake Leads]', message, data || '');
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => StopFakeLeads.init());
    } else {
        StopFakeLeads.init();
    }
    
    // Expose for debugging and utils.js
    window.StopFakeLeads = StopFakeLeads;
})();