#!/bin/bash
# Test various API endpoints to identify routing issues

echo "Testing content_pages endpoint..."
curl -v http://localhost:8080/api/proxy/api/content_pages

echo -e "\n\nTesting blog_posts endpoint..."
curl -v http://localhost:8080/api/proxy/api/blog_posts

echo -e "\n\nTesting listings endpoint (known working endpoint)..."
curl -v http://localhost:8080/api/proxy/api/listings

# Try without the /api/proxy prefix
echo -e "\n\nTesting direct content_pages endpoint (without proxy prefix)..."
curl -v http://localhost:8080/api/content_pages
