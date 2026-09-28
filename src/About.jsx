import React from 'react';
import './About.css';

function About({ onGoHome }) {
  return (
    <div className="about-page-container">
      {/* Navigation bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo" onClick={onGoHome} style={{ cursor: 'pointer' }}>
            <div className="brand-logo">
              <span className="brand-main-text">SkillLink</span>
            </div>
          </div>

          <ul className="navbar-links">
            <li><a href="#" onClick={(e) => { e.preventDefault(); onGoHome(); }}>Home</a></li>
            <li><a href="#explore">Explore</a></li>
            <li><a href="#" className="active">About</a></li>
          </ul>
        </div>
      </nav>

      {/* Main Content - No Scroll Viewport */}
      <main className="about-content-container">
        <div className="about-inner">
          <h1 className="section-title">How SkillLink Works</h1>
          <p className="section-subtitle">
            3 simple steps to find collaborators and launch your next project
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h2 className="step-title">Build Your Profile</h2>
              <p className="step-desc">
                List the skills you can offer and the technical or creative skills you want to learn.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h2 className="step-title">Match & Gap Analysis</h2>
              <p className="step-desc">
                Our algorithm scans projects to find exact missing skills and pairs you with right teammates.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h2 className="step-title">Collab & Endorse</h2>
              <p className="step-desc">
                Work together, complete deliverables, and build a peer-verified skill portfolio.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;