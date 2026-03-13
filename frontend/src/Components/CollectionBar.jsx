import React from 'react'
import '../CSS/CollectionBar.css'
import { useNavigate } from 'react-router-dom'

const CollectionBar = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigation = (item) => {
    switch(item) {
      case 'Best Sellers':
        if (window.location.pathname === '/') {
          scrollToSection('best-sellers');
        } else {
          navigate('/');
          setTimeout(() => scrollToSection('best-sellers'), 100);
        }
        break;
      case 'Catalog':
        if (window.location.pathname === '/') {
          scrollToSection('catalog');
        } else {
          navigate('/');
          setTimeout(() => scrollToSection('catalog'), 100);
        }
        break;
      case 'Reviews':
        if (window.location.pathname === '/') {
          scrollToSection('reviews');
        } else {
          navigate('/');
          setTimeout(() => scrollToSection('reviews'), 100);
        }
        break;
      case 'Blog':
        navigate('/blog');
        break;
      default:
        break;
    }
  };

  return (
    <div className='collectionbar'>
        <nav className='collectionitem bg1' onClick={() => handleNavigation('Best Sellers')}>Best Sellers</nav>
        <nav className='collectionitem bg2' onClick={() => handleNavigation('Catalog')}>Catalog</nav>
        <nav className='collectionitem bg1' onClick={() => handleNavigation('Reviews')}>Reviews</nav>
        <nav className='collectionitem bg2' onClick={() => handleNavigation('Blog')}>Blog</nav>
    </div>
  )
}

export default CollectionBar