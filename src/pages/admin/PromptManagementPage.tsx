import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getApiBaseUrl } from '@/lib/api';

// Define interface for prompt data
interface Prompt {
  id: number;
  name: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function PromptManagementPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    type: 'description',
    content: '',
  });

  // Fetch prompts on component mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Fetch all prompts
  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/prompts`);
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prompts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new prompt
  const createPrompt = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrompt),
      });

      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }

      toast({
        title: 'Success',
        description: 'Prompt created successfully.',
      });

      setIsCreateDialogOpen(false);
      setNewPrompt({
        name: '',
        type: 'description',
        content: '',
      });
      fetchPrompts();
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prompt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Update an existing prompt
  const updatePrompt = async () => {
    if (!currentPrompt) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/prompts/${currentPrompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentPrompt.name,
          type: currentPrompt.type,
          content: currentPrompt.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      toast({
        title: 'Success',
        description: 'Prompt updated successfully.',
      });

      setIsEditDialogOpen(false);
      fetchPrompts();
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prompt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete a prompt
  const deletePrompt = async () => {
    if (!currentPrompt) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/prompts/${currentPrompt.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      toast({
        title: 'Success',
        description: 'Prompt deleted successfully.',
      });

      setIsDeleteDialogOpen(false);
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete prompt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Prompt Management</CardTitle>
              <CardDescription>
                Create and manage prompts for AI-generated content
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Prompt
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {prompts.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No prompts found. Create your first prompt to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prompts.map((prompt) => (
                        <TableRow key={prompt.id}>
                          <TableCell className="font-medium">{prompt.name}</TableCell>
                          <TableCell>
                            <span className="capitalize">{prompt.type}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(prompt.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPrompt(prompt);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPrompt(prompt);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Prompt Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>
                Create a new AI prompt template. Use placeholders like {'{name}'}, {'{business_type}'}, etc. which will be replaced with actual data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prompt-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="prompt-name"
                  className="col-span-3"
                  placeholder="e.g., Business Description"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prompt-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newPrompt.type}
                  onValueChange={(value) => setNewPrompt({ ...newPrompt, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="prompt-content" className="text-right pt-2">
                  Content
                </Label>
                <Textarea
                  id="prompt-content"
                  className="col-span-3"
                  rows={10}
                  placeholder="Enter prompt content with placeholders like {name}, {business_type}, etc."
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                />
              </div>
              <div className="col-span-4">
                <div className="bg-muted rounded-md p-3 text-sm">
                  <p className="font-medium">Available placeholders:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>{'{name}'} - The name of the business</li>
                    <li>{'{business_type}'} - The type of business</li>
                    <li>{'{location}'} - The location of the business</li>
                    <li>{'{rating_info}'} - Rating information if available</li>
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createPrompt}>Create Prompt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Prompt Dialog */}
        {currentPrompt && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Edit Prompt</DialogTitle>
                <DialogDescription>
                  Update the prompt template. Use placeholders like {'{name}'}, {'{business_type}'}, etc. which will be replaced with actual data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-prompt-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-prompt-name"
                    className="col-span-3"
                    value={currentPrompt.name}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-prompt-type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={currentPrompt.type}
                    onValueChange={(value) => setCurrentPrompt({ ...currentPrompt, type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="description">Description</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-prompt-content" className="text-right pt-2">
                    Content
                  </Label>
                  <Textarea
                    id="edit-prompt-content"
                    className="col-span-3"
                    rows={10}
                    value={currentPrompt.content}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                  />
                </div>
                <div className="col-span-4">
                  <div className="bg-muted rounded-md p-3 text-sm">
                    <p className="font-medium">Available placeholders:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{'{name}'} - The name of the business</li>
                      <li>{'{business_type}'} - The type of business</li>
                      <li>{'{location}'} - The location of the business</li>
                      <li>{'{rating_info}'} - Rating information if available</li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updatePrompt}>Update Prompt</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {currentPrompt && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Prompt</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this prompt? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>
                  <strong>Name:</strong> {currentPrompt.name}
                </p>
                <p>
                  <strong>Type:</strong> {currentPrompt.type}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={deletePrompt}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
