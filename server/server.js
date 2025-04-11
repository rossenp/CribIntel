const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Track last served tips to avoid repetition
const recentlyServedTips = new Set();
const MAX_RECENT_TIPS = 5; // Don't repeat the last 5 tips

// Load tips from JSON files
let tips = [];
let tipsEs = [];

// Define multiple possible paths for the tip files to handle different environments
const possibleTipsPaths = [
  path.join(__dirname, 'tips.json'),                   // Standard path
  path.join(__dirname, '../tips.json'),                // One level up
  path.join(__dirname, '../../tips.json'),             // Two levels up
  '/var/www/cribintel/server/tips.json',               // Common production path
  '/home/ubuntu/cribintel/server/tips.json'            // Another common production path
];

const possibleTipsEsPaths = [
  path.join(__dirname, 'tips_es.json'),                // Standard path
  path.join(__dirname, '../tips_es.json'),             // One level up
  path.join(__dirname, '../../tips_es.json'),          // Two levels up
  '/var/www/cribintel/server/tips_es.json',            // Common production path
  '/home/ubuntu/cribintel/server/tips_es.json'         // Another common production path
];

// Function to try loading tips from multiple possible paths
function loadTipsFromPaths(pathsArray, description) {
  for (const filePath of pathsArray) {
    try {
      console.log(`Attempting to load ${description} from: ${filePath}`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        console.log(`Successfully loaded ${parsedData.length} ${description} from ${filePath}`);
        return parsedData;
      }
    } catch (error) {
      console.error(`Error loading ${description} from ${filePath}:`, error.message);
    }
  }
  console.error(`Failed to load ${description} from any of the possible paths`);
  return [];
}

// Load tips
tips = loadTipsFromPaths(possibleTipsPaths, 'English tips');
tipsEs = loadTipsFromPaths(possibleTipsEsPaths, 'Spanish tips');

// If no tips were loaded, provide fallback tips
if (tips.length === 0) {
  console.warn('Using fallback English tips');
  tips = [
    { 
      id: 999, 
      tip: "Always trust your parenting instincts - you know your child best.",
      category: "parenting",
      tags: ["confidence", "instinct"],
      author: "CribIntel Team",
      likes: 0,
      createdAt: "2025-01-01",
      ageRange: '0-3'
    }
  ];
}

if (tipsEs.length === 0) {
  console.warn('Using fallback Spanish tips');
  tipsEs = [
    { 
      id: 999, 
      tip: "Siempre confía en tus instintos de crianza - tú conoces mejor a tu hijo.",
      category: "crianza",
      tags: ["confianza", "instinto"],
      author: "Equipo CribIntel",
      likes: 0,
      createdAt: "2025-01-01",
      ageRange: '0-3'
    }
  ];
}

// Create a mapping between English and Spanish tip IDs
const tipLanguageMap = new Map();
tips.forEach(tip => {
  const matchingSpanishTip = tipsEs.find(spanishTip => spanishTip.id === tip.id);
  if (matchingSpanishTip) {
    tipLanguageMap.set(tip.id, matchingSpanishTip.id);
  }
});

console.log(`Created language mapping for ${tipLanguageMap.size} tips`);

// API endpoint to get a random tip with optional age range filter and language
app.get('/api/tip', (req, res) => {
  try {
    // Get language preference, default to English
    const language = req.query.language || 'en';
    console.log(`Received request for tip in language: ${language}`);
    
    // Debug information about available tips
    console.log(`Available English tips: ${tips.length}`);
    console.log(`Available Spanish tips: ${tipsEs.length}`);
    
    const tipsSource = language === 'es' ? tipsEs : tips;
    console.log(`Using tips source with ${tipsSource.length} tips`);
    
    // Check if a specific tip ID is requested (for language switching)
    const tipId = req.query.tipId ? parseInt(req.query.tipId) : null;
    console.log(`Requested tip ID: ${tipId}`);
    
    if (tipsSource.length === 0) {
      console.error(`No tips available for language: ${language}`);
      return res.status(404).json({ 
        error: 'No tips available',
        message: language === 'es' 
          ? 'No pudimos encontrar consejos de crianza en este momento.' 
          : 'We could not find any parenting tips at this time.'
      });
    }

    let randomTip;
    
    // If a specific tip ID is requested, find that tip in the requested language
    if (tipId !== null) {
      console.log(`Looking for specific tip ID: ${tipId} in ${language}`);
      
      // IMPORTANT: For Spanish, we need to handle this differently
      if (language === 'es') {
        // First try to find the exact tip ID
        randomTip = tipsEs.find(tip => tip.id === tipId);
        console.log(`Direct match for Spanish tip ID ${tipId}: ${randomTip ? 'Found' : 'Not found'}`);
        
        // If not found, check if there's a mapping for this tip ID
        if (!randomTip && tipLanguageMap.has(tipId)) {
          const mappedId = tipLanguageMap.get(tipId);
          randomTip = tipsEs.find(tip => tip.id === mappedId);
          console.log(`Using mapped Spanish tip ID ${mappedId} for English tip ID ${tipId}: ${randomTip ? 'Found' : 'Not found'}`);
        }
        
        // If still not found, just use the first Spanish tip as a fallback
        if (!randomTip && tipsEs.length > 0) {
          randomTip = tipsEs[0];
          console.log(`Using fallback Spanish tip ID ${randomTip.id} since requested tip was not found`);
        }
      } else {
        randomTip = tips.find(tip => tip.id === tipId);
        console.log(`Direct match for English tip ID ${tipId}: ${randomTip ? 'Found' : 'Not found'}`);
      }
      
      // If the tip with the requested ID doesn't exist in this language, get a random one
      if (!randomTip) {
        const randomIndex = Math.floor(Math.random() * tipsSource.length);
        randomTip = tipsSource[randomIndex];
        console.log(`Requested tip #${tipId} not found in ${language}, serving random tip #${randomTip.id}`);
      } else {
        console.log(`Serving ${language} tip #${randomTip.id} as requested`);
      }
    } else {
      // Filter by age range if provided
      const ageRange = req.query.ageRange;
      let filteredTips = tipsSource;
      
      if (ageRange && ['0-1', '1-2', '2-3'].includes(ageRange)) {
        filteredTips = tipsSource.filter(tip => 
          tip.ageRange === ageRange || tip.ageRange === '0-3'
        );
        
        if (filteredTips.length === 0) {
          return res.status(404).json({ 
            error: 'No tips available for this age range',
            message: language === 'es'
              ? `No pudimos encontrar consejos de crianza para el rango de edad ${ageRange}.`
              : `We could not find any parenting tips for age range ${ageRange}.`
          });
        }
      }

      // Get available tips (excluding recently served ones)
      const availableTips = filteredTips.filter(tip => !recentlyServedTips.has(tip.id));
      
      // If all tips have been recently served, reset and use all filtered tips
      const tipsToChooseFrom = availableTips.length > 0 ? availableTips : filteredTips;
      
      // Select a random tip
      const randomIndex = Math.floor(Math.random() * tipsToChooseFrom.length);
      randomTip = tipsToChooseFrom[randomIndex];
      
      // Add to recently served set
      recentlyServedTips.add(randomTip.id);
      
      // If we've reached our max recent tips, remove the oldest one
      if (recentlyServedTips.size > MAX_RECENT_TIPS) {
        const oldestTip = recentlyServedTips.values().next().value;
        recentlyServedTips.delete(oldestTip);
      }
      
      console.log(`Serving random ${language} tip #${randomTip.id}`);
    }
    
    // Add timestamp and language to track when tip was served
    const tipWithTimestamp = {
      ...randomTip,
      servedAt: new Date().toISOString(),
      language: language
    };
    
    // Log the tip being served to help with debugging
    console.log(`Serving ${language} tip #${randomTip.id}: ${randomTip.tip.substring(0, 30)}...`);
    
    res.json(tipWithTimestamp);
  } catch (error) {
    console.error('Error serving tip:', error);
    const language = req.query.language || 'en';
    res.status(500).json({ 
      error: 'Server error',
      message: language === 'es'
        ? 'Algo salió mal al obtener tu consejo de crianza. Por favor, inténtalo de nuevo.'
        : 'Something went wrong while fetching your parenting tip. Please try again.'
    });
  }
});

// API endpoint to get tips by category
app.get('/api/tips/category/:category', (req, res) => {
  try {
    const language = req.query.language || 'en';
    const tipsSource = language === 'es' ? tipsEs : tips;
    
    const category = req.params.category.toLowerCase();
    const categoryTips = tipsSource.filter(tip => tip.category.toLowerCase() === category);
    
    if (categoryTips.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: language === 'es'
          ? `No se encontraron consejos en la categoría ${category}.`
          : `No tips found in the ${category} category.`
      });
    }
    
    res.json(categoryTips);
  } catch (error) {
    console.error('Error fetching category tips:', error);
    const language = req.query.language || 'en';
    res.status(500).json({ 
      error: 'Server error',
      message: language === 'es'
        ? 'Algo salió mal al obtener los consejos por categoría. Por favor, inténtalo de nuevo.'
        : 'Something went wrong while fetching category tips. Please try again.'
    });
  }
});

// API endpoint to get tips by tag
app.get('/api/tips/tag/:tag', (req, res) => {
  try {
    const language = req.query.language || 'en';
    const tipsSource = language === 'es' ? tipsEs : tips;
    
    const tag = req.params.tag.toLowerCase();
    const tagTips = tipsSource.filter(tip => tip.tags.some(t => t.toLowerCase() === tag));
    
    if (tagTips.length === 0) {
      return res.status(404).json({ 
        error: 'Tag not found',
        message: language === 'es'
          ? `No se encontraron consejos con la etiqueta ${tag}.`
          : `No tips found with the tag ${tag}.`
      });
    }
    
    res.json(tagTips);
  } catch (error) {
    console.error('Error fetching tag tips:', error);
    const language = req.query.language || 'en';
    res.status(500).json({ 
      error: 'Server error',
      message: language === 'es'
        ? 'Algo salió mal al obtener los consejos por etiqueta. Por favor, inténtalo de nuevo.'
        : 'Something went wrong while fetching tag tips. Please try again.'
    });
  }
});

// API endpoint to get tips by age range
app.get('/api/tips/age/:ageRange', (req, res) => {
  try {
    const language = req.query.language || 'en';
    const tipsSource = language === 'es' ? tipsEs : tips;
    
    const ageRange = req.params.ageRange;
    
    if (!['0-1', '1-2', '2-3'].includes(ageRange)) {
      return res.status(400).json({ 
        error: 'Invalid age range',
        message: language === 'es'
          ? 'El rango de edad debe ser uno de: 0-1, 1-2, 2-3'
          : 'Age range must be one of: 0-1, 1-2, 2-3'
      });
    }
    
    const ageTips = tipsSource.filter(tip => 
      tip.ageRange === ageRange || tip.ageRange === '0-3'
    );
    
    if (ageTips.length === 0) {
      return res.status(404).json({ 
        error: 'Age range not found',
        message: language === 'es'
          ? `No se encontraron consejos para el rango de edad ${ageRange}.`
          : `No tips found for the age range ${ageRange}.`
      });
    }
    
    res.json(ageTips);
  } catch (error) {
    console.error('Error fetching age range tips:', error);
    const language = req.query.language || 'en';
    res.status(500).json({ 
      error: 'Server error',
      message: language === 'es'
        ? 'Algo salió mal al obtener los consejos por rango de edad. Por favor, inténtalo de nuevo.'
        : 'Something went wrong while fetching age range tips. Please try again.'
    });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
