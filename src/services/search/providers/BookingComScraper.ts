import {
  chromium,
  type Browser,
  type Page,
  type BrowserContext,
} from 'playwright';
import {
  type HotelResult,
  type HotelImage,
  type RoomType,
  type CancellationPolicy,
  type SearchParams,
  type HotelSearchProvider,
} from '../types.js';
import { createContextLogger } from '../../../utils/logger.js';

const logger = createContextLogger({ component: 'BookingComScraper' });

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT = 30_000;

function parseCurrency(text: string): string {
  const match = text.match(/[A-Z]{3}|[€$£¥]/);
  return match ? match[0] : 'USD';
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseRating(text: string): number {
  const match = text.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseReviewCount(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export class BookingComScraper implements HotelSearchProvider {
  readonly name = 'booking';

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async search(params: SearchParams): Promise<HotelResult[]> {
    const page = await this.getPage();
    const results: HotelResult[] = [];

    try {
      await this.navigateToHomepage(page);
      await this.handleCookieConsent(page);
      await this.fillDestination(page, params.destination);
      await this.selectDates(page, params.checkIn, params.checkOut);
      await this.selectGuests(page, params.guests, params.rooms ?? 1);
      await this.submitSearch(page);
      await this.waitForResults(page);
      await this.scrollForLazyContent(page);
      const extracted = await this.extractHotels(page);
      results.push(...extracted);
    } catch (error) {
      logger.error({ error }, 'Booking.com search failed');
      await this.takeScreenshot(page, 'booking-error');
    } finally {
      await page.close();
    }

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    if (!this.context) {
      this.context = await this.browser.newContext({
        userAgent: USER_AGENT,
        viewport: { width: 1440, height: 900 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        geolocation: { latitude: 40.7128, longitude: -74.006 },
        permissions: ['geolocation'],
      });
    }
    return this.context.newPage();
  }

  private async navigateToHomepage(page: Page): Promise<void> {
    await page.goto('https://www.booking.com', {
      waitUntil: 'networkidle',
      timeout: DEFAULT_TIMEOUT,
    });
  }

  private async handleCookieConsent(page: Page): Promise<void> {
    const acceptButtons = [
      'button#onetrust-accept-btn-handler',
      'button[aria-label*="Accept" i]',
      'button[aria-label*="accept" i]',
      'button:has-text("Accept")',
      'button:has-text("I\'ll search")',
      'button:has-text("必要的")',
    ];
    for (const selector of acceptButtons) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(500);
          logger.debug('Cookie consent accepted');
          return;
        }
      } catch {
        continue;
      }
    }
    logger.debug('No cookie consent button found');
  }

  private async fillDestination(
    page: Page,
    destination: string
  ): Promise<void> {
    const inputSelectors = [
      'input[name="ss"]',
      'input[placeholder*="destination" i]',
      'input[aria-label*="destination" i]',
      '#ss',
    ];

    let input = null;
    for (const sel of inputSelectors) {
      try {
        input = await page.$(sel);
        if (input) break;
      } catch {
        continue;
      }
    }

    if (!input) throw new Error('Could not find destination input');

    await input.click();
    await input.fill('');
    await page.waitForTimeout(300);
    await input.type(destination, { delay: 80 });
    await page.waitForTimeout(1000);

    const suggestionSelector = 'li[data-i="0"], ul[role="listbox"] li:first-child, .c-autocomplete__item:first-child';
    try {
      const suggestion = await page.waitForSelector(suggestionSelector, {
        timeout: 5000,
      });
      await suggestion.click();
      await page.waitForTimeout(500);
    } catch {
      logger.debug('No autocomplete suggestion clicked, using typed value');
    }
  }

  private async selectDates(
    page: Page,
    checkIn: string,
    checkOut: string
  ): Promise<void> {
    const dateInputSelectors = [
      '[data-testid="date-display-field-start"]',
      'div[data-mode="checkin"]',
      'span[aria-label*="check-in" i]',
      '.xp__dates__checkin',
      '.sb-date-picker',
    ];

    let clicked = false;
    for (const sel of dateInputSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!clicked) {
      await page.waitForTimeout(500);
    }

    const dateSpanSelector = `span[data-date="${checkIn}"]`;
    try {
      const checkInEl = await page.waitForSelector(dateSpanSelector, {
        timeout: 8000,
      });
      await checkInEl.click();
      await page.waitForTimeout(300);
    } catch {
      logger.warn({ checkIn }, 'Could not select check-in date, date picker may not have opened');
      return;
    }

    const checkOutSelector = `span[data-date="${checkOut}"]`;
    try {
      const checkOutEl = await page.$(checkOutSelector);
      if (checkOutEl) {
        await checkOutEl.click();
        await page.waitForTimeout(300);
      }
    } catch {
      logger.warn({ checkOut }, 'Could not select check-out date');
    }
  }

  private async selectGuests(
    page: Page,
    guests: number,
    rooms: number
  ): Promise<void> {
    const guestSelectors = [
      '[data-testid="occupancy-config"]',
      'button[data-testid*="occupancy"]',
      '.xp__guests__count',
      'button.sb-group__stepper-a11y',
      'button[aria-label*="guests" i]',
    ];

    let guestBtn = null;
    for (const sel of guestSelectors) {
      try {
        guestBtn = await page.$(sel);
        if (guestBtn) break;
      } catch {
        continue;
      }
    }

    if (!guestBtn) {
      logger.debug('Guest selector button not found, continuing with defaults');
      return;
    }

    await guestBtn.click();
    await page.waitForTimeout(500);

    const adults = Math.max(1, guests);
    for (let i = 1; i < adults; i++) {
      const plusButtons = [
        'button[aria-label*="adult" i][aria-label*="increase" i]',
        'button[aria-label*="add adult" i]',
        '.sb-group__field-adults button.sb-group__stepper-increase',
        'div[data-group="adults"] button:last-child',
      ];
      let clicked = false;
      for (const sel of plusButtons) {
        try {
          const btn = await page.$(sel);
          if (btn) {
            await btn.click({ timeout: 2000 });
            clicked = true;
            await page.waitForTimeout(100);
            break;
          }
        } catch {
          continue;
        }
      }
      if (!clicked) {
        logger.debug('Could not increase guest count');
        break;
      }
    }

    const doneButtons = [
      'button[aria-label*="done" i]:not([aria-label*="increase"])',
      'button:has-text("Done")',
      'button:has-text("Save")',
      '.xp__guests__count ~ button',
      '.sb-group__footer button',
    ];

    for (const sel of doneButtons) {
      try {
        const btn = await page.$(sel);
        if (btn && await btn.isVisible()) {
          await btn.click({ timeout: 2000 });
          break;
        }
      } catch {
        continue;
      }
    }

    await page.waitForTimeout(300);
  }

  private async submitSearch(page: Page): Promise<void> {
    const submitSelectors = [
      'button[type="submit"]',
      'button[data-testid*="search" i]',
      '.sb-searchbox__button',
      'button.sb-searchbox__button',
      'input[type="submit"]',
    ];

    for (const sel of submitSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn && await btn.isVisible()) {
          await btn.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          return;
        }
      } catch {
        continue;
      }
    }

    logger.warn('Submit button not found, pressing Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  }

  private async waitForResults(page: Page): Promise<void> {
    const resultSelectors = [
      'div[data-testid="property-card"]',
      'div[data-testid="accommodation-list"]',
      '[data-capla-component-boundary="b-property-web-property-page"]',
      '.sr_property_block',
      'div.sr_item',
    ];

    for (const sel of resultSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 15000 });
        logger.debug({ selector: sel }, 'Results loaded');
        await page.waitForTimeout(2000);
        return;
      } catch {
        continue;
      }
    }

    const currentUrl = page.url();
    logger.warn({ url: currentUrl }, 'Results selector not matched, waiting additional time');
    await page.waitForTimeout(5000);
  }

  private async scrollForLazyContent(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        const scrollContainer = document.querySelector(
          'div[data-testid="property-card-container"], .sr_item_container, main'
        ) || document.documentElement;

        for (let i = 0; i < 5; i++) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          await new Promise((r) => setTimeout(r, 1500));
          const newHeight = scrollContainer.scrollHeight;
          await new Promise((r) => setTimeout(r, 500));
          if (scrollContainer.scrollTop + (scrollContainer as HTMLElement).clientHeight >= newHeight - 100) {
            break;
          }
        }
      });
      await page.waitForTimeout(1000);
    } catch (error) {
      logger.warn({ error }, 'Scrolling failed, continuing');
    }
  }

  private async extractHotels(page: Page): Promise<HotelResult[]> {
    return page.evaluate(() => {
      const cardSelectors = [
        'div[data-testid="property-card"]',
        'div[data-component="property-card"]',
        '.sr_item',
        '.sr_property_block',
      ];

      let cards: Element[] = [];
      for (const sel of cardSelectors) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }

      return cards.map((card): HotelResult => {
        const titleEl =
          card.querySelector('[data-testid="title"]') ??
          card.querySelector('h3 a, h3 span, .sr_hotel_name a, [data-et-view*="title"]');

        const name = titleEl?.textContent?.trim() ?? 'Unknown Hotel';

        const imgEl =
          card.querySelector<HTMLImageElement>('img[data-testid="image"]') ??
          card.querySelector<HTMLImageElement>('.hotel_image img, .sr_item_photo img, img[src*="booking"]');

        const images: HotelImage[] = imgEl?.src
          ? [{ url: imgEl.src, alt: imgEl.alt || name }]
          : [];

        const priceEl =
          card.querySelector('[data-testid="price-and-discounted-price"]') ??
          card.querySelector('[data-testid="price-for-x-nights"]') ??
          card.querySelector('.prco-valign-middle-outer, .bui-price-display__value, .sr_gr_comp_rate, .avble');

        const priceText = priceEl?.textContent ?? '';
        const pricePerNight = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(/,/g, '')) || 0;
        const currencyMatch = priceText.match(/[A-Z]{3}|[€$£¥]/);
        const currency = currencyMatch ? currencyMatch[0] : 'USD';

        const reviewEl = card.querySelector('[data-testid="review-score"]');
        const ratingText = reviewEl?.textContent ?? '';
        const rating = parseFloat(ratingText.replace(',', '.').match(/(\d+(?:\.\d+)?)/)?.[0] ?? '0');
        const reviewDigits = ratingText.replace(/[^0-9]/g, '');
        const reviewCount = reviewDigits ? parseInt(reviewDigits, 10) : 0;

        const linkEl =
          card.querySelector<HTMLAnchorElement>('h3 a, a[href*="booking.com/hotel"], [data-testid="title-link"]');
        const bookingUrl = linkEl?.href ?? '';

        const breakfastTags = card.querySelectorAll('[data-testid*="breakfast"], .bui-icon-with-text');
        const breakfastAvailable = Array.from(breakfastTags).some(
          (el) => el.textContent?.toLowerCase().includes('breakfast')
        );

        const cancelTag = card.querySelector('[data-testid*="cancellation"], .bui-f-color-destructive');
        const cancellationPolicy: CancellationPolicy | undefined = (() => {
          const text = cancelTag?.textContent?.toLowerCase() ?? '';
          if (text.includes('free') || text.includes('cancel')) return { type: 'free', description: text };
          if (text.includes('refund') || text.includes('non')) return { type: 'non_refundable', description: text };
          return undefined;
        })();

        const roomEls = card.querySelectorAll('[data-testid*="room"], .room_info');
        const roomTypes: RoomType[] = Array.from(roomEls).map((r) => ({
          name: r.textContent?.trim() ?? 'Standard Room',
          pricePerNight,
          currency,
          maxGuests: 2,
          isRefundable: cancellationPolicy?.type !== 'non_refundable',
          breakfastIncluded: breakfastAvailable,
        }));

        const starEl = card.querySelector('[data-testid*="rating"], .bui-rating, i[class*="star"]');
        const starRating = (() => {
          const text = starEl?.textContent ?? '';
          const m = text.match(/(\d+)\s*(?:star|out of)/i);
          return m ? parseInt(m[1], 10) : undefined;
        })();

        const addressEl = card.querySelector('[data-testid="address"], .sr_card_address_line, .bui-link');
        const address = addressEl?.textContent?.trim();

        return {
          id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name,
          type: 'hotel',
          pricePerNight,
          totalPrice: pricePerNight * 1,
          currency,
          rating: rating || 0,
          reviewCount,
          images,
          provider: 'booking',
          bookingUrl,
          address,
          starRating,
          roomTypes,
          breakfastAvailable,
          cancellationPolicy,
          amenities: [],
          availability: true,
        };
      });
    });
  }

  private async takeScreenshot(page: Page, name: string): Promise<void> {
    try {
      await page.screenshot({
        path: `screenshots/${name}-${Date.now()}.png`,
        fullPage: true,
      });
    } catch {
      // ignore screenshot failures
    }
  }
}
