import { useState, useEffect } from 'react'
import Banner from "../../../public/assets/MainBanner.webp"
import ProductCatalog from '../../components/product/ProductCatalog/ProductCatalog'
import ReviewSlider from '../../components/product/ReviewSlider/ReviewSlider'
import "./Home.css"
import BestSellers from '../../components/product/BestSellers/BestSellers'
import { getProducts } from '../../utils/api'

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        console.log(data);
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>;
  if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>Error: {error}</div>;

  return (
    <div>
      <img className="main-banner" src={Banner} alt="Home" />
      <div className="best-seller-title">
        <span>Best Sellers</span>
      </div> 

      <BestSellers data={products}/>
      <ReviewSlider/>
      <ProductCatalog data={products}/>
    </div>
  )
}

export default Home