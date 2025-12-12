
export enum RentalStatus {
  ACTIVE = 'Ativo',
  COMPLETED = 'Devolvido',
  OVERDUE = 'Atrasado',
  MAINTENANCE = 'Manutenção',
  PARTIAL = 'Parcial / Pendente'
}

export type EquipmentCategory = 'Radio' | 'Headset' | 'PowerBank';

export interface Equipment {
  id: string;
  inventoryNumber: string; // Ex: ADM 01, VEO 02 (Etiqueta física)
  name: string; // Identificação interna (ex: Rádio 01)
  brand: string;
  model: string;
  category: EquipmentCategory;
  createdAt: string; // ISO Date
}

export interface Sector {
  id: string;
  name: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
}

export interface Event {
  id: string;
  name: string; // Ex: TOP 1109 - Edição 54
  startDate: string;
  endDate: string;
  isActive: boolean; // Se é o evento corrente
}

export interface RentalAccessories {
  charger: boolean;
  powerBank: boolean;
  headset: boolean;
  antenna: boolean;
  clip: boolean;
}

export interface Rental {
  id: string;
  eventId: string; // Vínculo com o evento
  clientName: string;
  clientPhone: string; 
  clientCompany: string; // Setor (Segurança, Mídia, etc)
  radioModel: string;
  serialNumber: string;
  startDate: string; 
  expectedReturnDate: string; 
  actualReturnDate?: string; 
  status: RentalStatus;
  notes?: string;
  registeredBy?: string; 
  dailyRate?: number;
  accessories: RentalAccessories;
  returnedAccessories?: RentalAccessories; // O que efetivamente voltou
}

export interface DashboardStats {
  totalActive: number;
  totalOverdue: number;
  monthlyRevenue: number;
  utilizationRate: number;
}

export type ViewState = 'dashboard' | 'rentals' | 'new-rental' | 'history' | 'settings' | 'reports';

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string; 
  preferredName?: string; 
  email: string;
  phone?: string; 
  role: UserRole;
  avatarInitials: string;
}
