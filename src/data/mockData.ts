export interface Company {
  id: number;
  name: string;
  cnpj: string;
  city: string;
  uf: string;
  status: 'active' | 'inactive';
  stations_count: number;
  users_count: number;
}

export interface Station {
  id: number;
  company_id: number;
  name: string;
  city: string;
  uf: string;
  status: 'online' | 'offline' | 'maintenance';
  connectors: Connector[];
  total_kwh: number;
  total_sessions: number;
  lat: number;
  lng: number;
}

export interface Connector {
  id: number;
  type: string;
  status: 'available' | 'in_use' | 'offline';
  power_kw: number;
}

export interface ChargingSession {
  id: string;
  company_id: number;
  user_name: string;
  station_name: string;
  connector_id: number;
  start: string;
  end: string | null;
  duration_min: number;
  kwh: number;
  revenue: number;
  status: 'active' | 'completed' | 'error';
}

export interface EVUser {
  id: number;
  company_id: number;
  name: string;
  document: string;
  vehicle: string | null;
  sessions_count: number;
  total_kwh: number;
  status: 'active' | 'inactive';
}

export const companies: Company[] = [
  { id: 1, name: "EcoCharge Brasil", cnpj: "12.345.678/0001-90", city: "São Paulo", uf: "SP", status: "active", stations_count: 12, users_count: 340 },
  { id: 2, name: "VoltMov", cnpj: "98.765.432/0001-10", city: "Rio de Janeiro", uf: "RJ", status: "active", stations_count: 8, users_count: 210 },
  { id: 3, name: "GreenPlug", cnpj: "11.222.333/0001-44", city: "Curitiba", uf: "PR", status: "active", stations_count: 5, users_count: 95 },
];

export const stations: Station[] = [
  { id: 1, company_id: 1, name: "Shopping Ibirapuera", city: "São Paulo", uf: "SP", status: "online", total_kwh: 12450, total_sessions: 890, lat: -23.5868, lng: -46.6589, connectors: [
    { id: 1, type: "CCS2", status: "available", power_kw: 150 },
    { id: 2, type: "CCS2", status: "in_use", power_kw: 150 },
    { id: 3, type: "Type 2", status: "available", power_kw: 22 },
  ]},
  { id: 2, company_id: 1, name: "Av. Paulista 1500", city: "São Paulo", uf: "SP", status: "online", total_kwh: 8920, total_sessions: 645, lat: -23.5615, lng: -46.6559, connectors: [
    { id: 4, type: "CCS2", status: "in_use", power_kw: 50 },
    { id: 5, type: "Type 2", status: "available", power_kw: 22 },
  ]},
  { id: 3, company_id: 1, name: "Shopping Vila Olímpia", city: "São Paulo", uf: "SP", status: "maintenance", total_kwh: 3200, total_sessions: 220, lat: -23.5960, lng: -46.6847, connectors: [
    { id: 6, type: "CCS2", status: "offline", power_kw: 150 },
    { id: 7, type: "Type 2", status: "offline", power_kw: 22 },
  ]},
  { id: 4, company_id: 2, name: "Barra Shopping", city: "Rio de Janeiro", uf: "RJ", status: "online", total_kwh: 9800, total_sessions: 720, lat: -22.9995, lng: -43.3635, connectors: [
    { id: 8, type: "CCS2", status: "available", power_kw: 150 },
    { id: 9, type: "CCS2", status: "available", power_kw: 150 },
  ]},
  { id: 5, company_id: 2, name: "Copacabana Station", city: "Rio de Janeiro", uf: "RJ", status: "online", total_kwh: 5600, total_sessions: 410, lat: -22.9711, lng: -43.1823, connectors: [
    { id: 10, type: "Type 2", status: "in_use", power_kw: 22 },
  ]},
  { id: 6, company_id: 3, name: "Park Shopping Barigui", city: "Curitiba", uf: "PR", status: "online", total_kwh: 4100, total_sessions: 310, lat: -25.4372, lng: -49.3032, connectors: [
    { id: 11, type: "CCS2", status: "available", power_kw: 50 },
    { id: 12, type: "Type 2", status: "available", power_kw: 22 },
  ]},
];

export const sessions: ChargingSession[] = [
  { id: "SES-001", company_id: 1, user_name: "Carlos Mendes", station_name: "Shopping Ibirapuera", connector_id: 2, start: "2026-02-18T08:30:00", end: null, duration_min: 45, kwh: 32.5, revenue: 48.75, status: "active" },
  { id: "SES-002", company_id: 1, user_name: "Ana Lucia", station_name: "Av. Paulista 1500", connector_id: 4, start: "2026-02-18T07:15:00", end: "2026-02-18T08:45:00", duration_min: 90, kwh: 55.2, revenue: 82.80, status: "completed" },
  { id: "SES-003", company_id: 1, user_name: "Roberto Lima", station_name: "Shopping Ibirapuera", connector_id: 1, start: "2026-02-17T14:00:00", end: "2026-02-17T15:20:00", duration_min: 80, kwh: 48.0, revenue: 72.00, status: "completed" },
  { id: "SES-004", company_id: 2, user_name: "Fernanda Costa", station_name: "Barra Shopping", connector_id: 8, start: "2026-02-18T09:00:00", end: null, duration_min: 30, kwh: 22.1, revenue: 33.15, status: "active" },
  { id: "SES-005", company_id: 2, user_name: "Paulo Souza", station_name: "Copacabana Station", connector_id: 10, start: "2026-02-17T18:30:00", end: "2026-02-17T20:00:00", duration_min: 90, kwh: 14.5, revenue: 21.75, status: "completed" },
  { id: "SES-006", company_id: 1, user_name: "Marcos Oliveira", station_name: "Shopping Vila Olímpia", connector_id: 6, start: "2026-02-16T10:00:00", end: "2026-02-16T10:05:00", duration_min: 5, kwh: 0.2, revenue: 0, status: "error" },
  { id: "SES-007", company_id: 3, user_name: "Juliana Pires", station_name: "Park Shopping Barigui", connector_id: 11, start: "2026-02-18T06:45:00", end: "2026-02-18T07:30:00", duration_min: 45, kwh: 28.0, revenue: 42.00, status: "completed" },
  { id: "SES-008", company_id: 1, user_name: "Thiago Alves", station_name: "Shopping Ibirapuera", connector_id: 3, start: "2026-02-17T20:00:00", end: "2026-02-17T22:30:00", duration_min: 150, kwh: 42.0, revenue: 63.00, status: "completed" },
];

export const evUsers: EVUser[] = [
  { id: 1, company_id: 1, name: "Carlos Mendes", document: "123.456.789-00", vehicle: "BYD Dolphin 2025", sessions_count: 24, total_kwh: 580, status: "active" },
  { id: 2, company_id: 1, name: "Ana Lucia", document: "987.654.321-00", vehicle: "GWM Ora 03", sessions_count: 18, total_kwh: 420, status: "active" },
  { id: 3, company_id: 1, name: "Roberto Lima", document: "456.789.123-00", vehicle: null, sessions_count: 5, total_kwh: 110, status: "active" },
  { id: 4, company_id: 2, name: "Fernanda Costa", document: "321.654.987-00", vehicle: "Volvo EX30", sessions_count: 31, total_kwh: 890, status: "active" },
  { id: 5, company_id: 2, name: "Paulo Souza", document: "789.123.456-00", vehicle: "Renault E-Tech", sessions_count: 12, total_kwh: 280, status: "inactive" },
  { id: 6, company_id: 3, name: "Juliana Pires", document: "654.987.321-00", vehicle: "Caoa Chery iCar", sessions_count: 8, total_kwh: 195, status: "active" },
  { id: 7, company_id: 1, name: "Marcos Oliveira", document: "111.222.333-00", vehicle: "BYD Seal", sessions_count: 42, total_kwh: 1200, status: "active" },
  { id: 8, company_id: 1, name: "Thiago Alves", document: "444.555.666-00", vehicle: "BMW iX1", sessions_count: 15, total_kwh: 350, status: "active" },
];

export const consumptionByDay = [
  { day: "Seg", kwh: 320, revenue: 480 },
  { day: "Ter", kwh: 280, revenue: 420 },
  { day: "Qua", kwh: 350, revenue: 525 },
  { day: "Qui", kwh: 410, revenue: 615 },
  { day: "Sex", kwh: 480, revenue: 720 },
  { day: "Sáb", kwh: 520, revenue: 780 },
  { day: "Dom", kwh: 290, revenue: 435 },
];

export const popularHours = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}h`,
  sessions: Math.round(Math.random() * 30 + (i >= 7 && i <= 20 ? 20 : 2)),
}));

export function filterByCompany<T extends { company_id: number }>(data: T[], companyId: number | null, role: string): T[] {
  if (role === 'super_admin' && companyId === null) return data;
  if (companyId !== null) return data.filter(d => d.company_id === companyId);
  return data;
}

export interface MockVoucher {
  id: number;
  company_id: number;
  code: string;
  name: string;
  type: string;
  total: number;
  daily: number | null;
  used: number;
  status: string;
  expiry_date: string | null;
}

export interface MockPushNotification {
  id: number;
  company_id: number;
  title: string;
  message: string;
  recipients_count: number;
  status: string;
  created_at: string;
}

export const vouchers: MockVoucher[] = [
  { id: 1, company_id: 1, code: "PROMO2026", name: "Promoção Verão", type: "kWh", total: 100, daily: 10, used: 45, status: "active", expiry_date: "2026-03-31" },
  { id: 2, company_id: 1, code: "ECO50", name: "Eco Desconto", type: "%", total: 200, daily: 20, used: 120, status: "active", expiry_date: "2026-06-30" },
  { id: 3, company_id: 1, code: "WELCOME", name: "Boas-vindas", type: "R$", total: 50, daily: 5, used: 50, status: "expired", expiry_date: "2026-01-31" },
];

export const pushNotifications: MockPushNotification[] = [
  { id: 1, company_id: 1, title: "Promoção de Carnaval", message: "Ganhe 20% off.", recipients_count: 340, status: "sent", created_at: "2026-02-15T00:00:00" },
  { id: 2, company_id: 1, title: "Nova estação disponível", message: "Inauguramos nova estação.", recipients_count: 210, status: "sent", created_at: "2026-02-10T00:00:00" },
  { id: 3, company_id: 1, title: "Manutenção programada", message: "Teremos manutenção.", recipients_count: 95, status: "sent", created_at: "2026-02-05T00:00:00" },
];
