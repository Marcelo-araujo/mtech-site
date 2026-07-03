"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const servicesDatabase = {
    residencial: [
        { id: 'res_wiring', title: "Troca de Fiação Completa", desc: "Substituição completa de cabos antigos e subdimensionados", price: 1500, time: "3 a 5 dias", complexity: "Alta" },
        { id: 'res_qdc', title: "Quadro de Distribuição (QDC)", desc: "Montagem de novo quadro com disjuntores DIN modernos, IDR e DPS", price: 500, time: "1 a 2 dias", complexity: "Média" },
        { id: 'res_shower', title: "Chuveiro ou Torneira Elétrica", desc: "Instalação física e fiação dedicada de alta potência", price: 150, time: "2 horas", complexity: "Baixa" },
        { id: 'res_outlets', title: "Instalação de Tomadas / Interruptores", desc: "Criação de novos pontos ou substituição estética de espelhos", price: 120, time: "4 horas", complexity: "Baixa" },
        { id: 'res_lighting', title: "Projeto e Instalação de Painéis LED", desc: "Montagem de luminárias spot, spots cênicos e fitas decorativas", price: 350, time: "1 dia", complexity: "Média" },
        { id: 'res_diagnosis', title: "Diagnóstico de Fuga e Curto-Circuito", desc: "Localização de falhas internas com instrumentos térmicos", price: 250, time: "3 horas", complexity: "Média" }
    ],
    comercial: [
        { id: 'com_infra', title: "Infraestrutura de Eletrocalhas e Perfilados", desc: "Montagem de caminhos aparentes industriais de alumínio", price: 2000, time: "4 a 6 dias", complexity: "Alta" },
        { id: 'com_phase', title: "Balanceamento de Fases e Carga", desc: "Otimização da potência trifásica para evitar queima de maquinário", price: 600, time: "1 dia", complexity: "Média" },
        { id: 'com_preventive', title: "Manutenção Preventiva Comercial", desc: "Reaperto de conexões elétricas, termografia e laudo de carga", price: 800, time: "1 dia", complexity: "Média" },
        { id: 'com_lighting', title: "Iluminação de Vitrine e Salão de Vendas", desc: "Montagem de luminárias trilho spot e sistemas economizadores", price: 900, time: "2 dias", complexity: "Média" },
        { id: 'com_ac', title: "Alimentação para Ar Condicionado Comercial", desc: "Instalação de comandos elétricos dedicados e proteção dedicada", price: 400, time: "6 horas", complexity: "Baixa" }
    ],
    predial: [
        { id: 'pred_spda', title: "Laudo técnico de Aterramento e SPDA", desc: "Medição ôhmica profissional de para-raios com atestado técnico", price: 1400, time: "2 dias", complexity: "Alta" },
        { id: 'pred_entrance', title: "Reforma de Padrão de Entrada de Energia", desc: "Adequação de caixas coletivas de medição padrão CPFL", price: 1800, time: "3 dias", complexity: "Alta" },
        { id: 'pred_dps', title: "Instalação de Proteção de Surto Geral (DPS)", desc: "Proteção central do prédio contra raios na rede pública", price: 600, time: "1 dia", complexity: "Média" },
        { id: 'pred_pumps', title: "Quadro de Comando para Bombas e Portões", desc: "Automação e partida de motores de reservatórios de água", price: 1100, time: "2 dias", complexity: "Alta" }
    ]
};

export default function Home() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    
    // Calculator State
    const [propertyType, setPropertyType] = useState('residencial');
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const toggleService = (id: string) => {
        setSelectedServices(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const changePropertyType = (type: 'residencial'|'comercial'|'predial') => {
        setPropertyType(type);
        setSelectedServices(new Set());
    };

    // Calculate Summary
    const services = servicesDatabase[propertyType as keyof typeof servicesDatabase];
    let count = 0;
    let totalPrice = 0;
    let maxComplexityWeight = 0;

    services.forEach(service => {
        if (selectedServices.has(service.id)) {
            count++;
            totalPrice += service.price;
            let weight = 1;
            if (service.complexity === 'Média') weight = 2;
            if (service.complexity === 'Alta') weight = 3;
            if (weight > maxComplexityWeight) maxComplexityWeight = weight;
        }
    });

    let complexity = 'Nenhum';
    let complexityClass = 'color-green';
    let time = '—';

    if (count > 0) {
        if (maxComplexityWeight === 1) {
            complexity = 'Baixa';
            complexityClass = 'color-green';
            time = 'Até 4 horas';
        } else if (maxComplexityWeight === 2) {
            complexity = 'Média';
            complexityClass = 'color-yellow';
            time = '1 a 2 dias';
        } else {
            complexity = 'Alta';
            complexityClass = 'color-red';
            time = '3 a 6 dias';
        }
    }

    const formattedPrice = count > 0 ? `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';
    const typeLabel = propertyType.charAt(0).toUpperCase() + propertyType.slice(1);

    const sendWhatsApp = () => {
        // Redireciona para o formulário de triagem ao invés do WhatsApp direto
        window.location.href = '/triagem';
    };

    return (
        <main>
            {/* Header / Navbar */}
            <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="container header-container">
                    <Link href="/" className="logo">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">M <span className="logo-highlight">TECH</span></span>
                    </Link>
                    
                    <nav className={`nav-menu ${menuOpen ? 'active' : ''}`} id="navMenu">
                        <a href="#inicio" className="nav-link" onClick={closeMenu}>Início</a>
                        <a href="#servicos" className="nav-link" onClick={closeMenu}>Serviços</a>
                        <a href="#calculadora" className="nav-link" onClick={closeMenu}>Simular Orçamento</a>
                        <Link href="/triagem" className="nav-link text-gradient" onClick={closeMenu}>Diagnóstico Inicial</Link>
                        <a href="#sobre" className="nav-link" onClick={closeMenu}>Sobre</a>
                        <a href="#contato" className="nav-link" onClick={closeMenu}>Contato</a>
                    </nav>
                    
                    <Link href="/triagem" className="btn btn-primary btn-nav-cta">
                        Solicitar Visita Técnica
                    </Link>
                    
                    <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} id="menuToggle" aria-label="Abrir Menu" onClick={toggleMenu}>
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                </div>
            </header>

            <div className={`menu-overlay ${menuOpen ? 'active' : ''}`} id="menuOverlay" onClick={closeMenu}></div>

            {/* Section: Hero */}
            <section id="inicio" className="hero-section">
                <div className="hero-bg-glow"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="badge-tech">
                            <span className="badge-icon">🛡️</span>
                            <span className="badge-text">Conformidade Técnica NBR 5410 & NR 10</span>
                        </div>
                        <h1 className="hero-title">Instalações e Manutenções Elétricas de <span className="text-gradient">Alta Performance</span></h1>
                        <p className="hero-subtitle">Engenharia e execução com precisão técnica absoluta. Segurança, eficiência energética e soluções sob medida para residências, comércios e indústrias em Sorocaba e região.</p>
                        <div className="hero-actions">
                            <a href="#calculadora" className="btn btn-primary">Simular Orçamento</a>
                            <Link href="/triagem" className="btn btn-secondary" style={{borderColor: 'var(--color-primary)'}}>Fazer Diagnóstico Online</Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">Segurança</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">+100</span>
                                <span className="stat-label">Projetos Executados</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">24h</span>
                                <span className="stat-label">Suporte de Emergência</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hero-visual">
                        <div className="card-glass hero-card">
                            <div className="card-header">
                                <div className="card-indicator"></div>
                                <span className="card-title">M Tech | Status do Sistema</span>
                            </div>
                            <div className="card-body">
                                <div className="system-status">
                                    <span className="status-dot green"></span>
                                    <span className="status-text">Rede Elétrica: Normalizada</span>
                                </div>
                                <div className="progress-container">
                                    <span className="progress-label">Eficiência Energética</span>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{width: '94%'}}></div>
                                    </div>
                                    <span className="progress-val">94%</span>
                                </div>
                                <div className="logs-container">
                                    <div className="log-line">{`> Analisando balanceamento de fases... ok`}</div>
                                    <div className="log-line">{`> Verificando aterramento estrutural... ok`}</div>
                                    <div className="log-line">{`> Diagnóstico térmico de disjuntores: Sob controle`}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section: Serviços */}
            <section id="servicos" className="services-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Especialidades de <span className="text-gradient">Engenharia Elétrica</span></h2>
                        <p className="section-subtitle">Soluções inteligentes projetadas para atender às demandas de segurança e estabilidade energética com o mais alto nível técnico.</p>
                    </div>
                    
                    <div className="services-grid">
                        <div className="card-glass service-card highlight-border">
                            <div className="service-icon-wrapper">
                                <svg className="service-icon color-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                            </div>
                            <h3 className="service-card-title">Comercial & Negócios</h3>
                            <p className="service-card-desc">Infraestrutura robusta de energia para empresas. Minimize paradas e previna falhas em equipamentos críticos de trabalho.</p>
                            <ul className="service-features">
                                <li>Infraestrutura com eletrocalhas e perfilados</li>
                                <li>Adequação e balanceamento de cargas trifásicas</li>
                                <li>Iluminação cênica e comercial planejada</li>
                                <li>Manutenção preventiva em quadros elétricos</li>
                            </ul>
                        </div>

                        <div className="card-glass service-card">
                            <div className="service-icon-wrapper">
                                <svg className="service-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                                </svg>
                            </div>
                            <h3 className="service-card-title">Predial & Segurança</h3>
                            <p className="service-card-desc">Sistemas complexos de proteção e distribuição de energia de alta escala para condomínios e galpões.</p>
                            <ul className="service-features">
                                <li>Manutenção preventiva e laudo de SPDA</li>
                                <li>Sistemas de aterramento e proteção contra surtos (DPS)</li>
                                <li>Adequação técnica de padrão de entrada de energia</li>
                                <li>Upgrade de potência contratada junto à concessionária</li>
                            </ul>
                        </div>
                        
                        <div className="card-glass service-card border-opacity-50 border-gray-600 opacity-80">
                            <div className="service-icon-wrapper bg-gray-800">
                                <svg className="service-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                            </div>
                            <h3 className="service-card-title text-gray-300">Residencial Premium (Restrito)</h3>
                            <p className="service-card-desc">Atendimento residencial de alto padrão sujeito a disponibilidade na agenda da engenharia.</p>
                            <ul className="service-features text-gray-400">
                                <li>Substituição completa de fiações antigas</li>
                                <li>Montagem e modernização de quadros (QDC)</li>
                                <li>Projeto de iluminação em LED e lustres</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section: Calculadora Interativa */}
            <section id="calculadora" className="calculator-section">
                <div className="calculator-glow"></div>
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Calculadora de <span className="text-gradient">Orçamento Inteligente</span></h2>
                        <p className="section-subtitle">Selecione os requisitos do seu imóvel e as necessidades para gerar uma estimativa de complexidade técnica e prazo.</p>
                    </div>
                    
                    <div className="calculator-box card-glass">
                        <div className="calculator-steps">
                            <div className="calc-step-group">
                                <label className="calc-step-label">1. Escolha o Tipo de Imóvel</label>
                                <div className="property-types">
                                    <button type="button" className={`property-btn ${propertyType === 'residencial' ? 'active' : ''}`} onClick={() => changePropertyType('residencial')}>
                                        <span className="btn-icon">🏠</span>
                                        <span className="btn-text">Residencial</span>
                                    </button>
                                    <button type="button" className={`property-btn ${propertyType === 'comercial' ? 'active' : ''}`} onClick={() => changePropertyType('comercial')}>
                                        <span className="btn-icon">🏢</span>
                                        <span className="btn-text">Comercial</span>
                                    </button>
                                    <button type="button" className={`property-btn ${propertyType === 'predial' ? 'active' : ''}`} onClick={() => changePropertyType('predial')}>
                                        <span className="btn-icon">🏗️</span>
                                        <span className="btn-text">Predial / Galpão</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="calc-step-group">
                                <label className="calc-step-label">2. Selecione os Serviços Necessários</label>
                                <div className="services-selection-list">
                                    {services.map(service => (
                                        <div key={service.id} className={`service-item-checkbox ${selectedServices.has(service.id) ? 'checked' : ''}`} onClick={() => toggleService(service.id)}>
                                            <input type="checkbox" className="checkbox-input" checked={selectedServices.has(service.id)} readOnly />
                                            <div className="service-checkbox-details">
                                                <span className="service-checkbox-title">{service.title}</span>
                                                <span className="service-checkbox-desc">{service.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="calculator-summary">
                            <h3 className="summary-title">Resumo Técnico</h3>
                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Tipo de Projeto:</span>
                                    <strong>{typeLabel}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Serviços Selecionados:</span>
                                    <strong>{count} {count === 1 ? 'item' : 'itens'}</strong>
                                </div>
                            </div>
                            
                            <div className="metrics-card">
                                <div className="metric-block">
                                    <span className="metric-label">Complexidade Técnica Estimada</span>
                                    <span className={`metric-value ${complexityClass}`}>{complexity}</span>
                                </div>
                                <div className="metric-block">
                                    <span className="metric-label">Prazo Médio Estimado de Execução</span>
                                    <span className="metric-value">{time}</span>
                                </div>
                            </div>
                            
                            <p className="summary-disclaimer text-gray-400 mb-4">Para validar esta estimativa técnica e garantir nossa disponibilidade de agenda, preencha o formulário de diagnóstico clicando abaixo.</p>
                            
                            <Link href="/triagem" className={`btn btn-primary btn-full-width py-4 flex items-center justify-center text-center ${count === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                Iniciar Diagnóstico Inicial (Requerido)
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer and specific styles can continue here, preserving the rest of index.html ... */}
            <footer className="site-footer">
                <div className="container footer-content" style={{textAlign:'center', padding:'40px 0'}}>
                    <p>&copy; 2026 M Tech Manutenções Elétricas. Todos os direitos reservados.</p>
                    <p className="footer-norms">Projetos em conformidade com as normas ABNT NBR 5410 e NR 10.</p>
                </div>
            </footer>
        </main>
    );
}
