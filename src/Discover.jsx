import React, { useState } from 'react';
import './Discover.css';

// Updated hobbies data with high-quality images and relevant tags
const discoverSkillsData = [
  {
    id: 1,
    title: 'Photography',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
    tags: ['Camera', 'Portrait', 'Editing']
  },
  {
    id: 2,
    title: 'Music',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    tags: ['Instruments', 'Production', 'Audio']
  },
  {
    id: 3,
    title: 'Gaming',
    category: 'Entertainment',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500',
    tags: ['Esports', 'PC', 'Console']
  },
  {
    id: 4,
    title: 'Art',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
    tags: ['Painting', 'DigitalArt', 'Sketching']
  },
  {
    id: 5,
    title: 'Sports',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
    tags: ['TeamSports', 'Athletics', 'Training']
  },
  {
    id: 6,
    title: 'Cooking',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500',
    tags: ['Culinary', 'Baking', 'Recipes']
  },
  {
    id: 7,
    title: 'Reading',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
    tags: ['Books', 'Literature', 'Learning']
  },
  {
    id: 8,
    title: 'Travel',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
    tags: ['Adventure', 'Exploring', 'Culture']
  },
  {
    id: 9,
    title: 'Cycling',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
    tags: ['Biking', 'Outdoor', 'Cardio']
  },
  {
    id: 10,
    title: 'Fitness',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500',
    tags: ['Gym', 'Workout', 'Health']
  }
];

function Discover() {
  const [activeTab, setActiveTab] = useState('Hobbies'); 
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Updated categories matching our hobbies list
  const categories = ['All', 'Creative', 'Entertainment', 'Fitness', 'Lifestyle'];

  const filteredSkills = discoverSkillsData.filter((item) => {
    return selectedCategory === 'All' || item.category === selectedCategory;
  });

  return (
    <div className="discover-container">
      <div className="discover-header-controls">
        
        {/* Main Tabs */}
        <div className="discover-main-tabs">
          <button
            className={`discover-tab-btn ${activeTab === 'Hobbies' ? 'active' : ''}`}
            onClick={() => setActiveTab('Hobbies')}
          >
            Hobbies
          </button>
          <button
            className={`discover-tab-btn ${activeTab === 'People' ? 'active' : ''}`}
            onClick={() => setActiveTab('People')}
          >
            People
          </button>
          <button
            className={`discover-tab-btn ${activeTab === 'Projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('Projects')}
          >
            Projects
          </button>
        </div>

        {/* Sub-Category Filter Pills */}
        {activeTab === 'Hobbies' && (
          <div className="discover-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`discover-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Content Area */}
      {activeTab === 'Hobbies' && (
        <div className="discover-grid-wrapper">
          {filteredSkills.length > 0 ? (
            <div className="discover-cards-grid">
              {filteredSkills.map((skill) => (
                <div key={skill.id} className="discover-card">
                  <div className="discover-card-img-container">
                    <img
                      src={skill.image}
                      alt={skill.title}
                      className="discover-card-img"
                    />
                    <span className="discover-badge">{skill.category}</span>
                  </div>
                  <div className="discover-card-body">
                    <h3 className="discover-card-title">{skill.title}</h3>
                    <div className="discover-tags-list">
                      {skill.tags.map((tag, idx) => (
                        <span key={idx} className="discover-tag-pill">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon">🔍</div>
              <p className="empty-text">No skills or hobbies found in this category.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State Views for People & Projects */}
      {activeTab === 'People' && (
        <div className="empty-state-card">
          <div className="empty-icon">👥</div>
          <p className="empty-text">Connect with creators and collaborators here!</p>
        </div>
      )}

      {activeTab === 'Projects' && (
        <div className="empty-state-card">
          <div className="empty-icon">📁</div>
          <p className="empty-text">Explore active open projects and team requests here!</p>
        </div>
      )}
    </div>
  );
}

export default Discover;