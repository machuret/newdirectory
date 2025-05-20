import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Rss, Database, KeyRound, MenuSquare, UploadCloud, Store, Tag, Sparkles, Star, HelpCircle, Palette } from 'lucide-react'; // Icons for sidebar

export function AdminLayout() {
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="mr-2 h-5 w-5" /> },
    // Content Management
    { to: '/admin/manage-content-pages', label: 'Manage Pages', icon: <FileText className="mr-2 h-5 w-5" /> },
    { to: '/admin/manage-blog-posts', label: 'Manage Blog Posts', icon: <Rss className="mr-2 h-5 w-5" /> },
    { to: '/admin/manage-menus', label: 'Manage Menus', icon: <MenuSquare className="mr-2 h-5 w-5" /> },
    { to: '/admin/customise/home', label: 'Homepage Content', icon: <Palette className="mr-2 h-5 w-5" /> },
    // Listings Management
    { to: '/admin/manage-listings', label: 'Manage Listings', icon: <Store className="mr-2 h-5 w-5" /> },
    { to: '/admin/manage-categories', label: 'Manage Categories', icon: <Tag className="mr-2 h-5 w-5" /> },
    { to: '/admin/featured', label: 'Featured Listings', icon: <Star className="mr-2 h-5 w-5" /> },
    { to: '/admin/import-listings', label: 'Import Listings (JSON URL)', icon: <Database className="mr-2 h-5 w-5" /> },
    { to: '/admin/api-importer', label: 'Apify Importer', icon: <UploadCloud className="mr-2 h-5 w-5" /> },
    { to: '/admin/ai-prompts', label: 'AI Description Generator', icon: <Sparkles className="mr-2 h-5 w-5" /> },
    { to: '/admin/enhance-faq', label: 'AI FAQ Generator', icon: <HelpCircle className="mr-2 h-5 w-5" /> },
    // System
    { to: '/admin/settings', label: 'Settings', icon: <Settings className="mr-2 h-5 w-5" /> },
    { to: '/admin/settings/manage-apis', label: 'Manage APIs', icon: <KeyRound className="mr-2 h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Admin Panel
        </h1>
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <Outlet /> {/* This is where nested routes will render their components */}
      </main>
    </div>
  );
}
