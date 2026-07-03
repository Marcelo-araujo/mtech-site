"use client";

import { useState } from 'react';
import Link from 'next/link';

interface ResultadoAnalise {
    classificacao_ia?: string;
    resumo_ia?: string;
    error?: string;
}

export default function TriagemForm() {
    const [tipoImovel, setTipoImovel] = useState('');
    const [desqualificado, setDesqualificado] = useState(false);
    
    // Status do form
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);

    const checkDesqualificacao = (valor: string) => {
        if (valor === 'Apenas o orçamento mais barato') {
            setDesqualificado(true);
        } else {
            setDesqualificado(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (desqualificado) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResultado(data);
        } catch (error: any) {
            console.error(error);
            alert(`Ocorreu um erro: ${error.message || 'Tente novamente.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen py-20 px-4">
            <div className="container max-w-2xl mx-auto">
                <div className="mb-10 text-center">
                    <Link href="/" className="inline-block mb-6 text-xl font-bold font-heading logo-text text-white">
                        <span className="logo-icon mr-2">⚡</span>M <span className="logo-highlight">TECH</span>
                    </Link>
                    <h1 className="text-3xl font-heading font-bold mb-4">Diagnóstico Inicial de Infraestrutura</h1>
                    <p className="text-gray-400">Preencha os dados abaixo para uma avaliação técnica preliminar da sua demanda.</p>
                </div>

                <div className="card-glass p-8 border border-white/10 rounded-2xl">
                    {resultado ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Análise Concluída</h2>
                            <div className="bg-white/5 p-6 rounded-lg mb-6 text-left">
                                <p className="mb-2 font-bold text-blue-400">Classificação: {resultado.classificacao_ia}</p>
                                <div className="text-gray-300" dangerouslySetInnerHTML={{__html: resultado.resumo_ia?.replace(/\n/g, '<br/>')}}></div>
                            </div>
                            <Link href="/" className="btn btn-primary">Voltar para o site</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Identificação */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Nome Completo</label>
                                    <input type="text" name="nome" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" placeholder="Seu nome" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Local (Bairro/Cidade)</label>
                                    <input type="text" name="local" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" placeholder="Ex: Sorocaba - Centro" />
                                </div>
                            </div>

                            {/* Segmentação */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Tipo de Imóvel</label>
                                <select 
                                    name="tipo_imovel" 
                                    required 
                                    className="w-full bg-[#161F30] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={tipoImovel}
                                    onChange={(e) => setTipoImovel(e.target.value)}
                                >
                                    <option value="" disabled>Selecione...</option>
                                    <option value="Residencial">Residencial</option>
                                    <option value="Comercial">Comercial</option>
                                </select>
                                
                                {tipoImovel === 'Residencial' && (
                                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm flex items-start">
                                        <span className="mr-2">⚠️</span>
                                        <p>Devido à alta demanda, projetos residenciais estão com disponibilidade restrita. Uma triagem mais rigorosa será aplicada.</p>
                                    </div>
                                )}
                            </div>

                            {/* Urgência */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Criticidade do Serviço</label>
                                <select 
                                    name="urgencia" 
                                    required 
                                    defaultValue=""
                                    className="w-full bg-[#161F30] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    onChange={(e) => checkDesqualificacao(e.target.value)}
                                >
                                    <option value="" disabled>Selecione...</option>
                                    <option value="Falha crítica de segurança / Parada total">Falha crítica (Curto-circuito, parada total)</option>
                                    <option value="Planejamento e reforma futura">Planejamento / Reforma estruturada</option>
                                    <option value="Apenas o orçamento mais barato">Preciso apenas do orçamento mais barato</option>
                                </select>

                                {desqualificado && (
                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center font-medium">
                                        <p>No momento, não atendemos o mercado focado apenas em menor preço. Valorizamos a execução técnica sob as normas de segurança ABNT.</p>
                                        <p className="mt-2 text-sm text-gray-400">Obrigado pelo interesse!</p>
                                    </div>
                                )}
                            </div>

                            {/* Problema */}
                            <div className={desqualificado ? 'opacity-50 pointer-events-none' : ''}>
                                <label className="block text-sm font-semibold mb-2">Descreva o Problema (Máximo 3 frases)</label>
                                <textarea 
                                    name="problema" 
                                    required={!desqualificado}
                                    maxLength={300}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none" 
                                    placeholder="Descreva de forma objetiva o que está acontecendo e o que precisa ser feito..."
                                ></textarea>
                            </div>

                            {/* Prova Visual */}
                            <div className={desqualificado ? 'opacity-50 pointer-events-none' : ''}>
                                <label className="block text-sm font-semibold mb-2">Prova Visual Obrigatória (Foto do local/quadro)</label>
                                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-white/5">
                                    <input 
                                        type="file" 
                                        name="foto" 
                                        required={!desqualificado}
                                        accept="image/*"
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 w-full cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Sem o envio de foto, a solicitação não será analisada.</p>
                                </div>
                            </div>

                            {/* Checklist de Proteção */}
                            <div className={`space-y-3 ${desqualificado ? 'opacity-50 pointer-events-none' : ''}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" required={!desqualificado} className="mt-1 w-5 h-5 accent-blue-600 bg-transparent border-gray-600 rounded" />
                                    <span className="text-sm text-gray-300">Entendo que este é um pré-agendamento e que o escopo final e valores serão definidos após a análise técnica.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" required={!desqualificado} className="mt-1 w-5 h-5 accent-blue-600 bg-transparent border-gray-600 rounded" />
                                    <span className="text-sm text-gray-300">Entendo que qualquer solicitação adicional no local é considerada um novo serviço e será orçada à parte.</span>
                                </label>
                            </div>

                            {!desqualificado && (
                                <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4 flex justify-center py-4">
                                    {loading ? 'Analisando via IA...' : 'Enviar Diagnóstico Técnico'}
                                </button>
                            )}

                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
