import { supabase } from './supabaseClient';
import type { Product, ProductType } from '../types/product';

const mapOfficialProduct = (p: any): Product => ({
  id: String(p.id),
  name: p.name || 'Equipment item',
  brand: p.brand || 'Camcrew',
  category: p.category || 'Cameras',
  type: 'sale',
  price: Number(p.price || 0),
  condition: 'New',
  image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800'),
  gallery: Array.isArray(p.images) ? p.images : [],
  description: p.description || '',
  specs: p.specifications || {},
  inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
  rating: 5.0,
  isOfficial: true,
  codEnabled: Boolean(p.cod_enabled),
  gtin: p.gtin || undefined,
  sku: p.sku || undefined,
  bulletPoints: Array.isArray(p.bullet_points) ? p.bullet_points : undefined,
  salePrice: p.sale_price ? Number(p.sale_price) : undefined,
  itemDimensions: p.item_dimensions || undefined,
  packageDimensions: p.package_dimensions || undefined,
  itemWeight: p.item_weight || undefined,
  packageWeight: p.package_weight || undefined,
  searchTerms: Array.isArray(p.search_terms) ? p.search_terms : undefined,
  browseNodes: Array.isArray(p.browse_nodes) ? p.browse_nodes : undefined,
  batteryInfo: p.battery_info || undefined,
  countryOfOrigin: p.country_of_origin || undefined,
  safetyWarnings: p.safety_warnings || undefined,
});

const mapProSaleItem = (p: any): Product => ({
  id: String(p.id),
  name: p.title || 'Used Equipment',
  brand: 'Used Gear',
  category: p.category || 'Accessories',
  type: 'sale',
  price: Number(p.price || 0),
  condition: p.condition || 'Good',
  image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
  gallery: Array.isArray(p.images) ? p.images : [],
  description: p.description || '',
  inStock: p.status !== 'sold',
  rating: 4.8,
  isUsed: true,
  codEnabled: Boolean(p.cod_enabled),
});

const mapRentalEquipment = (p: any): Product => ({
  id: String(p.id),
  name: p.name || 'Rental Equipment',
  brand: 'Rental',
  category: p.category || 'Lenses',
  type: 'rental',
  price: Number(p.daily_rate || 0),
  rentalPricePerDay: Number(p.daily_rate || 0),
  condition: 'Good',
  image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
  gallery: Array.isArray(p.images) ? p.images : [],
  description: p.description || '',
  inStock: p.status !== 'rented',
  rating: 4.9,
  isRental: true,
});

export const productApi = {
  getUserProducts: async (): Promise<Product[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    return productApi.getProductsByOwner(userData.user.id);
  },

  getProductsByOwner: async (ownerId: string): Promise<Product[]> => {
    const results: Product[] = [];

    const [salesRes, rentalsRes] = await Promise.all([
      supabase.from('pro_sale_items').select('*').eq('seller_id', ownerId),
      supabase.from('rental_equipment').select('*').eq('owner_id', ownerId),
    ]);

    if (salesRes.data) results.push(...salesRes.data.map(mapProSaleItem));
    if (rentalsRes.data) results.push(...rentalsRes.data.map(mapRentalEquipment));

    return results;
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const { data: userData } = await supabase.auth.getUser();
    const ownerId = userData?.user?.id;

    if (!ownerId) throw new Error('Must be logged in to create product');

    if (productData.type === 'rental') {
      const row = {
        owner_id: ownerId,
        name: productData.name,
        category: productData.category,
        daily_rate: productData.rentalPricePerDay || productData.price || 2500,
        security_deposit: (productData.rentalPricePerDay || productData.price || 2500) * 10,
        description: productData.description,
        images: productData.image ? [productData.image, ...(productData.gallery || [])] : [],
        status: 'available',
      };
      const { data, error } = await supabase.from('rental_equipment').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return mapRentalEquipment(data);
    } else {
      const row = {
        seller_id: ownerId,
        title: productData.name,
        category: productData.category,
        price: productData.price || 0,
        condition: productData.condition || 'Good',
        description: productData.description,
        images: productData.image ? [productData.image, ...(productData.gallery || [])] : [],
        status: 'active',
        cod_enabled: Boolean(productData.codEnabled),
        gtin: productData.gtin,
        sku: productData.sku,
        bullet_points: productData.bulletPoints || [],
        sale_price: productData.salePrice || null,
        item_dimensions: productData.itemDimensions,
        package_dimensions: productData.packageDimensions,
        item_weight: productData.itemWeight,
        package_weight: productData.packageWeight,
        search_terms: productData.searchTerms || [],
        browse_nodes: productData.browseNodes || [],
        battery_info: productData.batteryInfo,
        country_of_origin: productData.countryOfOrigin,
        safety_warnings: productData.safetyWarnings,
      };
      const { data, error } = await supabase.from('pro_sale_items').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return mapProSaleItem(data);
    }
  },

  getProducts: async (type?: ProductType, category?: string, searchQuery?: string): Promise<Product[]> => {
    let results: Product[] = [];

    const fetchSales = async () => {
      let q1 = supabase.from('products').select('*');
      let q2 = supabase.from('pro_sale_items').select('*');
      
      if (category && category !== 'All') {
        q1 = q1.ilike('category', `%${category}%`);
        q2 = q2.ilike('category', `%${category}%`);
      }
      if (searchQuery) {
        q1 = q1.ilike('name', `%${searchQuery}%`);
        q2 = q2.ilike('title', `%${searchQuery}%`);
      }

      const [res1, res2] = await Promise.all([q1, q2]);
      if (res1.data) results.push(...res1.data.map(mapOfficialProduct));
      if (res2.data) results.push(...res2.data.map(mapProSaleItem));
    };

    const fetchRentals = async () => {
      let q = supabase.from('rental_equipment').select('*');
      if (category && category !== 'All') {
        q = q.ilike('category', `%${category}%`);
      }
      if (searchQuery) {
        q = q.ilike('name', `%${searchQuery}%`);
      }
      const res = await q;
      if (res.data) results.push(...res.data.map(mapRentalEquipment));
    };

    if (type === 'sale') {
      await fetchSales();
    } else if (type === 'rental') {
      await fetchRentals();
    } else {
      await Promise.all([fetchSales(), fetchRentals()]);
    }

    return results;
  },

  getProductById: async (id: string): Promise<Product> => {
    // We don't know the type, so check all three sequentially or in parallel
    const [res1, res2, res3] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).maybeSingle(),
      supabase.from('pro_sale_items').select('*').eq('id', id).maybeSingle(),
      supabase.from('rental_equipment').select('*').eq('id', id).maybeSingle()
    ]);

    if (res1.data) return mapOfficialProduct(res1.data);
    if (res2.data) return mapProSaleItem(res2.data);
    if (res3.data) return mapRentalEquipment(res3.data);

    throw new Error('Product not found');
  },
};
