import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Hobbies from './Hobbies';
import Home from './Home';
import About from './About';
import Settings from './Settings';
import ChangePassword from './ChangePassword';
import Messages from './Messages';
import Notifications from './Notifications'; // Import Notifications
import './App.css';

// Landing page component
function LandingPage() {
  const navigate = useNavigate();

  const heroImg =
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop";

  return (
    <div className="landing-container">
      {/* Header navigation */}
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Main brand text logo */}
          <div
            className="navbar-logo"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-logo">
              <span className="brand-main-text">SKILLLINK</span>
            </div>
          </div>

          {/* Navigation links */}
          <ul className="navbar-links">
            <li>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Home
              </a>
            </li>

            <li>
              <a href="#explore">Explore</a>
            </li>

            <li>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/about');
                }}
              >
                About
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero banner section */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              Share Hobbies.
              <br />
              Find People.
              <br />
              Build Together.
            </h1>

            <p className="hero-description">
              Connect with people who share your interests, discover new
              skills, and turn your hobbies into meaningful projects.
            </p>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate('/login')}
              >
                Get Start
              </button>
            </div>
          </div>

          <div className="hero-image-container">
            <img
              src={heroImg}
              alt="Collaboration"
              className="hero-image"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// Main app component
function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/about"
        element={
          <About
            onGoHome={() => navigate('/')}
            onNavigateLogin={() => navigate('/login')}
            onNavigateSignUp={() => navigate('/signup')}
          />
        }
      />

      <Route
        path="/login"
        element={
          <Login
            onSwitchToSignUp={() => navigate('/signup')}
            onGoHome={() => navigate('/')}
            onLoginSuccess={() => navigate('/hobbies')}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <Signup
            onSwitchToLogin={() => navigate('/login')}
            onGoHome={() => navigate('/')}
            onSignupSuccess={() => navigate('/hobbies')}
          />
        }
      />

      <Route
        path="/hobbies"
        element={
          <Hobbies
            onContinue={(selectedHobbies) => {
              localStorage.setItem(
                'userHobbies',
                JSON.stringify(selectedHobbies)
              );

              navigate('/dashboard');
            }}
            onSkip={() => {
              if (!localStorage.getItem('userHobbies')) {
                localStorage.setItem(
                  'userHobbies',
                  JSON.stringify([])
                );
              }

              navigate('/dashboard');
            }}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <Home
            onGoToHobbies={() => navigate('/hobbies')}
          />
        }
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="/change-password"
        element={<ChangePassword />}
      />

      {/* Messages page */}
      <Route
        path="/messages"
        element={<Messages />}
      />

      {/* Notifications page */}
      <Route
        path="/notifications"
        element={<Notifications />}
      />
    </Routes>
  );
}

export default App;