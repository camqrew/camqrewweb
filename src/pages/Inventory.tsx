import { useState, useEffect } from 'react';
import { Package, XCircle, Edit, Plus, X, UploadCloud } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { supabase } from '../api/supabaseClient';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    country_of_origin: '',
    safety_warnings: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({ 
      name: '', brand: '', category: 'Cameras', price: '', description: '', cod_enabled: false,
      gtin: '', sku: '', bullet_points: '', sale_price: '', item_dimensions: '', package_dimensions: '',
      item_weight: '', package_weight: '', search_terms: '', browse_nodes: '', battery_info: '', country_of_origin: '', safety_warnings: ''
    });
    setSelectedFiles([]);
    setExistingImages([]);
    setShowModal(true);
  }

  function openEditModal(item: any) {
    setEditingId(item.id);
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
      country_of_origin: item.country_of_origin || '',
      safety_warnings: item.safety_warnings || ''
    });
    setExistingImages(item.images || []);
    setSelectedFiles([]);
    setShowModal(true);
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
    setUploading(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(selectedFiles);
      }
      
      // Combine existing images (if they weren't removed) with newly uploaded ones
      const finalImages = [...existingImages, ...uploadedUrls];

      const row = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description,
        images: finalImages,
        in_stock: true,
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
      } else {
        const { data, error } = await supabase.from('products').insert([row]).select().single();
        if (error) throw error;
        setItems([data, ...items]);
      }
      
      setShowModal(false);
    } catch (e: any) {
      alert(e.message || 'Error saving product');
    } finally {
      setUploading(false);
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm('Are you sure you want to completely remove this official product from the platform?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
    } catch (e) {
      console.error('Error deleting item', e);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading official inventory catalogue...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Manage official Camqrew Gear Store catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add New Product
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ backgroundColor: "var(--bg-surface)", width: 64, height: 64, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={28} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.category}</div>
                  </td>
                  <td>
                    <span className="badge badge-accent">{item.brand || 'Camqrew'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                      {formatCurrency(item.price)}
                    </div>
                  </td>
                  <td>
                    {item.in_stock ? (
                      <span className="badge badge-success">In Stock</span>
                    ) : (
                      <span className="badge badge-danger">Out of Stock</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => openEditModal(item)}>
                        <Edit size={16} /> Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => removeItem(item.id)}>
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No official products found in the catalogue.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="auth-gate-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card auth-gate-modal-card" style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close-icon"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: 24, fontSize: 20 }}>
              {editingId ? 'Edit Product' : 'Add Official Product'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Product Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Brand</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.brand} 
                    onChange={e => setFormData({...formData, brand: e.target.value})} 
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Category</label>
                  <CustomSelect 
                    value={formData.category}
                    onChange={val => setFormData({...formData, category: val})}
                    options={['Cameras', 'Lenses', 'Lighting', 'Audio', 'Accessories', 'Drones']}
                    placeholder="Select Category"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Price (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Sale Price (₹) - Optional</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.sale_price} 
                    onChange={e => setFormData({...formData, sale_price: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.sku} 
                    onChange={e => setFormData({...formData, sku: e.target.value})} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>GTIN (UPC/EAN/ISBN)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.gtin} 
                    onChange={e => setFormData({...formData, gtin: e.target.value})} 
                  />
                </div>
              </div>

              {/* IMAGES UPLOAD SECTION */}
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Product Images</label>
                
                {/* Show Existing Images if Editing */}
                {existingImages.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {existingImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                        <img src={img} alt="Existing" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                        <button 
                          type="button"
                          onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: -6, right: -6, backgroundColor: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ position: 'relative', border: 'none', borderRadius: 8, padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                    }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <UploadCloud size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {selectedFiles.length > 0 ? `${selectedFiles.length} new file(s) selected` : 'Click or drag to upload images'}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Bullet Points (One per line)</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={formData.bullet_points} 
                  onChange={e => setFormData({...formData, bullet_points: e.target.value})} 
                  placeholder="High quality material\nIncludes carrying case\n..."
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Item Dimensions (L x W x H)</label>
                  <input type="text" className="input-field" value={formData.item_dimensions} onChange={e => setFormData({...formData, item_dimensions: e.target.value})} placeholder="10 x 5 x 2 cm" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Package Dimensions</label>
                  <input type="text" className="input-field" value={formData.package_dimensions} onChange={e => setFormData({...formData, package_dimensions: e.target.value})} placeholder="12 x 7 x 4 cm" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Item Weight</label>
                  <input type="text" className="input-field" value={formData.item_weight} onChange={e => setFormData({...formData, item_weight: e.target.value})} placeholder="200g" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Package Weight</label>
                  <input type="text" className="input-field" value={formData.package_weight} onChange={e => setFormData({...formData, package_weight: e.target.value})} placeholder="250g" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Country of Origin</label>
                  <input type="text" className="input-field" value={formData.country_of_origin} onChange={e => setFormData({...formData, country_of_origin: e.target.value})} placeholder="e.g. India" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Battery Information</label>
                  <input type="text" className="input-field" value={formData.battery_info} onChange={e => setFormData({...formData, battery_info: e.target.value})} placeholder="e.g. Lithium-ion included" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Safety Warnings</label>
                <input type="text" className="input-field" value={formData.safety_warnings} onChange={e => setFormData({...formData, safety_warnings: e.target.value})} placeholder="e.g. Choking hazard - small parts" />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Search Terms (comma separated)</label>
                  <input type="text" className="input-field" value={formData.search_terms} onChange={e => setFormData({...formData, search_terms: e.target.value})} placeholder="dslr, camera, lens" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Browse Nodes (comma separated)</label>
                  <input type="text" className="input-field" value={formData.browse_nodes} onChange={e => setFormData({...formData, browse_nodes: e.target.value})} placeholder="Electronics > Cameras" />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.cod_enabled}
                  onChange={e => setFormData({...formData, cod_enabled: e.target.checked})}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Enable Cash on Delivery (COD) for this product
              </label>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: 12 }} disabled={uploading}>
                {uploading ? 'Uploading & Saving...' : editingId ? 'Update Product' : 'List Product on Gear Store'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
