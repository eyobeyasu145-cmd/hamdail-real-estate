import { NavLink } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineUserCircle,
  HiOutlineLibrary,
  HiOutlineChatAlt2,
  HiOutlineMail,
} from "react-icons/hi";

const navItems = [
  { name: "Overview", icon: HiOutlineViewGrid, path: "/admin-dashboard" },
  { name: "Users", icon: HiOutlineUsers, path: "/admin/users" },
  {
    name: "Seller Requests",
    icon: HiOutlineUserCircle,
    path: "/admin/seller-requests",
  },
  { name: "Properties", icon: HiOutlineLibrary, path: "/admin/properties" },
  { name: "Inquiries", icon: HiOutlineChatAlt2, path: "/admin/inquiries" },
  { name: "Contact Inbox", icon: HiOutlineMail, path: "/admin/contacts" },
];

export default function AdminSidebar() {
  return (
    <aside className="bg-dark text-white p-3 h-100">
      <h5 className="mb-4">Admin Panel</h5>

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
