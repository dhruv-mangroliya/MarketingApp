import React, { useState } from "react";
import reviews from "../../../data/ReviewsData.json";
import "./ReviewSlider.css";

const ReviewSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

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
