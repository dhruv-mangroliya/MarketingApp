import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-toastify';
import { API_BASE } from '../../utils/config';
import './AdminManagement.css';

const AdminManagement = () => {
  const { user } = useAuth();
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    discountPrice: '',
    description: '',
    image: '',
    category: '',
    sizes: '',
    stock: '',
    rating: '4.0',
    reviews: '0',
    isInCatalog: true
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const isAdmin = user?.email === 'dhruvmangroliya642@gmail.com';

  // Fetch products for removal
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load products on component mount
  React.useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setProductData({
      ...productData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    setImageFiles(validFiles);
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(`📤 Uploading image ${i + 1}/${imageFiles.length}:`, file.name);
        
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        console.log(`📥 Upload response for ${file.name}:`, data);
        
        if (data.success) {
          uploadedUrls.push(data.imageUrl);
          console.log(`✅ Image URL added:`, data.imageUrl);
        } else {
          throw new Error(data.message || `Failed to upload ${file.name}`);
        }
      }
      
      console.log(`🎉 All images uploaded successfully:`, uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error('❌ Image upload error:', error);
      toast.error('Failed to upload images');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    
    try {
      // Upload images first
      const imageUrls = await uploadImages();
      if (!imageUrls) return;
      
      const formattedData = {
        ...productData,
        image: imageUrls[0], // Main image
        images: imageUrls, // All images
        price: parseInt(productData.price),
        discountPrice: parseInt(productData.discountPrice),
        stock: parseInt(productData.stock),
        rating: parseFloat(productData.rating),
        reviews: parseInt(productData.reviews),
        sizes: productData.sizes.split(',').map(s => s.trim()).filter(s => s),
        discountPercentage: Math.round(((productData.price - productData.discountPrice) / productData.price) * 100)
      };

      const response = await fetch(`${API_BASE}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formattedData)
      });

      if (response.ok) {
        toast.success('Product added successfully!');
        setProductData({
          name: '',
          price: '',
          discountPrice: '',
          description: '',
          image: '',
          category: '',
          sizes: '',
          stock: '',
          rating: '4.0',
          reviews: '0',
          isInCatalog: true
        });
        setImageFiles([]);
        fetchProducts(); // Refresh product list
      } else {
        toast.error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product');
    }
  };

  // Remove product function
  const handleRemoveProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to hide "${productName}" from catalog?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast.success('Product hidden from catalog successfully!');
        fetchProducts(); // Refresh product list
      } else {
        toast.error('Failed to hide product');
      }
    } catch (error) {
      console.error('Error hiding product:', error);
      toast.error('Error hiding product');
    }
  };

  // Restore product function
  const handleRestoreProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to restore "${productName}" to catalog?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${productId}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast.success('Product restored to catalog successfully!');
        fetchProducts(); // Refresh product list
      } else {
        toast.error('Failed to restore product');
      }
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Error restoring product');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Management</h1>
        <p>Welcome, {user?.name}</p>
      </div>

      <div className="admin-content">
        <div className="add-product-section">
          <h2>Add New Product</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Product Name"
                value={productData.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={productData.category}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <input
                type="number"
                name="price"
                placeholder="Original Price"
                value={productData.price}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="discountPrice"
                placeholder="Discount Price"
                value={productData.discountPrice}
                onChange={handleChange}
                required
              />
            </div>

            <textarea
              name="description"
              placeholder="Product Description"
              value={productData.description}
              onChange={handleChange}
              required
            />

            <div className="image-upload-section">
              <label className="image-upload-label">
                <span>Product Images * (Max 5 images)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="image-input"
                  required
                />
                <div className="upload-area">
                  {imageFiles.length > 0 ? (
                    <div className="images-preview">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="image-preview-item">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index + 1}`} 
                            className="preview-image"
                          />
                          <span className="image-number">{index + 1}</span>
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => {
                              const newFiles = imageFiles.filter((_, i) => i !== index);
                              setImageFiles(newFiles);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div className="file-count">
                        {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span>Click to select images</span>
                      <span className="upload-hint">PNG, JPG up to 5MB each (Max 5 images)</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="form-row">
              <input
                type="text"
                name="sizes"
                placeholder="Sizes (comma separated: S, M, L, XL)"
                value={productData.sizes}
                onChange={handleChange}
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock Quantity"
                value={productData.stock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <input
                type="number"
                name="rating"
                placeholder="Rating (1-5)"
                min="1"
                max="5"
                step="0.1"
                value={productData.rating}
                onChange={handleChange}
              />
              <input
                type="number"
                name="reviews"
                placeholder="Number of Reviews"
                value={productData.reviews}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isInCatalog"
                  checked={productData.isInCatalog}
                  onChange={(e) => setProductData({...productData, isInCatalog: e.target.checked})}
                />
                <span>Show in Catalog (visible to customers)</span>
              </label>
            </div>

            <button type="submit" className="add-product-btn" disabled={uploading}>
              {uploading ? `Uploading ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}...` : 'Add Product'}
            </button>
          </form>
        </div>
      </div>

      <div className="admin-content">
        <div className="remove-product-section">
          <h2>Manage Products</h2>
          {loadingProducts ? (
            <div className="loading-products">Loading products...</div>
          ) : (
            <div className="products-list">
              {products.length === 0 ? (
                <p>No products found</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="product-item">
                    <img src={product.image} alt={product.name} className="product-thumbnail" />
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p>₹{product.discountPrice} | Stock: {product.stock}</p>
                      <span className={`catalog-status ${product.isInCatalog ? 'visible' : 'hidden'}`}>
                        {product.isInCatalog ? 'Visible in Catalog' : 'Hidden from Catalog'}
                      </span>
                    </div>
                    {product.isInCatalog ? (
                      <button 
                        className="remove-product-btn"
                        onClick={() => handleRemoveProduct(product.id, product.name)}
                      >
                        HIDE
                      </button>
                    ) : (
                      <button 
                        className="restore-product-btn"
                        onClick={() => handleRestoreProduct(product.id, product.name)}
                      >
                        RESTORE
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;