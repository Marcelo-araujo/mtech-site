/* --------------------------------------------------
   M Tech - Interactive JavaScript Logic
   -------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Header Scroll Effect
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle Drawer
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    function toggleMenu() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    }

    function closeMenu() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    }

    menuToggle.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // 3. Calculator Database of Services
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

    // State Variables
    let currentPropertyType = 'residencial';
    let selectedServices = new Set();

    // DOM Elements
    const propertyBtns = document.querySelectorAll('.property-btn');
    const servicesChecklist = document.getElementById('servicesChecklist');
    const summaryPropertyType = document.getElementById('summaryPropertyType');
    const summaryCount = document.getElementById('summaryCount');
    const complexityValue = document.getElementById('complexityValue');
    const timeValue = document.getElementById('timeValue');
    const priceValue = document.getElementById('priceValue');
    const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');

    // 4. Populate Checklist based on property type
    function renderServices() {
        servicesChecklist.innerHTML = '';
        const services = servicesDatabase[currentPropertyType];
        
        services.forEach(service => {
            const isChecked = selectedServices.has(service.id);
            
            const card = document.createElement('div');
            card.className = `service-item-checkbox ${isChecked ? 'checked' : ''}`;
            card.dataset.id = service.id;
            
            card.innerHTML = `
                <input type="checkbox" class="checkbox-input" id="${service.id}" ${isChecked ? 'checked' : ''}>
                <div class="service-checkbox-details">
                    <span class="service-checkbox-title">${service.title}</span>
                    <span class="service-checkbox-desc">${service.desc}</span>
                </div>
            `;
            
            // Toggle selection on click
            card.addEventListener('click', (e) => {
                // Prevent trigger twice if clicked directly on input element
                if (e.target.tagName === 'INPUT') return;
                
                const checkbox = card.querySelector('input');
                checkbox.checked = !checkbox.checked;
                handleSelectionChange(service.id, checkbox.checked, card);
            });

            // Listen directly to checkbox change
            const input = card.querySelector('input');
            input.addEventListener('change', () => {
                handleSelectionChange(service.id, input.checked, card);
            });

            servicesChecklist.appendChild(card);
        });

        calculateSummary();
    }

    function handleSelectionChange(id, isChecked, cardElement) {
        if (isChecked) {
            selectedServices.add(id);
            cardElement.classList.add('checked');
        } else {
            selectedServices.delete(id);
            cardElement.classList.remove('checked');
        }
        calculateSummary();
    }

    // 5. Calculate Metrics dynamically
    function calculateSummary() {
        const services = servicesDatabase[currentPropertyType];
        let count = 0;
        let totalPrice = 0;
        let maxComplexityWeight = 0; // 1 = Baixa, 2 = Média, 3 = Alta
        let selectedItems = [];

        services.forEach(service => {
            if (selectedServices.has(service.id)) {
                count++;
                totalPrice += service.price;
                selectedItems.push(service);

                // Calculate complexity weight
                let weight = 1;
                if (service.complexity === 'Média') weight = 2;
                if (service.complexity === 'Alta') weight = 3;
                if (weight > maxComplexityWeight) maxComplexityWeight = weight;
            }
        });

        // Update basic UI labels
        summaryPropertyType.textContent = currentPropertyType.charAt(0).toUpperCase() + currentPropertyType.slice(1);
        summaryCount.textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;

        // Set Complexity visual states
        complexityValue.className = 'metric-value'; // reset classes
        if (count === 0) {
            complexityValue.textContent = 'Nenhum';
            complexityValue.classList.add('color-green');
            timeValue.textContent = '—';
            priceValue.textContent = 'R$ 0,00';
            btnSendWhatsApp.disabled = true;
            return;
        }

        btnSendWhatsApp.disabled = false;

        if (maxComplexityWeight === 1) {
            complexityValue.textContent = 'Baixa';
            complexityValue.classList.add('color-green');
            timeValue.textContent = 'Até 4 horas';
        } else if (maxComplexityWeight === 2) {
            complexityValue.textContent = 'Média';
            complexityValue.classList.add('color-yellow');
            timeValue.textContent = '1 a 2 dias';
        } else {
            complexityValue.textContent = 'Alta';
            complexityValue.classList.add('color-red');
            timeValue.textContent = '3 a 6 dias';
        }

        // Format Total Price
        priceValue.textContent = `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // 6. Property buttons click triggers
    propertyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            propertyBtns.forEach(b => b.classList.remove('active'));
            
            // Mark current active
            btn.classList.add('active');
            currentPropertyType = btn.dataset.type;
            
            // Clear selections when switching main category
            selectedServices.clear();
            
            // Redraw Services
            renderServices();
        });
    });

    // 7. Send Structured WhatsApp Message
    btnSendWhatsApp.addEventListener('click', () => {
        if (selectedServices.size === 0) return;

        const services = servicesDatabase[currentPropertyType];
        let selectedListString = '';
        let totalPrice = 0;
        let finalComplexity = complexityValue.textContent;
        let finalTime = timeValue.textContent;

        services.forEach(service => {
            if (selectedServices.has(service.id)) {
                selectedListString += `• ${service.title}\n`;
                totalPrice += service.price;
            }
        });

        const formattedPrice = `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const typeLabel = currentPropertyType.charAt(0).toUpperCase() + currentPropertyType.slice(1);

        // Build elegant WhatsApp message text
        const messageText = `Olá, equipe M Tech!
Gostaria de agendar uma inspeção técnica para o meu imóvel. Fiz uma simulação de orçamento pelo site:

*Tipo do Imóvel:* ${typeLabel}

*Serviços Selecionados:*
${selectedListString}
*Métricas Estimadas:*
- Complexidade do Projeto: ${finalComplexity}
- Prazo Estimado de Execução: ${finalTime}
- Valor Referencial da Mão de Obra: ${formattedPrice}

Aguardo o retorno para agendarmos a visita e formalizarmos o orçamento!`;

        // Encode URI and open tab
        const encodedMessage = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/5515998144211?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    });

    // Initialize Calculator display
    renderServices();
});
