import React from 'react';

const Header = ({ language, onLanguageChange }) => {
  return (
    <header className="text-center relative">
      <div className="absolute right-0 top-0">
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
          className="px-3 py-1 rounded-full text-sm font-medium bg-white border border-baby-blue text-baby-blue hover:bg-baby-blue hover:text-white transition-colors shadow-sm"
        >
          {language === 'en' ? 'En Español' : 'In English'}
        </button>
      </div>
      <div className="flex items-center justify-center">
        <span className="text-4xl mr-2">👶</span>
        <h1 className="text-4xl md:text-5xl font-playful font-bold bg-gradient-to-r from-baby-blue to-soft-pink bg-clip-text text-transparent">
          CribIntel
        </h1>
        <span className="text-4xl ml-2">🧸</span>
      </div>
      <p className="mt-3 text-lg text-gray-600 font-rounded">
        {language === 'en' 
          ? 'Smart parenting tips for little ones (0-3 years)'
          : 'Consejos inteligentes para padres de pequeños (0-3 años)'}
      </p>
    </header>
  );
};

export default Header;
