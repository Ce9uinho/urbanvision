import React, { useState, useCallback, useEffect, useMemo } from 'react';
import MapComponent from './MapComponent.tsx';
import { fetchAllPOIs, fetchHighwayExits } from '../services/osmService.ts';
import type { PointOfInterest, PoiCategory, HighwayExit } from '../types.ts';
import type { StartPoint } from '../App.tsx';
import Loader from './Loader.tsx';
import { POI_CATEGORY_ICONS, POI_CATEGORY_COLORS } from '../constants.tsx';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { haversineDistance } from '../utils/geometry.ts';

// --- Helper Components & Icons ---

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-4 text-left font-semibold text-lg transition-colors hover:bg-gray-50 focus:outline-none`}>
        <span>{title}</span>
        <svg className={`w-5 h-5 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[10000px]' : 'max-h-0'}`}>
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

const SummarySkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
         <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
    </div>
);


const CuisineIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18.28 2.02a.75.75 0 00-1.06 0l-7.5 7.5a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L11.81 10l6.47-6.47a.75.75 0 000-1.06zM1.75 2.5a.75.75 0 000 1.5h6.54L5.22 7.07a.75.75 0 001.06 1.06L10 4.44v11.12a.75.75 0 001.5 0V2.5H1.75z" /></svg>;
const HoursIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const WebsiteIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l3.75-3.75a1.651 1.651 0 112.333 2.333L4.46 9.404a.75.75 0 001.06 1.06l2.252-2.252a1.651 1.651 0 012.333 2.333l-3.75 3.75a1.651 1.651 0 01-2.333 0L.664 10.59zM15.536 9.404a.75.75 0 00-1.06-1.06l-2.252 2.252a1.651 1.651 0 01-2.333-2.333l3.75-3.75a1.651 1.651 0 112.333 2.333L15.536 9.404z" clipRule="evenodd" /></svg>;
const PhoneIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5h-1.528a13.528 13.528 0 01-11.9-11.9A1.5 1.5 0 013.5 3h.965c.205 0 .399.08.545.224l.535.535a.75.75 0 010 1.06l-.934.934a.145.145 0 00-.03.042c-.015.025-.022.054-.035.078.01.033.02.067.032.1a12.04 12.04 0 006.942 6.942c.033.012.067.022.1.032.024-.013.053-.02.078-.035a.145.145 0 00.042-.03l.934-.934a.75.75 0 011.06 0l.535.535A.75.75 0 0115.535 15h.965z" clipRule="evenodd" /></svg>;


interface DashboardProps {
  startPoint: StartPoint;
  onReset: () => void;
}

const categoryDisplayNames: Record<PoiCategory, string> = {
  school: 'Escolas', cafe: 'Cafés', restaurant: 'Restaurantes', park: 'Parques',
  bus: 'Paragens de Autocarro', train: 'Estações de Comboio e Metro', 
  shop: 'Lojas', hospital: 'Hospitais', police: 'Esquadras da Polícia',
  fire_station: 'Quartéis de Bombeiros', hairdresser: 'Cabeleireiros', lawyer: 'Advogados',
  supermarket: 'Supermercados', accountant: 'Contabilistas'
};

const categorySearchTerms: Partial<Record<PoiCategory, string>> = {
  school: 'escola',
  cafe: 'café',
  restaurant: 'restaurante',
  park: 'parque',
  shop: 'loja',
  hospital: 'hospital',
  police: 'esquadra de polícia',
  fire_station: 'quartel de bombeiros',
  hairdresser: 'cabeleireiro',
  lawyer: 'advogado',
  supermarket: 'supermercado',
  accountant: 'contabilista',
};

const FIXED_RADIUS = 1000; // Fixed search radius of 1km

export default function Dashboard({ startPoint, onReset }: DashboardProps): React.ReactElement {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateSummary = useCallback(async (currentPois: PointOfInterest[], highwayExits: HighwayExit[], address: string) => {
    if (currentPois.length === 0) {
        setSummary("Não foram encontrados pontos de interesse para resumir.");
        setLoadingSummary(false);
        return;
    }
    setLoadingSummary(true);
    setSummary('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const localGroupedPois = currentPois.reduce((acc, poi) => {
          const category = poi.category;
          if (!acc[category]) acc[category] = [];
          acc[category].push(poi);
          return acc;
        }, {} as Record<PoiCategory, PointOfInterest[]>);

        const poiSummary = (Object.keys(localGroupedPois) as PoiCategory[])
            .map((category) => `- ${localGroupedPois[category].length} ${categoryDisplayNames[category]}`)
            .join('\n');
        
        const addressParts = address.split(',').map(s => s.trim());
        const locationName = addressParts.length > 2 ? `${addressParts[1]}, ${addressParts[2]}` : addressParts[0];

        const findClosestPoi = (category: PoiCategory): PointOfInterest | null => {
            return currentPois.find(p => p.category === category) || null;
        };

        const formatDistance = (poi: PointOfInterest | null): string => {
            if (!poi) return 'Não encontrado';
            const name = poi.tags.name || poi.tags.ref || `Ponto de interesse (${poi.category})`;
            return `${name} a ${poi.distance?.toFixed(0)}m`;
        }
        
        const highwaySummary = highwayExits.length > 0
            ? highwayExits.map(exit => `- Acesso a ${exit.name} a ${exit.distance.toFixed(0)}m`).join('\n')
            : 'Nenhum acesso a autoestrada encontrado a menos de 5km.';

        const closestSchool = findClosestPoi('school');
        const closestHospital = findClosestPoi('hospital');
        const closestShop = findClosestPoi('supermarket') || findClosestPoi('shop'); // Prioritize supermarket
        const closestBus = findClosestPoi('bus');
        const closestTrain = findClosestPoi('train');
        const closestTransport = closestBus && closestTrain ? (closestBus.distance! < closestTrain.distance! ? closestBus : closestTrain) : (closestBus || closestTrain);

        const keyDistances = [
            closestSchool && { label: "Escola mais próxima", value: formatDistance(closestSchool) },
            closestShop && { label: "Comércio mais próximo", value: formatDistance(closestShop) },
            closestHospital && { label: "Hospital mais próximo", value: formatDistance(closestHospital) },
            closestTransport && { label: "Transportes mais próximos", value: formatDistance(closestTransport) }
        ].filter((item): item is { label: string; value: string } => !!item);

        const keyDistancesSummary = keyDistances.map(item => `- ${item.label}: ${item.value}`).join('\n');

        const prompt = `
            Aja como um consultor imobiliário a escrever uma descrição formal e profissional para uma zona habitacional.
            Seja direto e profissional na resposta. Não inclua saudações ou frases de abertura. Use formatação limpa, com parágrafos bem definidos e negrito apenas para o título principal.

            Esta zona habitacional localiza-se em: ${locationName}.
            O raio de pesquisa para comodidades locais foi de ${FIXED_RADIUS}m.

            Dados de Proximidade (Pontos Chave):
            ${keyDistancesSummary}
            
            Dados de Acessos a Autoestradas (raio de 5km):
            ${highwaySummary}

            Resumo Geral da Zona (contagem total de locais):
            ${poiSummary}

            Com base em TODOS os dados fornecidos, crie um texto que destaque os pontos fortes da localização, seguindo este formato e tom:

            **Excelente localização: Conforto e Mobilidade em ${locationName}**

            (Parágrafo de introdução sobre a localização privilegiada, usando o nome da zona.)

            (Parágrafo sobre conveniência e serviços, integrando de forma natural os dados de proximidade dos pontos chave. Mencione a curta distância em metros para escolas, supermercados, hospitais, etc., usando a informação de "Dados de Proximidade".)

            (Parágrafo sobre mobilidade, mencionando a existência de paragens de autocarro ou estações nas proximidades E OS ACESSOS ÀS AUTOESTRADAS MAIS PRÓXIMAS, se aplicável, usando os "Dados de Acessos".)

            (Parágrafo de conclusão, reforçando o equilíbrio entre a vida quotidiana e o acesso a comodidades urbanas, e o potencial de valorização da zona.)

            O texto deve ser fluído, coeso e focado nos benefícios práticos para um potencial morador.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setSummary(response.text);

    } catch (error) {
        console.error("Error generating summary:", error);
        setSummary("Desculpe, ocorreu um erro ao gerar o resumo.");
    } finally {
        setLoadingSummary(false);
    }
  }, []);
  
  useEffect(() => {
    const runSearch = async () => {
        setLoading(true);
        setSummary('');
        setPois([]);
        setSelectedPoiId(null);
        setLoadingSummary(true);
        try {
          const [fetchedPois, fetchedExits] = await Promise.all([
            fetchAllPOIs(startPoint.coords, FIXED_RADIUS),
            fetchHighwayExits(startPoint.coords)
          ]);

          // Filter out POIs that are "unnamed" (no name or ref tag)
          const identifiedPois = fetchedPois.filter(poi => poi.tags.name || poi.tags.ref);
          
          const processedPois = identifiedPois.reduce((acc: PointOfInterest[], currentPoi) => {
            const isTransport = currentPoi.category === 'bus' || currentPoi.category === 'train';
            if (isTransport) {
                const isDuplicate = acc.some(existingPoi => 
                    (existingPoi.category === 'bus' || existingPoi.category === 'train') &&
                    // Only consider it a duplicate if they share the same non-empty name
                    (!!currentPoi.tags.name && existingPoi.tags.name === currentPoi.tags.name) &&
                    haversineDistance(
                        { lat: existingPoi.lat, lon: existingPoi.lon },
                        { lat: currentPoi.lat, lon: currentPoi.lon }
                    ) < 150
                );
                if (!isDuplicate) acc.push(currentPoi);
            } else {
                acc.push(currentPoi);
            }
            return acc;
          }, [] as PointOfInterest[]);

          setPois(processedPois);
          handleGenerateSummary(processedPois, fetchedExits, startPoint.address);
        } catch (error) {
          console.error("Failed to fetch POIs", error);
          setSummary("Falha ao carregar os dados da área. Por favor, tente novamente.");
          setLoadingSummary(false);
        } finally {
          setLoading(false);
        }
    };
    
    runSearch();
  }, [startPoint, handleGenerateSummary]);

  const groupedPois = useMemo(() => {
    return pois.reduce((acc, poi) => {
      const category = poi.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(poi);
      return acc;
    }, {} as Record<PoiCategory, PointOfInterest[]>);
  }, [pois]);

  const displayedPois = useMemo(() => {
    const poisCopy = { ...groupedPois };
    // Filter out generic 'shop' category from display, but keep for AI summary
    delete poisCopy.shop;
    return poisCopy;
  }, [groupedPois]);


  const handlePoiClick = (poiId: number) => {
    setSelectedPoiId(prevId => (prevId === poiId ? null : poiId));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
        console.error("Report content element not found!");
        setIsExporting(false);
        return;
    }
    try {
        const canvas = await html2canvas(reportContent, {
            scale: 2,
            useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }
        
        const fileName = `UrbanVision_Report_${startPoint.address.split(',')[0].replace(/\s/g, '_')}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const renderSummary = (text: string) => {
    if (!text) return null;
    const match = text.match(/\*\*(.*?)\*\*/);
    if (match && match[1]) {
        const title = match[1];
        const content = text.replace(`**${title}**`, '').trim();
        return (
            <div>
                <h3 className="text-lg font-bold text-gray-800 not-prose mb-3">{title}</h3>
                <p className="whitespace-pre-wrap text-gray-600">{content}</p>
            </div>
        );
    }
    return <p className="whitespace-pre-wrap text-gray-600">{text}</p>;
  };


  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Relatório da Zona</h1>
                <p className="text-sm text-gray-500 truncate" title={startPoint.address}>{startPoint.address}</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={handleExportPDF} disabled={isExporting || loading} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200 ease-in-out flex items-center space-x-2 shadow-sm hover:shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span>{isExporting ? 'A exportar...' : 'Exportar PDF'}</span>
                </button>
                <button onClick={onReset} className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-200 ease-in-out flex items-center space-x-2 border border-gray-300 shadow-sm hover:shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    <span>Nova Pesquisa</span>
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-800">
        
        <div id="report-content">
            {/* Map & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden h-96 lg:h-auto">
                    <MapComponent center={startPoint.coords} pois={pois} radius={FIXED_RADIUS} selectedPoiId={selectedPoiId} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow flex flex-col">
                    <div className="flex items-center mb-4">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 ml-3">Resumo Gerado por IA</h2>
                    </div>
                    <div className="flex-1 text-gray-700 prose-sm max-w-none">
                        {loadingSummary ? <SummarySkeleton /> : renderSummary(summary)}
                    </div>
                    <div className="mt-auto pt-4 text-right">
                        <span className="text-xs text-gray-400 italic">Gerado com tecnologia de IA</span>
                    </div>
                </div>
            </div>

            {/* POI Details */}
            <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
                <h2 className="text-xl font-semibold p-4 border-b">Pontos de Interesse Encontrados</h2>
                {loading ? <div className="p-8 text-center"><Loader className="h-10 w-10 text-blue-500 mx-auto"/></div> :
                Object.keys(displayedPois).length > 0 ? (
                    (Object.keys(displayedPois) as (keyof typeof displayedPois)[]).sort().map(category => (
                        <Accordion key={category} title={`${categoryDisplayNames[category]} (${displayedPois[category].length})`}>
                            <ul>
                            {displayedPois[category].map(poi => {
                                    const detailsAvailable = poi.tags.cuisine || poi.tags.opening_hours || poi.tags.website || poi.tags['contact:phone'];
                                    const poiName = poi.tags.name || poi.tags.ref;
                                    const colors = POI_CATEGORY_COLORS[poi.category];
                                    
                                    const addressParts = startPoint.address.split(',').map(p => p.trim());
                                    let locationContext = '';
                                    if (addressParts.length > 2) {
                                        locationContext = addressParts.slice(1, -1).join(' ');
                                    } else {
                                        locationContext = addressParts[0] || '';
                                    }

                                    const isTransport = poi.category === 'bus' || poi.category === 'train';
                                    
                                    const transportType = poi.category === 'bus' ? 'paragem autocarro' : 'estação';
                                    const routeInfo = poi.tags.route_ref ? poi.tags.route_ref.replace(/;/g, ' ') : '';
                                    const transportSearchQuery = `moovit ${transportType} "${poiName}" ${routeInfo} ${locationContext} ${poi.lat},${poi.lon}`.trim().replace(/\s+/g, ' ');
                                    const googleSearchForMoovitUrl = `https://www.google.com/search?q=${encodeURIComponent(transportSearchQuery)}`;

                                    const categoryTerm = categorySearchTerms[poi.category] || '';
                                    const fullAddressContext = addressParts.slice(0, -1).join(' ');
                                    const businessSearchQuery = `${categoryTerm} "${poiName}" ${fullAddressContext} ${poi.lat},${poi.lon}`.trim().replace(/\s+/g, ' ');
                                    const googleSearchForBusinessUrl = `https://www.google.com/search?q=${encodeURIComponent(businessSearchQuery)}`;

                                    return (
                                    <li key={poi.id} className="border-b last:border-b-0 border-gray-200">
                                        <div onClick={() => handlePoiClick(poi.id)} className={`relative p-3 sm:p-4 flex items-center space-x-4 cursor-pointer transition-colors duration-200 ${selectedPoiId === poi.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                            {selectedPoiId === poi.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>}
                                            
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                                <div className={`w-6 h-6 ${colors.text}`} dangerouslySetInnerHTML={{ __html: POI_CATEGORY_ICONS[poi.category] }} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">{poiName}</p>
                                                <p className="text-sm text-gray-500">{poi.distance?.toFixed(0)}m de distância</p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                                                {isTransport && (
                                                    <a
                                                        href={googleSearchForMoovitUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-transform transform hover:scale-105"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                                                        <span>Horários</span>
                                                    </a>
                                                )}
                                                {!isTransport && poi.tags.name && (
                                                     <a
                                                        href={googleSearchForBusinessUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                                    >
                                                        <span>Ver no Google</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        {detailsAvailable && (
                                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedPoiId === poi.id ? 'max-h-screen' : 'max-h-0'}`}>
                                                <div className="pl-16 pr-4 pb-4">
                                                    <div className="border-t border-gray-200 pt-3">
                                                        {poi.tags.cuisine && <DetailItem icon={CuisineIcon} label="Cozinha" value={poi.tags.cuisine} />}
                                                        {poi.tags.opening_hours && <DetailItem icon={HoursIcon} label="Horário" value={poi.tags.opening_hours} />}
                                                        {poi.tags.website && <DetailItem icon={WebsiteIcon} label="Website" value={poi.tags.website} isLink={true}/>}
                                                        {poi.tags['contact:phone'] && <DetailItem icon={PhoneIcon} label="Telefone" value={poi.tags['contact:phone']} />}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                            </ul>
                        </Accordion>
                    ))
                ) : <p className="p-8 text-center text-gray-500">Nenhum ponto de interesse encontrado para os critérios selecionados.</p>}
            </div>
        </div>
      </main>
    </div>
  );
}