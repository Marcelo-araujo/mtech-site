import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';

// Removidas instâncias globais para evitar erro no build

export async function POST(req: NextRequest) {
    // Inicializar clientes dentro da requisição
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    }) : null;
    
    try {
        const formData = await req.formData();
        
        const nome = formData.get('nome') as string;
        const local = formData.get('local') as string;
        const tipo_imovel = formData.get('tipo_imovel') as string;
        const urgencia = formData.get('urgencia') as string;
        const problema = formData.get('problema') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const email = formData.get('email') as string;
        const foto = formData.get('foto') as File;

        if (!nome || !foto || !problema || !whatsapp) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // 1. Converter imagem para Base64 para OpenAI e para o anexo do E-mail
        const buffer = await foto.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mimeType = foto.type;

        // 2. Chamada para OpenAI
        let aiClassification = "AGENDAR VISITA";
        let aiSummary = "Resumo indisponível (Erro na IA)";

        if (process.env.GEMINI_API_KEY) {
            const promptContext = `
Você é o engenheiro chefe de triagem da M Tech, uma empresa de engenharia elétrica de alto padrão.
Analise a seguinte solicitação de serviço e a imagem enviada.

Dados do Lead:
- Nome: ${nome}
- Local: ${local}
- Tipo de Imóvel: ${tipo_imovel}
- Urgência declarada: ${urgencia}
- Problema descrito: ${problema}

Protocolo de Rejeição Automática:
- Qualidade da Imagem: Se a imagem estiver fora de foco (borrada), mal iluminada ou com baixa resolução que impeça a identificação técnica do quadro elétrico, retorne REJEITAR: 'Foto de baixa qualidade'.
- Relevância da Imagem: Se a imagem não contiver componentes elétricos (fotos de tetos, pisos, objetos irrelevantes ou contexto aleatório), retorne REJEITAR: 'Conteúdo irrelevante'.
- Consistência do Escopo: Se a descrição do problema for vaga, contraditória com a foto ou demonstrar falta de seriedade/inconsistência técnica, retorne REJEITAR: 'Solicitação inconsistente'.
- O "Não" Silencioso: Sempre que retornar REJEITAR por um dos motivos acima, coloque como o primeiro item do resumo a mensagem exata: "Para manter o padrão de segurança e conformidade técnica (NBR 5410), não conseguimos processar orçamentos sem as informações completas e fotos do local conforme solicitado. Caso tenha os dados completos, ficaremos felizes em analisar uma nova solicitação".
- Cliente que deseja "Apenas o orçamento mais barato": retorne REJEITAR e no resumo alerte que a empresa não atende orçamentos baseados apenas em preço sem critério técnico.

Protocolo de Aceitação:
- Apenas se a imagem for clara, relevante (mostrando quadro/infraestrutura) e a descrição for coerente, classifique como PRÉ-APROVADO ou AGENDAR VISITA.

Responda em formato JSON válido:
{
  "classificacao": "REJEITAR" | "AGENDAR VISITA" | "PRÉ-APROVADO",
  "resumo_bullet_points": "Crie um resumo hiper-objetivo em bullet points (HTML <ul><li>) que um engenheiro possa ler em 10 segundos, destacando riscos imediatos, rentabilidade estimada e se faltam informações."
}
`;

            const response = await ai!.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptContext },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });

            const content = response.text;
            if (content) {
                const parsed = JSON.parse(content);
                aiClassification = parsed.classificacao;
                aiSummary = parsed.resumo_bullet_points;
            }
        } else {
            console.warn("GEMINI_API_KEY não configurada.");
            aiSummary = "<ul><li>Falta chave da API do Gemini.</li></ul>";
        }

        // 3. Disparar E-mail com Resend
        if (process.env.RESEND_API_KEY && process.env.MTECH_EMAIL_RECEIVER) {
            const emailHtml = `
                <h2>Novo Lead de Triagem: ${nome}</h2>
                <div style="padding: 15px; border-left: 4px solid #0066FF; background: #f4f4f4; margin-bottom: 20px;">
                    <h3 style="margin-top: 0;">Veredito da IA: [${aiClassification}]</h3>
                    ${aiSummary}
                </div>
                <h3>Dados Informados:</h3>
                <ul>
                    <li><strong>WhatsApp:</strong> <span style="font-size: 1.1em; color: #25D366; font-weight: bold;">${whatsapp}</span></li>
                    ${email ? `<li><strong>E-mail:</strong> ${email}</li>` : ''}
                    <li><strong>Local:</strong> ${local}</li>
                    <li><strong>Tipo de Imóvel:</strong> ${tipo_imovel}</li>
                    <li><strong>Criticidade:</strong> ${urgencia}</li>
                    <li><strong>Problema Relatado:</strong> ${problema}</li>
                </ul>
                <p>A foto enviada pelo cliente está em anexo neste e-mail.</p>
            `;

            await resend!.emails.send({
                from: 'Triagem M Tech <onboarding@resend.dev>', // Em produção, altere para seu domínio verificado
                to: [process.env.MTECH_EMAIL_RECEIVER],
                subject: `[${aiClassification}] Novo Diagnóstico - ${nome}`,
                html: emailHtml,
                attachments: [
                    {
                        filename: foto.name || 'foto_quadro.jpg',
                        content: Buffer.from(buffer)
                    }
                ]
            });
        }

        // 4. Retornar resposta para o frontend
        return NextResponse.json({
            status: 'success',
            classificacao_ia: aiClassification,
            resumo_ia: aiSummary
        });

    } catch (error: unknown) {
        console.error("Erro na API /analyze:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
