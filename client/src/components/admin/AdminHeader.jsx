"use client";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
const AdminHeader = ({ setSidebarOpen, pageTitle, user }) => {
  return (
    <div className="sticky z-40 flex items-center h-16 px-4 bg-white border-b border-gray-200 shadow-sm top-10 shrink-0 gap-x-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="w-6 h-6" aria-hidden="true" />
      </button>
      {/* Separator */}
      <div className="w-px h-6 bg-gray-200 lg:hidden" aria-hidden="true" />
      <div className="flex self-stretch flex-1 gap-x-4 lg:gap-x-6">
        {/* Page Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold leading-6 text-gray-900">{pageTitle}</h1>
        </div>
        <div className="flex items-center ml-auto gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <BellIcon className="w-6 h-6" aria-hidden="true" />
          </button>
          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
          {/* Profile */}
          <div className="flex items-center gap-x-4">
            <div className="hidden lg:flex lg:flex-col lg:items-end lg:leading-6">
              <div className="text-sm font-semibold text-gray-900">{user?.name || "Admin User"}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role || "admin"}</div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
              <span className="text-sm font-medium text-white">{(user?.name || "A").charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminHeader;