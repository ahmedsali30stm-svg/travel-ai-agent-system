# Travel Quotation Rendering Engine

> Premium OTA-style quotation system with world-class design and enterprise quality.

---

## Overview

The Travel Quotation Rendering Engine is a complete, production-ready HTML/CSS/JS solution for creating luxury travel quotations. Built without any frameworks, it delivers a premium experience with:

- **Pure HTML/CSS/JS** - No dependencies, no frameworks
- **Responsive Design** - Works on all devices
- **Print Optimized** - Beautiful print layouts
- **PDF Optimized** - Ready for PDF export
- **Dark Mode** - Automatic and manual toggle
- **RTL/LTR Support** - Full bidirectional text support
- **Image Lazy Loading** - Optimized performance
- **Accessibility** - WCAG 2.1 compliant
- **Professional Animations** - Smooth, purposeful motion

---

## File Structure

```
rendering-engine/
├── quotation.html    # Main quotation template
├── styles.css        # Complete CSS design system
├── engine.js         # JavaScript functionality
└── README.md         # This documentation
```

---

## Features

### 1. Design System

The CSS file implements a complete design token system:

```css
:root {
  /* Colors */
  --color-primary: #1a1a2e;
  --color-accent: #e94560;
  --color-gold: #d4af37;
  
  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', sans-serif;
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Shadows */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}
```

### 2. Components

#### Hotel Cards
```html
<article class="hotel-card">
  <div class="hotel-card-image">
    <img data-src="image.jpg" alt="Hotel Name" loading="lazy">
    <span class="hotel-card-badge">Featured</span>
  </div>
  <div class="hotel-card-body">
    <h3 class="hotel-card-name">Hotel Name</h3>
    <div class="hotel-card-rating">9.6</div>
    <div class="hotel-card-price">$890</div>
    <button class="btn btn-primary">Select</button>
  </div>
</article>
```

#### Price Table
```html
<table class="price-table">
  <thead>
    <tr>
      <th>Item</th>
      <th>Details</th>
      <th>Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Accommodation</td>
      <td>6 nights</td>
      <td><span class="price-amount">$5,340</span></td>
    </tr>
  </tbody>
</table>
```

#### Timeline
```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-marker">
      <svg><!-- icon --></svg>
    </div>
    <div class="timeline-content">
      <span class="timeline-date">Day 1 - Jul 15</span>
      <h3 class="timeline-title">Arrival</h3>
      <p class="timeline-description">Description...</p>
    </div>
  </div>
</div>
```

#### Gallery
```html
<div class="gallery">
  <div class="gallery-item">
    <img data-src="image.jpg" alt="Description">
    <div class="gallery-item-overlay">
      <span class="gallery-item-caption">Caption</span>
    </div>
  </div>
</div>
```

### 3. Dark Mode

Toggle between light and dark themes:

```javascript
// Manual toggle
QuotationEngine.theme.toggleTheme();

// Get current theme
const theme = QuotationEngine.theme.getTheme();
```

The theme persists in localStorage and respects system preference.

### 4. RTL/LTR Support

```html
<!-- Set direction -->
<html dir="rtl" lang="ar">

<!-- Or via JavaScript -->
QuotationEngine.setDirection('rtl');
```

### 5. Print Styles

```javascript
// Trigger print
QuotationEngine.print();

// Export as PDF (triggers print dialog)
QuotationEngine.exportPDF();
```

### 6. Lazy Loading

Images with `data-src` attribute are automatically lazy loaded:

```html
<img 
  data-src="https://example.com/image.jpg" 
  alt="Description"
  loading="lazy"
>
```

### 7. Lightbox

Gallery items automatically get lightbox functionality:

```html
<div class="gallery">
  <div class="gallery-item" role="button" tabindex="0">
    <img src="image.jpg" alt="Description">
  </div>
</div>
```

### 8. Scroll Animations

Elements with `data-animate` attribute animate on scroll:

```html
<div data-animate data-delay="200">
  Content to animate
</div>
```

### 9. Toast Notifications

```javascript
QuotationEngine.toast.show('Success!', 'success');
QuotationEngine.toast.show('Error occurred', 'error');
QuotationEngine.toast.show('Info message', 'info');
```

---

## Accessibility

- Skip navigation link
- ARIA labels on interactive elements
- Focus management in modals
- Keyboard navigation support
- Reduced motion support
- High contrast mode support
- Screen reader friendly

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close lightbox |
| `←` | Previous image |
| `→` | Next image |
| `Tab` | Navigate elements |
| `Enter/Space` | Activate buttons |

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Performance

- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2s
- **Total Blocking Time**: < 200ms
- **Cumulative Layout Shift**: < 0.1

### Optimizations

- Critical CSS inlined
- Font preloading
- Image lazy loading
- Debounced scroll handlers
- Throttled resize handlers
- Minimal DOM operations

---

## Customization

### Colors

Override CSS variables to customize:

```css
:root {
  --color-primary: #your-color;
  --color-accent: #your-color;
  --color-gold: #your-color;
}
```

### Typography

```css
:root {
  --font-display: 'Your Font', serif;
  --font-body: 'Your Font', sans-serif;
}
```

### Spacing

```css
:root {
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}
```

---

## Integration

### With Travel AI Agent System

The rendering engine integrates with the agent system's output:

```javascript
// Agent generates quotation data
const quotationData = {
  client: { name: 'John Doe', email: 'john@example.com' },
  trip: { destination: 'Paris', dates: { start: '2026-07-15', end: '2026-07-22' } },
  hotels: [...],
  activities: [...],
  costs: { total: 8550, breakdown: {...} }
};

// Render quotation
document.dispatchEvent(new CustomEvent('quotationdata', { detail: quotationData }));
```

### API Reference

```javascript
// QuotationEngine global object
window.QuotationEngine = {
  theme: ThemeManager,        // Theme management
  toast: Toast,               // Toast notifications
  lightbox: Lightbox,         // Image lightbox
  formatters: Formatters,     // Data formatters
  utils: Utils,               // Utility functions
  print: Function,            // Print quotation
  exportPDF: Function,        // Export as PDF
  setDirection: Function      // Set RTL/LTR
};
```

---

## License

Enterprise License - Internal Use Only

---

## Support

For issues or questions, contact the development team.
