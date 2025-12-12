import { Rental, RentalStatus, Equipment, User, Sector, Event } from './types';

// URL da Logo
export const SYSTEM_LOGO = "https://res.cloudinary.com/doggu1n5f/image/upload/v1765277843/logolegendarios_ixbof2.png";

export const MOCK_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'João Diretor Silva',
    preferredName: 'João',
    email: 'admin@radiotrack.com',
    phone: '(11) 99999-9999',
    role: 'ADMIN',
    avatarInitials: 'JD'
  },
  {
    id: 'USR-002',
    name: 'Operador Logístico Souza',
    preferredName: 'Souza',
    email: 'operacao@radiotrack.com',
    phone: '(11) 98888-8888',
    role: 'USER',
    avatarInitials: 'OL'
  }
];

export const MOCK_SECTORS: Sector[] = [
  { id: 'SEC-001', name: 'ADM', coordinatorName: 'Carlos Admin', coordinatorPhone: '(11) 91111-1111' },
  { id: 'SEC-002', name: 'EVENTOS', coordinatorName: 'Ana Eventos', coordinatorPhone: '(11) 92222-2222' },
  { id: 'SEC-003', name: 'SEGURANÇA', coordinatorName: 'Sgt. Peixoto', coordinatorPhone: '(11) 93333-3333' },
  { id: 'SEC-004', name: 'LOGISTICA', coordinatorName: 'Roberto Log', coordinatorPhone: '(11) 94444-4444' },
  { id: 'SEC-005', name: 'HAKUNAS', coordinatorName: 'Líder Hakuna', coordinatorPhone: '(11) 95555-5555' },
  { id: 'SEC-006', name: 'INTERCESSÃO', coordinatorName: 'Pastora Maria', coordinatorPhone: '(11) 96666-6666' },
  { id: 'SEC-007', name: 'MINISTRADORES', coordinatorName: 'João Ministro', coordinatorPhone: '(11) 97777-7777' },
  { id: 'SEC-008', name: 'MÍDIA', coordinatorName: 'Lucas Mídia', coordinatorPhone: '(11) 98888-8888' },
  { id: 'SEC-009', name: 'COORDENAÇÃO', coordinatorName: 'Coord. Geral', coordinatorPhone: '(11) 99999-9999' },
  { id: 'SEC-010', name: 'VOZ', coordinatorName: 'Líder Voz', coordinatorPhone: '(11) 90000-0000' }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 'EVT-053',
        name: 'TOP 1109 - Edição 53 (Fev)',
        startDate: '2023-02-10',
        endDate: '2023-02-14',
        isActive: false
    },
    {
        id: 'EVT-054',
        name: 'TOP 1109 - Edição 54 (Mar)',
        startDate: '2023-03-15',
        endDate: '2023-03-19',
        isActive: true
    }
];

export const MOCK_RENTALS: Rental[] = [
  {
    id: 'RNT-2023-001',
    eventId: 'EVT-053',
    clientName: 'Carlos Silva',
    clientPhone: '(11) 99999-1001',
    clientCompany: 'EVENTOS',
    radioModel: 'Motorola T800',
    serialNumber: 'SN-882910',
    startDate: '2023-02-10',
    expectedReturnDate: '2023-02-14',
    status: RentalStatus.COMPLETED,
    actualReturnDate: '2023-02-14',
    registeredBy: 'USR-001',
    accessories: { charger: true, powerBank: false, headset: true, antenna: true, clip: true }
  },
  {
    id: 'RNT-2023-042',
    eventId: 'EVT-054',
    clientName: 'Fernanda Costa',
    clientPhone: '(11) 98888-2002',
    clientCompany: 'LOGISTICA',
    radioModel: 'Baofeng UV-5R',
    serialNumber: 'SN-112233',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    expectedReturnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: RentalStatus.ACTIVE,
    registeredBy: 'USR-002',
    accessories: { charger: false, powerBank: true, headset: false, antenna: true, clip: true }
  },
  {
    id: 'RNT-2023-043',
    eventId: 'EVT-054',
    clientName: 'João Santos',
    clientPhone: '(11) 97777-3003',
    clientCompany: 'SEGURANÇA',
    radioModel: 'Motorola Talkabout',
    serialNumber: 'SN-998877',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expectedReturnDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: RentalStatus.OVERDUE,
    registeredBy: 'USR-002',
    accessories: { charger: true, powerBank: true, headset: true, antenna: true, clip: true }
  },
  {
    id: 'RNT-2023-045',
    eventId: 'EVT-054',
    clientName: 'Mariana Lima',
    clientPhone: '(21) 96666-4004',
    clientCompany: 'MÍDIA',
    radioModel: 'Kenwood PKT-23',
    serialNumber: 'SN-445566',
    startDate: new Date(Date.now()).toISOString().split('T')[0], 
    expectedReturnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: RentalStatus.ACTIVE,
    registeredBy: 'USR-001',
    accessories: { charger: false, powerBank: false, headset: true, antenna: true, clip: true }
  }
];

export const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: 'EQ-001',
    inventoryNumber: 'ADM 01',
    name: 'Kit Tático Alpha',
    brand: 'Motorola',
    model: 'T800',
    category: 'Radio',
    createdAt: '2023-01-15'
  },
  {
    id: 'EQ-002',
    inventoryNumber: 'FONE 01',
    name: 'Fone Intra-auricular',
    brand: 'Baofeng',
    model: 'Air Acoustic',
    category: 'Headset',
    createdAt: '2023-02-10'
  },
  {
    id: 'EQ-003',
    inventoryNumber: 'PWR 05',
    name: 'Power Station 20k',
    brand: 'Anker',
    model: 'PowerCore',
    category: 'PowerBank',
    createdAt: '2023-03-22'
  },
  {
    id: 'EQ-004',
    inventoryNumber: 'OP 01',
    name: 'Rádio Operacional 01',
    brand: 'Baofeng',
    model: 'UV-5R',
    category: 'Radio',
    createdAt: '2023-04-01'
  },
  {
    id: 'EQ-005',
    inventoryNumber: 'OP 02',
    name: 'Rádio Operacional 02',
    brand: 'Kenwood',
    model: 'PKT-23',
    category: 'Radio',
    createdAt: '2023-04-05'
  }
];