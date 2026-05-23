import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ProductPage.css";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import { getProductById } from "../../utils/api";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>;
  if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>Error: {error}</div>;
  if (!product) return <div style={{textAlign: 'center', padding: '50px'}}>NO DATA FOUND</div>;

  const images = product.images || [product.image];
  const sizes = product.sizes || [];
  const availableStock = selectedSize && product.sizeStock ? product.sizeStock[selectedSize] : product.stock;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size!");
      return;
    }
    addToCart({ ...product}, selectedSize, quantity);
    toast.success(`${quantity} item(s) added to cart!`);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  return (
    <div className="product-page">
      <div className="product-left">
        <div className="image-slider">
          <img src={images[currentImage]} alt={product.name} loading="lazy" />
          <div className="slider-controls">
            <button onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}>‹</button>
            <button onClick={() => setCurrentImage((currentImage + 1) % images.length)}>›</button>
          </div>
        </div>
        <div className="thumbnail-container">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt="" className={idx === currentImage ? "active" : ""} onClick={() => setCurrentImage(idx)} loading="lazy" />
          ))}
        </div>
      </div>

      <div className="product-right">
        <h2>{product.name}</h2>
        
        <div className="rating-section">
          <span className="stars">{'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}</span>
          <span className="rating-text">{product.rating} ({product.reviews} ratings)</span>
        </div>

        <div className="price-section">
          <span className="discount-price">₹{product.discountPrice}</span>
          <span className="original-price">₹{product.price}</span>
          <span className="discount-badge">{product.discountPercentage}% OFF</span>
        </div>

        <p className="product-description">{product.description}</p>

        {sizes.length > 0 && (
          <div className="size-section">
            <label>Select Size:</label>
            <div className="size-options">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? "active" : ""}`}
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="product-info">
          <p><strong>Return Period:</strong> {product.returnPeriod} days</p>
          <p><strong>Stock:</strong> {selectedSize ? (availableStock > 0 ? `${availableStock} available` : 'Out of stock') : 'Select a size'}</p>
        </div>

        <div className="quantity-section">
          <label>Quantity:</label>
          <div className="quantity-controls">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} disabled={!selectedSize}>+</button>
          </div>
        </div>

        <button className="add-to-cart" onClick={handleAddToCart} disabled={!selectedSize || availableStock === 0}>
          Add to Cart
        </button>

        <div className="reviews-section">
          <h3>Customer Reviews</h3>
          {product.userReviews?.map((review, idx) => (
            <div key={idx} className="review">
              <div className="review-header">
                <strong>{review.user}</strong>
                <span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
