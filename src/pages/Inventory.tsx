import { useState, useEffect } from 'react';
import { 
  Package, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  UploadCloud, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'logistics' | 'seo'>('basic');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Cameras',
    price: '',
    description: '',
    cod_enabled: false,
    gtin: '',
    sku: '',
    bullet_points: '',
    sale_price: '',
    item_dimensions: '',
    package_dimensions: '',
    item_weight: '',
    package_weight: '',
    search_terms: '',
    browse_nodes: '',
    battery_info: '',
    country_of_origin: 'India',
    safety_warnings: '',
    in_stock: true,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const categories = ['All', 'Cameras', 'Lenses', 'Lighting', 'Audio', 'Drones', 'Gimbals', 'Crafts & Gifting', 'Accessories'];

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle URL query action e.g. ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchInventory(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setActiveTab('basic');
    setFormData({ 
      name: '', brand: '', category: 'Cameras', price: '', description: '', cod_enabled: false,
      gtin: '', sku: '', bullet_points: '', sale_price: '', item_dimensions: '', package_dimensions: '',
      item_weight: '', package_weight: '', search_terms: '', browse_nodes: '', battery_info: '', 
      country_of_origin: 'India', safety_warnings: '', in_stock: true
    });
    setSelectedFiles([]);
    setExistingImages([]);
    setShowModal(true);
  }

  function openEditModal(item: any) {
    setEditingId(item.id);
    setActiveTab('basic');
    setFormData({
      name: item.name || '',
      brand: item.brand || '',
      category: item.category || 'Cameras',
      price: item.price ? String(item.price) : '',
      description: item.description || '',
      cod_enabled: Boolean(item.cod_enabled),
      gtin: item.gtin || '',
      sku: item.sku || '',
      bullet_points: Array.isArray(item.bullet_points) ? item.bullet_points.join('\n') : (item.bullet_points || ''),
      sale_price: item.sale_price ? String(item.sale_price) : '',
      item_dimensions: item.item_dimensions || '',
      package_dimensions: item.package_dimensions || '',
      item_weight: item.item_weight || '',
      package_weight: item.package_weight || '',
      search_terms: Array.isArray(item.search_terms) ? item.search_terms.join(', ') : (item.search_terms || ''),
      browse_nodes: Array.isArray(item.browse_nodes) ? item.browse_nodes.join(', ') : (item.browse_nodes || ''),
      battery_info: item.battery_info || '',
      country_of_origin: item.country_of_origin || 'India',
      safety_warnings: item.safety_warnings || '',
      in_stock: item.in_stock !== false,
    });
    setExistingImages(item.images || []);
    setSelectedFiles([]);
    setShowModal(true);
  }

  // Quick 1-click toggle stock status directly on table
  async function toggleStockStatus(item: any, e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = !item.in_stock;
    
    // Optimistic UI update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, in_stock: newStatus } : i));

    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      setToastMessage(`Product status updated to ${newStatus ? 'In Stock' : 'Out of Stock'}`);
    } catch (err: any) {
      // Revert if error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, in_stock: !newStatus } : i));
      setToastMessage(`Error toggling stock: ${err.message}`);
    }
  }

  async function uploadImages(files: File[]) {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `gear/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { data, error } = await supabase.storage.from('gear').upload(filename, file, {
        upsert: true,
      });
      
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from('gear').getPublicUrl(data.path);
      urls.push(publicData.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Product Name is required.');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    setUploading(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(selectedFiles);
      }
      
      const finalImages = [...existingImages, ...uploadedUrls];

      const row = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || 'Camqrew',
        category: formData.category,
        price: Number(formData.price),
        description: formData.description,
        images: finalImages,
        in_stock: formData.in_stock,
        cod_enabled: formData.cod_enabled,
        gtin: formData.gtin,
        sku: formData.sku,
        bullet_points: formData.bullet_points ? formData.bullet_points.split('\n').filter(Boolean) : [],
        sale_price: formData.sale_price ? Number(formData.sale_price) : null,
        item_dimensions: formData.item_dimensions,
        package_dimensions: formData.package_dimensions,
        item_weight: formData.item_weight,
        package_weight: formData.package_weight,
        search_terms: formData.search_terms ? formData.search_terms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        browse_nodes: formData.browse_nodes ? formData.browse_nodes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        battery_info: formData.battery_info,
        country_of_origin: formData.country_of_origin,
        safety_warnings: formData.safety_warnings,
      };

      if (editingId) {
        const { data, error } = await supabase.from('products').update(row).eq('id', editingId).select().single();
        if (error) throw error;
        setItems(items.map(i => i.id === editingId ? data : i));
        setToastMessage(`Updated "${formData.name}" successfully!`);
      } else {
        const { data, error } = await supabase.from('products').insert([row]).select().single();
        if (error) throw error;
        setItems([data, ...items]);
        setToastMessage(`Created new listing "${formData.name}"!`);
      }
      
      setShowModal(false);
    } catch (e: any) {
      alert(e.message || 'Error saving product');
    } finally {
      setUploading(false);
    }
  }

  async function removeItem(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from the catalogue?`)) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
      setToastMessage(`Removed "${name}" from catalogue.`);
    } catch (e) {
      console.error('Error deleting item', e);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Filter items by search, category, and stock
  const filteredItems = items.filter(item => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchBrand = item.brand?.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchSku) return false;
    }

    // Category
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Stock
    if (stockFilter === 'in_stock' && !item.in_stock) return false;
    if (stockFilter === 'out_of_stock' && item.in_stock) return false;

    return true;
  });

  const inStockCount = items.filter(i => i.in_stock).length;
  const outOfStockCount = items.filter(i => !i.in_stock).length;

  return (
    <div className="admin-page-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-floating-toast">
          <CheckCircle2 size={18} color="var(--accent)" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="toast-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Inventory & Catalogue</h1>
          <p className="admin-page-subtitle">
            Manage official gear, cinema kits, artisanal items & e-commerce listings
          </p>
        </div>

        <div className="admin-header-controls">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            title="Refresh catalogue"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button 
            type="button" 
            className="admin-btn admin-btn-primary" 
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Hub */}
      <div className="admin-filter-hub">
        <div className="admin-search-field">
          <div className="search-field-icon-wrap">
            <Search size={15} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by gear name, brand, SKU..."
            className="admin-input-clean"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn" title="Clear Search">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Stock Filter Pills */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${stockFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStockFilter('all')}
          >
            All ({items.length})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${stockFilter === 'in_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('in_stock')}
          >
            In Stock ({inStockCount})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${stockFilter === 'out_of_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('out_of_stock')}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="admin-cat-filter-strip">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`admin-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Inventory Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product Details</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} className="admin-row-hover">
                  <td>
                    <div className="admin-product-cell">
                      <div className="admin-product-thumb">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.name} />
                        ) : (
                          <Package size={24} color="var(--text-muted)" />
                        )}
                      </div>
                      <div className="admin-product-meta">
                        <div className="admin-product-name">{item.name}</div>
                        <div className="admin-product-desc-line">
                          {item.sku ? <span className="sku-tag">SKU: {item.sku}</span> : null}
                          <span>{item.description || 'No description provided'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="admin-cat-tag">{item.category}</span>
                  </td>

                  <td>
                    <span className="admin-brand-tag">{item.brand || 'Camqrew'}</span>
                  </td>

                  <td>
                    <div className="admin-price-cell">
                      <span className="price-main">{formatCurrency(item.price)}</span>
                      {item.sale_price && (
                        <span className="price-strike">{formatCurrency(item.sale_price)}</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <button 
                      type="button"
                      className={`admin-stock-toggle-btn ${item.in_stock ? 'in-stock' : 'out-of-stock'}`}
                      onClick={(e) => toggleStockStatus(item, e)}
                      title="Click to toggle stock status"
                    >
                      <span className="stock-dot" />
                      <span>{item.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                    </button>
                  </td>

                  <td>
                    <div className="admin-actions-cell">
                      <Link 
                        to={`/marketplace/${item.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="admin-table-icon-btn" 
                        title="View Live Listing"
                      >
                        <ExternalLink size={16} />
                      </Link>

                      <button 
                        type="button" 
                        className="admin-table-icon-btn" 
                        onClick={() => openEditModal(item)}
                        title="Edit Product"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button 
                        type="button" 
                        className="admin-table-icon-btn danger" 
                        onClick={() => removeItem(item.id, item.name)}
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-empty">
                      <Package size={36} color="var(--text-muted)" />
                      <div className="empty-title">No products found</div>
                      <div className="empty-sub">
                        {searchQuery ? `No listings match your search "${searchQuery}"` : 'No items match selected filters.'}
                      </div>
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-primary" 
                        onClick={openAddModal}
                        style={{ marginTop: 14 }}
                      >
                        <Plus size={16} /> Add First Product
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal-card-lg" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">
                  {editingId ? 'Edit Product Listing' : 'Add New Gear Listing'}
                </h2>
                <p className="admin-modal-sub">
                  Official catalogue item published across Marketplace & Rental stores
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="admin-modal-tabs">
              <button 
                type="button"
                className={`admin-modal-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                General & Media
              </button>
              <button 
                type="button"
                className={`admin-modal-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                Pricing & Stock
              </button>
              <button 
                type="button"
                className={`admin-modal-tab-btn ${activeTab === 'logistics' ? 'active' : ''}`}
                onClick={() => setActiveTab('logistics')}
              >
                Dimensions & Shipping
              </button>
              <button 
                type="button"
                className={`admin-modal-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
                onClick={() => setActiveTab('seo')}
              >
                Identifiers & SEO
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="admin-modal-scroll-area">
                {/* TAB 1: General & Media */}
                {activeTab === 'basic' && (
                  <div className="modal-tab-content">
                    <div className="form-group">
                      <label className="admin-form-label">Product Title *</label>
                      <input 
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Sony FX3 Cinema Line Full-Frame Camera Body"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="admin-form-row-2">
                      <div className="form-group">
                        <label className="admin-form-label">Brand / Manufacturer</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. Sony, Canon, RED, Aputure"
                          value={formData.brand}
                          onChange={e => setFormData({ ...formData, brand: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="admin-form-label">Category</label>
                        <select 
                          className="admin-form-input"
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="admin-form-label">Description</label>
                      <textarea 
                        className="admin-form-textarea"
                        rows={4}
                        placeholder="Detailed technical specifications, condition notes, and what's included..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {/* Image Upload Area */}
                    <div className="form-group">
                      <label className="admin-form-label">Product Showcase Images</label>
                      <div className="admin-image-upload-zone">
                        <UploadCloud size={28} color="var(--accent)" />
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>
                          Click to select photos or drag & drop
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          PNG, JPG, or WEBP up to 10MB
                        </div>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files) {
                              setSelectedFiles(Array.from(e.target.files));
                            }
                          }}
                          className="upload-file-input"
                        />
                      </div>

                      {/* Existing Images Thumbnails */}
                      {existingImages.length > 0 && (
                        <div className="image-previews-strip">
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: '100%' }}>
                            Current Images ({existingImages.length})
                          </span>
                          {existingImages.map((img, idx) => (
                            <div key={idx} className="preview-thumb-box">
                              <img src={img} alt="Current" />
                              <button 
                                type="button" 
                                className="remove-img-btn"
                                onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New Files Preview */}
                      {selectedFiles.length > 0 && (
                        <div className="new-files-badge-list">
                          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                            {selectedFiles.length} new {selectedFiles.length === 1 ? 'file' : 'files'} selected for upload
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Pricing & Stock */}
                {activeTab === 'pricing' && (
                  <div className="modal-tab-content">
                    <div className="admin-form-row-2">
                      <div className="form-group">
                        <label className="admin-form-label">Retail / Selling Price (₹) *</label>
                        <input 
                          type="number"
                          className="admin-form-input"
                          placeholder="e.g. 299900"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="admin-form-label">Promotional Sale Price (Optional)</label>
                        <input 
                          type="number"
                          className="admin-form-input"
                          placeholder="e.g. 284900"
                          value={formData.sale_price}
                          onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row-2" style={{ marginTop: 12 }}>
                      <div className="form-group">
                        <label className="admin-form-label">Stock Availability</label>
                        <div className="admin-radio-toggle-group">
                          <label className={`radio-pill-option ${formData.in_stock ? 'active' : ''}`}>
                            <input 
                              type="radio" 
                              name="in_stock" 
                              checked={formData.in_stock} 
                              onChange={() => setFormData({ ...formData, in_stock: true })} 
                            />
                            <span>In Stock (Available for Order)</span>
                          </label>
                          <label className={`radio-pill-option ${!formData.in_stock ? 'active' : ''}`}>
                            <input 
                              type="radio" 
                              name="in_stock" 
                              checked={!formData.in_stock} 
                              onChange={() => setFormData({ ...formData, in_stock: false })} 
                            />
                            <span>Out of Stock</span>
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="admin-form-label">Payment Methods</label>
                        <label className="admin-checkbox-label">
                          <input 
                            type="checkbox"
                            checked={formData.cod_enabled}
                            onChange={e => setFormData({ ...formData, cod_enabled: e.target.checked })}
                          />
                          <span>Allow Cash on Delivery (COD) for this item</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label className="admin-form-label">Key Highlights / Bullet Points (One per line)</label>
                      <textarea 
                        className="admin-form-textarea"
                        rows={4}
                        placeholder={"Full-Frame 10.2MP BSI CMOS Sensor\nUHD 4K up to 120p, 10-Bit 4:2:2 XAVC S-I\n15+ Stops Dynamic Range\nFast Hybrid AF with Real-Time Eye AF"}
                        value={formData.bullet_points}
                        onChange={e => setFormData({ ...formData, bullet_points: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: Logistics & Dimensions */}
                {activeTab === 'logistics' && (
                  <div className="modal-tab-content">
                    <div className="admin-form-row-2">
                      <div className="form-group">
                        <label className="admin-form-label">Item Weight (kg / g)</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 715g"
                          value={formData.item_weight}
                          onChange={e => setFormData({ ...formData, item_weight: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Package Weight (Shiprocket)</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 1.4kg"
                          value={formData.package_weight}
                          onChange={e => setFormData({ ...formData, package_weight: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row-2" style={{ marginTop: 12 }}>
                      <div className="form-group">
                        <label className="admin-form-label">Item Dimensions (L × W × H)</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 129.7 x 77.8 x 84.5 mm"
                          value={formData.item_dimensions}
                          onChange={e => setFormData({ ...formData, item_dimensions: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Package Dimensions for Courier</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 24 x 18 x 15 cm"
                          value={formData.package_dimensions}
                          onChange={e => setFormData({ ...formData, package_dimensions: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row-2" style={{ marginTop: 12 }}>
                      <div className="form-group">
                        <label className="admin-form-label">Country of Origin</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          value={formData.country_of_origin}
                          onChange={e => setFormData({ ...formData, country_of_origin: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Battery Information</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 1x NP-FZ100 Lithium-Ion included"
                          value={formData.battery_info}
                          onChange={e => setFormData({ ...formData, battery_info: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Identifiers & SEO */}
                {activeTab === 'seo' && (
                  <div className="modal-tab-content">
                    <div className="admin-form-row-2">
                      <div className="form-group">
                        <label className="admin-form-label">SKU (Stock Keeping Unit)</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. SNY-FX3-BODY-01"
                          value={formData.sku}
                          onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">GTIN / UPC / Barcode</label>
                        <input 
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 027242922716"
                          value={formData.gtin}
                          onChange={e => setFormData({ ...formData, gtin: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label className="admin-form-label">Search Keywords (Comma separated)</label>
                      <input 
                        type="text"
                        className="admin-form-input"
                        placeholder="cinema camera, 4k 120fps, sony fx3, wedding videography, vlogging"
                        value={formData.search_terms}
                        onChange={e => setFormData({ ...formData, search_terms: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading & Saving...' : (editingId ? 'Save Changes' : 'Publish Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
