import { ArrowRight } from "lucide-react";
import { useState, useEffect } from 'react';
import { BlogPost } from "../../types/blogPost";

import { Badge } from "./badge"; 
import { Button } from "./button"; 
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./card"; 

interface Post {
  id: string;
  title: string;
  summary: string;
  label: string;
  author: string;
  published: string;
  url: string;
  image: string;
}

interface Blog7Props {
  tagline?: string; 
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
}

const API_URL_BLOG_POSTS = 'http://localhost:3002/blogPosts';

const Blog7 = ({
  tagline = "Latest Updates",
  heading = "From Our Blog",
  description = "Discover the latest trends, tips, and best practices in modern web development. From UI components to design systems, stay updated with our expert insights.",
  buttonText = "View all articles",
  buttonUrl = "#/blog",
}: Blog7Props) => {
  const [fetchedPosts, setFetchedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL_BLOG_POSTS);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BlogPost[] = await response.json();
        
        // Sort by publishedAt descending to show newest first, if available
        // Or by createdAt if publishedAt is null
        data.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
          const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        // Map BlogPost to Post interface for rendering
        const mappedPosts: Post[] = data.map(bp => ({
          id: bp.id,
          title: bp.title,
          summary: bp.excerpt || bp.content.substring(0, 150) + (bp.content.length > 150 ? '...' : ''), 
          label: bp.status === 'published' ? 'Published' : 'Draft', 
          author: bp.authorName || 'Admin',
          published: bp.publishedAt ? new Date(bp.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(bp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          url: `/blog/${bp.slug}`, 
          image: `https://source.unsplash.com/random/400x300?sig=${bp.id}`, 
        }));
        setFetchedPosts(mappedPosts);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      }
      setIsLoading(false);
    };

    fetchBlogData();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto text-center">
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading latest posts...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto text-center">
          <p className="text-xl text-red-500">Error loading posts: {error}</p>
          <p className="text-md text-gray-600 dark:text-gray-400">Please ensure the API server (json-server) is running.</p>
        </div>
      </section>
    );
  }

  if (fetchedPosts.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto text-center">
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:text-5xl text-gray-900 dark:text-white">
            {heading}
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300">No blog posts available at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto flex flex-col items-center gap-12 md:gap-16 px-4 lg:px-8">
        <div className="text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4 md:mb-6">
            {tagline}
          </Badge>
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:text-5xl text-gray-900 dark:text-white">
            {heading}
          </h2>
          <p className="mb-6 md:mb-8 text-gray-600 dark:text-gray-300 md:text-base lg:text-lg">
            {description}
          </p>
          {buttonUrl && buttonText && (
            <Button variant="link" className="w-full sm:w-auto text-lg" asChild>
              <a href={buttonUrl}>
                {buttonText}
                <ArrowRight className="ml-2 size-5" />
              </a>
            </Button>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 w-full">
          {fetchedPosts.map((post) => (
            <Card key={post.id} className="grid grid-rows-[auto_1fr_auto] bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-t-lg">
                <a
                  href={post.url}
                  target={post.url === "#" ? "_self" : "_blank"}
                  className="block h-full w-full transition-opacity duration-200 hover:opacity-80"
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover object-center"
                  />
                </a>
              </div>
              <CardHeader className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white hover:underline">
                  <a href={post.url} target={post.url === "#" ? "_self" : "_blank"}>
                    {post.title}
                  </a>
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 pt-1">By {post.author} - {post.published}</span>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{post.summary}</p>
              </CardContent>
              <CardFooter className="p-4 md:p-6 pt-0">
                <a
                  href={post.url}
                  target={post.url === "#" ? "_self" : "_blank"}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Read more
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Blog7 };
