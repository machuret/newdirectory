import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '@/types/menuItem'; 

const API_URL = 'http://localhost:3002/menuItems';

export function Footer() {
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFooterItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}?menuLocation=footer`);
        if (!response.ok) {
          throw new Error('Failed to fetch footer menu items');
        }
        const data = await response.json();
        // Sort by order property
        const sortedData = data.sort((a: MenuItem, b: MenuItem) => (a.order ?? Infinity) - (b.order ?? Infinity));
        setFooterMenuItems(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooterItems();
  }, []);

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 p-4 mt-auto">
      <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} MySite. All rights reserved.</p>
        {isLoading && <p className="mt-2">Loading menu...</p>}
        {error && <p className="mt-2 text-red-500">Error: {error}</p>}
        {!isLoading && !error && footerMenuItems.length > 0 && (
          <div className="mt-2">
            {footerMenuItems.map((item) => (
              <Link 
                key={item.id} 
                to={item.url} 
                className="hover:text-blue-500 dark:hover:text-blue-400 mx-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
        {!isLoading && !error && footerMenuItems.length === 0 && (
           <p className="mt-2">No footer links configured.</p>
        )}
      </div>
    </footer>
  );
}
