
import { supabase } from './supabaseClient';
import { Equipment, Sector, User, Event, Rental, RentalStatus, UserRole, EquipmentItem } from '../types';

// --- HELPERS DE CONVERSÃO ---

const mapItem = (c: any): EquipmentItem => {
  const profileData = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
  return {
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    createdBy: profileData?.name || 'Sistema'
  };
};

const mapUser = (u: any): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as UserRole,
  avatarInitials: u.avatar_initials || u.name.substring(0, 2).toUpperCase(),
  preferredName: u.preferred_name,
  phone: u.phone
});

const mapSector = (s: any): Sector => ({
  id: s.id,
  name: s.name,
  coordinatorName: s.coordinator_name,
  coordinatorPhone: s.coordinator_phone
});

const mapEvent = (e: any): Event => ({
  id: e.id,
  name: e.name,
  startDate: e.start_date,
  endDate: e.end_date,
  isActive: e.is_active
});

const mapEquipment = (e: any): Equipment => ({
  id: e.id,
  inventoryNumber: e.inventory_number,
  name: e.name,
  brand: e.brand,
  model: e.model,
  category: e.category,
  createdAt: e.created_at
});

const mapRental = (r: any): Rental => ({
  id: r.id,
  eventId: r.event_id,
  clientName: r.client_name,
  clientPhone: r.client_phone,
  clientCompany: r.client_company,
  radioModel: r.radio_model,
  serialNumber: r.serial_number,
  startDate: r.start_date,
  expectedReturnDate: r.expected_return_date,
  actualReturnDate: r.actual_return_date,
  status: r.status as RentalStatus,
  notes: r.notes,
  registeredBy: r.registered_by,
  accessories: r.accessories, 
  returnedAccessories: r.returned_accessories 
});

// --- API METHODS ---

export const api = {
  // ITEMS (EQUIPMENT CATEGORIES)
  fetchItems: async () => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .select('*, profiles(name)')
      .order('name');
    if (error) throw error;
    return (data || []).map(mapItem);
  },
  createItem: async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .insert({ name, created_by: userId })
      .select('*, profiles(name)')
      .single();
    if (error) throw error;
    return mapItem(data);
  },
  updateItem: async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .update({ name })
      .eq('id', id)
      .select('*, profiles(name)')
      .single();
    if (error) throw error;
    return mapItem(data);
  },
  deleteItem: async (id: string) => {
    const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
    if (error) throw error;
  },

  // EVENTS
  fetchEvents: async () => {
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapEvent);
  },
  createEvent: async (event: Omit<Event, 'id'>) => {
    const { data, error } = await supabase.from('events').insert({
      name: event.name,
      start_date: event.startDate,
      end_date: event.endDate,
      is_active: event.isActive
    }).select().single();
    if (error) throw error;
    return mapEvent(data);
  },
  updateEvent: async (event: Event) => {
    const { data, error } = await supabase.from('events').update({
        name: event.name,
        start_date: event.startDate,
        end_date: event.endDate,
        is_active: event.isActive
    }).eq('id', event.id).select().single();
    if(error) throw error;
    return mapEvent(data);
  },

  // EQUIPMENT
  fetchEquipment: async () => {
    const { data, error } = await supabase.from('equipment').select('*').order('inventory_number', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapEquipment);
  },
  createEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const { data, error } = await supabase.from('equipment').insert({
        inventory_number: eq.inventoryNumber,
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        category: eq.category,
        created_at: eq.createdAt
    }).select().single();
    if (error) throw error;
    return mapEquipment(data);
  },
  updateEquipment: async (eq: Equipment) => {
    const { data, error } = await supabase.from('equipment').update({
        inventory_number: eq.inventoryNumber,
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        category: eq.category
    }).eq('id', eq.id).select().single();
    if (error) throw error;
    return mapEquipment(data);
  },
  deleteEquipment: async (id: string) => {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) throw error;
  },

  // SECTORS
  fetchSectors: async () => {
    const { data, error } = await supabase.from('sectors').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapSector);
  },
  createSector: async (sec: Omit<Sector, 'id'>) => {
    const { data, error } = await supabase.from('sectors').insert({
        name: sec.name,
        coordinator_name: sec.coordinatorName,
        coordinator_phone: sec.coordinatorPhone
    }).select().single();
    if (error) throw error;
    return mapSector(data);
  },
  updateSector: async (sec: Sector) => {
    const { data, error } = await supabase.from('sectors').update({
        name: sec.name,
        coordinator_name: sec.coordinatorName,
        coordinator_phone: sec.coordinatorPhone
    }).eq('id', sec.id).select().single();
    if (error) throw error;
    return mapSector(data);
  },
  deleteSector: async (id: string) => {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) throw error;
  },

  // USERS
  fetchUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map(mapUser);
  },
  createProfile: async (user: User) => {
      const { data, error } = await supabase.from('profiles').insert({
          id: user.id, 
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_initials: user.avatarInitials,
          phone: user.phone,
          preferred_name: user.preferredName
      }).select().single();
      if (error) throw error;
      return mapUser(data);
  },
  updateProfile: async (user: User) => {
      const { data, error } = await supabase.from('profiles').update({
          name: user.name,
          role: user.role,
          phone: user.phone,
          preferred_name: user.preferredName
      }).eq('id', user.id).select().single();
      if (error) throw error;
      return mapUser(data);
  },

  // RENTALS
  fetchRentals: async () => {
    const { data, error } = await supabase.from('rentals').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRental);
  },
  createRental: async (rental: Omit<Rental, 'id' | 'status'>, userId: string) => {
      const { data, error } = await supabase.from('rentals').insert({
          event_id: rental.eventId,
          client_name: rental.clientName,
          client_phone: rental.clientPhone,
          client_company: rental.clientCompany,
          radio_model: rental.radioModel,
          serial_number: rental.serialNumber,
          start_date: rental.startDate,
          expected_return_date: rental.expectedReturnDate,
          status: 'Ativo',
          notes: rental.notes,
          registered_by: userId,
          accessories: rental.accessories
      }).select().single();
      if (error) throw error;
      return mapRental(data);
  },
  returnRental: async (id: string, status: string, returnedItems: any) => {
      const updates: any = {
          status: status,
          returned_accessories: returnedItems
      };
      if (status === 'Devolvido') {
          updates.actual_return_date = new Date().toISOString().split('T')[0];
      }
      const { data, error } = await supabase.from('rentals').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return mapRental(data);
  }
};
