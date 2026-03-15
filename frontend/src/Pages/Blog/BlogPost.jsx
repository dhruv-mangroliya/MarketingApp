import { useParams, useNavigate } from 'react-router-dom';
import './BlogPost.css';

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const blog = blogData.find(b => b.id === parseInt(id));

  if (!blog) {
    return (
      <div className="blog-post-page">
        <h1>Blog post not found</h1>
        <button onClick={() => navigate('/blog')} className="back-btn">← Back to Blog</button>
      </div>
    );
  }

  const renderContent = (item, index) => {
    switch (item.type) {
      case 'heading':
        return <h2 key={index}>{item.text}</h2>;
      case 'subheading':
        return <h3 key={index}>{item.text}</h3>;
      case 'paragraph':
        return <p key={index}>{item.text}</p>;
      case 'list':
        return (
          <ul key={index}>
            {item.items.map((listItem, i) => (
              <li key={i}>{listItem}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="blog-post-page">
      <button onClick={() => navigate('/blog')} className="back-btn">← Back to Blog</button>
      
      <article className="blog-post">
        <img src={blog.image} alt={blog.title} className="blog-post-image" loading="lazy" />
        <h1>{blog.title}</h1>
        
        <div className="blog-content">
          {blog.content.map((item, index) => renderContent(item, index))}
        </div>
      </article>
    </div>
  );
};

export default BlogPost;