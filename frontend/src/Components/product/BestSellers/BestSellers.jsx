import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../ProductCatalog/ProductCatalog.css";

const BestSellers = (props) => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (props.data) {
      const filteredData = props.data.filter(
        (item) => item.rating >= 4
      );
      setData(filteredData);
    }
  }, [props.data]);

  return (
    <div className="catalog-container">
      {data.length === 0 ? (
        <div style={{textAlign: 'center', padding: '50px', width: '100%', fontSize: '18px', color: '#666'}}>
          NO DATA FOUND
        </div>
      ) : (
        data.map((item) => (
          <div className="product-card" key={item.id}>
            <div className="product-image-wrapper">
              <img src={item.image} alt={item.name} loading="lazy" />
            </div>
            <h3>{item.name}</h3>

            <div className="price-row">
              <p className="price">Rs.{item.price}</p>

              <button
                className="more-details-button"
                onClick={() => navigate(`/product/${item.id}`)}
              >
                More Details
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default BestSellers;
