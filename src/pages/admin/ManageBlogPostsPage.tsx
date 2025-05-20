import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '../../types/blogPost'; 
import { Button } from '../../components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { BlogPostForm } from '../../components/admin/forms/BlogPostForm'; 
import { blogPostsApi } from '../../services/apiService';

export function ManageBlogPostsPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false); 
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [submissionError, setSubmissionError] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlogPosts = useCallback(async () => {
    setError(null); 
    try {
      console.log('Fetching blog posts using API service');
      const data = await blogPostsApi.getAllPosts();
      console.log('Fetched blog posts:', data);
      setBlogPosts(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  const handleAddNewPost = () => {
    setEditingPost(null); 
    setShowForm(true); 
    setSubmissionError(null); 
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post); 
    setShowForm(true); 
  };

  const saveBlogPost = async (postData: any) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const isEditing = !!postData.id;
      console.log(`${isEditing ? 'Updating' : 'Creating'} blog post with data:`, postData);

      if (isEditing && postData.id) {
        await blogPostsApi.updatePost(postData.id.toString(), postData);
      } else {
        await blogPostsApi.createPost(postData);
      }

      await fetchBlogPosts(); 
      setShowForm(false);
      setEditingPost(null);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await blogPostsApi.deletePost(postId.toString());
      console.log('Blog post deleted successfully');
      // Remove the deleted post from state
      setBlogPosts(blogPosts.filter(post => post.id.toString() !== postId.toString()));
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setSubmissionError(null);
  };

  if (isLoading && !blogPosts.length) {
    return <div>Loading blog posts...</div>;
  }

  if (error && !blogPosts.length) {
    return <div className="error-container">
      <h2>Error loading blog posts</h2>
      <p>{error}</p>
      <Button onClick={fetchBlogPosts}>Try Again</Button>
    </div>;
  }

  if (showForm) {
    return (
      <div className="admin-container">
        <h1>{editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
        {submissionError && (
          <div className="error-message">
            <p>{submissionError}</p>
          </div>
        )}
        <BlogPostForm 
          post={editingPost}
          onSave={saveBlogPost}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
          submissionError={submissionError}
        />
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="header-actions">
        <h1>Manage Blog Posts</h1>
        <Button onClick={handleAddNewPost} className="primary-button">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Post
        </Button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <Button onClick={fetchBlogPosts} variant="outline" size="sm">Try Again</Button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Published At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.slug}</td>
                  <td>{post.status || 'draft'}</td>
                  <td>
                    {post.published_at 
                      ? new Date(post.published_at).toLocaleDateString() 
                      : 'Not published'}
                  </td>
                  <td className="actions-cell">
                    <Button
                      onClick={() => handleEditPost(post)}
                      variant="ghost"
                      size="sm"
                      className="icon-button"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeletePost(post.id)}
                      variant="ghost"
                      size="sm"
                      className="icon-button text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No blog posts found. Click "Add New Post" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
