import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        Mezban <small>Table Reservations</small>
      </Link>
      <nav>
        <Link to="/browse">Browse Tables</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {!user ? (
          <Link to="/login" className="pill" style={{ textDecoration: "none" }}>
            Sign in
          </Link>
        ) : (
          <button onClick={handleLogout}>Sign out</button>
        )}
      </nav>
    </header>
  );
}
