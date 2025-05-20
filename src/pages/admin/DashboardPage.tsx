import { Link } from 'react-router-dom';

export function DashboardPage() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Welcome to the admin panel. From here you can manage your site's content and settings.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/manage-content-pages" className="block p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">Manage Pages</h2>
          <p>Create, edit, and delete content pages.</p>
        </Link>
        <Link to="/admin/manage-blog-posts" className="block p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">Manage Blog Posts</h2>
          <p>Write, edit, and publish blog articles.</p>
        </Link>
        <Link to="/admin/settings" className="block p-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">Site Settings</h2>
          <p>Configure global site settings.</p>
        </Link>
      </div>
    </div>
  );
}
