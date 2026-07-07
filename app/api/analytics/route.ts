import { NextRequest, NextResponse } from 'next/server';
import { addVisit, getAnalyticsSummary } from '@/lib/analyticsStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, userAgent, utm_source, utm_medium, utm_campaign } = body;

    if (!path) {
      return NextResponse.json({ error: 'Parâmetro path é obrigatório' }, { status: 400 });
    }

    const visit = await addVisit({
      path,
      referrer: referrer || '',
      userAgent: userAgent || '',
      utm_source: utm_source || undefined,
      utm_medium: utm_medium || undefined,
      utm_campaign: utm_campaign || undefined,
    });

    return NextResponse.json({ success: true, visit });
  } catch (error: unknown) {
    console.error('Erro na API POST /api/analytics:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const expectedPin = process.env.ADMIN_DASHBOARD_PIN || '1234';

    if (!pin || pin !== expectedPin) {
      return NextResponse.json({ error: 'Não autorizado. PIN inválido.' }, { status: 401 });
    }

    const summary = await getAnalyticsSummary(days);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Erro na API GET /api/analytics:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
