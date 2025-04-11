import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import TipCard from './components/TipCard';
import Header from './components/Header';
import ErrorMessage from './components/ErrorMessage';
import AgeFilter from './components/AgeFilter';

function App() {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [previousTipIds, setPreviousTipIds] = useState([]);
  const [selectedAge, setSelectedAge] = useState('');
  const [language, setLanguage] = useState('en'); // Default to English
  const MAX_RETRY_ATTEMPTS = 3;

  // Create axios instance with timeout
  const api = axios.create({
    timeout: 10000, // 10 seconds timeout
    baseURL: process.env.REACT_APP_API_URL || '',
  });

  const fetchTip = useCallback(async (isRetry = false, preserveTipId = false) => {
    try {
      if (!isRetry) {
        setIsRefreshing(true);
      }
      
      // Add age range filter and language parameter
      const params = {
        ...(selectedAge ? { ageRange: selectedAge } : {}),
        language: language
      };
      
      // If preserving the current tip when switching languages, pass the tip ID
      if (preserveTipId && tip && tip.id) {
        params.tipId = tip.id;
        console.log(`Preserving tip ID ${tip.id} when switching to ${language}`);
      }
      
      console.log(`Fetching tip with language: ${language}`);
      const response = await api.get('/api/tip', { params });
      
      // Check if we have a valid tip
      if (response.data && response.data.tip) {
        console.log(`Received tip: ${response.data.tip.substring(0, 30)}...`);
        console.log(`Tip language: ${response.data.language}, Category: ${response.data.category}`);
        setTip(response.data);
        
        // Track this tip ID to avoid immediate repetition
        setPreviousTipIds(prev => {
          const newIds = [...prev, response.data.id];
          // Keep only the last 5 tip IDs
          return newIds.length > 5 ? newIds.slice(newIds.length - 5) : newIds;
        });
        
        setError(null);
        setRetryCount(0);
      } else {
        throw new Error('Invalid tip data received');
      }
    } catch (err) {
      console.error('Error fetching tip:', err);
      
      // Implement retry logic
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        
        setTimeout(() => {
          fetchTip(true);
        }, backoffTime);
        
        // Only show error if we've tried multiple times
        if (retryCount >= 1) {
          setError(
            language === 'es'
              ? `Teniendo problemas para conectar. Intento ${retryCount}/${MAX_RETRY_ATTEMPTS}...`
              : `Having trouble connecting. Retry attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}...`
          );
        }
      } else {
        // Max retries reached, show error
        setError(
          err.response?.data?.message || 
          (language === 'es'
            ? 'No se pudo obtener el consejo. Por favor, inténtalo de nuevo más tarde o verifica tu conexión a internet.'
            : 'Failed to fetch tip. Please try again later or check your internet connection.')
        );
      }
    } finally {
      setLoading(false);
      if (!isRetry) {
        setIsRefreshing(false);
      }
    }
  }, [retryCount, api, selectedAge, language, tip]);

  useEffect(() => {
    fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch a new tip when age filter changes
  useEffect(() => {
    if (!loading) {
      fetchTip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAge]);
  
  // Preserve the current tip when language changes
  useEffect(() => {
    if (!loading && tip) {
      console.log(`Language changed to: ${language}. Current tip ID: ${tip.id}, Category: ${tip.category}`);
      console.log(`Attempting to fetch the same tip in ${language} language...`);
      fetchTip(false, true); // Preserve tip ID when switching languages
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleRefresh = () => {
    setRetryCount(0); // Reset retry count on manual refresh
    console.log('Manual refresh requested');
    fetchTip();
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    console.log('Retry requested after error');
    fetchTip();
  };

  const handleAgeChange = (ageRange) => {
    console.log(`Age filter changed to: ${ageRange}`);
    setSelectedAge(ageRange);
    // The useEffect will trigger a new tip fetch
  };

  const handleLanguageChange = (newLanguage) => {
    console.log(`Language changing from ${language} to ${newLanguage}`);
    setLanguage(newLanguage);
    // The useEffect will trigger a new tip fetch
  };

  return (
    <>
      <Helmet>
        <title>{language === 'es' ? 'CribIntel - Consejos para Padres de 0-3 Años' : 'CribIntel - Parenting Tips for Ages 0-3'}</title>
        <meta 
          name="description" 
          content={language === 'es' 
            ? 'Obtén consejos diarios útiles para padres de niños de 0 a 3 años. Consejos simples y prácticos para nuevos padres.' 
            : 'Get helpful, daily parenting tips for children aged 0-3 years. Simple, practical advice for new parents.'} 
        />
        <meta 
          name="keywords" 
          content={language === 'es'
            ? 'consejos para padres, consejos para bebés, consejos para niños pequeños, desarrollo infantil, nuevos padres'
            : 'parenting tips, baby advice, toddler tips, child development, new parents'} 
        />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cribintel.com/" />
        <meta 
          property="og:title" 
          content={language === 'es' ? 'CribIntel - Consejos Inteligentes para Padres' : 'CribIntel - Smart Parenting Tips'} 
        />
        <meta 
          property="og:description" 
          content={language === 'es'
            ? 'Sabiduría diaria para padres de niños de 0 a 3 años.'
            : 'Daily parenting wisdom for children aged 0-3 years.'} 
        />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta 
          name="twitter:title" 
          content={language === 'es' ? 'CribIntel - Consejos Inteligentes para Padres' : 'CribIntel - Smart Parenting Tips'} 
        />
        <meta 
          name="twitter:description" 
          content={language === 'es'
            ? 'Sabiduría diaria para padres de niños de 0 a 3 años.'
            : 'Daily parenting wisdom for children aged 0-3 years.'} 
        />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-baby-blue/30 to-soft-pink/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Header 
            language={language} 
            onLanguageChange={handleLanguageChange} 
          />
          
          <main className="mt-8">
            <AgeFilter 
              selectedAge={selectedAge} 
              onAgeChange={handleAgeChange} 
              language={language}
            />
            
            {loading && !isRefreshing ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-bounce text-3xl">🍼</div>
              </div>
            ) : error ? (
              <ErrorMessage 
                message={error} 
                onRetry={handleRetry} 
                language={language}
              />
            ) : (
              <TipCard 
                tip={tip} 
                onRefresh={handleRefresh} 
                isRefreshing={isRefreshing} 
                previousTipIds={previousTipIds}
                language={language}
              />
            )}
          </main>

          <footer className="mt-12 text-center text-gray-500">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} CribIntel - 
              {language === 'es' 
                ? ' Consejos para Padres de Niños de 0-3 Años'
                : ' Parenting Tips for Ages 0-3'}
            </p>
            <p className="text-xs mt-2 max-w-2xl mx-auto">
              <span className="text-gray-400">
                {language === 'es' 
                  ? 'AVISO LEGAL: Los consejos para padres proporcionados por CribIntel son solo para fines informativos y no pretenden ser consejos médicos, diagnósticos o tratamientos. Siempre busque el consejo de su médico, pediatra u otro proveedor de salud calificado con cualquier pregunta que pueda tener sobre la salud o el bienestar de su hijo. CribIntel y sus creadores no son responsables de ninguna acción tomada en base a la información proporcionada. El uso de esta aplicación constituye la aceptación de estos términos.'
                  : 'DISCLAIMER: The parenting tips provided by CribIntel are for informational purposes only and are not intended as medical advice, diagnosis, or treatment. Always seek the advice of your physician, pediatrician, or other qualified health provider with any questions you may have regarding your child\'s health or well-being. CribIntel and its creators are not liable for any actions taken based on the information provided. Use of this application constitutes acceptance of these terms.'}
              </span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
