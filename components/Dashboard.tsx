import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import MapComponent from './MapComponent.tsx';
import { fetchAllPOIs } from '../services/osmService.ts';
import type { PointOfInterest, PoiCategory } from '../types.ts';
import type { StartPoint } from '../App.tsx';
import Loader from './Loader.tsx';
import { POI_CATEGORY_ICONS } from '../constants.tsx';

// --- Helper Components & Icons ---

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-4 text-left font-semibold text-lg transition-colors ${isOpen ? 'bg-gray-50' : ''} hover:bg-gray-50`}>
        <span>{title}</span>
        <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="bg-white">{children}</div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string; isLink?: boolean }> = ({ icon, label, value, isLink }) => (
    <div className="flex items-start text-sm mt-3">
        <div className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1">
            <span className="font-semibold text-gray-600">{label}: </span>
            {isLink ? 
                <a href={value.startsWith('http') ? value : `//${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value}</a> :
                <span className="text-gray-800">{value}</span>
            }
        </div>
    </div>
);

const CuisineIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18.28 2.02a.75.75 0 00-1.06 0l-7.5 7.5a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L11.81 10l6.47-6.47a.75.75 0 000-1.06zM1.75 2.5a.75.75 0 000 1.5h6.54L5.22 7.07a.75.75 0 001.06 1.06L10 4.44v11.12a.75.75 0 001.5 0V2.5H1.75z" /></svg>;
const HoursIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const WebsiteIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l3.75-3.75a1.651 1.651 0 112.333 2.333L4.46 9.404a.75.75 0 001.06 1.06l2.252-2.252a1.651 1.651 0 012.333 2.333l-3.75 3.75a1.651 1.651 0 01-2.333 0L.664 10.59zM15.536 9.404a.75.75 0 00-1.06-1.06l-2.252 2.252a1.651 1.651 0 01-2.333-2.333l3.75-3.75a1.651 1.651 0 112.333 2.333L15.536 9.404z" clipRule="evenodd" /></svg>;
const PhoneIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5h-1.528a13.528 13.528 0 01-11.9-11.9A1.5 1.5 0 013.5 3h.965c.205 0 .399.08.545.224l.535.535a.75.75 0 010 1.06l-.934.934a.145.145 0 00-.03.042c-.015.025-.022.054-.035.078.01.033.02.067.032.1a12.04 12.04 0 006.942 6.942c.033.012.067.022.1.032.024-.013.053-.02.078-.035a.145.145 0 00.042-.03l.934-.934a.75.75 0 011.06 0l.535.535A.75.75 0 0115.535 15h.965z" clipRule="evenodd" /></svg>;
const RouteIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8H7a1 1 0 010-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /><path fillRule="evenodd" d="M3.293 8.293a1 1 0 011.414 0L7 10.586V4a1 1 0 012 0v6.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const DestinationIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>;


interface DashboardProps {
  startPoint: StartPoint;
  onReset: () => void;
}

const categoryDisplayNames: Record<PoiCategory, string> = {
  school: 'Schools', cafe: 'Cafes', restaurant: 'Restaurants', park: 'Parks',
  bus: 'Bus Stops & Stations', train: 'Train & Metro Stations', 
  shop: 'Shops', hospital: 'Hospitals',
};

export default function Dashboard({ startPoint, onReset }: DashboardProps): React.ReactElement {
  const [radius, setRadius] = useState(1000);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSummary('');
    setPois([]);
    setSelectedPoiId(null);
    try {
      const fetchedPois = await fetchAllPOIs(startPoint.coords, radius);
      setPois(fetchedPois);
    } catch (error) {
      console.error("Failed to fetch POIs", error);
    } finally {
      setLoading(false);
    }
  }, [startPoint.coords, radius]);
  
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const groupedPois = useMemo(() => {
    return pois.reduce((acc, poi) => {
      const category = poi.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(poi);
      return acc;
    }, {} as Record<PoiCategory, PointOfInterest[]>);
  }, [pois]);


  const handleGenerateSummary = useCallback(async () => {
    if (pois.length === 0) {
        setSummary("No points of interest were found to summarize.");
        return;
    }
    setLoadingSummary(true);
    setSummary('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const poiSummary = (Object.keys(groupedPois) as PoiCategory[])
            .map((category) => `- ${groupedPois[category].length} ${categoryDisplayNames[category]}`)
            .join('\n');

        const prompt = `
            You are a real estate analyst providing a summary of a neighborhood.
            Based on a search within a ${radius}-meter radius of a specific point, the following places were found:
            ${poiSummary}

            Provide a concise, modern, and professional summary for a real estate report.
            Analyze what this mix of amenities implies about the area's character (e.g., family-friendly, vibrant, business-oriented).
            Keep it to one or two paragraphs.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setSummary(response.text);

    } catch (error) {
        console.error("Error generating summary:", error);
        setSummary("Sorry, an error occurred while generating the summary.");
    } finally {
        setLoadingSummary(false);
    }
  }, [pois, radius, groupedPois]);

  const handlePoiClick = (poiId: number) => {
    setSelectedPoiId(prevId => (prevId === poiId ? null : poiId));
  };


  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Area Report</h1>
                <p className="text-sm text-gray-500 truncate max-w-md" title={startPoint.address}>{startPoint.address}</p>
            </div>
            <button onClick={onReset} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                <span>New Search</span>
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-800">
        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Options</h2>
            <div className="flex items-center space-x-6">
                 <div className="flex-1">
                    <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">Search Radius</label>
                    <input type="range" id="radius" min="500" max="5000" step="500" value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center text-gray-600 mt-1 font-medium">{radius}m</div>
                </div>
                <button onClick={handleSearch} disabled={loading} className="bg-gray-800 text-white font-bold py-3 px-6 rounded-md hover:bg-gray-900 disabled:bg-gray-400 flex items-center justify-center transition-colors self-end">
                    {loading ? <Loader className="h-5 w-5 text-white" /> : 'Update Search'}
                </button>
            </div>
        </div>

        {/* Map & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden h-96 lg:h-auto">
                <MapComponent center={startPoint.coords} pois={pois} radius={radius} selectedPoiId={selectedPoiId} />
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow flex flex-col">
                <h2 className="text-xl font-semibold mb-4">AI-Powered Summary</h2>
                <div className="flex-1 text-gray-700 prose prose-sm max-w-none">
                    {summary ? <p className="whitespace-pre-wrap">{summary}</p> : <p className="text-gray-500 italic">Generate a summary to see an AI analysis of this area.</p>}
                </div>
                 <button onClick={handleGenerateSummary} disabled={loadingSummary} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center transition-colors mt-4">
                    {loadingSummary ? <Loader className="h-5 w-5 text-white" /> : 'Generate Summary'}
                </button>
            </div>
        </div>

        {/* POI Details */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-4 border-b">Points of Interest Found</h2>
            {loading ? <div className="p-8 text-center"><Loader className="h-10 w-10 text-blue-500 mx-auto"/></div> :
             Object.keys(groupedPois).length > 0 ? (
                (Object.keys(groupedPois) as PoiCategory[]).sort().map(category => (
                    <Accordion key={category} title={`${categoryDisplayNames[category]} (${groupedPois[category].length})`}>
                        <ul className="divide-y divide-gray-200">
                           {groupedPois[category].map(poi => (
                               <li key={poi.id} onClick={() => handlePoiClick(poi.id)} className={`cursor-pointer ${selectedPoiId === poi.id ? 'bg-blue-50' : ''}`}>
                                    <div className="p-4 flex items-center space-x-4 hover:bg-gray-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md flex-shrink-0" dangerouslySetInnerHTML={{ __html: POI_CATEGORY_ICONS[poi.category] }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{poi.tags.name || `Unnamed ${poi.category}`}</p>
                                            <p className="text-sm text-gray-500">{poi.distance?.toFixed(0)}m away</p>
                                        </div>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedPoiId === poi.id ? 'max-h-screen' : 'max-h-0'}`}>
                                        <div className="px-4 pb-4 pl-16">
                                             <div className="border-t border-gray-200 pt-3">
                                                {poi.category === 'bus' && poi.tags.ref && <DetailItem icon={RouteIcon} label="Routes" value={poi.tags.ref.replace(/;/g, ', ')} />}
                                                {poi.category === 'bus' && poi.tags.destination && <DetailItem icon={DestinationIcon} label="Destinations" value={poi.tags.destination} />}

                                                {poi.tags.cuisine && <DetailItem icon={CuisineIcon} label="Cuisine" value={poi.tags.cuisine} />}
                                                {poi.tags.opening_hours && <DetailItem icon={HoursIcon} label="Hours" value={poi.tags.opening_hours} />}
                                                {poi.tags.website && <DetailItem icon={WebsiteIcon} label="Website" value={poi.tags.website} isLink={true}/>}
                                                {poi.tags['contact:phone'] && <DetailItem icon={PhoneIcon} label="Phone" value={poi.tags['contact:phone']} />}
                                             </div>
                                        </div>
                                    </div>
                               </li>
                           ))}
                        </ul>
                    </Accordion>
                ))
            ) : <p className="p-8 text-center text-gray-500">No points of interest found for the selected criteria.</p>}
        </div>
      </main>
    </div>
  );
}