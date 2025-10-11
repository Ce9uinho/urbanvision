import React, { useState } from 'react';
import useAddressSuggestions from '../hooks/useAddressSuggestions.ts';
import type { AddressSuggestion } from '../types.ts';
import Loader from './Loader.tsx';
import type { StartPoint } from '../App.tsx';

interface LandingPageProps {
  onStart: (startPoint: StartPoint) => void;
}

export default function LandingPage({ onStart }: LandingPageProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const { suggestions, loading, error } = useAddressSuggestions(query);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onStart({
      coords: {
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon),
      },
      address: suggestion.display_name,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">UrbanVision</h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter a starting address to discover points of interest around you.
        </p>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter an address or a place name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {loading && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Loader className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {suggestions.length > 0 && (
          <ul className="mt-2 border border-gray-200 rounded-lg bg-white max-h-60 overflow-y-auto shadow-md">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 text-gray-800"
              >
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}