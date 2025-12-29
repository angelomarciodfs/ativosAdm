
export enum RentalStatus {
  ACTIVE = 'Ativo',
  COMPLETED = 'Devolvido',
  OVERDUE = 'Atrasado',
  MAINTENANCE = 'Manutenção',
  PARTIAL = 'Parcial / Pendente'
}

export interface Channel {
  id: string;
  name: string; // Ex: UV-01
  frequency: string; // Ex: 144.925
  type: string; // VHF / UHF
}

export interface EquipmentItem {
  id: string;
  name: string;
  createdAt?: string;
  createdBy?: string;
}

export interface Equipment {
  id: string;
  inventoryNumber: string; 
  name: string; 
  brand: string;
  model: string;
  category: string; 
  createdAt: string; 
}

export interface Sector {
  id: string;
  name: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
  channelId?: string; // Vínculo com Canal
}

export interface Event {
  id: string;
  name: string; 
  startDate: string;
  endDate: string;
  isActive: boolean; 
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
  eventId: string; 
  clientName: string;
  clientPhone: string; 
  clientCompany: string; 
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
  returnedAccessories?: RentalAccessories; 
}

export interface DashboardStats {
  totalActive: number;
  totalOverdue: number;
  monthlyRevenue: number;
  utilizationRate: number;
}

export type ViewState = 'dashboard' | 'rentals' | 'new-rental' | 'history' | 'settings' | 'reports' | 'profile';

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
