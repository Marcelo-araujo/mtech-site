import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAnalyticsSummary } from '@/lib/analyticsStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    
    const expectedPin = process.env.ADMIN_DASHBOARD_PIN || '1234';

    if (!pin || pin !== expectedPin) {
      return NextResponse.json({ error: 'Não autorizado. PIN inválido.' }, { status: 401 });
    }

    // Gerar resumo dos últimos 7 dias para o relatório semanal
    const summary = await getAnalyticsSummary(7);
    
    const resendKey = process.env.RESEND_API_KEY;
    const receiver = process.env.MTECH_EMAIL_RECEIVER || 'mtech.manut@gmail.com';

    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    // Formatar listas em HTML para o e-mail
    const pageRows = Object.entries(summary.pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee; font-family: monospace;">${path}</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #0066FF;">${count}</td></tr>`)
      .join('');

    const referrerRows = Object.entries(summary.referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ref, count]) => `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${ref}</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #10B981;">${count}</td></tr>`)
      .join('');

    const utmRows = Object.entries(summary.utmSources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([src, count]) => `<tr><td style="padding: 6px 0; border-bottom: 1px solid #eee; font-family: monospace;">utm_source=${src}</td><td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #F59E0B;">${count}</td></tr>`)
      .join('');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background: #0B0F19; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">M Tech <span style="color: #0066FF;">Analytics</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8;">Relatório Semanal de Tráfego</p>
        </div>
        
        <div style="padding: 24px; background: #ffffff;">
          <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Resumo dos Últimos 7 Dias</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="width: 50%; padding: 16px; background: #f8fafc; border-radius: 8px 0 0 8px; text-align: center; border-right: 1px solid #e2e8f0;">
                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px;">Page Views</div>
                <div style="font-size: 28px; font-weight: 800; color: #0066FF;">${summary.totalPageViews}</div>
              </td>
              <td style="width: 50%; padding: 16px; background: #f8fafc; border-radius: 0 8px 8px 0; text-align: center;">
                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px;">Visitantes Únicos</div>
                <div style="font-size: 28px; font-weight: 800; color: #F59E0B;">${summary.uniqueVisitors}</div>
              </td>
            </tr>
          </table>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Top Páginas</h3>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              ${pageRows || '<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 12px 0;">Nenhum acesso registrado</td></tr>'}
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Principais Origens de Acesso</h3>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              ${referrerRows || '<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 12px 0;">Nenhum referrer capturado</td></tr>'}
            </table>
          </div>

          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Campanhas de Marketing (UTM)</h3>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              ${utmRows || '<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 12px 0;">Nenhum lead com UTM</td></tr>'}
            </table>
          </div>

          <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <a href="${req.nextUrl.origin}/admin/dashboard" style="display: inline-block; background: #0066FF; color: white; text-decoration: none; padding: 10px 20px; font-weight: 600; font-size: 13px; border-radius: 8px;">Acessar Painel em Tempo Real</a>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
          Este relatório semanal foi enviado automaticamente por M Tech Analytics.
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Relatório Analytics <onboarding@resend.dev>',
      to: [receiver],
      subject: `[M Tech] Relatório de Tráfego Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: `Relatório semanal enviado para ${receiver}` });
  } catch (error: unknown) {
    console.error('Erro ao enviar relatório de analytics:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
