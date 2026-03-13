import { useNavigate } from 'react-router-dom';
import blogData from '../../Data/BlogData.json';
import './Blog.css';

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="blog-page">
      <h1>Our Blog</h1>
      <p className="blog-subtitle">Fashion tips, care guides, and more</p>
      
      <div className="blog-grid">
        {blogData.map((blog) => (
          <div key={blog.id} className="blog-card" onClick={() => navigate(`/blog/${blog.id}`)}>
            <img src={blog.image} alt={blog.title} loading="lazy" />
            <div className="blog-card-content">
              <h2>{blog.title}</h2>
              <p>{blog.excerpt}</p>
              <button className="read-more-btn">Read More →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;