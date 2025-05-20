import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/types/menuItem';
import MenuItemForm from '@/components/admin/forms/MenuItemForm';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming you have these shadcn/ui table components
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3002/menuItems';

export function ManageMenusPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch menu items: ${response.statusText}`);
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleAddNew = () => {
    setEditingMenuItem(null);
    setShowForm(true);
  };

  const handleEdit = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete menu item');
        }
        fetchMenuItems(); // Refresh the list
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveMenuItem = async (menuItemToSave: MenuItem) => {
    setIsLoading(true);
    setError(null);
    const method = menuItemToSave.id ? 'PUT' : 'POST';
    const url = menuItemToSave.id ? `${API_URL}/${menuItemToSave.id}` : API_URL;

    // Construct payload: include ID for PUT, exclude for POST if it's not yet defined
    let payload: Partial<MenuItem>;
    if (method === 'PUT') {
      payload = { ...menuItemToSave };
    } else { // POST (new item)
      const { id, ...newItemPayload } = menuItemToSave; // Destructure to exclude id
      payload = newItemPayload;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save menu item`);
      }
      setShowForm(false);
      setEditingMenuItem(null);
      fetchMenuItems(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMenuItem(null);
  };

  if (isLoading && !menuItems.length) {
    return <p>Loading menu items...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  const headerMenuItems = menuItems.filter(item => item.menuLocation === 'header').sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const footerMenuItems = menuItems.filter(item => item.menuLocation === 'footer').sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

  const renderMenuTable = (title: string, items: MenuItem[]) => (
    <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {isLoading && items.length === 0 && <p>Updating {title.toLowerCase()}...</p>} 
      {isLoading && items.length > 0 && <p>Updating {title.toLowerCase()}...</p>} 
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.url}</TableCell>
                <TableCell>{item.order !== undefined ? item.order : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="mr-2">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No menu items found for this location.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Manage Menus</h1>
        <Button onClick={handleAddNew} className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Menu Item
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-2xl font-semibold mb-4">
            {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <MenuItemForm
            menuItem={editingMenuItem}
            onSave={handleSaveMenuItem}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Render table for Header menu items */}
      {renderMenuTable("Header Menu Items", headerMenuItems)}

      {/* Render table for Footer menu items */}
      {renderMenuTable("Footer Menu Items", footerMenuItems)}
    </div>
  );
}
