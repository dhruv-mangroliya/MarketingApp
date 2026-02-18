import React from 'react'
import { Outlet } from 'react-router-dom'
import NavbarHeader from './NavbarHeader'
import Navbar from './Navbar'
import CollectionBar from './CollectionBar'

const Layout = () => {
  return (
    <>
    <NavbarHeader/>
    <Navbar/>
    <CollectionBar/>
    <Outlet/>
    </>
  )
}

export default Layout