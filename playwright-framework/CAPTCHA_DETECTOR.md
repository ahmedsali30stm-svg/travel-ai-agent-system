# CAPTCHA Detector

> CAPTCHA detection and handling for web scraping operations.

---

## Overview

The CAPTCHA Detector identifies CAPTCHA challenges on web pages and provides strategies for handling them.

---

## CAPTCHA Detector Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CAPTCHA DETECTOR ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         DETECTION LAYER                                     │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Image    │ │  Text     │ │  HTML     │ │  Behavior │ │  ML       │  │ │
│  │  │  Analysis │ │  Analysis │ │  Analysis │ │  Analysis │ │  Detection│  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CAPTCHA TYPES                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  reCAPTCHA│ │  hCaptcha │ │  Turnstile│ │  Fun      │ │  Custom   │  │ │
│  │  │  v2/v3    │ │           │ │           │ │  CAPTCHA  │ │  CAPTCHA  │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         HANDLING STRATEGIES                                 │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Wait &   │ │  Rotate   │ │  Human    │ │  Third-   │ │  Bypass   │  │ │
│  │  │  Retry    │ │  Proxy    │ │  Solve    │ │  Party    │ │  Strategy │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## CAPTCHA Detector Implementation

```typescript
import { Page } from 'playwright';

interface CAPTCHAConfig {
  // Detection settings
  detection: {
    enabled: boolean;
    timeout: number;
    selectors: string[];
  };
  
  // Handling settings
  handling: {
    strategy: 'wait' | 'rotate' | 'human' | 'third-party' | 'bypass';
    maxRetries: number;
    retryDelay: number;
  };
  
  // Notification settings
  notification: {
    enabled: boolean;
    channels: string[];
  };
}

interface CAPTCHADetection {
  // Detected
  detected: boolean;
  
  // Type
  type: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'turnstile' | 'fun' | 'custom' | null;
  
  // Element
  element: string | null;
  
  // Confidence
  confidence: number;
  
  // Metadata
  metadata: {
    url: string;
    timestamp: number;
    selectors: string[];
  };
}

class CAPTTADetector {
  private page: Page;
  private config: CAPTCHAConfig;
  
  constructor(page: Page, config: CAPTCHAConfig) {
    this.page = page;
    this.config = config;
  }
  
  // Detect CAPTCHA
  async detect(): Promise<CAPTCHADetection> {
    const detection: CAPTCHADetection = {
      detected: false,
      type: null,
      element: null,
      confidence: 0,
      metadata: {
        url: this.page.url(),
        timestamp: Date.now(),
        selectors: [],
      },
    };
    
    // Check for common CAPTCHA selectors
    for (const selector of this.config.detection.selectors) {
      try {
        const element = await this.page.$(selector);
        
        if (element) {
          detection.detected = true;
          detection.element = selector;
          detection.confidence = 0.9;
          detection.metadata.selectors.push(selector);
          
          // Determine CAPTCHA type
          detection.type = await this.determineType(selector);
          
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Check for reCAPTCHA
    if (!detection.detected) {
      detection.detected = await this.detectRecaptcha();
      if (detection.detected) {
        detection.type = 'recaptcha-v2';
        detection.confidence = 0.95;
      }
    }
    
    // Check for hCaptcha
    if (!detection.detected) {
      detection.detected = await this.detectHcaptcha();
      if (detection.detected) {
        detection.type = 'hcaptcha';
        detection.confidence = 0.95;
      }
    }
    
    // Check for Turnstile
    if (!detection.detected) {
      detection.detected = await this.detectTurnstile();
      if (detection.detected) {
        detection.type = 'turnstile';
        detection.confidence = 0.95;
      }
    }
    
    return detection;
  }
  
  // Detect reCAPTCHA
  private async detectRecaptcha(): Promise<boolean> {
    const selectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',
      '.g-recaptcha',
      '#g-recaptcha',
      'div[data-sitekey]',
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    return false;
  }
  
  // Detect hCaptcha
  private async detectHcaptcha(): Promise<boolean> {
    const selectors = [
      'iframe[src*="hcaptcha"]',
      'iframe[src*="hcaptcha.com"]',
      '.h-captcha',
      '#h-captcha',
      'div[data-hcaptcha-widget-id]',
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    return false;
  }
  
  // Detect Turnstile
  private async detectTurnstile(): Promise<boolean> {
    const selectors = [
      'iframe[src*="turnstile"]',
      'iframe[src*="challenges.cloudflare.com"]',
      '.cf-turnstile',
      '#cf-turnstile',
      'div[data-turnstile-widget-id]',
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    return false;
  }
  
  // Determine CAPTCHA type
  private async determineType(selector: string): Promise<CAPTCHADetection['type']> {
    if (selector.includes('recaptcha')) {
      return 'recaptcha-v2';
    }
    
    if (selector.includes('hcaptcha')) {
      return 'hcaptcha';
    }
    
    if (selector.includes('turnstile')) {
      return 'turnstile';
    }
    
    if (selector.includes('fun')) {
      return 'fun';
    }
    
    return 'custom';
  }
  
  // Handle CAPTCHA
  async handle(detection: CAPTCHADetection): Promise<boolean> {
    switch (this.config.handling.strategy) {
      case 'wait':
        return await this.handleWait(detection);
      case 'rotate':
        return await this.handleRotate(detection);
      case 'human':
        return await this.handleHuman(detection);
      case 'third-party':
        return await this.handleThirdParty(detection);
      case 'bypass':
        return await this.handleBypass(detection);
      default:
        return await this.handleWait(detection);
    }
  }
  
  // Handle with wait
  private async handleWait(detection: CAPTCHADetection): Promise<boolean> {
    // Wait for CAPTCHA to be solved
    await this.page.waitForTimeout(this.config.handling.retryDelay);
    
    // Check if CAPTCHA is still present
    const stillPresent = await this.detect();
    
    return !stillPresent.detected;
  }
  
  // Handle with proxy rotation
  private async handleRotate(detection: CAPTCHADetection): Promise<boolean> {
    // Rotate proxy
    // This would typically be handled by the proxy rotator
    return false;
  }
  
  // Handle with human interaction
  private async handleHuman(detection: CAPTCHADetection): Promise<boolean> {
    // Notify human operator
    if (this.config.notification.enabled) {
      await this.notifyHuman(detection);
    }
    
    // Wait for human to solve
    await this.page.waitForTimeout(300000); // 5 minutes
    
    // Check if CAPTCHA is still present
    const stillPresent = await this.detect();
    
    return !stillPresent.detected;
  }
  
  // Handle with third-party service
  private async handleThirdParty(detection: CAPTCHADetection): Promise<boolean> {
    // This would integrate with a CAPTCHA solving service
    // For now, return false
    return false;
  }
  
  // Handle with bypass
  private async handleBypass(detection: CAPTCHADetection): Promise<boolean> {
    // Try to bypass CAPTCHA
    // This is site-specific and may not work for all sites
    return false;
  }
  
  // Notify human
  private async notifyHuman(detection: CAPTCHADetection): Promise<void> {
    // Send notification to human operator
    console.log(`CAPTCHA detected on ${detection.metadata.url}`);
  }
  
  // Take screenshot
  async screenshot(): Promise<string> {
    const screenshotPath = `./screenshots/captcha_${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath });
    return screenshotPath;
  }
  
  // Get CAPTCHA info
  async getInfo(): Promise<CAPTCHAInfo> {
    const detection = await this.detect();
    
    return {
      detected: detection.detected,
      type: detection.type,
      confidence: detection.confidence,
      screenshot: detection.detected ? await this.screenshot() : null,
    };
  }
}
```

---

## CAPTCHA Types

### 1. reCAPTCHA v2
- Checkbox "I'm not a robot"
- Image selection challenges
- Audio challenges

### 2. reCAPTCHA v3
- Invisible CAPTCHA
- Score-based system
- No user interaction required

### 3. hCaptcha
- Similar to reCAPTCHA
- Image selection challenges
- Privacy-focused

### 4. Turnstile
- Cloudflare's CAPTCHA
- Invisible by default
- Low friction

### 5. Fun CAPTCHA
- Interactive challenges
- Puzzle-based
- Game-like

### 6. Custom CAPTCHA
- Site-specific implementations
- Various challenge types

---

## CAPTCHA Detection Configuration

```yaml
captchaDetector:
  # Detection settings
  detection:
    enabled: true
    timeout: 5000
    selectors:
      - ".g-recaptcha"
      - "#g-recaptcha"
      - ".h-captcha"
      - "#h-captcha"
      - ".cf-turnstile"
      - "iframe[src*='recaptcha']"
      - "iframe[src*='hcaptcha']"
      - "iframe[src*='turnstile']"
  
  # Handling settings
  handling:
    strategy: wait
    maxRetries: 3
    retryDelay: 5000
  
  # Notification settings
  notification:
    enabled: true
    channels:
      - email
      - slack
  
  # Third-party settings
  thirdParty:
    enabled: false
    provider: "2captcha"
    apiKey: ${CAPTCHA_API_KEY}
    timeout: 120000
```

---

## CAPTCHA Statistics

```typescript
interface CAPTCHAStats {
  // Detection counts
  totalDetections: number;
  detectedCount: number;
  notDetectedCount: number;
  
  // Type breakdown
  typeBreakdown: {
    recaptchaV2: number;
    recaptchaV3: number;
    hcaptcha: number;
    turnstile: number;
    fun: number;
    custom: number;
  };
  
  // Handling
  handledCount: number;
  failedCount: number;
  
  // Performance
  avgDetectionTime: number;
  avgHandlingTime: number;
}
```
