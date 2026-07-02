import Handlebars from 'handlebars';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { createContextLogger } from '../../utils/logger.js';
import { chromium } from 'playwright';

const logger = createContextLogger({ component: 'TemplateEngine' });

interface TemplateEngineOptions {
  templatesDir?: string;
  cacheTemplates?: boolean;
}

interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
}

export class TemplateEngine {
  private templatesDir: string;
  private cache: boolean;
  private compiledTemplates = new Map<string, Handlebars.TemplateDelegate>();
  private initialized = false;

  constructor(options: TemplateEngineOptions = {}) {
    this.templatesDir = options.templatesDir || join(process.cwd(), 'templates');
    this.cache = options.cacheTemplates !== false;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private registerHelpers(): void {
    // Format a date value into a human-readable date string
    Handlebars.registerHelper('formatDate', (date: unknown) => {
      if (date == null) return '';
      const d = new Date(date as string | number | Date);
      if (isNaN(d.getTime())) return String(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    });

    // Format a date value into a human-readable date-time string
    Handlebars.registerHelper('formatDateTime', (date: unknown) => {
      if (date == null) return '';
      const d = new Date(date as string | number | Date);
      if (isNaN(d.getTime())) return String(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // Format a numeric amount with currency symbol
    Handlebars.registerHelper('formatCurrency', (amount: unknown, currency: string) => {
      if (amount == null) return '';
      const num = Number(amount);
      if (isNaN(num)) return String(amount);
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
        }).format(num);
      } catch {
        return `${currency || 'USD'} ${num.toFixed(2)}`;
      }
    });

    // Default / fallback helper: returns the value if present, else the fallback
    Handlebars.registerHelper('default', (value: unknown, fallback: unknown) => {
      return value !== undefined && value !== null ? value : fallback;
    });

    // Equality and comparison helpers for template conditionals
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    Handlebars.registerHelper('gt', (a: unknown, b: unknown) => Number(a) > Number(b));
    Handlebars.registerHelper('gte', (a: unknown, b: unknown) => Number(a) >= Number(b));
    Handlebars.registerHelper('lt', (a: unknown, b: unknown) => Number(a) < Number(b));
    Handlebars.registerHelper('lte', (a: unknown, b: unknown) => Number(a) <= Number(b));
  }

  // ---------------------------------------------------------------------------
  // Pipe-syntax pre-processing
  // ---------------------------------------------------------------------------

  /**
   * Convert the non-standard pipe syntax used in templates
   *   {{variable | default 'fallback'}}
   * into a standard Handlebars helper call:
   *   {{default variable 'fallback'}}
   */
  private preprocessTemplate(template: string): string {
    return template.replace(
      /\{\{([\w.]+)\s*\|\s*default\s+('[^']*'|"[^"]*"|\S+)\s*\}\}/g,
      '{{default $1 $2}}',
    );
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  /**
   * Initialise the engine: register helpers, scan & compile templates.
   * Safe to call multiple times (idempotent).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.registerHelpers();

    try {
      await this.loadAllTemplates();
      this.initialized = true;
      logger.info({ count: this.compiledTemplates.size }, 'Template engine initialised');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialise template engine');
      throw error;
    }
  }

  /**
   * Recursively scan the templates directory and compile every .hbs file.
   */
  private async loadAllTemplates(): Promise<void> {
    if (!existsSync(this.templatesDir)) {
      logger.warn({ templatesDir: this.templatesDir }, 'Templates directory does not exist');
      return;
    }

    const walk = (dir: string): void => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.hbs')) {
          const templateName = this.toTemplateName(fullPath);
          const raw = readFileSync(fullPath, 'utf-8');
          const processed = this.preprocessTemplate(raw);
          this.compiledTemplates.set(templateName, Handlebars.compile(processed));
          logger.debug({ templateName, path: fullPath }, 'Template compiled');
        }
      }
    };

    walk(this.templatesDir);
  }

  /**
   * Derive the logical template name from the absolute file path.
   * Example:  /abs/path/templates/itinerary/standard.hbs  →  "itinerary/standard"
   */
  private toTemplateName(filePath: string): string {
    const rel = relative(this.templatesDir, filePath);
    return rel.replace(/\.hbs$/i, '').replace(/\\/g, '/');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Render a named template with the supplied data and return the HTML string.
   */
  async render(templateName: string, data: Record<string, unknown> = {}): Promise<string> {
    if (!this.initialized) await this.initialize();

    let fn = this.compiledTemplates.get(templateName);

    // On-demand load (useful during development when new templates are added)
    if (!fn) {
      const filePath = join(this.templatesDir, `${templateName}.hbs`);
      if (!existsSync(filePath)) {
        throw new Error(
          `Template not found: "${templateName}". ` +
          `Searched in: ${this.templatesDir}. Available: [${this.listTemplates().join(', ')}]`,
        );
      }
      const raw = readFileSync(filePath, 'utf-8');
      const processed = this.preprocessTemplate(raw);
      fn = Handlebars.compile(processed);
      if (this.cache) {
        this.compiledTemplates.set(templateName, fn);
      }
    }

    try {
      return fn(data);
    } catch (error) {
      logger.error({ templateName, err: error }, 'Template rendering failed');
      throw error;
    }
  }

  /**
   * Render a named template to a PDF buffer using Playwright.
   * Playwright must already be installed (it is in this project).
   */
  async renderPDF(
    templateName: string,
    data: Record<string, unknown> = {},
    pdfOptions: PDFOptions = {},
  ): Promise<Buffer> {
    const html = await this.render(templateName, data);
    return this.htmlToPDF(html, pdfOptions);
  }

  /**
   * Convert an arbitrary HTML string into a PDF buffer via Playwright.
   */
  async htmlToPDF(html: string, pdfOptions: PDFOptions = {}): Promise<Buffer> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage({ colorScheme: 'light' });
      await page.setContent(html, { waitUntil: 'networkidle' });

      const buffer = await page.pdf({
        format: pdfOptions.format || 'A4',
        landscape: pdfOptions.landscape ?? false,
        margin: {
          top: pdfOptions.margin?.top ?? '20mm',
          right: pdfOptions.margin?.right ?? '15mm',
          bottom: pdfOptions.margin?.bottom ?? '20mm',
          left: pdfOptions.margin?.left ?? '15mm',
        },
        printBackground: pdfOptions.printBackground ?? true,
      });

      return Buffer.from(buffer);
    } finally {
      await browser.close();
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** List every registered template name. */
  listTemplates(): string[] {
    return Array.from(this.compiledTemplates.keys());
  }

  /** Check whether a template name is already compiled. */
  hasTemplate(templateName: string): boolean {
    return this.compiledTemplates.has(templateName);
  }

  /**
   * Verify the engine is operational:
   *   - helpers work
   *   - templates are loaded (warning if zero)
   */
  async verify(): Promise<boolean> {
    try {
      if (!this.initialized) await this.initialize();

      if (this.compiledTemplates.size === 0) {
        logger.warn('No templates are loaded — engine is idle');
      }

      // Sanity-check helper registration
      const result = Handlebars.compile('Hello {{name}}')({ name: 'Engine' });
      if (result !== 'Hello Engine') {
        throw new Error('Handlebars base compilation check failed');
      }

      logger.info({ templatesLoaded: this.compiledTemplates.size }, 'Template engine verified');
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Template engine verification failed');
      return false;
    }
  }

  /**
   * Discard all cached templates and re-compile from disk.
   */
  async reloadTemplates(): Promise<void> {
    this.compiledTemplates.clear();
    await this.loadAllTemplates();
    logger.info({ count: this.compiledTemplates.size }, 'Templates reloaded from disk');
  }
}

export const templateEngine = new TemplateEngine();
