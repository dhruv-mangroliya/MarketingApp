import React, { useState, useEffect } from "react";
import "./ReviewSlider.css";
import { API_BASE } from '../../../utils/config';

const ReviewSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/reviews`);
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchReviews();
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? reviews.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === reviews.length - 1 ? 0 : prev + 1
    );
  };

  if (reviews.length === 0) {
    return <div style={{textAlign: 'center', padding: '50px'}}>Loading reviews...</div>;
  }

  return (
    <div className="review-slider">
      <button className="nav-btn left" onClick={handlePrev}>
        &#8249;
      </button>

      <div className="slider-window">
        <div
          className="slider-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {reviews.map((review) => (
            <div className="review-card" key={review.id}>
              <div className="stars">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
              <p>"{review.review}"</p>
              <h4>{review.name}</h4>
              <span>{review.location}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="nav-btn right" onClick={handleNext}>
        &#8250;
      </button>
    </div>
  );
};

export default ReviewSlider;
