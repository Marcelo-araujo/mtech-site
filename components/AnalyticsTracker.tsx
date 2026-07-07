'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Evitar registrar múltiplos eventos idênticos consecutivamente na mesma sessão de navegação
    const currentPathWithSearch = pathname + window.location.search;
    if (lastTrackedPath.current === currentPathWithSearch) return;
    lastTrackedPath.current = currentPathWithSearch;

    const trackVisit = async () => {
      try {
        const utm_source = searchParams.get('utm_source') || undefined;
        const utm_medium = searchParams.get('utm_medium') || undefined;
        const utm_campaign = searchParams.get('utm_campaign') || undefined;

        // Opcional: ignorar visitas a páginas de administração
        if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
          return;
        }

        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            utm_source,
            utm_medium,
            utm_campaign,
          }),
        });
      } catch (error) {
        // Falha silenciosa para não atrapalhar a experiência do usuário
        console.warn('Analytics Tracking Error:', error);
      }
    };

    // Atraso de 500ms para evitar contar carregamentos parciais ou cliques rápidos acidentais
    const timer = setTimeout(trackVisit, 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
