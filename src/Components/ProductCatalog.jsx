import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import catalog from "../data/CatalogData.json";
import "../CSS/ProductCatalog.css";

const ProductCatalog = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setData(catalog);
  }, []);

  return (
    <div className="catalog-container">
      {data.map((item) => (
        <div className="product-card" key={item.id}>
          <img src={item.image} alt={item.name} />
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
      ))}
    </div>
  );
};

export default ProductCatalog;
