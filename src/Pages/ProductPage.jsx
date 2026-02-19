import { useParams } from "react-router-dom";
import catalog from "../data/CatalogData1.json";
import "../CSS/ProductPage.css";

const ProductPage = () => {
  const { id } = useParams();
  const product = catalog.find((item) => item.id === parseInt(id));

  if (!product) return <h2>Product Not Found</h2>;

  return (
    <div className="product-page">
        <div className="product-left">
        <img src={product.image} alt={product.name} />
        </div>

        <div className="product-right">
        <h2>{product.name}</h2>
        <p className="product-price">Rs.{product.price}</p>
        <p className="product-description">{product.description}</p>
        </div>
    </div>
);

};

export default ProductPage;
