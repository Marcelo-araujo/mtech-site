import fs from 'fs';
import path from 'path';

export interface Visit {
  id: string;
  timestamp: string;
  path: string;
  referrer: string;
  userAgent: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  referrers: Record<string, number>;
  pages: Record<string, number>;
  utmSources: Record<string, number>;
  history: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  recentVisits: Visit[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

// Helper para garantir que a pasta data existe
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Ler as visitas do arquivo JSON de forma segura
export async function getVisits(): Promise<Visit[]> {
  ensureDataDir();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
    if (!data.trim()) return [];
    return JSON.parse(data) as Visit[];
  } catch (error) {
    console.error('Erro ao ler arquivo de analytics:', error);
    return [];
  }
}

// Salvar visitas no arquivo JSON com limite de tamanho para performance
export async function addVisit(visit: Omit<Visit, 'id' | 'timestamp'>): Promise<Visit> {
  ensureDataDir();
  
  const newVisit: Visit = {
    ...visit,
    id: Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
  };

  try {
    const visits = await getVisits();
    visits.push(newVisit);
    
    // Manter o limite dos últimos 5000 registros para evitar sobrecarga de arquivo
    const trimmedVisits = visits.slice(-5000);
    
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(trimmedVisits, null, 2), 'utf-8');
    return newVisit;
  } catch (error) {
    console.error('Erro ao salvar visita no analytics:', error);
    return newVisit;
  }
}

// Obter resumo formatado dos dados de analytics
export async function getAnalyticsSummary(daysLimit = 30): Promise<AnalyticsSummary> {
  const visits = await getVisits();
  
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
  
  // Filtrar visitas dentro do intervalo
  const filteredVisits = visits.filter(v => new Date(v.timestamp) >= cutoffDate);
  
  // Calcular totais
  const totalPageViews = filteredVisits.length;
  
  // Rastrear visitantes únicos baseados na combinação de userAgent + referrer (ou apenas userAgent para simulação simples)
  // Como não salvamos IPs completos por privacidade/GDPR e limites locais, criamos uma assinatura hash do visitante
  const uniqueVisitorHashes = new Set(
    filteredVisits.map(v => `${v.userAgent}-${v.referrer}`)
  );
  const uniqueVisitors = uniqueVisitorHashes.size;

  // Origens / Referrers
  const referrers: Record<string, number> = {};
  // Páginas mais populares
  const pages: Record<string, number> = {};
  // UTM Sources
  const utmSources: Record<string, number> = {};

  filteredVisits.forEach(v => {
    // Processar referrer para ficar legível (ex: extrair domínio de URLs longas)
    let ref = v.referrer || 'Direto / Favoritos';
    if (ref !== 'Direto / Favoritos') {
      try {
        const url = new URL(ref);
        ref = url.hostname;
      } catch (e) {
        // Se falhar, mantém a string
      }
    }
    referrers[ref] = (referrers[ref] || 0) + 1;

    // Páginas
    const path = v.path || '/';
    pages[path] = (pages[path] || 0) + 1;

    // UTMs
    if (v.utm_source) {
      utmSources[v.utm_source] = (utmSources[v.utm_source] || 0) + 1;
    }
  });

  // Histórico dia a dia
  const historyMap: Record<string, { pageViews: number; uniqueVisitors: Set<string> }> = {};
  
  // Inicializar o mapa com os últimos X dias para garantir que dias vazios apareçam com 0
  for (let i = daysLimit - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    historyMap[dateStr] = { pageViews: 0, uniqueVisitors: new Set() };
  }

  filteredVisits.forEach(v => {
    const dateStr = v.timestamp.split('T')[0];
    if (historyMap[dateStr]) {
      historyMap[dateStr].pageViews++;
      historyMap[dateStr].uniqueVisitors.add(`${v.userAgent}-${v.referrer}`);
    }
  });

  const history = Object.entries(historyMap).map(([date, data]) => ({
    date,
    pageViews: data.pageViews,
    uniqueVisitors: data.uniqueVisitors.size,
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Últimas 20 visitas
  const recentVisits = [...filteredVisits].reverse().slice(0, 20);

  return {
    totalPageViews,
    uniqueVisitors,
    referrers,
    pages,
    utmSources,
    history,
    recentVisits,
  };
}
