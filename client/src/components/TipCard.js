import React, { useState, useEffect } from 'react';

const TipCard = ({ tip, onRefresh, isRefreshing, previousTipIds }) => {
  const [animateIn, setAnimateIn] = useState(false);
  
  useEffect(() => {
    if (tip && !isRefreshing) {
      // Trigger animation when a new tip is loaded
      setAnimateIn(false); // First set to false to reset
      
      // Use a small timeout to ensure the browser registers the change
      const resetTimeout = setTimeout(() => {
        setAnimateIn(true); // Then animate in
      }, 50);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [tip, isRefreshing]);

  if (!tip) return null;

  const categoryColors = {
    development: 'bg-baby-blue/20 border-baby-blue',
    health: 'bg-pastel-green/20 border-pastel-green',
    emotional: 'bg-soft-pink/20 border-soft-pink',
    sleep: 'bg-warm-yellow/20 border-warm-yellow',
    nutrition: 'bg-pastel-green/20 border-pastel-green',
    safety: 'bg-baby-blue/20 border-baby-blue',
    play: 'bg-warm-yellow/20 border-warm-yellow',
    parenting: 'bg-soft-pink/20 border-soft-pink',
    'self-care': 'bg-baby-blue/20 border-baby-blue',
  };

  const getAgeRangeText = (ageRange) => {
    if (ageRange === '0-3') return 'All Ages (0-3)';
    return `Age ${ageRange} Years`;
  };

  const cardClass = `tip-card ${categoryColors[tip.category] || 'bg-white border-gray-200'} ${
    animateIn ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
  }`;

  return (
    <div 
      className={cardClass}
      style={{ transition: 'transform 0.5s ease-out, opacity 0.5s ease-out' }}
    >
      <div className="mb-6 flex flex-wrap justify-between items-center gap-2">
        <div className="flex gap-2">
          <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-white shadow-sm">
            {tip.category}
          </span>
          <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-white/80 text-gray-700 shadow-sm">
            {getAgeRangeText(tip.ageRange)}
          </span>
        </div>
        
        {tip.tags && tip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tip.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs px-2 py-1 bg-white/50 rounded-full">
                #{tag}
              </span>
            ))}
            {tip.tags.length > 2 && (
              <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                +{tip.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      <p className="text-xl font-medium mb-6">{tip.tip}</p>
      
      <div className="flex justify-between items-center">
        {tip.author && (
          <span className="text-sm text-gray-600">By {tip.author}</span>
        )}
        
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-full text-white font-medium transition-all ${
            isRefreshing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-baby-blue hover:bg-baby-blue/80 hover:shadow-md'
          }`}
          aria-label="Get another tip"
        >
          {isRefreshing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            'Next Tip'
          )}
        </button>
      </div>
    </div>
  );
};

export default TipCard;
