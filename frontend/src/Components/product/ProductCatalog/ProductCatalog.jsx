import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCatalog.css";

const ProductCatalog = (props) => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const newdata = props.data.filter(item => item.rating < 4);
    setData(newdata);
  }, [props.data]);

  return (
    <div className="catalog-container">
      {data.length === 0 ? (
        <div style={{textAlign: 'center', padding: '50px', width: '100%', fontSize: '18px', color: '#666'}}>
          NO DATA FOUND
        </div>
      ) : (
        data.map((item, index) => (
          <div 
            className="product-card" 
            key={item.id}
          >
            <div className="product-image-wrapper">
              <img src={item.image} alt={item.name} loading="lazy" />
              {item.discountPercentage >= 20 && (
                <img src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/690af5f6667d5.png" alt="discount" className="discount-tag" />
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
        ))
      )}
    </div>
  );
};

export default ProductCatalog;
