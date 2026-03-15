import { Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from "./components/layout/Layout";
import Home from "./pages/Home/Home";
import ProductPage from "./pages/ProductPage/ProductPage";
import AboutUs from "./pages/AboutUs/AboutUs";
import ContactUs from "./pages/ContactUs/ContactUs";
import ShippingPolicy from "./pages/ShippingPolicy/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions/TermsConditions";
import ReturnExchange from "./pages/ReturnExchange/ReturnExchange";
import Blog from "./pages/Blog/Blog";
import BlogPost from "./pages/Blog/BlogPost";
import AdminManagement from "./pages/AdminManagement/AdminManagement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/common/ScrollToTop";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'PASTE_YOUR_ACTUAL_CLIENT_ID_HERE') {
    console.error('VITE_GOOGLE_CLIENT_ID is not properly configured');
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#242f66' }}>
        <h2>⚠️ Configuration Required</h2>
        <p>Please configure your Google Client ID in the .env file</p>
        <ol style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
          <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
          <li>Create OAuth 2.0 Client ID</li>
          <li>Copy the Client ID to frontend/.env file</li>
          <li>Restart the development server</li>
        </ol>
      </div>
    );
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/admin" element={<AdminManagement />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/return-exchange" element={<ReturnExchange />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Route>
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
