import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  requestNotificationPermission,
  listenForMessages
} from "./messaging";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bolt,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Plus,
  Power,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  Tv,
  X,
  Zap
} from "lucide-react";

import {
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";

import api from "./api";

import {
  auth,
  googleProvider,
  isConfigured as firebaseConfigured
} from "./firebase";

import { socket } from "./socket";

const initialUser = JSON.parse(
  localStorage.getItem("ecoMeterUser") || "null"
);

function saveSession(token, user) {
  localStorage.setItem("ecoMeterToken", token);
  localStorage.setItem("ecoMeterUser", JSON.stringify(user));
}

function getError(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong"
  );
}

function ProtectedRoute({ children }) {
  return localStorage.getItem("ecoMeterToken")
    ? children
    : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    const logout = () => setUser(null);

    window.addEventListener(
      "eco-meter-logout",
      logout
    );

    return () =>
      window.removeEventListener(
        "eco-meter-logout",
        logout
      );
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch {
      // Local JWT session can still be cleared.
    }

    localStorage.removeItem("ecoMeterToken");
    localStorage.removeItem("ecoMeterUser");

    setUser(null);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <AuthPage
              mode="login"
              onAuth={setUser}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <AuthPage
              mode="register"
              onAuth={setUser}
            />
          )
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Shell
              user={user}
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/auth/login"
        : "/auth/register";

      const response = await api.post(
        endpoint,
        form
      );

      saveSession(
        response.data.token,
        response.data.user
      );

      onAuth(response.data.user);

      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError("");

    if (!auth || !googleProvider) {
      setError(
        "Firebase Web App is not configured yet. Add the VITE_FIREBASE_* values to .env."
      );

      return;
    }

    setGoogleLoading(true);

    try {
      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      const idToken =
        await result.user.getIdToken();

      const response = await api.post(
        "/auth/firebase-login",
        { idToken }
      );

      saveSession(
        response.data.token,
        response.data.user
      );

      onAuth(response.data.user);

      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-visual">

        <div className="brand">
          <span className="brand-mark">
            <Zap size={20} />
          </span>

          EcoMeter
        </div>

        <div className="auth-hero">

          <span className="eyebrow">
            ENERGY USAGE MONITOR
          </span>

          <h1>
            Understand your energy.
            <span> Use it smarter.</span>
          </h1>

          <p>
            Track readings, manage devices,
            predict bills and receive real-time
            usage alerts from one dashboard.
          </p>

          <div className="mini-stats">

            <div>
              <strong>Live</strong>
              <span>Socket.io updates</span>
            </div>

            <div>
              <strong>Secure</strong>
              <span>JWT + Firebase Auth</span>
            </div>

            <div>
              <strong>Smart</strong>
              <span>Bill prediction</span>
            </div>

          </div>

        </div>
      </div>


      <div className="auth-card-wrap">

        <div className="auth-card">

          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <Zap size={18} />
            </span>
            EcoMeter
          </div>

          <span className="eyebrow">
            WELCOME
          </span>

          <h2>
            {isLogin
              ? "Sign in to EcoMeter"
              : "Create your account"}
          </h2>

          <p className="muted">
            {isLogin
              ? "Continue monitoring your home's energy usage."
              : "Start tracking your home's energy usage."}
          </p>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <form
            onSubmit={submit}
            className="form-stack"
          >

            {!isLogin && (
              <label>
                Name

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password

              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
                placeholder="Minimum 6 characters"
              />
            </label>

            <button
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </button>

          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            className="google-btn"
            onClick={googleLogin}
            disabled={googleLoading}
          >
            <span className="google-icon">
              G
            </span>

            {googleLoading
              ? "Connecting..."
              : "Continue with Google"}
          </button>

          {!firebaseConfigured && (
            <small className="hint">
              Google sign-in becomes active after
              you add your Firebase Web App
              configuration.
            </small>
          )}

          <p className="auth-switch">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            {" "}

            <Link
              to={
                isLogin
                  ? "/register"
                  : "/login"
              }
            >
              {isLogin
                ? "Create one"
                : "Sign in"}
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}


/* =========================================================
   SHELL + GLOBAL SOCKET CONNECTION
========================================================= */

function Shell({ user, onLogout }) {

  const location = useLocation();

  const [open, setOpen] =
    useState(false);

  const nav = [
    {
      to: "/",
      label: "Dashboard",
      icon: Home
    },
    {
      to: "/devices",
      label: "Devices",
      icon: Bolt
    },
    {
      to: "/readings",
      label: "Readings",
      icon: Activity
    },
    {
      to: "/bills",
      label: "Bills",
      icon: CircleDollarSign
    },
    {
      to: "/tips",
      label: "Tips",
      icon: Lightbulb
    },
    {
      to: "/alerts",
      label: "Alerts",
      icon: AlertTriangle
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell
    }
  ];

  const title =
    nav.find(
      (item) =>
        item.to === location.pathname
    )?.label || "Dashboard";


  /* =====================================================
     IMPORTANT SOCKET FIX
  ===================================================== */

  useEffect(() => {

    const userId =
      user?.id || user?._id;

    if (!userId) {
      console.log(
        "Socket: user ID not found",
        user
      );

      return;
    }

    console.log(
      "Socket: connecting..."
    );

    console.log(
      "Socket: joining user room:",
      userId
    );

    const joinRoom = () => {

      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "joinUserRoom",
        userId
      );
    };

    socket.connect();

    socket.on(
      "connect",
      joinRoom
    );

    if (socket.connected) {
      joinRoom();
    }

    return () => {

      socket.off(
        "connect",
        joinRoom
      );

      socket.disconnect();
    };

  }, [user]);

  useEffect(() => {
  const unsubscribe =
    listenForMessages((payload) => {
      console.log(
        "Foreground notification:",
        payload
      );

      const title =
        payload.notification?.title ||
        "EcoMeter Usage Alert";

      const body =
        payload.notification?.body ||
        "Your energy usage has crossed the selected threshold.";

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          body
        });
      }
    });

  return () => {
    unsubscribe();
  };
}, []);


  return (
    <div className="app-shell">

      <aside
        className={`sidebar ${
          open ? "open" : ""
        }`}
      >

        <div className="sidebar-top">

          <div className="brand">
            <span className="brand-mark">
              <Zap size={20} />
            </span>

            EcoMeter
          </div>

          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>

        </div>

        <div className="side-label">
          MONITOR
        </div>

        <nav>

          {nav.map(
            ({
              to,
              label,
              icon: Icon
            }) => (

              <Link
                key={to}
                to={to}
                onClick={() =>
                  setOpen(false)
                }
                className={`nav-link ${
                  location.pathname === to
                    ? "active"
                    : ""
                }`}
              >

                <Icon size={18} />

                <span>{label}</span>

              </Link>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.role || "user"}
              </span>
            </div>

          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            <LogOut size={17} />
            Sign out
          </button>

        </div>

      </aside>

      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="main-area">

        <header className="topbar">

          <button
            className="menu-btn"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div>
            <span className="top-kicker">
              ECOMETER / HOME
            </span>

            <h1>{title}</h1>
          </div>

          <div className="top-actions">

            <span className="connection-dot"></span>

            <span className="live-label">
              Live
            </span>

            <div className="avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

          </div>

        </header>

        <div className="content">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/devices"
              element={<Devices />}
            />

            <Route
              path="/readings"
              element={<Readings />}
            />

            <Route
              path="/bills"
              element={<Bills />}
            />

            <Route
              path="/tips"
              element={<Tips user={user} />}
            />

            <Route
              path="/alerts"
              element={<Alerts />}
            />

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

  const [devices, setDevices] =
    useState([]);

  const [readings, setReadings] =
    useState([]);

  const [bill, setBill] =
    useState(null);

  const [live, setLive] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const load = async () => {

    setLoading(true);

    try {

      const [
        deviceRes,
        readingRes,
        billRes
      ] = await Promise.all([
        api.get("/devices"),
        api.get("/readings"),
        api.get("/bills")
      ]);

      setDevices(
        deviceRes.data.devices || []
      );

      setReadings(
        readingRes.data.readings || []
      );

      setBill(
        billRes.data
      );

    } catch {
      // Individual cards remain usable.
    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    load();

    const onUsage = (data) => {

      setLive(
        data?.reading || data
      );

      load();
    };

    socket.on(
      "usageUpdate",
      onUsage
    );

    socket.on(
      "liveUsage",
      onUsage
    );

    return () => {

      socket.off(
        "usageUpdate",
        onUsage
      );

      socket.off(
        "liveUsage",
        onUsage
      );

    };

  }, []);


  const online =
    devices.filter(
      (d) => d.isOnline
    ).length;

  const latest =
    live || readings[0];


  return (
    <div className="page-stack">

      <div className="page-intro">

        <div>

          <span className="eyebrow">
            OVERVIEW
          </span>

          <h2>
            Good energy starts
            with visibility.
          </h2>

          <p>
            Monitor usage, devices and
            estimated costs from your
            home dashboard.
          </p>

        </div>

        <button
          className="icon-btn"
          onClick={load}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

      </div>


      <div className="stats-grid">

        <StatCard
          icon={Zap}
          label="Total usage"
          value={
            bill
              ? `${bill.totalKwh} kWh`
              : "—"
          }
          note={`${bill?.totalReadings || 0} readings`}
        />

        <StatCard
          icon={CircleDollarSign}
          label="Estimated bill"
          value={
            bill
              ? `₹${bill.estimatedBill}`
              : "—"
          }
          note={`₹${bill?.ratePerKwh || 8}/kWh`}
        />

        <StatCard
          icon={Gauge}
          label="Devices online"
          value={`${online}/${devices.length}`}
          note="Connected devices"
        />

        <StatCard
          icon={Activity}
          label="Live reading"
          value={
            latest
              ? `${latest.energyKwh} kWh`
              : "—"
          }
          note={
            latest
              ? new Date(
                  latest.recordedAt ||
                  Date.now()
                ).toLocaleTimeString()
              : "Waiting for update"
          }
        />

      </div>


      <div className="two-col">

        <section className="panel">

          <PanelHead
            title="Live usage"
            icon={Activity}
          />

          <div className="live-panel">

            <div className="live-ring">

              <span>
                {latest?.energyKwh ?? 0}
              </span>

              <small>
                kWh
              </small>

            </div>

            <div>

              <span className="live-pill">

                <span className="connection-dot"></span>

                Real-time

              </span>

              <h3>
                {latest?.device?.name ||
                  "Waiting for a reading"}
              </h3>

              <p>
                {latest
                  ? `Updated ${new Date(
                      latest.recordedAt ||
                      Date.now()
                    ).toLocaleString()}`
                  : "Create a device and add a reading to see live data."}
              </p>

            </div>

          </div>

        </section>


        <section className="panel">

          <PanelHead
            title="Recent readings"
            icon={BarChart3}
            link="/readings"
          />

          <div className="mini-list">

            {loading ? (
              <Empty text="Loading..." />
            ) : (
              readings
                .slice(0, 5)
                .map((r) => (

                  <div
                    className="mini-row"
                    key={r._id}
                  >

                    <div className="row-icon">
                      <Zap size={16} />
                    </div>

                    <div>

                      <strong>
                        {r.device?.name ||
                          "Device"}
                      </strong>

                      <span>
                        {new Date(
                          r.recordedAt
                        ).toLocaleString()}
                      </span>

                    </div>

                    <b>
                      {r.energyKwh} kWh
                    </b>

                  </div>

                ))
            )}

            {!loading &&
              readings.length === 0 && (
                <Empty
                  text="No readings yet."
                />
              )}

          </div>

        </section>

      </div>


      <section className="panel">

        <PanelHead
          title="Your devices"
          icon={Bolt}
          link="/devices"
        />

        <div className="device-grid">

          {devices
            .slice(0, 4)
            .map((d) => (
              <DeviceTile
                key={d._id}
                device={d}
              />
            ))}

          {devices.length === 0 && (
            <Empty
              text="No devices yet. Add your first device from the Devices page."
            />
          )}

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   COMMON COMPONENTS
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  note
}) {

  return (
    <div className="stat-card">

      <div className="stat-icon">
        <Icon size={20} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{note}</small>

    </div>
  );
}


function PanelHead({
  title,
  icon: Icon,
  link
}) {

  return (
    <div className="panel-head">

      <div>
        <Icon size={18} />

        <h3>{title}</h3>
      </div>

      {link && (
        <Link to={link}>
          View all
          <ChevronRight size={15} />
        </Link>
      )}

    </div>
  );
}


function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}


function DeviceTile({
  device,
  compact = false
}) {

  return (
    <div
      className={`device-tile ${
        compact ? "compact" : ""
      }`}
    >

      <div className="device-symbol">
        <Tv size={19} />
      </div>

      <div className="device-info">

        <strong>
          {device.name}
        </strong>

        <span>
          {device.type}

          {device.room
            ? ` · ${device.room}`
            : ""}
        </span>

      </div>

      <span
        className={`status ${
          device.status === "on"
            ? "on"
            : "off"
        }`}
      >
        {device.status}
      </span>

    </div>
  );
}


/* =========================================================
   DEVICES
========================================================= */

function Devices() {

  const [devices, setDevices] =
    useState([]);

  const [form, setForm] =
    useState({
      name: "",
      type: "",
      room: "",
      powerRatingWatts: ""
    });

  const [editing, setEditing] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  const load = async () => {

    try {

      const r =
        await api.get("/devices");

      setDevices(
        r.data.devices || []
      );

    } catch (e) {

      setError(
        getError(e)
      );

    }
  };


  useEffect(() => {

    load();

  }, []);


  /* =====================================================
     REAL-TIME DEVICE UPDATE
  ===================================================== */

  useEffect(() => {

    const onDeviceStatusUpdate =
      (updatedDevice) => {

        console.log(
          "Real-time device update:",
          updatedDevice
        );

        setDevices(
          (current) =>
            current.map(
              (device) =>
                device._id ===
                updatedDevice._id
                  ? updatedDevice
                  : device
            )
        );
      };

    socket.on(
      "deviceStatusUpdate",
      onDeviceStatusUpdate
    );

    return () => {

      socket.off(
        "deviceStatusUpdate",
        onDeviceStatusUpdate
      );

    };

  }, []);


  const submit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    try {

      const payload = {
        ...form,
        powerRatingWatts:
          form.powerRatingWatts === ""
            ? undefined
            : Number(
                form.powerRatingWatts
              )
      };

      if (editing) {

        await api.put(
          `/devices/${editing._id}`,
          payload
        );

      } else {

        await api.post(
          "/devices",
          payload
        );
      }

      setMessage(
        editing
          ? "Device updated successfully."
          : "Device added successfully."
      );

      setForm({
        name: "",
        type: "",
        room: "",
        powerRatingWatts: ""
      });

      setEditing(null);

      load();

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  const edit = (d) => {

    setEditing(d);

    setForm({
      name: d.name,
      type: d.type,
      room: d.room || "",
      powerRatingWatts:
        d.powerRatingWatts ?? ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


  const remove = async (id) => {

    if (
      !window.confirm(
        "Delete this device?"
      )
    ) {
      return;
    }

    try {

      await api.delete(
        `/devices/${id}`
      );

      load();

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  /* =====================================================
     FIXED DEVICE CONTROL
  ===================================================== */

  const control = async (d) => {

    try {

      setError("");
      setMessage("");

      const newStatus =
        d.status === "on"
          ? "off"
          : "on";

      console.log(
        "Changing device:",
        d._id,
        "to:",
        newStatus
      );

      const response =
        await api.post(
          `/devices/${d._id}/control`,
          {
            status: newStatus
          }
        );

      console.log(
        "Device control response:",
        response.data
      );

      /*
        Immediately update this tab.
        The backend will also emit
        deviceStatusUpdate through Socket.io,
        which updates other tabs.
      */

      setDevices(
        (current) =>
          current.map(
            (device) =>
              device._id === d._id
                ? response.data.device
                : device
          )
      );

      setMessage(
        `Device turned ${newStatus}.`
      );

    } catch (e) {

      console.error(
        "Device control error:",
        e
      );

      setError(
        getError(e)
      );
    }
  };


  return (
    <div className="page-stack">

      <div className="page-intro">

        <div>

          <span className="eyebrow">
            DEVICE CONTROL
          </span>

          <h2>
            Manage your connected
            devices.
          </h2>

          <p>
            Add appliances, update details
            and control their on/off status.
          </p>

        </div>

      </div>


      {(error || message) && (
        <div
          className={
            error
              ? "error-box"
              : "success-box"
          }
        >
          {error || message}
        </div>
      )}


      <div className="two-col devices-layout">

        <section className="panel form-panel">

          <PanelHead
            title={
              editing
                ? "Edit device"
                : "Add device"
            }
            icon={Plus}
          />

          <form
            onSubmit={submit}
            className="form-stack"
          >

            <label>
              Name

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
                placeholder="Air Conditioner"
              />
            </label>


            <label>
              Type

              <input
                required
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value
                  })
                }
                placeholder="Appliance"
              />
            </label>


            <label>
              Room

              <input
                value={form.room}
                onChange={(e) =>
                  setForm({
                    ...form,
                    room: e.target.value
                  })
                }
                placeholder="Bedroom"
              />
            </label>


            <label>
              Power rating (watts)

              <input
                type="number"
                min="0"
                value={
                  form.powerRatingWatts
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    powerRatingWatts:
                      e.target.value
                  })
                }
                placeholder="1200"
              />

            </label>


            <div className="form-actions">

              <button className="primary-btn">

                {editing
                  ? "Update device"
                  : "Add device"}

              </button>

              {editing && (

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {

                    setEditing(null);

                    setForm({
                      name: "",
                      type: "",
                      room: "",
                      powerRatingWatts: ""
                    });

                  }}
                >
                  Cancel
                </button>

              )}

            </div>

          </form>

        </section>


        <section className="panel">

          <PanelHead
            title={`All devices · ${devices.length}`}
            icon={Bolt}
          />

          <div className="device-list">

            {devices.map((d) => (

              <div
                className="device-card"
                key={d._id}
              >

                <DeviceTile
                  device={d}
                  compact
                />

                <div className="device-meta">

                  <span>
                    {d.powerRatingWatts
                      ? `${d.powerRatingWatts} W`
                      : "Power rating not set"}
                  </span>

                  <span>
                    {d.isOnline
                      ? "Online"
                      : "Offline"}
                  </span>

                </div>


                <div className="device-actions">

                  <button
                    className={`toggle-btn ${
                      d.status === "on"
                        ? "is-on"
                        : ""
                    }`}
                    onClick={() =>
                      control(d)
                    }
                  >

                    <Power size={16} />

                    {d.status === "on"
                      ? "Turn off"
                      : "Turn on"}

                  </button>


                  <button
                    className="icon-btn"
                    onClick={() =>
                      edit(d)
                    }
                    title="Edit"
                  >
                    <Settings size={17} />
                  </button>


                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      remove(d._id)
                    }
                    title="Delete"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>

            ))}


            {devices.length === 0 && (
              <Empty
                text="No devices added yet."
              />
            )}

          </div>

        </section>

      </div>

    </div>
  );
}


/* =========================================================
   READINGS
========================================================= */

function Readings() {

  const [devices, setDevices] =
    useState([]);

  const [readings, setReadings] =
    useState([]);

  const [form, setForm] =
    useState({
      device: "",
      energyKwh: "",
      voltage: "",
      current: "",
      recordedAt: ""
    });

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  const load = async () => {

    try {

      const [d, r] =
        await Promise.all([
          api.get("/devices"),
          api.get("/readings")
        ]);

      setDevices(
        d.data.devices || []
      );

      setReadings(
        r.data.readings || []
      );

      if (
        !form.device &&
        d.data.devices?.[0]
      ) {

        setForm((f) => ({
          ...f,
          device:
            d.data.devices[0]._id
        }));
      }

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  useEffect(() => {

    load();

  }, []);


  useEffect(() => {

    const onUsage = () => {
      load();
    };

    socket.on(
      "usageUpdate",
      onUsage
    );

    return () => {

      socket.off(
        "usageUpdate",
        onUsage
      );

    };

  }, []);


  const submit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    try {

      await api.post(
        "/readings",
        {
          device: form.device,
          energyKwh:
            Number(form.energyKwh),
          voltage: form.voltage
            ? Number(form.voltage)
            : undefined,
          current: form.current
            ? Number(form.current)
            : undefined,
          recordedAt:
            form.recordedAt ||
            undefined
        }
      );

      setMessage(
        "Reading logged successfully."
      );

      setForm((f) => ({
        ...f,
        energyKwh: "",
        voltage: "",
        current: "",
        recordedAt: ""
      }));

      load();

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  return (
    <div className="page-stack">

      <div className="page-intro">

        <div>

          <span className="eyebrow">
            ENERGY DATA
          </span>

          <h2>
            Log and monitor usage.
          </h2>

          <p>
            Every new reading can be
            streamed through Socket.io
            in real time.
          </p>

        </div>

      </div>


      {(error || message) && (
        <div
          className={
            error
              ? "error-box"
              : "success-box"
          }
        >
          {error || message}
        </div>
      )}


      <div className="two-col">

        <section className="panel form-panel">

          <PanelHead
            title="Add reading"
            icon={Activity}
          />

          <form
            onSubmit={submit}
            className="form-stack"
          >

            <label>
              Device

              <select
                required
                value={form.device}
                onChange={(e) =>
                  setForm({
                    ...form,
                    device:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Select a device
                </option>

                {devices.map((d) => (
                  <option
                    key={d._id}
                    value={d._id}
                  >
                    {d.name}
                  </option>
                ))}

              </select>

            </label>


            <label>
              Energy usage (kWh)

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={
                  form.energyKwh
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    energyKwh:
                      e.target.value
                  })
                }
                placeholder="2.5"
              />

            </label>


            <label>
              Voltage (optional)

              <input
                type="number"
                min="0"
                step="0.1"
                value={form.voltage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    voltage:
                      e.target.value
                  })
                }
                placeholder="230"
              />

            </label>


            <label>
              Current (optional)

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.current}
                onChange={(e) =>
                  setForm({
                    ...form,
                    current:
                      e.target.value
                  })
                }
                placeholder="5.2"
              />

            </label>


            <label>
              Recorded at (optional)

              <input
                type="datetime-local"
                value={
                  form.recordedAt
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    recordedAt:
                      e.target.value
                  })
                }
              />

            </label>


            <button className="primary-btn">
              Log reading
            </button>

          </form>

        </section>


        <section className="panel">

          <PanelHead
            title={`Recent readings · ${readings.length}`}
            icon={BarChart3}
          />

          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>Device</th>
                  <th>Usage</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Time</th>
                </tr>

              </thead>

              <tbody>

                {readings
                  .slice(0, 20)
                  .map((r) => (

                    <tr key={r._id}>

                      <td>

                        <strong>
                          {r.device?.name ||
                            "Device"}
                        </strong>

                        <small>
                          {r.device?.room ||
                            ""}
                        </small>

                      </td>

                      <td>
                        {r.energyKwh} kWh
                      </td>

                      <td>
                        {r.voltage ?? "—"}
                      </td>

                      <td>
                        {r.current ?? "—"}
                      </td>

                      <td>
                        {new Date(
                          r.recordedAt
                        ).toLocaleString()}
                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>


            {readings.length === 0 && (
              <Empty
                text="No readings yet."
              />
            )}

          </div>

        </section>

      </div>

    </div>
  );
}


/* =========================================================
   BILLS
========================================================= */

function Bills() {

  const [bill, setBill] =
    useState(null);

  const [prediction, setPrediction] =
    useState(null);

  const [monthly, setMonthly] =
    useState(null);

  const [rate, setRate] =
    useState(8);

  const [days, setDays] =
    useState(30);

  const [error, setError] =
    useState("");


  const load = async () => {

    try {

      const [b, p, m] =
        await Promise.all([
          api.get(
            `/bills?ratePerKwh=${rate}`
          ),
          api.get(
            `/bills/predict?days=${days}&ratePerKwh=${rate}`
          ),
          api.get(
            `/bills/monthly?ratePerKwh=${rate}`
          )
        ]);

      setBill(b.data);
      setPrediction(p.data);
      setMonthly(m.data);

      setError("");

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  useEffect(() => {

    load();

  }, []);


  return (
    <div className="page-stack">

      <div className="page-intro">

        <div>

          <span className="eyebrow">
            COST ANALYTICS
          </span>

          <h2>
            Estimate your energy bill.
          </h2>

          <p>
            Use your stored readings to
            estimate current and future
            costs.
          </p>

        </div>

      </div>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      <section className="panel controls-row">

        <label>
          Rate per kWh

          <input
            type="number"
            min="0"
            step="0.1"
            value={rate}
            onChange={(e) =>
              setRate(e.target.value)
            }
          />

        </label>


        <label>
          Prediction days

          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) =>
              setDays(e.target.value)
            }
          />

        </label>


        <button
          className="primary-btn"
          onClick={load}
        >
          Recalculate
        </button>

      </section>


      <div className="stats-grid">

        <StatCard
          icon={CircleDollarSign}
          label="Current estimate"
          value={
            bill
              ? `₹${bill.estimatedBill}`
              : "—"
          }
          note={`${bill?.totalKwh ?? 0} kWh`}
        />

        <StatCard
          icon={Gauge}
          label="Average daily"
          value={
            prediction
              ? `${prediction.averageDailyKwh} kWh`
              : "—"
          }
          note={`${prediction?.observedDays ?? 0} observed days`}
        />

        <StatCard
          icon={BarChart3}
          label="Predicted usage"
          value={
            prediction
              ? `${prediction.predictedKwh} kWh`
              : "—"
          }
          note={`${prediction?.predictionDays ?? days} days`}
        />

        <StatCard
          icon={Sparkles}
          label="Predicted bill"
          value={
            prediction
              ? `₹${prediction.predictedBill}`
              : "—"
          }
          note="Based on current readings"
        />

      </div>


      <section className="panel">

        <PanelHead
          title="This month"
          icon={CircleDollarSign}
        />

        <div className="monthly-card">

          <div>
            <span>
              Estimated bill
            </span>

            <strong>
              ₹{monthly?.estimatedBill ?? "—"}
            </strong>
          </div>

          <div>
            <span>
              Usage
            </span>

            <strong>
              {monthly?.totalKwh ?? "—"} kWh
            </strong>
          </div>

          <div>
            <span>
              Readings
            </span>

            <strong>
              {monthly?.totalReadings ?? "—"}
            </strong>
          </div>

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   TIPS
========================================================= */
function Tips({ user }) {
  const [tips, setTips] = useState([]);

  const [recommendations, setRecommendations] =
    useState([]);

  const [usage, setUsage] = useState({
    readingsCount: 0,
    averageKwh: 0
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    estimatedSavingPercent: ""
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setError("");

      const response =
        await api.get("/tips");

      setTips(
        response.data.tips || []
      );

      setRecommendations(
        response.data.recommendations || []
      );

      setUsage(
        response.data.usage || {
          readingsCount: 0,
          averageKwh: 0
        }
      );
    } catch (e) {
      setError(getError(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      await api.post("/tips", {
        ...form,
        estimatedSavingPercent:
          form.estimatedSavingPercent !== ""
            ? Number(
                form.estimatedSavingPercent
              )
            : undefined
      });

      setMessage(
        "Tip added successfully."
      );

      setForm({
        title: "",
        description: "",
        category: "general",
        estimatedSavingPercent: ""
      });

      await load();
    } catch (e) {
      setError(getError(e));
    }
  };

  return (
    <div className="page-stack">

      <div className="page-intro">
        <div>
          <span className="eyebrow">
            SMART SAVINGS
          </span>

          <h2>
            Small changes, lower usage.
          </h2>

          <p>
            EcoMeter analyzes your recent
            energy usage and provides
            personalized recommendations.
          </p>
        </div>
      </div>

      {(error || message) && (
        <div
          className={
            error
              ? "error-box"
              : "success-box"
          }
        >
          {error || message}
        </div>
      )}

      {/* USAGE SUMMARY */}

      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">
              YOUR USAGE
            </span>

            <h3>
              Usage analysis
            </h3>

            <p>
              Based on your 10 most recent
              energy readings.
            </p>
          </div>
        </div>

        <div className="usage-summary">
        <div className="summary-card">
          <span>Readings analyzed</span>
          <strong>{usage.readingsCount}</strong>
        </div>

        <div className="summary-card">
          <span>Average usage</span>
          <strong>{usage.averageKwh} kWh</strong>
        </div>
      </div>


      </section>

      {/* PERSONALIZED TIPS */}

      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">
              PERSONALIZED
            </span>

            <h3>
              Recommendations for you
            </h3>

            <p>
              These recommendations are
              based on your recent usage.
            </p>
          </div>
        </div>

        <div className="tip-grid">

          {recommendations.map(
            (tip, index) => (

              <div
                className="tip-card"
                key={index}
              >

                <div className="tip-icon">
                  <Lightbulb size={19} />
                </div>

                <span className="tag">
                  {tip.category}
                </span>

                <h3>
                  {tip.title}
                </h3>

                <p>
                  {tip.description}
                </p>

              </div>

            )
          )}

        </div>

      </section>

      {/* GENERAL TIPS */}

      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">
              ENERGY TIPS
            </span>

            <h3>
              General energy-saving tips
            </h3>

            <p>
              Additional recommendations
              for reducing electricity usage.
            </p>
          </div>
        </div>

        <div className="tip-grid">

          {tips.map((tip) => (

            <div
              className="tip-card"
              key={tip._id}
            >

              <div className="tip-icon">
                <Lightbulb size={19} />
              </div>

              <span className="tag">
                {tip.category}
              </span>

              <h3>
                {tip.title}
              </h3>

              <p>
                {tip.description}
              </p>

              {tip.estimatedSavingPercent !=
                null && (
                <strong>
                  Potential saving:{" "}
                  {tip.estimatedSavingPercent}%
                </strong>
              )}

            </div>

          ))}

          {tips.length === 0 && (
            <Empty
              text="No general tips available yet."
            />
          )}

        </div>

      </section>

      {/* ADMIN */}

      {user?.role === "admin" && (

        <section className="panel">

          <PanelHead
            title="Add tip (admin)"
            icon={Plus}
          />

          <form
            onSubmit={add}
            className="admin-tip-form"
          >

            <input
              required
              placeholder="Tip title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />

            <input
              required
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value
                })
              }
            />

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category:
                    e.target.value
                })
              }
            />

            <input
              type="number"
              min="0"
              max="100"
              placeholder="Saving %"
              value={
                form.estimatedSavingPercent
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  estimatedSavingPercent:
                    e.target.value
                })
              }
            />

            <button
              type="submit"
              className="primary-btn"
            >
              Add tip
            </button>

          </form>

        </section>

      )}

    </div>
  );
}
/* =========================================================
   ALERTS
========================================================= */

function Alerts() {

  const [alerts, setAlerts] =
    useState([]);

  const [readings, setReadings] =
    useState([]);

  const [form, setForm] =
    useState({
      readingId: "",
      thresholdKwh: ""
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  const load = async () => {

    try {

      const [a, r] =
        await Promise.all([
          api.get("/alerts"),
          api.get("/readings")
        ]);

      setAlerts(
        a.data.alerts || []
      );

      setReadings(
        r.data.readings || []
      );

      if (
        !form.readingId &&
        r.data.readings?.[0]
      ) {

        setForm((f) => ({
          ...f,
          readingId:
            r.data.readings[0]._id
        }));
      }

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  useEffect(() => {

    load();

    const onAlert = () => {
      load();
    };

    socket.on(
      "usageAlert",
      onAlert
    );

    return () => {

      socket.off(
        "usageAlert",
        onAlert
      );

    };

  }, []);


  const check = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");

    try {

      const r =
        await api.post(
          "/alerts/check",
          {
            readingId:
              form.readingId,
            thresholdKwh:
              Number(
                form.thresholdKwh
              )
          }
        );

      setMessage(
        r.data.alertTriggered
          ? "High-usage alert created."
          : "Usage is within the threshold."
      );

      load();

    } catch (e) {

      setError(
        getError(e)
      );
    }
  };


  return (
    <div className="page-stack">

      <div className="page-intro">

        <div>

          <span className="eyebrow">
            USAGE ALERTS
          </span>

          <h2>
            Stay ahead of unusual usage.
          </h2>

          <p>
            Check a reading against a
            threshold and receive real-time
            Socket.io alerts.
          </p>

        </div>

      </div>


      {(error || message) && (
        <div
          className={
            error
              ? "error-box"
              : "success-box"
          }
        >
          {error || message}
        </div>
      )}


      <div className="two-col">

        <section className="panel form-panel">

          <PanelHead
            title="Check threshold"
            icon={AlertTriangle}
          />

          <form
            onSubmit={check}
            className="form-stack"
          >

            <label>
              Reading

              <select
                required
                value={form.readingId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    readingId:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Select a reading
                </option>

                {readings.map((r) => (

                  <option
                    key={r._id}
                    value={r._id}
                  >
                    {r.device?.name ||
                      "Device"}
                    {" · "}
                    {r.energyKwh} kWh
                  </option>

                ))}

              </select>

            </label>


            <label>
              Threshold (kWh)

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={
                  form.thresholdKwh
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    thresholdKwh:
                      e.target.value
                  })
                }
                placeholder="5"
              />

            </label>


            <button className="primary-btn">
              Check usage
            </button>

          </form>

        </section>


        <section className="panel">

          <PanelHead
            title={`Alert history · ${alerts.length}`}
            icon={Bell}
          />

          <div className="alert-list">

            {alerts.map((a) => (

              <div
                className="alert-item"
                key={a._id}
              >

                <div className="alert-symbol">
                  <AlertTriangle size={17} />
                </div>

                <div>

                  <strong>
                    {a.message}
                  </strong>

                  <span>
                    {a.device?.name ||
                      "Device"}
                    {" · threshold "}
                    {a.thresholdKwh}
                    {" kWh · actual "}
                    {a.actualKwh}
                    {" kWh"}
                  </span>

                  <small>
                    {new Date(
                      a.createdAt
                    ).toLocaleString()}
                  </small>

                </div>

              </div>

            ))}


            {alerts.length === 0 && (
              <Empty
                text="No alerts yet."
              />
            )}

          </div>

        </section>

      </div>

    </div>
  );
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function Notifications() {
  const [fcmToken, setFcmToken] = useState("");

  const [notificationStatus, setNotificationStatus] =
    useState("Not enabled");

  const [statusType, setStatusType] =
    useState("neutral");

  const [form, setForm] = useState({
    title: "EcoMeter Alert",
    body:
      "Your energy usage is above the selected threshold."
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const enableNotifications = async () => {
    try {
      setMessage("");
      setError("");

      setNotificationStatus(
        "Requesting permission..."
      );

      setStatusType("loading");

      const token =
        await requestNotificationPermission();

      setNotificationStatus(
        "Registering this device..."
      );

      const response = await api.post(
        "/notifications/register-token",
        {
          token
        }
      );

      setFcmToken(token);

      setNotificationStatus(
        "Notifications enabled"
      );

      setStatusType("success");

      setMessage(
        response.data.message ||
          "This device is registered for EcoMeter notifications."
      );
    } catch (error) {
      console.error(
        "Notification setup error:",
        error
      );

      setNotificationStatus(
        "Notifications not enabled"
      );

      setStatusType("error");

      setError(
        getError(error)
      );
    }
  };

  useEffect(() => {
    /*
     * Listen for Firebase messages while the
     * EcoMeter tab is open and active.
     */
    const unsubscribe =
      listenForMessages((payload) => {
        console.log(
          "Foreground FCM message:",
          payload
        );

        const title =
          payload.notification?.title ||
          "EcoMeter Alert";

        const body =
          payload.notification?.body ||
          "New energy alert received.";

        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(
            title,
            {
              body
            }
          );
        }
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendTestNotification = async (
    event
  ) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      if (!fcmToken) {
        setError(
          "Please enable push notifications first."
        );

        return;
      }

      const response = await api.post(
        "/notifications/send",
        {
          token: fcmToken,

          title: form.title,

          body: form.body,

          data: {
            type: "test"
          }
        }
      );

      setMessage(
        response.data.message ||
          "Test notification sent successfully."
      );
    } catch (error) {
      console.error(
        "Test notification error:",
        error
      );

      setError(
        getError(error)
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            ECOMETER / HOME
          </div>

          <h1>Notifications</h1>

          <p>
            Manage push notifications and
            receive real-time energy usage alerts.
          </p>
        </div>
      </div>

      <div className="notification-grid">

        {/* Push notification setup */}
        <section className="notification-card">
          <div className="notification-card-header">
            <div>
              <h2>Push Notifications</h2>

              <p>
                Allow EcoMeter to notify you when
                your energy usage crosses a
                selected threshold.
              </p>
            </div>

            <div
              className={`notification-status ${statusType}`}
            >
              <span className="status-dot"></span>

              {notificationStatus}
            </div>
          </div>

          <div className="notification-divider"></div>

          <div className="notification-info">
            <div className="notification-info-item">
              <span className="info-label">
                Browser permission
              </span>

              <span className="info-value">
                {typeof Notification !==
                  "undefined"
                  ? Notification.permission
                  : "unsupported"}
              </span>
            </div>

            <div className="notification-info-item">
              <span className="info-label">
                Device registration
              </span>

              <span className="info-value">
                {fcmToken
                  ? "Registered"
                  : "Not registered"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="primary-btn notification-enable-btn"
            onClick={enableNotifications}
          >
            {fcmToken
              ? "Refresh notification access"
              : "Enable push notifications"}
          </button>
        </section>


        {/* Test notification */}
        <section className="notification-card">
          <div className="notification-card-header">
            <div>
              <h2>Send Test Notification</h2>

              <p>
                Send a test push notification to
                this browser to verify your Firebase
                setup.
              </p>
            </div>
          </div>

          <div className="notification-divider"></div>

          <form
            className="notification-form"
            onSubmit={
              sendTestNotification
            }
          >
            <div className="notification-field">
              <label htmlFor="notification-title">
                Notification title
              </label>

              <input
                id="notification-title"
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value
                  })
                }
                placeholder="EcoMeter Alert"
                required
              />
            </div>

            <div className="notification-field">
              <label htmlFor="notification-body">
                Notification message
              </label>

              <textarea
                id="notification-body"
                rows="4"
                value={form.body}
                onChange={(e) =>
                  setForm({
                    ...form,
                    body:
                      e.target.value
                  })
                }
                placeholder="Enter notification message..."
                required
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!fcmToken}
            >
              {fcmToken
                ? "Send test notification"
                : "Enable notifications first"}
            </button>
          </form>
        </section>

      </div>

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}
    </div>
  );
}


export default App;