export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface HotelImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface RoomType {
  name: string;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedType?: string;
  isRefundable: boolean;
  breakfastIncluded: boolean;
}

export interface CancellationPolicy {
  type: 'free' | 'non_refundable' | 'partial_refund';
  description: string;
  deadline?: string;
}

export interface HotelResult {
  id: string;
  name: string;
  type: 'hotel';
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: HotelImage[];
  provider: string;
  bookingUrl: string;
  location?: GeoCoordinates;
  address?: string;
  starRating?: number;
  roomTypes: RoomType[];
  breakfastAvailable: boolean;
  cancellationPolicy?: CancellationPolicy;
  amenities?: string[];
  taxesAndFees?: number;
  availability: boolean;
}

export interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  budget?: number;
  preferences?: {
    stars?: number;
    amenities?: string[];
    mealPlan?: string;
    cancellationPolicy?: string;
  };
  providers?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse<T = HotelResult> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  providers: string[];
  metadata: {
    searchTime: number;
    cached: boolean;
    filters: Record<string, any>;
  };
}

export interface HotelSearchProvider {
  readonly name: string;
  search(params: SearchParams): Promise<HotelResult[]>;
  cleanup(): Promise<void>;
}
