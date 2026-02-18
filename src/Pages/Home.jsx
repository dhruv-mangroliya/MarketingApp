import React from 'react'
import Banner from "../../public/assets/MainBanner.webp"
import ProductCatalog from '../Components/ProductCatalog'

const Home = () => {
  return (
    <div>
      <img className="main-banner" src={Banner} alt="Home" />
      <ProductCatalog/>
      
    </div>
  )
}

export default Home