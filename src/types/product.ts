export type ProductType = 'sale' | 'rental';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  type: ProductType;
  price: number;
  rentalPricePerDay?: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  image: string;
  gallery?: string[];
  description: string;
  specs?: { [key: string]: string };
  inStock: boolean;
  rating: number;
  isOfficial?: boolean;
  isUsed?: boolean;
  isRental?: boolean;
  codEnabled?: boolean;
  
  // Advanced E-commerce Fields
  gtin?: string;
  sku?: string;
  bulletPoints?: string[];
  salePrice?: number;
  itemDimensions?: string;
  packageDimensions?: string;
  itemWeight?: string;
  packageWeight?: string;
  searchTerms?: string[];
  browseNodes?: string[];
  batteryInfo?: string;
  countryOfOrigin?: string;
  safetyWarnings?: string;
}
