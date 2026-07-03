import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Inicializar clientes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        
        const nome = formData.get('nome') as string;
        const local = formData.get('local') as string;
        const tipo_imovel = formData.get('tipo_imovel') as string;
        const urgencia = formData.get('urgencia') as string;
        const problema = formData.get('problema') as string;
        const foto = formData.get('foto') as File;

        if (!nome || !foto || !problema) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // 1. Converter imagem para Base64 para a OpenAI
        const buffer = await foto.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mimeType = foto.type;

        // 2. Upload para o Supabase Storage (Opcional caso dê erro, mas tentamos)
        let publicFotoUrl = null;
        if (supabaseUrl && supabaseKey) {
            const fileName = `${Date.now()}_${foto.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fotos_triagem')
                .upload(fileName, buffer, { contentType: mimeType });
            
            if (!uploadError) {
                const { data } = supabase.storage.from('fotos_triagem').getPublicUrl(fileName);
                publicFotoUrl = data.publicUrl;
            } else {
                console.warn("Erro no upload do Supabase:", uploadError);
            }
        }

        // 3. Chamada para OpenAI
        let aiClassification = "AGENDAR VISITA";
        let aiSummary = "Resumo indisponível (Erro na IA)";

        if (process.env.OPENAI_API_KEY) {
            const promptContext = `
Você é o engenheiro chefe de triagem da M Tech, uma empresa de engenharia elétrica de alto padrão.
Analise a seguinte solicitação de serviço e a imagem enviada.

Dados do Lead:
- Nome: ${nome}
- Local: ${local}
- Tipo de Imóvel: ${tipo_imovel}
- Urgência declarada: ${urgencia}
- Problema descrito: ${problema}

Regras rigorosas:
1. Se o cliente mencionou urgência "Apenas o orçamento mais barato", você DEVE classificar como "REJEITAR".
2. Se o problema é complexo, rentável e requer análise técnica no local (ex: curto-circuito grave, troca de fiação completa, laudos de SPDA), classifique como "AGENDAR VISITA".
3. Se o escopo é muito claro, padronizado e a imagem comprova (ex: troca de chuveiro, instalação de quadro elétrico simples), classifique como "PRÉ-APROVADO".

Responda em formato JSON válido:
{
  "classificacao": "REJEITAR" | "AGENDAR VISITA" | "PRÉ-APROVADO",
  "resumo_bullet_points": "Crie um resumo hiper-objetivo em bullet points (HTML <ul><li>) que um engenheiro possa ler em 10 segundos, destacando riscos imediatos, rentabilidade estimada e se faltam informações."
}
`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptContext },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                    detail: "low"
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (content) {
                const parsed = JSON.parse(content);
                aiClassification = parsed.classificacao;
                aiSummary = parsed.resumo_bullet_points;
            }
        } else {
            console.warn("OPENAI_API_KEY não configurada. Simulando resposta.");
            aiSummary = "<ul><li>Falta chave da API da OpenAI.</li><li>Simulação ativada.</li></ul>";
        }

        // 4. Salvar no Banco de Dados Supabase
        if (supabaseUrl && supabaseKey) {
            await supabase.from('leads').insert([{
                nome,
                local,
                tipo_imovel,
                urgencia,
                problema,
                classificacao_ia: aiClassification,
                resumo_ia: aiSummary,
                foto_url: publicFotoUrl
            }]);
        }

        // 5. Retornar resposta
        return NextResponse.json({
            status: 'success',
            classificacao_ia: aiClassification,
            resumo_ia: aiSummary
        });

    } catch (error: any) {
        console.error("Erro na API /analyze:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
