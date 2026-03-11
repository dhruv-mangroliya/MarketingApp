import React from 'react'
import { Outlet } from 'react-router-dom'
import NavbarHeader from './Navbar/NavbarHeader'
import Navbar from './Navbar/Navbar'
import CollectionBar from '../CollectionBar'
import Footer from './Footer/Footer'

const Layout = () => {
  return (
    <>
    <NavbarHeader/>
    <Navbar/>
    <CollectionBar/>
    <Outlet/>
    <Footer />
    </>
  )
}

export default Layout