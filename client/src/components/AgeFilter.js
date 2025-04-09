import React from 'react';

const AgeFilter = ({ selectedAge, onAgeChange }) => {
  const ageRanges = [
    { value: '', label: 'All Ages' },
    { value: '0-1', label: '0-1 Years' },
    { value: '1-2', label: '1-2 Years' },
    { value: '2-3', label: '2-3 Years' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-3">
      <span className="text-sm font-medium text-gray-600">Filter by age:</span>
      <div className="flex space-x-2">
        {ageRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => onAgeChange(range.value)}
            className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
              selectedAge === range.value
                ? 'bg-baby-blue text-white font-medium shadow-md'
                : 'bg-white text-gray-600 hover:bg-baby-blue/20'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AgeFilter;
