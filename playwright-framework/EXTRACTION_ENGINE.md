# Extraction Engine

> Structured data extraction with selector fallback and auto-wait strategies.

---

## Overview

The Extraction Engine provides comprehensive data extraction capabilities with multiple selector strategies, auto-waiting, and structured data parsing.

---

## Extraction Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EXTRACTION ENGINE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         SELECTOR ENGINE                                     │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  CSS        │ │  XPath      │ │  Text       │ │  Attribute  │     │ │
│  │  │  Selectors  │ │  Selectors  │ │  Selectors  │ │  Selectors  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         AUTO-WAIT STRATEGIES                                │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Wait for │ │  Wait for │ │  Wait for │ │  Wait for │ │  Wait for │  │ │
│  │  │  Element  │ │  Network  │ │  Animation│ │  Loading  │ │  Custom   │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA EXTRACTION                                     │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Text     │ │  Attribute│ │  HTML     │ │  Table    │ │  List    │  │ │
│  │  │  Extract  │ │  Extract  │ │  Extract  │ │  Extract  │ │  Extract  │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         STRUCTURED PARSING                                  │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  JSON     │ │  Schema   │ │  Validation│ │  Transform│ │  Output   │  │ │
│  │  │  Parser   │ │  Parser   │ │  Engine   │ │  Engine   │ │  Formatter│  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Extraction Engine Implementation

```typescript
import { Page, ElementHandle, Locator } from 'playwright';

interface ExtractionConfig {
  // Auto-wait settings
  autoWait: boolean;
  waitTimeout: number;
  
  // Retry settings
  retryOnEmpty: boolean;
  maxRetries: number;
  retryDelay: number;
  
  // Screenshot settings
  screenshotOnError: boolean;
  screenshotPath: string;
  
  // Selector fallback
  selectorFallback: boolean;
  fallbackSelectors: string[];
}

interface ExtractionRule {
  // Field name
  field: string;
  
  // Selectors (with fallback)
  selectors: string[];
  
  // Extraction type
  type: 'text' | 'attribute' | 'html' | 'table' | 'list' | 'count' | 'exists';
  
  // Attribute name (for attribute type)
  attribute?: string;
  
  // Transform function
  transform?: (value: any) => any;
  
  // Default value
  defaultValue?: any;
  
  // Required field
  required?: boolean;
  
  // Validation
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

interface ExtractionResult {
  // Extracted data
  data: Record<string, any>;
  
  // Metadata
  metadata: {
    url: string;
    timestamp: number;
    duration: number;
    fieldsExtracted: number;
    fieldsFailed: number;
  };
  
  // Errors
  errors: ExtractionError[];
  
  // Warnings
  warnings: string[];
}

interface ExtractionError {
  field: string;
  error: string;
  selector: string;
}

class ExtractionEngine {
  private page: Page;
  private config: ExtractionConfig;
  
  constructor(page: Page, config: ExtractionConfig) {
    this.page = page;
    this.config = config;
  }
  
  // Extract data using rules
  async extract(rules: ExtractionRule[]): Promise<ExtractionResult> {
    const startTime = Date.now();
    const data: Record<string, any> = {};
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];
    
    for (const rule of rules) {
      try {
        const value = await this.extractField(rule);
        data[rule.field] = value;
      } catch (error) {
        errors.push({
          field: rule.field,
          error: error.message,
          selector: rule.selectors[0],
        });
        
        if (rule.defaultValue !== undefined) {
          data[rule.field] = rule.defaultValue;
        } else if (rule.required) {
          warnings.push(`Required field ${rule.field} failed to extract`);
        }
      }
    }
    
    return {
      data,
      metadata: {
        url: this.page.url(),
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        fieldsExtracted: Object.keys(data).length,
        fieldsFailed: errors.length,
      },
      errors,
      warnings,
    };
  }
  
  // Extract single field
  private async extractField(rule: ExtractionRule): Promise<any> {
    let value: any = null;
    
    // Try each selector
    for (const selector of rule.selectors) {
      try {
        value = await this.extractWithSelector(selector, rule);
        
        if (value !== null && value !== undefined) {
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Apply transform
    if (value !== null && rule.transform) {
      value = rule.transform(value);
    }
    
    // Validate
    if (value !== null && rule.validation) {
      this.validateValue(value, rule.validation);
    }
    
    return value;
  }
  
  // Extract with selector
  private async extractWithSelector(
    selector: string,
    rule: ExtractionRule
  ): Promise<any> {
    // Wait for element if auto-wait enabled
    if (this.config.autoWait) {
      await this.page.waitForSelector(selector, {
        timeout: this.config.waitTimeout,
      });
    }
    
    // Get element
    const element = await this.page.$(selector);
    
    if (!element) {
      return rule.defaultValue || null;
    }
    
    // Extract based on type
    switch (rule.type) {
      case 'text':
        return await element.textContent();
      
      case 'attribute':
        return await element.getAttribute(rule.attribute || '');
      
      case 'html':
        return await element.innerHTML();
      
      case 'table':
        return await this.extractTable(element);
      
      case 'list':
        return await this.extractList(element);
      
      case 'count':
        return await this.page.$$eval(selector, els => els.length);
      
      case 'exists':
        return element !== null;
      
      default:
        return await element.textContent();
    }
  }
  
  // Extract table
  private async extractTable(element: ElementHandle): Promise<any[][]> {
    return await element.$$eval('tr', rows => {
      return rows.map(row => {
        return Array.from(row.querySelectorAll('td, th')).map(cell => {
          return cell.textContent?.trim() || '';
        });
      });
    });
  }
  
  // Extract list
  private async extractList(element: ElementHandle): Promise<string[]> {
    return await element.$$eval('li', items => {
      return items.map(item => item.textContent?.trim() || '');
    });
  }
  
  // Validate value
  private validateValue(value: any, validation: any): void {
    if (validation.pattern && typeof value === 'string') {
      if (!validation.pattern.test(value)) {
        throw new Error(`Value does not match pattern: ${validation.pattern}`);
      }
    }
    
    if (validation.min !== undefined && typeof value === 'number') {
      if (value < validation.min) {
        throw new Error(`Value ${value} is less than minimum ${validation.min}`);
      }
    }
    
    if (validation.max !== undefined && typeof value === 'number') {
      if (value > validation.max) {
        throw new Error(`Value ${value} is greater than maximum ${validation.max}`);
      }
    }
    
    if (validation.enum && Array.isArray(validation.enum)) {
      if (!validation.enum.includes(value)) {
        throw new Error(`Value ${value} is not in allowed values: ${validation.enum.join(', ')}`);
      }
    }
  }
  
  // Extract with CSS selector
  async extractCSS(selector: string): Promise<string | null> {
    const element = await this.page.$(selector);
    
    if (!element) {
      return null;
    }
    
    return await element.textContent();
  }
  
  // Extract with XPath
  async extractXPath(xpath: string): Promise<string | null> {
    const element = await this.page.$(`xpath=${xpath}`);
    
    if (!element) {
      return null;
    }
    
    return await element.textContent();
  }
  
  // Extract multiple elements
  async extractAll(selector: string): Promise<string[]> {
    return await this.page.$$eval(selector, elements => {
      return elements.map(el => el.textContent?.trim() || '');
    });
  }
  
  // Extract with text matching
  async extractByText(text: string): Promise<string | null> {
    const element = await this.page.getByText(text);
    
    if (!element) {
      return null;
    }
    
    return await element.textContent();
  }
  
  // Extract with role
  async extractByRole(
    role: string,
    options?: { name?: string }
  ): Promise<string | null> {
    const element = await this.page.getByRole(role as any, options);
    
    if (!element) {
      return null;
    }
    
    return await element.textContent();
  }
  
  // Extract with label
  async extractByLabel(label: string): Promise<string | null> {
    const element = await this.page.getByLabel(label);
    
    if (!element) {
      return null;
    }
    
    return await element.inputValue();
  }
  
  // Extract with placeholder
  async extractByPlaceholder(placeholder: string): Promise<string | null> {
    const element = await this.page.getByPlaceholder(placeholder);
    
    if (!element) {
      return null;
    }
    
    return await element.inputValue();
  }
  
  // Extract with test ID
  async extractByTestId(testId: string): Promise<string | null> {
    const element = await this.page.getByTestId(testId);
    
    if (!element) {
      return null;
    }
    
    return await element.textContent();
  }
  
  // Screenshot on error
  private async screenshotOnError(fieldName: string): Promise<void> {
    if (this.config.screenshotOnError) {
      const screenshotPath = `${this.config.screenshotPath}/${fieldName}_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath });
    }
  }
}
```

---

## Auto-Wait Strategies

```typescript
interface AutoWaitStrategies {
  // Wait for element
  waitForElement(
    page: Page,
    selector: string,
    timeout: number
  ): Promise<void>;
  
  // Wait for navigation
  waitForNavigation(
    page: Page,
    timeout: number
  ): Promise<void>;
  
  // Wait for network idle
  waitForNetworkIdle(
    page: Page,
    timeout: number
  ): Promise<void>;
  
  // Wait for animation
  waitForAnimation(
    page: Page,
    timeout: number
  ): Promise<void>;
  
  // Wait for loading
  waitForLoading(
    page: Page,
    timeout: number
  ): Promise<void>;
}

// Wait for element
async function waitForElement(
  page: Page,
  selector: string,
  timeout: number
): Promise<void> {
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
  });
}

// Wait for navigation
async function waitForNavigation(
  page: Page,
  timeout: number
): Promise<void> {
  await page.waitForNavigation({
    waitUntil: 'networkidle',
    timeout,
  });
}

// Wait for network idle
async function waitForNetworkIdle(
  page: Page,
  timeout: number
): Promise<void> {
  await page.waitForLoadState('networkidle', {
    timeout,
  });
}

// Wait for animation
async function waitForAnimation(
  page: Page,
  timeout: number
): Promise<void> {
  await page.waitForFunction(() => {
    return document.querySelectorAll('[style*="animation"]').length === 0;
  }, { timeout });
}

// Wait for loading
async function waitForLoading(
  page: Page,
  timeout: number
): Promise<void> {
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  }, { timeout });
}
```

---

## Selector Fallback

```typescript
interface SelectorFallback {
  // Try multiple selectors
  trySelectors(
    page: Page,
    selectors: string[],
    timeout: number
  ): Promise<ElementHandle | null>;
  
  // Try CSS then XPath
  tryCSSThenXPath(
    page: Page,
    css: string,
    xpath: string,
    timeout: number
  ): Promise<ElementHandle | null>;
  
  // Try with retry
  tryWithRetry(
    page: Page,
    selector: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<ElementHandle | null>;
}

// Try multiple selectors
async function trySelectors(
  page: Page,
  selectors: string[],
  timeout: number
): Promise<ElementHandle | null> {
  for (const selector of selectors) {
    try {
      const element = await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });
      
      if (element) {
        return element;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

// Try CSS then XPath
async function tryCSSThenXPath(
  page: Page,
  css: string,
  xpath: string,
  timeout: number
): Promise<ElementHandle | null> {
  // Try CSS first
  try {
    const element = await page.waitForSelector(css, {
      state: 'visible',
      timeout: timeout / 2,
    });
    
    if (element) {
      return element;
    }
  } catch (error) {
    // Try XPath
    try {
      const element = await page.waitForSelector(`xpath=${xpath}`, {
        state: 'visible',
        timeout: timeout / 2,
      });
      
      return element;
    } catch (error) {
      return null;
    }
  }
}

// Try with retry
async function tryWithRetry(
  page: Page,
  selector: string,
  maxRetries: number,
  retryDelay: number
): Promise<ElementHandle | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = await page.$(selector);
      
      if (element) {
        return element;
      }
    } catch (error) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
}
```

---

## Extraction Configuration

```yaml
extractionEngine:
  # Auto-wait settings
  autoWait: true
  waitTimeout: 10000
  
  # Retry settings
  retryOnEmpty: true
  maxRetries: 3
  retryDelay: 1000
  
  # Screenshot settings
  screenshotOnError: true
  screenshotPath: ./screenshots
  
  # Selector fallback
  selectorFallback: true
  fallbackSelectors:
    - css
    - xpath
    - text
    - role
  
  # Extraction rules
  rules:
    - field: title
      selectors:
        - "h1.title"
        - "//h1[@class='title']"
        - "h1"
      type: text
      required: true
    
    - field: price
      selectors:
        - ".price-value"
        - "//span[@class='price']"
      type: text
      transform: (value) => parseFloat(value.replace(/[^0-9.]/g, ''))
      validation:
        min: 0
        max: 10000
```

---

## Extraction Statistics

```typescript
interface ExtractionStats {
  // Counts
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  
  // Performance
  avgExtractionTime: number;
  p50ExtractionTime: number;
  p95ExtractionTime: number;
  
  // Fields
  totalFields: number;
  avgFieldsPerExtraction: number;
  
  // Selectors
  selectorSuccessRate: number;
  fallbackUsageRate: number;
}
```
