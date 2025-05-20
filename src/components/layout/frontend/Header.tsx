import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '@/types/menuItem'; 

const API_URL = 'http://localhost:3002/menuItems';

export function Header() {
  const [headerMenuItems, setHeaderMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeaderItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}?menuLocation=header`);
        if (!response.ok) {
          throw new Error('Failed to fetch header menu items');
        }
        const data = await response.json();
        // Sort by order property
        const sortedData = data.sort((a: MenuItem, b: MenuItem) => (a.order ?? Infinity) - (b.order ?? Infinity));
        setHeaderMenuItems(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeaderItems();
  }, []);

  return (
    <header className="bg-gray-100 dark:bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800 dark:text-white">
          <Link to="/">MySite Logo</Link> 
        </div>
        <nav>
          {isLoading && <p className="text-gray-600 dark:text-gray-300">Loading menu...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && (
            <ul className="flex space-x-4">
              {headerMenuItems.map((item) => (
                <li key={item.id}>
                  <Link 
                    to={item.url} 
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}
