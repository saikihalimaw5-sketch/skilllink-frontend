import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hobbies.css';

// Updated HOBBIES_DATA matching the reference UI image
const HOBBIES_DATA = [
  { id: '1', name: 'Photography', category: 'Creative', icon: '📷' },
  { id: '2', name: 'Music', category: 'Creative', icon: '🎵' },
  { id: '3', name: 'Gaming', category: 'Entertainment', icon: '🎮' },
  { id: '4', name: 'Art', category: 'Creative', icon: '🎨' },
  { id: '5', name: 'Sports', category: 'Fitness', icon: '⚽' },
  { id: '6', name: 'Cooking', category: 'Lifestyle', icon: '🍳' },
  { id: '7', name: 'Reading', category: 'Lifestyle', icon: '📖' },
  { id: '8', name: 'Travel', category: 'Lifestyle', icon: '✈️' },
  { id: '9', name: 'Cycling', category: 'Fitness', icon: '🚴' },
  { id: '10', name: 'Fitness', category: 'Fitness', icon: '💪' },
];

function Hobbies({ onContinue, onSkip }) {
  const navigate = useNavigate();
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://skilllink-backend-v277.onrender.com';

  // Load existing hobbies mula sa LocalStorage at MongoDB pag-open ng page
  useEffect(() => {
    // 1. Unang kuhanin ang nasa localStorage para hindi mawala ang dating napili
    const savedLocalHobbies = JSON.parse(localStorage.getItem('userHobbies')) || [];
    if (savedLocalHobbies.length > 0) {
      setSelectedHobbies(savedLocalHobbies);
    }

    // 2. Fetch din mula sa backend para updated kung may token
    const fetchHobbies = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/my-hobbies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.hobbies) {
          // I-combine ang existing local at database hobbies nang walang duplicates
          const combinedHobbies = Array.from(new Set([...savedLocalHobbies, ...data.hobbies]));
          setSelectedHobbies(combinedHobbies);
        }
      } catch (err) {
        console.error('Failed to load hobbies from database:', err);
      }
    };

    fetchHobbies();
  }, [token, API_BASE_URL]);

  const categories = ['All', 'Creative', 'Entertainment', 'Fitness', 'Lifestyle'];

  const handleHobbyToggle = (hobbyName) => {
    if (selectedHobbies.includes(hobbyName)) {
      setSelectedHobbies(prev => prev.filter(item => item !== hobbyName));
    } else {
      setSelectedHobbies(prev => [...prev, hobbyName]);
    }
  };

  const filteredHobbies = HOBBIES_DATA.filter((hobby) => {
    const matchesCategory = activeCategory === 'All' || hobby.category === activeCategory;
    const matchesSearch = hobby.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContinueSubmit = async () => {
    setLoading(true);
    try {
      if (token) {
        // Save sa MongoDB Database
        await fetch(`${API_BASE_URL}/api/auth/save-hobbies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ hobbies: selectedHobbies })
        });
      }

      // I-update ang localStorage gamit ang pinagsamang luma at bagong napili
      localStorage.setItem('userHobbies', JSON.stringify(selectedHobbies));

      if (onContinue) {
        onContinue(selectedHobbies);
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Error saving hobbies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo" onClick={handleSkipClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="logo-icon" style={{ fontSize: '1.75rem' }}>{"🔗"}</span>
            <span className="logo-text" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>SkillLink</span>
          </div>

          <div className="navbar-actions">
            <button className="btn-logout" onClick={handleSkipClick}>
              Skip for now
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="hobbies-main-wrapper">
        <div className="hobbies-content-box">
          
          {/* Header Section */}
          <div className="hobbies-intro">
            <span className="hobbies-badge">Step 1 of 2</span>
            <h1 className="hero-title" style={{ fontSize: '3.2rem', marginBottom: '0.8rem', textAlign: 'center' }}>
              What do you love?
            </h1>
            <p className="hero-description" style={{ textAlign: 'center', margin: '0 auto 1.5rem auto', maxWidth: '600px' }}>
              Choose the hobbies you're interested in so we can help you discover people who enjoy the same things.
            </p>
          </div>

          {/* Search & Categories */}
          <div className="hobbies-controls">
            <input
              type="text"
              placeholder="Search hobbies or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input hobbies-search-bar"
            />

            <div className="hobbies-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies Grid */}
          <div className="hobbies-grid-container">
            <div className="hobbies-grid">
              {filteredHobbies.length > 0 ? (
                filteredHobbies.map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby.name);
                  return (
                    <div
                      key={hobby.id}
                      className={`hobby-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleHobbyToggle(hobby.name)}
                    >
                      <span className="hobby-icon">{hobby.icon}</span>
                      <span className="hobby-name">{hobby.name}</span>
                      {isSelected && <span className="hobby-checkmark">✓</span>}
                    </div>
                  );
                })
              ) : (
                <p className="no-results">No hobbies found matching "{searchQuery}"</p>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="hobbies-footer">
            <span className="selected-count">
              {selectedHobbies.length} {selectedHobbies.length === 1 ? 'hobby' : 'hobbies'} selected
            </span>

            <button
              type="button"
              className="btn-primary"
              disabled={selectedHobbies.length === 0 || loading}
              onClick={handleContinueSubmit}
              style={{
                opacity: selectedHobbies.length === 0 || loading ? 0.4 : 1,
                cursor: selectedHobbies.length === 0 || loading ? 'not-allowed' : 'pointer',
                padding: '0.85rem 2.5rem'
              }}
            >
              {loading ? 'Saving...' : `Continue → (${selectedHobbies.length})`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Hobbies;