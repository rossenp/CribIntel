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
  const MAX_RETRY_ATTEMPTS = 3;

  // Create axios instance with timeout
  const api = axios.create({
    timeout: 10000, // 10 seconds timeout
    baseURL: process.env.REACT_APP_API_URL || '',
  });

  const fetchTip = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setIsRefreshing(true);
      }
      
      // Add age range filter if selected
      const params = selectedAge ? { ageRange: selectedAge } : {};
      const response = await api.get('/api/tip', { params });
      
      // Check if we have a valid tip
      if (response.data && response.data.tip) {
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
          setError(`Having trouble connecting. Retry attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}...`);
        }
      } else {
        // Max retries reached, show error
        setError(
          err.response?.data?.message || 
          'Failed to fetch tip. Please try again later or check your internet connection.'
        );
      }
    } finally {
      setLoading(false);
      if (!isRetry) {
        setIsRefreshing(false);
      }
    }
  }, [retryCount, api, selectedAge]);

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

  const handleRefresh = () => {
    setRetryCount(0); // Reset retry count on manual refresh
    fetchTip();
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    fetchTip();
  };

  const handleAgeChange = (ageRange) => {
    setSelectedAge(ageRange);
    // The useEffect will trigger a new tip fetch
  };

  return (
    <>
      <Helmet>
        <title>CribIntel - Parenting Tips for Ages 0-3</title>
        <meta name="description" content="Get helpful, daily parenting tips for children aged 0-3 years. Simple, practical advice for new parents." />
        <meta name="keywords" content="parenting tips, baby advice, toddler tips, child development, new parents" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cribintel.com/" />
        <meta property="og:title" content="CribIntel - Smart Parenting Tips" />
        <meta property="og:description" content="Daily parenting wisdom for children aged 0-3 years." />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CribIntel - Smart Parenting Tips" />
        <meta name="twitter:description" content="Daily parenting wisdom for children aged 0-3 years." />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-baby-blue/30 to-soft-pink/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Header />
          
          <main className="mt-8">
            <AgeFilter 
              selectedAge={selectedAge} 
              onAgeChange={handleAgeChange} 
            />
            
            {loading && !isRefreshing ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-bounce text-3xl">🍼</div>
              </div>
            ) : error ? (
              <ErrorMessage 
                message={error} 
                onRetry={handleRetry} 
              />
            ) : (
              <TipCard 
                tip={tip} 
                onRefresh={handleRefresh} 
                isRefreshing={isRefreshing} 
                previousTipIds={previousTipIds}
              />
            )}
          </main>

          <footer className="mt-12 text-center text-gray-500">
            <p className="text-sm">&copy; {new Date().getFullYear()} CribIntel - Parenting Tips for Ages 0-3</p>
            <p className="text-xs mt-2 max-w-2xl mx-auto">
              <span className="text-gray-400">
                DISCLAIMER: The parenting tips provided by CribIntel are for informational purposes only and are not intended as medical advice, diagnosis, or treatment. Always seek the advice of your physician, pediatrician, or other qualified health provider with any questions you may have regarding your child's health or well-being. CribIntel and its creators are not liable for any actions taken based on the information provided. Use of this application constitutes acceptance of these terms.
              </span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
