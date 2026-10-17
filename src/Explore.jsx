import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Explore.css';

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
  { id: '10', name: 'Fitness', category: 'Fitness', icon: '💪' }
];

function Explore() {
  const navigate = useNavigate();

  const handleHobbyClick = (hobby) => {
    navigate('/login', {
      state: { selectedHobby: hobby.name }
    });
  };

  return (
    <main className="explore-container">
      <nav className="explore-navbar">
        <button
          type="button"
          className="explore-logo"
          onClick={() => navigate('/')}
        >
          SKILLLINK
        </button>

        <div className="explore-nav-links">
          <button type="button" onClick={() => navigate('/')}>
            Home
          </button>

          <button type="button" onClick={() => navigate('/about')}>
            About
          </button>
        </div>
      </nav>

      <section className="explore-content">
        <header className="explore-heading">
          <p className="explore-eyebrow">
            EXPLORE YOUR INTERESTS
          </p>

          <h1>What are you into?</h1>

          <p className="explore-subtitle">
            Choose a hobby and discover a community waiting for you.
          </p>
        </header>

        <div className="explore-hobbies-grid">
          {HOBBIES_DATA.map((hobby) => (
            <button
              type="button"
              key={hobby.id}
              className="explore-hobby-card"
              onClick={() => handleHobbyClick(hobby)}
              aria-label={`Explore ${hobby.name}`}
            >
              <span className="explore-hobby-icon">
                {hobby.icon}
              </span>

              <span className="explore-hobby-name">
                {hobby.name}
              </span>

              <span className="explore-hobby-category">
                <span
                  className={`explore-category-dot ${hobby.category.toLowerCase()}`}
                />
                {hobby.category}
              </span>

              <span className="explore-card-arrow">
                ↗
              </span>
            </button>
          ))}
        </div>

        <section className="explore-cta">
          <div>
            <h2>Find your people. Build something together.</h2>

            <p>
              Join SkillLink and connect with people who share your interests.
            </p>
          </div>

          <button
            type="button"
            className="explore-get-started"
            onClick={() => navigate('/login')}
          >
            Get Started <span>→</span>
          </button>
        </section>
      </section>
    </main>
  );
}

export default Explore;