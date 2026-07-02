/**
 * ============================================================================
 * TRAVEL QUOTATION ENGINE - JavaScript
 * Premium OTA Design System
 * Version: 1.0.0
 * ============================================================================
 */

(function() {
  'use strict';

  // --------------------------------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------------------------------
  const CONFIG = {
    animationDuration: 300,
    lazyLoadThreshold: 100,
    debounceDelay: 250,
    scrollOffset: 100,
    toastDuration: 3000,
    currency: {
      symbol: '$',
      position: 'before',
      decimals: 2,
      thousandsSeparator: ','
    }
  };

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------
  const Utils = {
    // DOM helpers
    $(selector, context = document) {
      return context.querySelector(selector);
    },

    $$(selector, context = document) {
      return Array.from(context.querySelectorAll(selector));
    },

    // Debounce
    debounce(fn, delay = CONFIG.debounceDelay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    // Throttle
    throttle(fn, limit = 100) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // Format currency
    formatCurrency(amount, currency = CONFIG.currency) {
      const formatted = Math.abs(amount).toFixed(currency.decimals);
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
      
      const result = currency.position === 'before'
        ? `${currency.symbol}${parts.join('.')}`
        : `${parts.join('.')}${currency.symbol}`;
      
      return amount < 0 ? `-${result}` : result;
    },

    // Format date
    formatDate(date, format = 'medium') {
      const d = new Date(date);
      const options = {
        short: { month: 'short', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
        full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }
      };
      
      return d.toLocaleDateString('en-US', options[format] || options.medium);
    },

    // Generate unique ID
    generateId(prefix = 'id') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Deep merge
    deepMerge(target, source) {
      const output = Object.assign({}, target);
      if (this.isObject(target) && this.isObject(source)) {
        Object.keys(source).forEach(key => {
          if (this.isObject(source[key])) {
            if (!(key in target)) Object.assign(output, { [key]: source[key] });
            else output[key] = this.deepMerge(target[key], source[key]);
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      return output;
    },

    isObject(item) {
      return (item && typeof item === 'object' && !Array.isArray(item));
    },

    // Intersection Observer support
    supportsIntersectionObserver() {
      return 'IntersectionObserver' in window;
    },

    // Smooth scroll
    smoothScrollTo(element, offset = 0) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    },

    // Get URL parameters
    getUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const result = {};
      for (const [key, value] of params) {
        result[key] = value;
      }
      return result;
    }
  };

  // --------------------------------------------------------------------------
  // THEME MANAGER
  // --------------------------------------------------------------------------
  const ThemeManager = {
    storageKey: 'quotation-theme',
    
    init() {
      this.toggle = Utils.$('.theme-toggle');
      if (!this.toggle) return;
      
      // Load saved theme
      const savedTheme = localStorage.getItem(this.storageKey);
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      // Update toggle icon
      this.updateIcon();
      
      // Add click handler
      this.toggle.addEventListener('click', () => this.toggleTheme());
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
          this.updateIcon();
        }
      });
    },
    
    toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(this.storageKey, newTheme);
      
      this.updateIcon();
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
    },
    
    updateIcon() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const icon = this.toggle.querySelector('svg');
      
      if (currentTheme === 'dark') {
        icon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      }
    },
    
    getTheme() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
  };

  // --------------------------------------------------------------------------
  // LAZY LOADING
  // --------------------------------------------------------------------------
  const LazyLoader = {
    observer: null,
    
    init() {
      if (!Utils.supportsIntersectionObserver()) {
        // Fallback: load all images
        Utils.$$('img[data-src]').forEach(img => this.loadImage(img));
        return;
      }
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      }, {
        rootMargin: `${CONFIG.lazyLoadThreshold}px`
      });
      
      Utils.$$('img[data-src]').forEach(img => {
        // Add skeleton class
        img.classList.add('skeleton');
        this.observer.observe(img);
      });
    },
    
    loadImage(img) {
      const src = img.getAttribute('data-src');
      const srcset = img.getAttribute('data-srcset');
      
      if (srcset) {
        img.srcset = srcset;
      }
      
      img.onload = () => {
        img.classList.remove('skeleton');
        img.classList.add('loaded');
        img.removeAttribute('data-src');
      };
      
      img.onerror = () => {
        img.classList.remove('skeleton');
        img.classList.add('error');
        // Use a placeholder
        img.src = 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect fill="#e9ecef" width="400" height="300"/>
            <text fill="#adb5bd" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="150">Image not available</text>
          </svg>
        `);
      };
      
      img.src = src;
    }
  };

  // --------------------------------------------------------------------------
  // SCROLL ANIMATIONS
  // --------------------------------------------------------------------------
  const ScrollAnimations = {
    observer: null,
    
    init() {
      if (!Utils.supportsIntersectionObserver()) {
        Utils.$$('[data-animate]').forEach(el => el.classList.add('visible'));
        return;
      }
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute('data-delay') || 0;
            
            setTimeout(() => {
              el.classList.add('visible');
            }, parseInt(delay));
            
            this.observer.unobserve(el);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      Utils.$$('[data-animate]').forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // --------------------------------------------------------------------------
  // LIGHTBOX
  // --------------------------------------------------------------------------
  const Lightbox = {
    currentImage: 0,
    images: [],
    
    init() {
      this.lightbox = Utils.$('.lightbox');
      if (!this.lightbox) return;
      
      // Gallery items
      Utils.$$('.gallery-item').forEach((item, index) => {
        item.addEventListener('click', () => this.open(index));
      });
      
      // Close button
      const closeBtn = Utils.$('.lightbox-close', this.lightbox);
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }
      
      // Navigation
      const prevBtn = Utils.$('.lightbox-nav-prev', this.lightbox);
      const nextBtn = Utils.$('.lightbox-nav-next', this.lightbox);
      
      if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
      if (nextBtn) nextBtn.addEventListener('click', () => this.next());
      
      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.lightbox.classList.contains('active')) return;
        
        switch (e.key) {
          case 'Escape':
            this.close();
            break;
          case 'ArrowLeft':
            this.prev();
            break;
          case 'ArrowRight':
            this.next();
            break;
        }
      });
      
      // Click outside to close
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) {
          this.close();
        }
      });
      
      // Build image list
      this.buildImageList();
    },
    
    buildImageList() {
      this.images = Utils.$$('.gallery-item img').map(img => ({
        src: img.src || img.getAttribute('data-src'),
        alt: img.alt,
        caption: img.closest('.gallery-item')?.querySelector('.gallery-item-caption')?.textContent || ''
      }));
    },
    
    open(index) {
      this.currentImage = index;
      this.updateContent();
      this.lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus trap
      this.lightbox.focus();
    },
    
    close() {
      this.lightbox.classList.remove('active');
      document.body.style.overflow = '';
    },
    
    prev() {
      this.currentImage = (this.currentImage - 1 + this.images.length) % this.images.length;
      this.updateContent();
    },
    
    next() {
      this.currentImage = (this.currentImage + 1) % this.images.length;
      this.updateContent();
    },
    
    updateContent() {
      const image = this.images[this.currentImage];
      if (!image) return;
      
      const content = Utils.$('.lightbox-content', this.lightbox);
      const caption = Utils.$('.lightbox-caption', this.lightbox);
      
      if (content) {
        content.querySelector('img').src = image.src;
        content.querySelector('img').alt = image.alt;
      }
      
      if (caption) {
        caption.textContent = image.caption || `${this.currentImage + 1} / ${this.images.length}`;
      }
      
      // Update nav visibility
      const prevBtn = Utils.$('.lightbox-nav-prev', this.lightbox);
      const nextBtn = Utils.$('.lightbox-nav-next', this.lightbox);
      
      if (prevBtn) prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
    }
  };

  // --------------------------------------------------------------------------
  // SCROLL TO TOP
  // --------------------------------------------------------------------------
  const ScrollToTop = {
    init() {
      this.button = Utils.$('.scroll-top');
      if (!this.button) return;
      
      // Show/hide based on scroll position
      window.addEventListener('scroll', Utils.throttle(() => {
        if (window.pageYOffset > CONFIG.scrollOffset) {
          this.button.classList.add('visible');
        } else {
          this.button.classList.remove('visible');
        }
      }));
      
      // Click handler
      this.button.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // PRINT FUNCTIONALITY
  // --------------------------------------------------------------------------
  const PrintManager = {
    init() {
      this.printBtn = Utils.$('.print-btn');
      if (!this.printBtn) return;
      
      this.printBtn.addEventListener('click', () => this.print());
    },
    
    print() {
      // Add print mode class
      document.body.classList.add('print-mode');
      
      // Trigger print
      window.print();
      
      // Remove print mode class after print
      setTimeout(() => {
        document.body.classList.remove('print-mode');
      }, 1000);
    }
  };

  // --------------------------------------------------------------------------
  // PDF EXPORT
  // --------------------------------------------------------------------------
  const PDFExport = {
    init() {
      this.exportBtn = Utils.$('.export-pdf-btn');
      if (!this.exportBtn) return;
      
      this.exportBtn.addEventListener('click', () => this.export());
    },
    
    export() {
      // Add PDF mode class
      document.body.classList.add('pdf-mode');
      
      // Hide interactive elements
      const hiddenElements = Utils.$$('.btn, .theme-toggle, .print-btn, .scroll-top, .lightbox');
      hiddenElements.forEach(el => el.style.display = 'none');
      
      // Trigger print (user can save as PDF)
      window.print();
      
      // Restore elements
      setTimeout(() => {
        document.body.classList.remove('pdf-mode');
        hiddenElements.forEach(el => el.style.display = '');
      }, 1000);
    }
  };

  // --------------------------------------------------------------------------
  // DIRECTION MANAGER (RTL/LTR)
  // --------------------------------------------------------------------------
  const DirectionManager = {
    init() {
      const urlParams = Utils.getUrlParams();
      const dir = urlParams.dir || localStorage.getItem('quotation-dir') || 'ltr';
      
      this.setDirection(dir);
      
      // Direction toggle
      const dirToggle = Utils.$('.dir-toggle');
      if (dirToggle) {
        dirToggle.addEventListener('click', () => {
          const currentDir = document.documentElement.getAttribute('dir');
          const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
          this.setDirection(newDir);
          localStorage.setItem('quotation-dir', newDir);
        });
      }
    },
    
    setDirection(dir) {
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
    }
  };

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  const Toast = {
    container: null,
    
    init() {
      // Create toast container
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .toast-container {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .toast {
          padding: 12px 20px;
          background: var(--bg-card);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideInRight 0.3s ease;
          min-width: 250px;
        }
        
        .toast-success {
          border-left: 4px solid var(--color-success);
        }
        
        .toast-error {
          border-left: 4px solid var(--color-danger);
        }
        
        .toast-info {
          border-left: 4px solid var(--color-info);
        }
        
        .toast-message {
          flex: 1;
          font-size: 14px;
        }
        
        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          opacity: 0.5;
        }
        
        .toast-close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    },
    
    show(message, type = 'info', duration = CONFIG.toastDuration) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      `;
      
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      });
      
      this.container.appendChild(toast);
      
      // Auto remove
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s ease forwards';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  };

  // --------------------------------------------------------------------------
  // COUNTER ANIMATION
  // --------------------------------------------------------------------------
  const CounterAnimation = {
    init() {
      Utils.$$('[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        const duration = parseInt(el.getAttribute('data-duration')) || 2000;
        
        this.animate(el, target, duration);
      });
    },
    
    animate(element, target, duration) {
      let start = 0;
      const increment = target / (duration / 16);
      
      const updateCounter = () => {
        start += increment;
        if (start < target) {
          element.textContent = Math.floor(start);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };
      
      // Start when element is in view
      if (Utils.supportsIntersectionObserver()) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              updateCounter();
              observer.unobserve(element);
            }
          });
        });
        observer.observe(element);
      } else {
        updateCounter();
      }
    }
  };

  // --------------------------------------------------------------------------
  // FORMATTING HELPERS
  // --------------------------------------------------------------------------
  const Formatters = {
    currency(amount, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    
    date(date, format = 'medium') {
      const d = new Date(date);
      const options = {
        short: { month: 'short', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      };
      return d.toLocaleDateString('en-US', options[format]);
    },
    
    relativeTime(date) {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return this.date(date);
    }
  };

  // --------------------------------------------------------------------------
  // MAP INTEGRATION
  // --------------------------------------------------------------------------
  const MapManager = {
    init() {
      const mapContainers = Utils.$$('.map-container[data-lat][data-lng]');
      
      mapContainers.forEach(container => {
        const lat = container.getAttribute('data-lat');
        const lng = container.getAttribute('data-lng');
        const zoom = container.getAttribute('data-zoom') || 15;
        const title = container.getAttribute('data-title') || '';
        
        // Use OpenStreetMap (no API key required)
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${parseFloat(lng)+0.01},${parseFloat(lat)+0.01}&layer=mapnik&marker=${lat},${lng}`;
        iframe.title = `Map of ${title}`;
        iframe.loading = 'lazy';
        iframe.setAttribute('allowfullscreen', '');
        
        container.appendChild(iframe);
      });
    }
  };

  // --------------------------------------------------------------------------
  // SHARE FUNCTIONALITY
  // --------------------------------------------------------------------------
  const ShareManager = {
    init() {
      const shareBtn = Utils.$('.share-btn');
      if (!shareBtn) return;
      
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.share();
      });
    },
    
    async share() {
      const title = Utils.$('.quotation-title')?.textContent || 'Travel Quotation';
      const url = window.location.href;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            url: url
          });
          Toast.show('Shared successfully!', 'success');
        } catch (err) {
          if (err.name !== 'AbortError') {
            Toast.show('Failed to share', 'error');
          }
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          Toast.show('Link copied to clipboard!', 'success');
        } catch {
          Toast.show('Failed to copy link', 'error');
        }
      }
    }
  };

  // --------------------------------------------------------------------------
  // ACCESSIBILITY ENHANCEMENTS
  // --------------------------------------------------------------------------
  const Accessibility = {
    init() {
      this.addAriaLabels();
      this.setupFocusTrap();
      this.enhanceKeyboardNavigation();
    },
    
    addAriaLabels() {
      // Add aria-labels to icon-only buttons
      Utils.$$('button:not([aria-label])').forEach(btn => {
        const text = btn.textContent.trim();
        if (!text) {
          const svg = btn.querySelector('svg');
          if (svg) {
            const label = btn.getAttribute('data-tooltip') || 'Button';
            btn.setAttribute('aria-label', label);
          }
        }
      });
      
      // Add aria-expanded to collapsible elements
      Utils.$$('[data-toggle]').forEach(el => {
        el.setAttribute('aria-expanded', 'false');
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
      });
    },
    
    setupFocusTrap() {
      const lightbox = Utils.$('.lightbox');
      if (!lightbox) return;
      
      lightbox.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        const focusableElements = lightbox.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    },
    
    enhanceKeyboardNavigation() {
      // Make gallery items keyboard accessible
      Utils.$$('.gallery-item').forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'View image');
        
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      });
      
      // Make timeline items focusable
      Utils.$$('.timeline-item').forEach(item => {
        item.setAttribute('tabindex', '0');
      });
    }
  };

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  function init() {
    // Initialize all modules
    ThemeManager.init();
    LazyLoader.init();
    ScrollAnimations.init();
    Lightbox.init();
    ScrollToTop.init();
    PrintManager.init();
    PDFExport.init();
    DirectionManager.init();
    Toast.init();
    CounterAnimation.init();
    MapManager.init();
    ShareManager.init();
    Accessibility.init();
    
    // Log initialization
    console.log('Travel Quotation Engine initialized');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('quotationready'));
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API
  window.QuotationEngine = {
    theme: ThemeManager,
    toast: Toast,
    lightbox: Lightbox,
    formatters: Formatters,
    utils: Utils,
    print: () => PrintManager.print(),
    exportPDF: () => PDFExport.export(),
    setDirection: (dir) => DirectionManager.setDirection(dir)
  };

})();
