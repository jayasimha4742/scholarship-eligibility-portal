/**
 * Backend Server - Scholarship Eligibility Portal
 * Node.js & Express.js REST API
 * 
 * College Academic Project
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const eligibilityService = require('./services/eligibility.service');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// Helper function to load scholarships JSON safely
function loadScholarshipsData() {
  const filePath = path.join(__dirname, 'scholarships.json');
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading scholarships.json:', error.message);
    return [];
  }
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Scholarship Eligibility Portal API',
    totalRecords: loadScholarshipsData().length
  });
});

// GET /api/categories - Returns distinct filters (states, education levels, categories)
app.get('/api/categories', (req, res) => {
  try {
    const scholarships = loadScholarshipsData();

    const categoriesSet = new Set();
    const educationLevelsSet = new Set();
    const statesSet = new Set();
    const providersSet = new Set();

    scholarships.forEach((s) => {
      if (s.category) categoriesSet.add(s.category);
      if (s.provider) providersSet.add(s.provider);
      (s.educationLevels || []).forEach((l) => educationLevelsSet.add(l));
      (s.eligibleStates || []).forEach((st) => statesSet.add(st));
    });

    res.json({
      success: true,
      data: {
        categories: Array.from(categoriesSet),
        educationLevels: Array.from(educationLevelsSet),
        states: Array.from(statesSet),
        providers: Array.from(providersSet)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: err.message });
  }
});

// GET /api/scholarships/search - Search and filter scholarships
// Query params: state, educationLevel, category, provider, q (general keyword search)
app.get('/api/scholarships/search', (req, res) => {
  try {
    let scholarships = loadScholarshipsData();
    const { state, educationLevel, category, provider, q } = req.query;

    if (state && state.trim()) {
      const sLower = state.trim().toLowerCase();
      scholarships = scholarships.filter((item) => {
        const states = (item.eligibleStates || []).map((s) => s.toLowerCase());
        return states.includes('all india') || states.includes('all') || states.some((s) => s.includes(sLower) || sLower.includes(s));
      });
    }

    if (educationLevel && educationLevel.trim()) {
      const eLower = educationLevel.trim().toLowerCase();
      scholarships = scholarships.filter((item) => {
        const levels = (item.educationLevels || []).map((l) => l.toLowerCase());
        return levels.includes('all') || levels.some((l) => l.includes(eLower) || eLower.includes(l));
      });
    }

    if (category && category.trim()) {
      const cLower = category.trim().toLowerCase();
      scholarships = scholarships.filter((item) => (item.category || '').toLowerCase() === cLower);
    }

    if (provider && provider.trim()) {
      const pLower = provider.trim().toLowerCase();
      scholarships = scholarships.filter((item) => (item.provider || '').toLowerCase().includes(pLower));
    }

    if (q && q.trim()) {
      const keyword = q.trim().toLowerCase();
      scholarships = scholarships.filter((item) => {
        return (
          (item.name || '').toLowerCase().includes(keyword) ||
          (item.description || '').toLowerCase().includes(keyword) ||
          (item.provider || '').toLowerCase().includes(keyword) ||
          (item.category || '').toLowerCase().includes(keyword) ||
          (item.benefit || '').toLowerCase().includes(keyword)
        );
      });
    }

    res.json({
      success: true,
      count: scholarships.length,
      data: scholarships
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error executing search query', error: err.message });
  }
});

// GET /api/scholarships - Retrieve all scholarship records
app.get('/api/scholarships', (req, res) => {
  try {
    const scholarships = loadScholarshipsData();
    res.json({
      success: true,
      count: scholarships.length,
      data: scholarships
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to read scholarships data',
      error: err.message
    });
  }
});

// GET /api/scholarships/:id - Retrieve a particular scholarship by ID
app.get('/api/scholarships/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scholarship ID provided. ID must be an integer.'
      });
    }

    const scholarships = loadScholarshipsData();
    const scholarship = scholarships.find((s) => s.id === id);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: `Scholarship with ID ${id} was not found in our database.`
      });
    }

    res.json({
      success: true,
      data: scholarship
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving scholarship details',
      error: err.message
    });
  }
});

// POST /api/eligibility/check - Compare student details with scholarship requirements
app.post('/api/eligibility/check', (req, res) => {
  try {
    const profile = req.body;

    // Basic validation
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile payload is required.'
      });
    }

    if (!profile.educationLevel || !profile.state) {
      return res.status(400).json({
        success: false,
        message: 'Education level and state of residence are mandatory for evaluation.'
      });
    }

    const percentage = parseFloat(profile.previousPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Previous examination percentage must be a valid number between 0 and 100.'
      });
    }

    const income = parseFloat(profile.annualFamilyIncome);
    if (isNaN(income) || income < 0) {
      return res.status(400).json({
        success: false,
        message: 'Annual family income must be a valid non-negative number.'
      });
    }

    const allScholarships = loadScholarshipsData();
    const evaluatedResults = eligibilityService.evaluateAll(profile, allScholarships);

    // Summary counts
    const eligibleCount = evaluatedResults.filter((r) => r.status === 'Meets Listed Criteria').length;
    const borderlineCount = evaluatedResults.filter((r) => r.status === 'May Be Eligible').length;
    const notEligibleCount = evaluatedResults.filter((r) => r.status === 'Not Eligible Under Listed Rules').length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      studentSummary: {
        name: profile.name || 'Student',
        educationLevel: profile.educationLevel,
        course: profile.course || 'Not specified',
        state: profile.state,
        percentage: percentage,
        income: income,
        socialCategory: profile.socialCategory || 'General',
        disabilityStatus: profile.disabilityStatus || 'No'
      },
      summary: {
        totalEvaluated: evaluatedResults.length,
        eligibleCount,
        borderlineCount,
        notEligibleCount
      },
      disclaimer: 'This evaluation provides preliminary educational guidance based on entered criteria. Official eligibility and award decisions are strictly governed by respective awarding bodies and scheme guidelines.',
      results: evaluatedResults
    });
  } catch (err) {
    console.error('Error during eligibility evaluation:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while evaluating scholarship eligibility.',
      error: err.message
    });
  }
});

// Root catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on Scholarship Eligibility Portal API.'
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`Scholarship Eligibility Portal - REST API Server`);
  console.log(`Running on: http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;

