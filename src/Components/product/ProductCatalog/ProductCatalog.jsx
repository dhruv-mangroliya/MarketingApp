import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCatalog.css";

const ProductCatalog = (props) => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setData(props.data);
  }, []);

  return (
    <div className="catalog-container">
      {data.map((item, index) => (
        <div 
          className="product-card" 
          key={item.id}
        >
          <div className="product-image-wrapper">
            <img src={item.image} alt={item.name} />
            {item.discountPercentage > 0 && (
              <span className="discount-tag">{item.discountPercentage}% OFF</span>
            )}
          </div>
          <h3>{item.name}</h3>
          <div className="rating-stars">
            {'★'.repeat(Math.floor(item.rating))}{'☆'.repeat(5 - Math.floor(item.rating))}
            <span className="rating-count">({item.reviews})</span>
          </div>
          <div className="price-row">
            <div className="price-group">
              <p className="discount-price">₹{item.discountPrice}</p>
              <p className="original-price">₹{item.price}</p>
            </div>
            <button
              className="more-details-button"
              onClick={() => navigate(`/product/${item.id}`)}
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCatalog;
