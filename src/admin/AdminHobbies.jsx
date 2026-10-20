import { useEffect, useState } from "react";
import { Search, Layers3 } from "lucide-react";
import "./AdminHobbies.css";

function AdminHobbies() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [hobbySkills, setHobbySkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

  const tabs = ["All", "Categories"];
  useEffect(() => {
  let cancelled = false;

  const fetchHobbySkills = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_URL}/api/admin/hobbies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load hobbies and skills."
        );
      }

      if (!cancelled) {
        setHobbySkills(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchHobbySkills();

  return () => {
    cancelled = true;
  };
}, []);
// Filter hobbies and skills from MongoDB
const filteredHobbySkills = hobbySkills.filter((item) => {
  const query = search.trim().toLowerCase();

  // Search by name or category
  const matchesSearch =
    String(item.name || "").toLowerCase().includes(query) ||
    String(item.category || "").toLowerCase().includes(query);

  // Filter by selected tab
  const matchesTab =
    activeTab === "All" ||
    (activeTab === "Hobbies" && item.type === "Hobby") ||
    (activeTab === "Skills" && item.type === "Skill") ||
    activeTab === "Categories";

  return matchesSearch && matchesTab;
});
// Group hobbies by category using MongoDB records
const groupedCategories = hobbySkills.reduce((groups, item) => {
  const categoryName = item.category || "Uncategorized";

  if (!groups[categoryName]) {
    groups[categoryName] = {
      name: categoryName,
      totalHobbies: 0,
      totalSelections: 0,
    };
  }

  groups[categoryName].totalHobbies += 1;
  groups[categoryName].totalSelections += Number(item.totalUsers) || 0;

  return groups;
}, {});

// Convert grouped categories into an array
const categoriesList = Object.values(groupedCategories)
  .filter((category) =>
    category.name.toLowerCase().includes(search.trim().toLowerCase())
  )
  .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="admin-hobbies-page">
      {/* PAGE HEADER */}
      <div className="admin-hobbies-heading">
        <div>
          <h2>Hobbies & Skills</h2>
          <p>
            Manage hobbies, skills, and categories of the platform.
          </p>
        </div>
      </div>

      {/* TABS AND SEARCH */}
      <div className="admin-hobbies-toolbar">
        <div className="admin-hobbies-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="admin-hobbies-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search hobbies or skills..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

            {/* TABLE */}
            {activeTab === "Categories" ? (
  <div className="admin-hobbies-table-wrapper">
    <table className="admin-hobbies-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Total Hobbies</th>
          <th>Total Selections</th>
        </tr>
      </thead>

      <tbody>
        {!loading &&
          !error &&
          categoriesList.map((category) => (
            <tr key={category.name}>
              <td>
                <div className="admin-category-name">
                    <span className="admin-category-icon">
                    {category.name === "Creative"
                        ? "🎨"
                        : category.name === "Entertainment"
                        ? "🎮"
                        : category.name === "Fitness"
                        ? "💪"
                        : category.name === "Lifestyle"
                        ? "🌿"
                        : "🎯"}
                    </span>

                    <div className="admin-category-details">
                    <strong>{category.name}</strong>

                    <small>
                        {hobbySkills
                        .filter((item) => item.category === category.name)
                        .map((item) => item.name)
                        .join(", ")}
                    </small>
                    </div>
                </div>
                </td>
              <td>
                <span className="admin-hobby-count">
                    {category.totalHobbies}
                </span>
                </td>

                <td>
                <span className="admin-hobby-count">
                    {category.totalSelections}
                </span>
                </td>
            </tr>
          ))}
      </tbody>
    </table>

    {loading ? (
      <div className="admin-hobbies-empty">
        <h3>Loading categories...</h3>
      </div>
    ) : error ? (
      <div className="admin-hobbies-empty">
        <h3>Unable to load categories</h3>
        <p>{error}</p>
      </div>
    ) : categoriesList.length === 0 ? (
      <div className="admin-hobbies-empty">
        <h3>No categories found</h3>
      </div>
    ) : null}
  </div>
) : (

        <div className="admin-hobbies-table-wrapper">
        <table className="admin-hobbies-table">
            <thead>
            <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Total Users</th>
                <th>Status</th>
            </tr>
            </thead>

            <tbody>
            {!loading &&
                !error &&
                filteredHobbySkills.map((item) => (
                <tr key={item._id}>
                    <td>
                    <div className="admin-hobby-name">
                        <span className="admin-hobby-icon">
                        {item.icon || "🎯"}
                        </span>

                        <strong>{item.name}</strong>
                    </div>
                    </td>

                    <td>
                    <span className="admin-hobby-type">
                        {item.type}
                    </span>
                    </td>

                    <td>
                    <span
                        className={`admin-hobby-category ${String(
                        item.category || ""
                        ).toLowerCase()}`}
                    >
                        {item.category}
                    </span>
                    </td>

                    <td>
                    <span className="admin-hobby-count">
                        {item.totalUsers ?? 0}
                    </span>
                    </td>
                    <td>
                    <span
                        className={`admin-hobby-status ${
                        item.status === "active" ? "active" : "inactive"
                        }`}
                    >
                        {item.status === "active" ? "Active" : "Inactive"}
                    </span>
                    </td>           
                </tr>
                ))}
            </tbody>
        </table>
        

        {loading ? (
            <div className="admin-hobbies-empty">
            <Layers3 size={38} />
            <h3>Loading hobbies and skills...</h3>
            <p>Please wait while records are being retrieved.</p>
            </div>
        ) : error ? (
            <div className="admin-hobbies-empty">
            <Layers3 size={38} />
            <h3>Unable to load records</h3>
            <p>{error}</p>
            </div>
        ) : filteredHobbySkills.length === 0 ? (
            <div className="admin-hobbies-empty">
            <Layers3 size={38} />
            <h3>
                {search.trim()
                ? "No matching records found"
                : "No hobbies or skills available"}
            </h3>
            <p>
                {hobbySkills.length === 0
                ? "No records have been added to the database yet."
                : "Try another search or select a different tab."}
            </p>
            </div>
                ) : null}
        </div>
        )}
    </div>
  );
}

export default AdminHobbies;