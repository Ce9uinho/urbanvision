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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200/80">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            UrbanVision
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Insira uma morada para descobrir os pontos de interesse à sua volta.
        </p>
        <div className="relative group">
           <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Insira uma morada ou nome de um local..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          {loading && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Loader className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {suggestions.length > 0 && (
          <ul className="mt-4 border border-gray-200 rounded-lg bg-white max-h-60 overflow-y-auto shadow-xl">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 text-gray-800 transition-colors"
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