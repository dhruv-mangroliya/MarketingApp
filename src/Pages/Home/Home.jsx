import Banner from "../../../public/assets/MainBanner.webp"
import ProductCatalog from '../../components/product/ProductCatalog/ProductCatalog'
import ReviewSlider from '../../components/product/ReviewSlider/ReviewSlider'
import data1 from '../../data/CatalogData1.json'
import "./Home.css"
import BestSellers from '../../components/product/BestSellers/BestSellers'

const Home = () => {
  return (
    <div>
      <img className="main-banner" src={Banner} alt="Home" />
      <div className="best-seller-title">
        <span>Best Sellers</span>
      </div> 

      <BestSellers data={data1}/>
      <ReviewSlider/>
      <ProductCatalog data={data1}/>
    </div>
  )
}

export default Home