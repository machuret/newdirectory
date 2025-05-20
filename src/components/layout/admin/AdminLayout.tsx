import React from 'react';
// We will use simple <a> tags for navigation with hash routing.
// For more complex routing or active state management, libraries like React Router are typically used.

interface AdminMenuItem {
  label: string;
  path: string;
  // icon?: React.ReactNode; // Future: For icons like from lucide-react
}

const adminMenuItems: AdminMenuItem[] = [
  { label: 'Dashboard', path: '#/admin' },
  { label: 'Manage Users', path: '#/admin/users' },
  { label: 'Manage Listings', path: '#/admin/listings' },
  { label: 'Manage Sections', path: '#/admin/sections' },
  { label: 'Manage Menus', path: '#/admin/menus' },
  { label: 'Manage Blog Posts', path: '#/admin/blog' },
  { label: 'Manage Pages', path: '#/admin/pages' }, // Content pages
  { label: 'Manage API Keys', path: '#/admin/apikeys' },
  { label: 'Import Listings', path: '#/admin/import' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string; // Passed from App.tsx to determine active link
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <a href="#/admin" className="text-2xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Admin Panel
          </a>
        </div>
        <nav className="mt-5 flex-grow">
          <ul className="space-y-1">
            {adminMenuItems.map((item) => {
              // Basic active check: currentPath starts with item.path
              // More specific for dashboard: currentPath is exactly '#/admin' or '#/admin/'
              const isActive = item.path === '#/admin' 
                ? (currentPath === '#/admin' || currentPath === '#/admin/') 
                : currentPath.startsWith(item.path);

              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={`
                      block px-5 py-3 text-sm font-medium transition-colors duration-150 
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-300
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                        : 'text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {/* item.icon && <span className="mr-3">{item.icon}</span> */}
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-5 mt-auto border-t border-gray-200 dark:border-gray-700">
            <a href="#/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
                &larr; Back to Site
            </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
