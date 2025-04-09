import React from 'react';

const Header = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center">
        <span className="text-4xl mr-2">👶</span>
        <h1 className="text-4xl md:text-5xl font-playful font-bold bg-gradient-to-r from-baby-blue to-soft-pink bg-clip-text text-transparent">
          CribIntel
        </h1>
        <span className="text-4xl ml-2">🧸</span>
      </div>
      <p className="mt-3 text-lg text-gray-600 font-rounded">
        Smart parenting tips for little ones (0-3 years)
      </p>
    </header>
  );
};

export default Header;
