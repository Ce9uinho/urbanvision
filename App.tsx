import React, { useState } from 'react';
import Dashboard from './components/Dashboard.tsx';
import LandingPage from './components/LandingPage.tsx';
import type { Coordinates } from './types.ts';

export interface StartPoint {
  coords: Coordinates;
  address: string;
}

export default function App(): React.ReactElement {
  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);

  const handleStart = (data: StartPoint) => {
    setStartPoint(data);
  };
  
  const handleReset = () => {
    setStartPoint(null);
  };

  return (
    <div className="font-sans">
      {!startPoint ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <Dashboard startPoint={startPoint} onReset={handleReset} />
      )}
    </div>
  );
}