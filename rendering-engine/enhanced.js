/**
 * ============================================================================
 * TRAVEL QUOTATION ENGINE - Enhanced JavaScript
 * Additional functionality for extended components
 * Version: 1.0.0
 * ============================================================================
 */

(function() {
  'use strict';

  // --------------------------------------------------------------------------
  // TABS COMPONENT
  // --------------------------------------------------------------------------
  const Tabs = {
    init() {
      Utils.$$('.tabs').forEach(tabsContainer => {
        const header = Utils.$('.tabs-header', tabsContainer);
        const buttons = Utils.$$('.tab-btn', header);
        const panes = Utils.$$('.tab-pane', tabsContainer);

        buttons.forEach(btn => {
          btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            
            // Update buttons
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update panes
            panes.forEach(pane => {
              pane.classList.remove('active');
              if (pane.id === targetId) {
                pane.classList.add('active');
              }
            });
          });
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // ACCORDION COMPONENT
  // --------------------------------------------------------------------------
  const Accordion = {
    init() {
      Utils.$$('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.accordion-item');
          const isOpen = item.classList.contains('open');
          
          // Close all items in same accordion
          const accordion = item.closest('.accordion');
          Utils.$$('.accordion-item', accordion).forEach(i => {
            i.classList.remove('open');
          });
          
          // Toggle current item
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // CURRENCY CONVERTER
  // --------------------------------------------------------------------------
  const CurrencyConverter = {
    rates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CHF: 0.88,
      CAD: 1.36,
      AUD: 1.53
    },
    
    init() {
      Utils.$$('.currency-converter').forEach(converter => {
        const fromInput = Utils.$('.currency-from-input', converter);
        const toInput = Utils.$('.currency-to-input', converter);
        const fromSelect = Utils.$('.currency-from-select', converter);
        const toSelect = Utils.$('.currency-to-select', converter);
        const swapBtn = Utils.$('.currency-swap', converter);
        const resultAmount = Utils.$('.currency-result-amount', converter);
        const resultRate = Utils.$('.currency-result-rate', converter);
        
        if (!fromInput || !toInput) return;
        
        const convert = () => {
          const amount = parseFloat(fromInput.value) || 0;
          const fromCurrency = fromSelect.value;
          const toCurrency = toSelect.value;
          
          // Convert to USD first, then to target
          const usdAmount = amount / this.rates[fromCurrency];
          const result = usdAmount * this.rates[toCurrency];
          
          toInput.value = result.toFixed(2);
          
          if (resultAmount) {
            resultAmount.textContent = this.formatCurrency(result, toCurrency);
          }
          
          if (resultRate) {
            const rate = this.rates[toCurrency] / this.rates[fromCurrency];
            resultRate.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
          }
        };
        
        fromInput.addEventListener('input', convert);
        fromSelect.addEventListener('change', convert);
        toSelect.addEventListener('change', convert);
        
        if (swapBtn) {
          swapBtn.addEventListener('click', () => {
            const tempCurrency = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = tempCurrency;
            convert();
          });
        }
        
        // Initial conversion
        convert();
      });
    },
    
    formatCurrency(amount, currency) {
      const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CHF: 'CHF',
        CAD: 'C$',
        AUD: 'A$'
      };
      
      return `${symbols[currency] || ''}${amount.toFixed(2)}`;
    }
  };

  // --------------------------------------------------------------------------
  // FLIGHT BOOKING
  // --------------------------------------------------------------------------
  const FlightBooking = {
    init() {
      Utils.$$('.flight-card-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const card = btn.closest('.flight-card');
          const airline = Utils.$('.flight-card-airline-name', card)?.textContent;
          const price = Utils.$('.flight-card-price-amount', card)?.textContent;
          
          // Deselect all
          Utils.$$('.flight-card').forEach(c => {
            c.style.borderColor = 'var(--border-light)';
          });
          
          // Select this one
          card.style.borderColor = 'var(--color-accent)';
          
          // Show toast
          if (window.QuotationEngine) {
            window.QuotationEngine.toast.show(
              `Selected ${airline} for ${price}`,
              'success'
            );
          }
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('flightselected', {
            detail: { airline, price, card }
          }));
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // ACTIVITY BOOKING
  // --------------------------------------------------------------------------
  const ActivityBooking = {
    init() {
      Utils.$$('.activity-card-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const card = btn.closest('.activity-card');
          const title = Utils.$('.activity-card-title', card)?.textContent;
          const price = Utils.$('.activity-card-price-amount', card)?.textContent;
          
          // Toggle selection
          const isSelected = card.classList.contains('selected');
          
          if (isSelected) {
            card.classList.remove('selected');
            card.style.borderColor = 'var(--border-light)';
            btn.textContent = 'Add';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
          } else {
            card.classList.add('selected');
            card.style.borderColor = 'var(--color-accent)';
            btn.textContent = 'Added';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
          }
          
          // Show toast
          if (window.QuotationEngine) {
            window.QuotationEngine.toast.show(
              isSelected ? `Removed ${title}` : `Added ${title} - ${price}`,
              isSelected ? 'info' : 'success'
            );
          }
          
          // Update total
          this.updateTotal();
        });
      });
    },
    
    updateTotal() {
      const selected = Utils.$$('.activity-card.selected');
      let total = 0;
      
      selected.forEach(card => {
        const priceText = Utils.$('.activity-card-price-amount', card)?.textContent;
        const price = parseFloat(priceText?.replace(/[^0-9.-]+/g, '')) || 0;
        total += price;
      });
      
      const totalEl = Utils.$('.activities-total');
      if (totalEl) {
        totalEl.textContent = `$${total.toLocaleString()}`;
      }
    }
  };

  // --------------------------------------------------------------------------
  // HOTEL SELECTION
  // --------------------------------------------------------------------------
  const HotelSelection = {
    init() {
      Utils.$$('.hotel-card-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const card = btn.closest('.hotel-card');
          const name = Utils.$('.hotel-card-name', card)?.textContent;
          const price = Utils.$('.hotel-card-price-amount', card)?.textContent;
          
          // Deselect all
          Utils.$$('.hotel-card').forEach(c => {
            c.style.borderColor = 'var(--border-light)';
            const b = Utils.$('.hotel-card-book', c);
            if (b) {
              b.textContent = 'Select';
              b.classList.remove('btn-gold');
              b.classList.add('btn-primary');
            }
          });
          
          // Select this one
          card.style.borderColor = 'var(--color-gold)';
          btn.textContent = 'Selected';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-gold');
          
          // Show toast
          if (window.QuotationEngine) {
            window.QuotationEngine.toast.show(
              `Selected ${name} for ${price}/night`,
              'success'
            );
          }
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('hotelselected', {
            detail: { name, price, card }
          }));
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // FAVORITE TOGGLE
  // --------------------------------------------------------------------------
  const FavoriteToggle = {
    init() {
      Utils.$$('.hotel-card-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const isFavorite = btn.classList.contains('active');
          btn.classList.toggle('active');
          
          const svg = btn.querySelector('svg');
          if (!isFavorite) {
            svg.setAttribute('fill', 'currentColor');
            if (window.QuotationEngine) {
              window.QuotationEngine.toast.show('Added to favorites', 'success');
            }
          } else {
            svg.setAttribute('fill', 'none');
            if (window.QuotationEngine) {
              window.QuotationEngine.toast.show('Removed from favorites', 'info');
            }
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // CONFIRMATION DIALOG
  // --------------------------------------------------------------------------
  const ConfirmDialog = {
    init() {
      this.dialog = Utils.$('.confirm-dialog');
      if (!this.dialog) return;
      
      this.title = Utils.$('.confirm-dialog-title', this.dialog);
      this.message = Utils.$('.confirm-dialog-message', this.dialog);
      this.confirmBtn = Utils.$('.confirm-dialog-confirm', this.dialog);
      this.cancelBtn = Utils.$('.confirm-dialog-cancel', this.dialog);
      
      if (this.cancelBtn) {
        this.cancelBtn.addEventListener('click', () => this.close());
      }
      
      if (this.confirmBtn) {
        this.confirmBtn.addEventListener('click', () => {
          if (this.onConfirm) this.onConfirm();
          this.close();
        });
      }
      
      // Close on backdrop click
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) {
          this.close();
        }
      });
      
      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.dialog.classList.contains('active')) {
          this.close();
        }
      });
    },
    
    show(options = {}) {
      if (this.title) this.title.textContent = options.title || 'Confirm Action';
      if (this.message) this.message.textContent = options.message || 'Are you sure?';
      this.onConfirm = options.onConfirm;
      
      // Update icon
      const icon = Utils.$('.confirm-dialog-icon', this.dialog);
      if (icon) {
        icon.className = 'confirm-dialog-icon';
        icon.classList.add(options.type === 'success' ? 'confirm-dialog-icon-success' : 'confirm-dialog-icon-warning');
      }
      
      this.dialog.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
    
    close() {
      this.dialog.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --------------------------------------------------------------------------
  // LOADING OVERLAY
  // --------------------------------------------------------------------------
  const LoadingOverlay = {
    init() {
      this.overlay = Utils.$('.loading-overlay');
    },
    
    show(text = 'Loading...') {
      if (!this.overlay) return;
      
      const textEl = Utils.$('.loading-text', this.overlay);
      if (textEl) textEl.textContent = text;
      
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
    
    hide() {
      if (!this.overlay) return;
      
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --------------------------------------------------------------------------
  // VISA STATUS
  // --------------------------------------------------------------------------
  const VisaStatus = {
    init() {
      Utils.$$('.visa-card-check').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          
          const card = btn.closest('.visa-card');
          const country = Utils.$('.visa-card-title', card)?.textContent;
          
          // Show loading
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span> Checking...';
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Update status
          const statusEl = Utils.$('.visa-card-status', card);
          if (statusEl) {
            statusEl.className = 'visa-card-status visa-card-status-not-required';
            statusEl.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Visa Not Required
            `;
          }
          
          // Reset button
          btn.disabled = false;
          btn.textContent = 'Check Status';
          
          if (window.QuotationEngine) {
            window.QuotationEngine.toast.show(
              `Visa not required for ${country}`,
              'success'
            );
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // PROGRESS TRACKER
  // --------------------------------------------------------------------------
  const ProgressTracker = {
    currentStep: 0,
    steps: ['Hotels', 'Flights', 'Activities', 'Transport', 'Review'],
    
    init() {
      this.container = Utils.$('.booking-progress');
      if (!this.container) return;
      
      this.render();
    },
    
    render() {
      const stepsHtml = this.steps.map((step, index) => {
        let className = 'progress-step';
        if (index < this.currentStep) className += ' completed';
        if (index === this.currentStep) className += ' active';
        
        return `<span class="${className}">${step}</span>`;
      }).join('');
      
      const progressHtml = `
        <div class="progress">
          <div class="progress-bar" style="width: ${(this.currentStep / (this.steps.length - 1)) * 100}%"></div>
        </div>
        <div class="progress-steps">${stepsHtml}</div>
      `;
      
      this.container.innerHTML = progressHtml;
    },
    
    next() {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        this.render();
      }
    },
    
    prev() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.render();
      }
    },
    
    goTo(step) {
      if (step >= 0 && step < this.steps.length) {
        this.currentStep = step;
        this.render();
      }
    }
  };

  // --------------------------------------------------------------------------
  // COST CALCULATOR
  // --------------------------------------------------------------------------
  const CostCalculator = {
    breakdown: {},
    
    init() {
      this.container = Utils.$('.cost-breakdown');
      if (!this.container) return;
      
      // Listen for selection events
      window.addEventListener('hotelselected', (e) => {
        this.updateItem('accommodation', 'Accommodation (6 nights)', parseFloat(e.detail.price) * 6);
      });
      
      window.addEventListener('flightselected', (e) => {
        this.updateItem('flights', 'Flights', parseFloat(e.detail.price?.replace(/[^0-9.-]+/g, '')) || 0);
      });
      
      window.addEventListener('activitiesupdated', (e) => {
        this.updateItem('activities', 'Activities', e.detail.total);
      });
    },
    
    updateItem(id, label, amount) {
      this.breakdown[id] = { label, amount };
      this.render();
    },
    
    render() {
      const itemsEl = Utils.$('.cost-breakdown-items', this.container);
      const totalEl = Utils.$('.cost-breakdown-total-amount', this.container);
      
      if (!itemsEl) return;
      
      let html = '';
      let total = 0;
      
      Object.values(this.breakdown).forEach(item => {
        total += item.amount;
        html += `
          <div class="cost-breakdown-item">
            <span class="cost-breakdown-item-label">${item.label}</span>
            <span class="cost-breakdown-item-amount">$${item.amount.toLocaleString()}</span>
          </div>
        `;
      });
      
      itemsEl.innerHTML = html;
      
      if (totalEl) {
        totalEl.textContent = `$${total.toLocaleString()}`;
      }
    }
  };

  // --------------------------------------------------------------------------
  // ENHANCED UTILITIES (add to main Utils)
  // --------------------------------------------------------------------------
  const Utils = window.Utils || {
    $(selector, context = document) {
      return context.querySelector(selector);
    },
    $$(selector, context = document) {
      return Array.from(context.querySelectorAll(selector));
    }
  };

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  function initEnhanced() {
    Tabs.init();
    Accordion.init();
    CurrencyConverter.init();
    FlightBooking.init();
    ActivityBooking.init();
    HotelSelection.init();
    FavoriteToggle.init();
    ConfirmDialog.init();
    LoadingOverlay.init();
    VisaStatus.init();
    ProgressTracker.init();
    CostCalculator.init();
    
    console.log('Enhanced components initialized');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('enhancedready'));
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhanced);
  } else {
    initEnhanced();
  }

  // Expose to global
  window.QuotationEngine = window.QuotationEngine || {};
  Object.assign(window.QuotationEngine, {
    tabs: Tabs,
    accordion: Accordion,
    currency: CurrencyConverter,
    confirmDialog: ConfirmDialog,
    loading: LoadingOverlay,
    progress: ProgressTracker,
    costCalculator: CostCalculator
  });

})();
