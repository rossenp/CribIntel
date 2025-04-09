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

// Load tips from JSON file
const tipsPath = path.join(__dirname, 'tips.json');
let tips = [];

try {
  const tipsData = fs.readFileSync(tipsPath, 'utf8');
  tips = JSON.parse(tipsData);
  console.log(`Successfully loaded ${tips.length} tips`);
} catch (error) {
  console.error('Error loading tips:', error);
  // Provide fallback tips in case the file can't be loaded
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

// API endpoint to get a random tip with optional age range filter
app.get('/api/tip', (req, res) => {
  try {
    if (tips.length === 0) {
      return res.status(404).json({ 
        error: 'No tips available',
        message: 'We could not find any parenting tips at this time.'
      });
    }

    // Filter by age range if provided
    const ageRange = req.query.ageRange;
    let filteredTips = tips;
    
    if (ageRange && ['0-1', '1-2', '2-3'].includes(ageRange)) {
      filteredTips = tips.filter(tip => 
        tip.ageRange === ageRange || tip.ageRange === '0-3'
      );
      
      if (filteredTips.length === 0) {
        return res.status(404).json({ 
          error: 'No tips available for this age range',
          message: `We could not find any parenting tips for age range ${ageRange}.`
        });
      }
    }

    // Get available tips (excluding recently served ones)
    const availableTips = filteredTips.filter(tip => !recentlyServedTips.has(tip.id));
    
    // If all tips have been recently served, reset and use all filtered tips
    const tipsToChooseFrom = availableTips.length > 0 ? availableTips : filteredTips;
    
    // Select a random tip
    const randomIndex = Math.floor(Math.random() * tipsToChooseFrom.length);
    const randomTip = tipsToChooseFrom[randomIndex];
    
    // Add to recently served set
    recentlyServedTips.add(randomTip.id);
    
    // If we've reached our max recent tips, remove the oldest one
    if (recentlyServedTips.size > MAX_RECENT_TIPS) {
      const oldestTip = recentlyServedTips.values().next().value;
      recentlyServedTips.delete(oldestTip);
    }
    
    // Add timestamp to track when tip was served
    const tipWithTimestamp = {
      ...randomTip,
      servedAt: new Date().toISOString()
    };
    
    res.json(tipWithTimestamp);
  } catch (error) {
    console.error('Error serving tip:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Something went wrong while fetching your parenting tip. Please try again.'
    });
  }
});

// API endpoint to get tips by category
app.get('/api/tips/category/:category', (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const categoryTips = tips.filter(tip => tip.category.toLowerCase() === category);
    
    if (categoryTips.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: `No tips found in the ${category} category.`
      });
    }
    
    res.json(categoryTips);
  } catch (error) {
    console.error('Error fetching category tips:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Something went wrong while fetching category tips. Please try again.'
    });
  }
});

// API endpoint to get tips by tag
app.get('/api/tips/tag/:tag', (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const tagTips = tips.filter(tip => tip.tags.some(t => t.toLowerCase() === tag));
    
    if (tagTips.length === 0) {
      return res.status(404).json({ 
        error: 'Tag not found',
        message: `No tips found with the tag ${tag}.`
      });
    }
    
    res.json(tagTips);
  } catch (error) {
    console.error('Error fetching tag tips:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Something went wrong while fetching tag tips. Please try again.'
    });
  }
});

// API endpoint to get tips by age range
app.get('/api/tips/age/:ageRange', (req, res) => {
  try {
    const ageRange = req.params.ageRange;
    
    if (!['0-1', '1-2', '2-3'].includes(ageRange)) {
      return res.status(400).json({ 
        error: 'Invalid age range',
        message: 'Age range must be one of: 0-1, 1-2, 2-3'
      });
    }
    
    const ageTips = tips.filter(tip => 
      tip.ageRange === ageRange || tip.ageRange === '0-3'
    );
    
    if (ageTips.length === 0) {
      return res.status(404).json({ 
        error: 'Age range not found',
        message: `No tips found for the age range ${ageRange}.`
      });
    }
    
    res.json(ageTips);
  } catch (error) {
    console.error('Error fetching age range tips:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Something went wrong while fetching age range tips. Please try again.'
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
