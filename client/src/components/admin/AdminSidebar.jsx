"use client";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingBagIcon,
  PhotoIcon,
  UsersIcon,
  LightBulbIcon,
  TicketIcon,
  QuestionMarkCircleIcon,
  SparklesIcon, // Replaced ShirtIcon with SparklesIcon as ShirtIcon doesn't exist in Heroicons
} from "@heroicons/react/24/outline";
const AdminSidebar = ({ sidebarOpen, setSidebarOpen, userRole }) => {
  const location = useLocation();
  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
    { name: "Products", href: "/admin/products", icon: CubeIcon },
    { name: "Categories", href: "/admin/categories", icon: TagIcon },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBagIcon },
    { name: "Banners", href: "/admin/banners", icon: PhotoIcon },
    { name: "Innovations", href: "/admin/innovations", icon: LightBulbIcon },
    { name: "Kasuni T-Shirt Style", href: "/admin/ksaunitshirtstyle", icon: SparklesIcon },
    { name: "Feedback", href: "/admin/cancellation", icon: QuestionMarkCircleIcon } 
  ];
  // Admin-only navigation items
  const adminOnlyNavigation = [
    { name: "Users", href: "/admin/users", icon: UsersIcon },
    { name: "Coupons", href: "/admin/coupons", icon: TicketIcon },
  ];
  const allNavigation = userRole === "admin" ? [...navigation, ...adminOnlyNavigation] : navigation;
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {allNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? "" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-900/80" />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {allNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default AdminSidebar;