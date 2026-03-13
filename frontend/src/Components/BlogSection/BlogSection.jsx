import { useNavigate } from 'react-router-dom';
import blogData from '../../Data/BlogData.json';
import './BlogSection.css';

const BlogSection = () => {
  const navigate = useNavigate();
  const featuredBlogs = blogData.slice(0, 3); // Show first 3 blogs

  return (
    <section className="blog-section">
      <div className="blog-section-header">
        <h2>Latest from Our Blog</h2>
        <p>Fashion tips, care guides, and styling advice</p>
      </div>
      
      <div className="blog-cards">
        {featuredBlogs.map((blog) => (
          <div key={blog.id} className="blog-preview-card" onClick={() => navigate(`/blog/${blog.id}`)}>
            <img src={blog.image} alt={blog.title} loading="lazy" />
            <div className="blog-preview-content">
              <h3>{blog.title}</h3>
              <p>{blog.excerpt}</p>
              <span className="read-more">Read More →</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="blog-section-footer">
        <button className="view-all-btn" onClick={() => navigate('/blog')}>
          View All Articles
        </button>
      </div>
    </section>
  );
};

export default BlogSection;