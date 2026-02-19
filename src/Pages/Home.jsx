import Banner from "../../public/assets/MainBanner.webp"
import ProductCatalog from '../Components/ProductCatalog'
import ReviewSlider from '../Components/ReviewSlider'
import data1 from '../Data/CatalogData1.json'
import "../CSS/Home.css"
import BestSellers from '../Components/BestSellers'

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