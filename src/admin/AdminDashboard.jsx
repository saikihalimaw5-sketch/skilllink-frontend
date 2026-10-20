
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Link2,
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  Ban,
  Palette,
  FolderKanban,
  Handshake,
  Flag,
  Settings,
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Activity,
  Camera,
  Music,
  Gamepad2,
  Dumbbell,
  Brush,
  Search,
  LogOut,
} from "lucide-react";

import AdminUsers from "./AdminUsers";
import AdminHobbies from "./AdminHobbies";
import AdminProjects from "./AdminProjects";
import AdminCollaboration from "./AdminCollaboration";

import AdminReports from "./AdminReports";
import AdminNotifications from "./AdminNotifications";
import AdminSettings from "./AdminSettings";
import "./AdminDashboard.css";


function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  
const [adminUsername, setAdminUsername] = useState("Administrator");

const [adminProfileImage, setAdminProfileImage] = useState("");
const [adminAvatarSeed, setAdminAvatarSeed] = useState("Admin");


useEffect(() => {
  const controller = new AbortController();

  const fetchAdminName = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";

      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/auth/my-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      
if (data.user?.role === "admin" && !controller.signal.aborted) {
  setAdminUsername(data.user.username || "Administrator");
  setAdminProfileImage(data.user.profileImage || "");
  setAdminAvatarSeed(data.user._id || data.user.id || "Admin");
}

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Unable to load admin username:", error);
      }
    }
  };

  fetchAdminName();

  const handleProfileUpdated = () => {
    fetchAdminName();
  };

  window.addEventListener("admin-profile-updated", handleProfileUpdated);

  return () => {
    controller.abort();
    window.removeEventListener("admin-profile-updated", handleProfileUpdated);
  };
}, []);

  const [period, setPeriod] = useState("This Year");
  const [selectedMonth, setSelectedMonth] = useState(
  new Date().toISOString().slice(0, 7)
);
  
const [totalUsers, setTotalUsers] = useState(null);
const [activeUsers, setActiveUsers] = useState(null);
const [suspendedUsers, setSuspendedUsers] = useState(null);
const [blockedUsers, setBlockedUsers] = useState(null);
const [statsError, setStatsError] = useState("");

const [newUsersThisMonth, setNewUsersThisMonth] = useState(null);
const [growthRate, setGrowthRate] = useState(null);
const [userGrowth, setUserGrowth] = useState([]);
const [topHobbies, setTopHobbies] = useState([]);
const [allHobbies, setAllHobbies] = useState([]);

useEffect(() => {
  const controller = new AbortController();

  const fetchDashboardStats = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load dashboard statistics.");
      }

     const data = await response.json();

if (controller.signal.aborted) return;

setTotalUsers(data.totalUsers);
setActiveUsers(data.activeUsers);
setSuspendedUsers(data.suspendedUsers);
setBlockedUsers(data.blockedUsers);
setNewUsersThisMonth(data.newUsersThisMonth);
setGrowthRate(data.growthRate);
setUserGrowth(Array.isArray(data.userGrowth) ? data.userGrowth : []);
setTopHobbies(Array.isArray(data.topHobbies) ? data.topHobbies : []);
const hobbiesResponse = await fetch(`${API_URL}/api/admin/hobbies`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  signal: controller.signal,
});

if (!hobbiesResponse.ok) {
  throw new Error("Unable to load hobbies summary.");
}

const hobbiesData = await hobbiesResponse.json();

if (controller.signal.aborted) return;

setAllHobbies(
  Array.isArray(hobbiesData.items)
    ? hobbiesData.items.sort(
        (a, b) => b.totalUsers - a.totalUsers
      )
    : []
);

setStatsError("");
    } catch (error) {
      if (error.name !== "AbortError") {
        setStatsError(error.message);
      }
    }
  };

  fetchDashboardStats();

  return () => controller.abort();
}, []);


  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Users", icon: Users },
    { name: "Hobbies & Skills", icon: Palette },
    { name: "Projects", icon: FolderKanban },
    { name: "Collaborations", icon: Handshake },
    { name: "Reports", icon: Flag },
    { name: "Notifications", icon: Bell },
    { name: "Settings", icon: Settings },
  ];

  const statistics = [
    {
      title: "Total Users",
      icon: Users,
      color: "#a78bfa",
    },
    {
      title: "Active Users",
      icon: UserCheck,
      color: "#6ee7b7",
    },
    {
      title: "Suspended Users",
      icon: UserX,
      color: "#fb7185",
    },
    {
      title: "Blocked Users",
      icon: Ban,
      color: "#facc15",
    },
  ];

  // Data will be connected to real MongoDB records.
  // No sample statistics are used.
  // Recent Activity and Top Hobbies will be connected later.
   
const [recentActivities, setRecentActivities] = useState([]);
const [recentActivityLoading, setRecentActivityLoading] = useState(true);
const [recentActivityError, setRecentActivityError] = useState("");

useEffect(() => {
  const controller = new AbortController();

  const fetchRecentActivities = async () => {
    try {
      setRecentActivityLoading(true);
      setRecentActivityError("");

      const API_URL =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/admin/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load recent activities.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.activities)) {
        throw new Error("Invalid recent activity response.");
      }

      if (!controller.signal.aborted) {
        setRecentActivities(
          [...data.activities]
            .sort(
              (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            )
            .slice(0, 5)
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setRecentActivityError(error.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setRecentActivityLoading(false);
      }
    }
  };

  fetchRecentActivities();

  return () => controller.abort();
}, []);

    

    // ==========================================
// USER GROWTH ANALYTICS - REAL MONGODB DATA
// ==========================================

const chartData = (() => {
  const now = new Date();

  const registrations = userGrowth
    .map((user) => new Date(user.date))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (period === "This Year") {
    return Array.from({ length: 12 }, (_, month) => {
      const count = registrations.filter(
        (date) =>
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === month
      ).length;

      return {
        name: new Date(now.getFullYear(), month, 1)
          .toLocaleString("en-US", { month: "short" }),
        users: count,
      };
    });
  }

  if (period === "This Month") {
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      const count = registrations.filter(
        (date) =>
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === day
      ).length;

      return {
        name: String(day),
        users: count,
      };
    });
  }
if (period === "Custom Month") {
  if (!selectedMonth) return [];

  const [year, month] = selectedMonth.split("-").map(Number);

  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;

    const count = registrations.filter(
      (date) =>
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    ).length;

    return {
      name: String(day),
      users: count,
    };
  });
}
  if (period === "This Week") {
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const dayOfWeek = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const count = registrations.filter(
        (registeredDate) =>
          registeredDate.getFullYear() === date.getFullYear() &&
          registeredDate.getMonth() === date.getMonth() &&
          registeredDate.getDate() === date.getDate()
      ).length;

      return {
        name: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        users: count,
      };
    });
  }

  return [];
})();

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "open" : "closed"
        }`}
      >
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <Link2 size={29} />
            {sidebarOpen && <h2>SkillLink</h2>}
          </div>
        </div>

        <nav className="admin-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                type="button"
                className={`admin-nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
         
<div className="admin-profile">
  <img
    src={
      adminProfileImage ||
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
        adminAvatarSeed
      )}`
    }
    alt="Admin profile"
    style={{
      width: "34px",
      height: "34px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid #a78bfa",
      flexShrink: 0,
    }}
  />

  {sidebarOpen && (
    <div>
      <strong>{adminUsername}</strong>
      <small>SkillLink Admin</small>
    </div>
  )}
</div>


          
<button
  type="button"
  className="admin-nav-item admin-logout"
  onClick={() => {
    localStorage.removeItem("token");
    window.location.replace("/login");
  }}
  title="Logout from Admin"
>
  <LogOut size={20} />
  {sidebarOpen && <span>Logout</span>}
</button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <Menu size={23} />
            </button>

            <div>
              <h1>
                {activePage === "Dashboard"
                  ? "Admin Dashboard"
                  : activePage}
              </h1>
              <p>SkillLink Administration Panel</p>
            </div>
          </div>

          <div className="admin-topbar-right">
  <button
    type="button"
    className="admin-icon-button"
    onClick={() => setActivePage("Notifications")}
    aria-label="Open admin notifications"
    title="Notifications"
  >
    <Bell size={21} />
  </button>

            
<div className="admin-avatar">
  <img
    src={
      adminProfileImage ||
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
        adminAvatarSeed
      )}`
    }
    alt="Admin profile"
    style={{
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      objectFit: "cover",
    }}
  />
</div>

          </div>
        </header>

        <section className="admin-content">
  {activePage === "Users" ? (
  <AdminUsers />
) : activePage === "Hobbies & Skills" ? (
  <AdminHobbies />
) : activePage === "Projects" ? (
  <AdminProjects />
) : activePage === "Collaborations" ? (
  <AdminCollaboration />

) : activePage === "Reports" ? (
  <AdminReports />
) : activePage === "Notifications" ? (
  <AdminNotifications />
) : activePage === "Settings" ? (
  <AdminSettings />
) : activePage === "Dashboard" ? (

            <>
              {/* WELCOME */}
              <div className="admin-welcome">
                <div>
                  <h2>Welcome, {adminUsername}!</h2>
                  <p>
                    Here's what's happening on SkillLink
                    today. Monitor your platform and
                    manage its activities.
                  </p>
                </div>

                <Activity size={36} />
              </div>

              {/* STATISTICS */}
              <div className="admin-statistics">
                {statistics.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      className="admin-stat-card"
                      key={stat.title}
                    >
                      <div className="admin-stat-header">
                        <span>{stat.title}</span>

                        <Icon
                          size={24}
                          style={{ color: stat.color }}
                        />
                      </div>                     
                     
                        <h2>
                        {stat.title === "Total Users"
                          ? totalUsers ?? "—"
                          : stat.title === "Active Users"
                          ? activeUsers ?? "—"
                          : stat.title === "Suspended Users"
                          ? suspendedUsers ?? "—"
                          : stat.title === "Blocked Users"
                          ? blockedUsers ?? "—"
                          : "—"}
                        </h2>

                        <p>
                        {statsError
                          ? statsError
                          : stat.title === "Total Users"
                          ? totalUsers === null
                            ? "Loading database records..."
                            : "Registered student accounts"
                          : stat.title === "Active Users"
                          ? activeUsers === null
                            ? "Loading database records..."
                            : "Active student accounts"
                          : stat.title === "Suspended Users"
                          ? suspendedUsers === null
                            ? "Loading database records..."
                            : "Suspended student accounts"
                          : stat.title === "Blocked Users"
                          ? blockedUsers === null
                            ? "Loading database records..."
                            : "Blocked student accounts"
                          : "Not yet implemented"}
                        </p>

                    </div>
                  );
                })}
              </div>

              {/* USER GROWTH + RECENT ACTIVITY */}
              <div className="admin-dashboard-grid">
                {/* USER GROWTH */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>User Growth</h3>

                    <select
                      value={period}
                      onChange={(event) =>
                        setPeriod(event.target.value)
                      }
                      style={{
                        background:
                          "rgba(168, 85, 247, 0.12)",
                        color: "#e9d5ff",
                        border:
                          "1px solid rgba(168, 85, 247, 0.35)",
                        borderRadius: "9px",
                        padding: "7px 10px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="This Year">
                        This Year
                      </option>
                      <option value="This Month">
                        This Month
                      </option>
                        <option value="This Week">
                              This Week
                            </option>
                     <option value="Custom Month">
                        Select Month
                      </option>
                    </select>

                    {period === "Custom Month" && (
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={`${new Date().getFullYear()}-${String(
                          new Date().getMonth() + 1
                        ).padStart(2, "0")}`}
                        style={{
                          background: "rgba(168, 85, 247, 0.12)",
                          color: "#e9d5ff",
                          border: "1px solid rgba(168, 85, 247, 0.35)",
                          borderRadius: "9px",
                          padding: "7px 10px",
                          outline: "none",
                          cursor: "pointer",
                          colorScheme: "dark",
                        }}
                      />
                    )}
                  </div>
                  <div className="admin-chart-container">
                    {statsError ? (
                      <div className="admin-empty-state">
                        <p>{statsError}</p>
                      </div>
                    ) : userGrowth.length === 0 ? (
                      <div className="admin-empty-state">
                        <Activity size={38} style={{ color: "#a78bfa" }} />
                        <p>No registration data available yet.</p>
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: "260px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(167, 139, 250, 0.15)"
                            />
                            <XAxis dataKey="name" stroke="#c4b5fd" />
                            <YAxis allowDecimals={false} stroke="#c4b5fd" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e1635",
                                border: "1px solid #7c3aed",
                                borderRadius: "10px",
                                color: "#ffffff",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="users"
                              stroke="#a78bfa"
                              strokeWidth={3}
                              dot={{ fill: "#a78bfa", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
                {/* RECENT ACTIVITY */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>Recent Activity</h3>

                    <button
                      type="button"
                      onClick={() => setActivePage("Notifications")}
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>

                  
<div
  className="admin-recent-activity"
  style={{
    maxHeight: "300px",
    overflowY: "auto",
  }}
>
  {recentActivityLoading ? (
    <div className="admin-empty-state">
      <p>Loading recent activities...</p>
    </div>
  ) : recentActivityError ? (
    <div className="admin-empty-state">
      <p>{recentActivityError}</p>
    </div>
  ) : recentActivities.length === 0 ? (
    <div className="admin-empty-state">
      <Bell size={34} color="#a78bfa" />
      <p>No recent activities yet.</p>
    </div>
  ) : (
    recentActivities.map((activity) => (
      <div
        key={`${activity.type}-${activity.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "13px 10px",
          borderBottom: "1px solid rgba(167,139,250,0.12)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "rgba(167,139,250,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {activity.username ? (
            <img
              src={
                activity.profileImage ||
                `https://api.dicebear.com/9.x/${encodeURIComponent(
                  activity.avatarStyle || "avataaars"
                )}/svg?seed=${encodeURIComponent(activity.username)}`
              }
              alt={`${activity.username}'s avatar`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Bell size={19} color="#a78bfa" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              color: "#f5f3ff",
              fontSize: "13px",
              marginBottom: "4px",
            }}
          >
            {activity.title}
          </strong>

          <p
            style={{
              margin: "0 0 5px",
              color: "#c4b5d4",
              fontSize: "12px",
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {activity.description}
          </p>

          <span
            style={{
              color: "#a99ab8",
              fontSize: "11px",
            }}
          >
            {activity.createdAt
              ? new Date(activity.createdAt).toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "Unknown date"}
          </span>
        </div>
      </div>
    ))
  )}
</div>

                </div>
              </div>

              {/* TOP HOBBIES */}
              <div className="admin-dashboard-grid">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>Top Hobbies 5</h3>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePage("Hobbies & Skills")
                      }
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="admin-top-hobbies">
                  {statsError ? (
                    <div className="admin-empty-state">
                      <p>{statsError}</p>
                    </div>
                  ) : topHobbies.length === 0 ? (
                    <div className="admin-empty-state">
                      <Palette size={35} color="#c084fc" />
                      <p>No student hobby selections available yet.</p>
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "280px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topHobbies}
                          layout="vertical"
                          margin={{ top: 10, right: 25, left: 25, bottom: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(167, 139, 250, 0.15)"
                            horizontal={false}
                          />

                          <XAxis
                            type="number"
                            allowDecimals={false}
                            stroke="#c4b5fd"
                          />

                          <YAxis
                            type="category"
                            dataKey="hobby"
                            width={110}
                            stroke="#c4b5fd"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                              value.charAt(0).toUpperCase() + value.slice(1)
                            }
                          />

                          <Tooltip
                            labelFormatter={(value) =>
                              String(value)
                                .split(" ")
                                .map((word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")
                            }
                            contentStyle={{
                              backgroundColor: "#1e1635",
                              border: "1px solid #7c3aed",
                              borderRadius: "10px",
                              color: "#ffffff",
                            }}
                            cursor={{ fill: "rgba(167, 139, 250, 0.08)" }}
                          />

                          <Bar
                            dataKey="count"
                            name="Students"
                            fill="#a78bfa"
                            radius={[0, 6, 6, 0]}
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                                   )}
                </div>
                </div>

                {/* ALL HOBBIES SUMMARY */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>All Hobbies Summary</h3>

                    <span style={{ color: "#c4b5fd", fontSize: "13px" }}>
                      {allHobbies.length} Total
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "18px",
                      maxHeight: "330px",
                      overflowY: "auto",
                    }}
                  >
                    {statsError ? (
                      <div className="admin-empty-state">
                        <p>{statsError}</p>
                      </div>
                    ) : allHobbies.length === 0 ? (
                      <div className="admin-empty-state">
                        <Palette size={32} color="#c084fc" />
                        <p>No hobbies available yet.</p>
                      </div>
                    ) : (
                      allHobbies.map((hobby) => (
                        <div
                          key={hobby._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            marginBottom: "8px",
                            borderRadius: "10px",
                            background: "rgba(167, 139, 250, 0.07)",
                            border: "1px solid rgba(167, 139, 250, 0.12)",
                          }}
                        >
                          <span
                            style={{
                              color: "#e9d5ff",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                          >
                            {hobby.name}
                          </span>

                          <span
                            style={{
                              color:
                                hobby.totalUsers === 0
                                  ? "#fda4af"
                                  : "#c4b5fd",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {hobby.totalUsers}{" "}
                            {hobby.totalUsers === 1
                              ? "Student"
                              : "Students"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* OTHER ADMIN PAGES */
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>{activePage}</h3>
              </div>

              <div className="admin-empty-state">
                <ShieldCheck
                  size={42}
                  style={{
                    color: "#c084fc",
                    marginBottom: "15px",
                  }}
                />

                <h2
                  style={{
                    color: "#ffffff",
                    marginBottom: "10px",
                  }}
                >
                  {activePage} Management
                </h2>

                <p>
                  This admin section will be developed
                  and connected to the SkillLink database.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
