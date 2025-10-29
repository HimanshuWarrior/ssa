import React from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults: React.FC = () => {
  const query = useQuery().get('q') || '';

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4">
      <h2 className="text-2xl font-bold mb-4">Search results</h2>
      <p className="text-sm text-gray-600 mb-6">Showing results for: <span className="font-medium">{query}</span></p>
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <p className="text-gray-500">This is a placeholder search results page. Implement actual search logic to query your content or API.</p>
      </div>
    </div>
  );
};

export default SearchResults;
