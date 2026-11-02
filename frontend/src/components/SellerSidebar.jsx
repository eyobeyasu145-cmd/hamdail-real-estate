import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineSupport,
} from "react-icons/hi";

const navItems = [
  { name: "Dashboard", icon: HiOutlineViewGrid, path: "/dashboard" },
  {
    name: "My Listings",
    icon: HiOutlineClipboardList,
    path: "/my-properties",
  },
  { name: "Profile", icon: HiOutlineUser, path: "/profile" },
  { name: "Support", icon: HiOutlineSupport, path: "/contact" },
];

export default function SellerSidebar() {
  const { user } = useAuth();
  return (
    <aside className="bg-dark text-white p-3 h-100">
      <h5 className="mb-4">{user?.role === "agent" ? "Agent Panel" : "Seller Panel"}</h5>

      <nav className="nav flex-column gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 rounded ${
                  isActive ? "bg-primary text-white" : "text-white"
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
