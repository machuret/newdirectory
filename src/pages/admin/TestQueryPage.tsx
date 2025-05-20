import { useState } from 'react';
import { useListings, useGenerateFAQs } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestQueryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListings(page, 10);
  const generateFAQs = useGenerateFAQs();
  
  const handleGenerateFAQs = (id: number) => {
    generateFAQs.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">
          Error: {error instanceof Error ? error.message : 'Failed to load listings'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test React Query</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.listings.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <CardTitle>{listing.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-500">{listing.formatted_address}</p>
                {listing.main_type && (
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded mt-2">
                    {listing.main_type}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <p>
                  <strong>FAQs:</strong> {listing.faq ? listing.faq.length : 0} items
                </p>
                
                <Button 
                  onClick={() => handleGenerateFAQs(listing.id)}
                  disabled={generateFAQs.isPending}
                  size="sm"
                >
                  {generateFAQs.isPending && generateFAQs.variables === listing.id 
                    ? 'Generating...' 
                    : 'Generate FAQs'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center space-x-2">
        <Button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="py-2 px-4 border rounded">Page {page}</span>
        <Button 
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.hasMore}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
