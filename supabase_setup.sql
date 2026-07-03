-- Script de Criação do Banco de Dados para a Ferramenta de Triagem M Tech

-- 1. Criar a tabela de Leads
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo_imovel TEXT NOT NULL CHECK (tipo_imovel IN ('Residencial', 'Comercial')),
    urgencia TEXT NOT NULL,
    problema TEXT NOT NULL,
    classificacao_ia TEXT,
    resumo_ia TEXT,
    foto_url TEXT
);

-- Habilitar RLS (Row Level Security) para proteger os dados
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção anônima (já que o formulário é público)
CREATE POLICY "Permitir inserção pública" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Criar política para leitura apenas por usuários autenticados (ou desative RLS temporariamente para testes)
CREATE POLICY "Permitir leitura apenas para autenticados" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Configurar o Storage para as fotos
-- Certifique-se de que você ativou o Storage no painel do Supabase antes de rodar isso
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos_triagem', 'fotos_triagem', true);

-- Políticas do Storage
-- Permitir upload público de fotos
CREATE POLICY "Permitir upload público"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'fotos_triagem');

-- Permitir leitura pública das fotos
CREATE POLICY "Permitir leitura pública"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'fotos_triagem');
