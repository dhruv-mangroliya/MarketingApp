import { useState, useEffect } from 'react'
import ProductCatalog from '../../components/product/ProductCatalog/ProductCatalog'
import ReviewSlider from '../../components/product/ReviewSlider/ReviewSlider'
import { lazy, Suspense } from 'react'
import "./Home.css"
import BestSellers from '../../components/product/BestSellers/BestSellers'
import { getProducts } from '../../utils/api'

// Lazy load BlogSection
const BlogSection = lazy(() => import('../../components/BlogSection/BlogSection'))

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
      <img className="main-banner" src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/ChatGPT+Image+Mar+31%2C+2026%2C+12_24_22+AM.png" alt="Home" loading="lazy" />
      
      <div className="best-seller-title" id="best-sellers">
        <span>Best Sellers</span>
      </div> 

      <BestSellers data={products}/>
      <div id="reviews">
        <ReviewSlider/>
      </div>
      <div id="catalog">
        <ProductCatalog data={products}/>
      </div>
      <Suspense fallback={<div style={{textAlign: 'center', padding: '50px'}}>Loading blog...</div>}>
        <BlogSection/>
      </Suspense>
    </div>
  )
}

export default Home