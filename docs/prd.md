📌 PRD – ATOMTECH SaaS (Gestão de Carregadores Veiculares)
1. Visão do Produto

Nome: Atomtech Dashboard
Tipo: SaaS multi-tenant (multi-empresa)
Plataforma: Web (responsivo – desktop/tablet)

🎯 Objetivo

Criar uma plataforma centralizada para gestão, monitoramento e monetização de redes de carregadores veiculares, permitindo que empresas operem seus pontos de recarga com eficiência e visibilidade total.

💡 Problema

Empresas que operam carregadores elétricos enfrentam:

Falta de controle operacional em tempo real

Dificuldade de análise de consumo e receita

Gestão descentralizada de estações e usuários

Baixa visibilidade sobre performance

🚀 Solução

Um dashboard SaaS que:

Centraliza todos os dados da operação

Permite gestão multi-empresa

Oferece analytics avançado

Simula controle em tempo real (futuro WebSocket)

2. Personas
👤 Super Admin (Atomtech)

Administra todas as empresas

Visão global do sistema

Cria e gerencia empresas

🏢 Admin da Empresa

Gerencia sua própria rede

Controle total dentro da empresa

👨‍💼 Manager

Acompanha operação

Não gerencia configurações críticas

👁️ Viewer

Apenas visualização

3. Escopo do Produto
MVP (fase atual)

Autenticação simulada

Dashboard multi-tenant

CRUD básico (mockado)

Visualização de dados

Controle por roles

UI completa

Futuro

Integração com Supabase

Realtime (WebSocket / OCPP)

Integração com app mobile

Pagamentos reais

API pública

4. Arquitetura do Sistema
🧠 Modelo SaaS Multi-Tenant

Todos os dados devem conter:

company_id: number

🧩 Usuário
type User = {
  id: number
  email: string
  role: "super_admin" | "company_admin" | "manager" | "viewer"
  company_id: number | null
}

🔐 Regras

Super Admin → vê tudo

Outros → filtrados por company_id

5. Autenticação
📌 Objetivo

Controlar acesso ao sistema com simulação de backend.

Funcionalidades

Login com email/senha

Persistência de sessão (localStorage)

Logout

Proteção de rotas

Dados mockados
const users = [...]

Regras

Usuário inválido → erro visual

Usuário válido → salva em estado global

Redireciona para dashboard

6. Controle de Acesso (RBAC)
Roles
Role	Permissão
super_admin	acesso total
company_admin	controle total da empresa
manager	gestão parcial
viewer	leitura
Permissões

Visualizar

Criar

Editar

Excluir

7. Funcionalidades
7.1 Dashboard (Visão Geral)
Objetivo

Visão macro da operação

KPIs

Usuários

Sessões

Estações

kWh

Receita

CO₂

Componentes

Cards de métricas

Gráficos (consumo, receita)

Heatmap horário

Mapa interativo

Regra

Filtrar por company_id

Super Admin pode alternar empresa

7.2 Sessões
Objetivo

Monitorar recargas

Dados

Usuário

Estação

kWh

Receita

Status

Funcionalidades

Filtros

Tabela

Status visual

7.3 Estações
Objetivo

Gerenciar carregadores

Funcionalidades

Listagem

Status dos conectores

Cadastro (wizard 3 etapas)

Detalhes da estação

Status

Verde → disponível

Amarelo → em uso

Vermelho → offline

7.4 Usuários
Objetivo

Gerenciar clientes finais

Dados

Nome

Veículo

Consumo

Destaque

Alertar se usuário não tem veículo

7.5 Analytics
Objetivo

Tomada de decisão

Filtros

7 / 28 / 90 dias

1 ano

Custom

Métricas

Consumo

Duração

Horários

Veículos

7.6 Push
Objetivo

Comunicação com usuários

Funcionalidades

Criar notificações

Histórico

7.7 Voucher
Objetivo

Promoções e incentivos

Tipos

kWh

R$

%

7.8 Tarifas
Objetivo

Precificação

Configuração

Por dia da semana

Dinâmica por horário

7.9 Financeiro
Objetivo

Controle de receita

Dados

Receita por estação

Impostos

Consolidado

7.10 Configurações
Permissões

Criar níveis customizados

Sistema

Tema

Moeda

Fuso

8. UX / UI
Diretrizes

Minimalista

Dark mode padrão

Responsivo

Sidebar moderna

Animações suaves

Componentes

Cards

Tabelas

Charts

Mapas

Modais

Wizards

9. Requisitos Técnicos
Frontend

React / Next.js

Tailwind

State global (Zustand ou Context)

Componentização

Dados

Mock local

Estrutura pronta para API

Futuro

Supabase (Auth + DB)

WebSocket realtime

10. Estrutura de Dados (Simplificada)
Exemplo Sessão
type Session = {
  id: number
  user_id: number
  station_id: number
  kwh: number
  revenue: number
  status: "active" | "finished" | "error"
  company_id: number
}

11. Fluxos Principais
Login

Usuário entra com email/senha

Validação local

Salva sessão

Redireciona

Navegação

Sidebar → módulos

Header → busca + logout

Criação de Estação

Dados gerais

Endereço

Upload

12. Métricas de Sucesso

Tempo médio na dashboard

Número de sessões visualizadas

Uso de analytics

Retenção de usuários

13. Roadmap
Fase 1 (Agora)

UI completa

Dados mockados

Multi-tenant funcional

Fase 2

Backend real (Supabase)

Auth real

Fase 3

Realtime

Integração com carregadores (OCPP)

Fase 4

App mobile

Pagamentos

14. Diferencial Estratégico

Aqui é onde você pode ser agressivo:

👉 Seu produto não é só um dashboard
👉 É uma plataforma de energia inteligente

Se você evoluir certo, você vira:

SaaS de mobilidade elétrica

Plataforma de gestão energética

Infraestrutura de smart cities

15. Riscos

Complexidade de multi-tenant mal implementada

UI bonita sem lógica de dados consistente

Escalabilidade futura se não estruturar bem agora

16. Decisão Técnica Crítica

Se você acertar isso, você voa:

👉 Tudo precisa girar em torno de:

company_id

role

Se errar isso, refatora tudo depois.