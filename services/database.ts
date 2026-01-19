
import { supabase } from './supabaseClient';
import { Equipment, Sector, User, Event, Rental, RentalStatus, UserRole, EquipmentItem, Channel, MerchandiseItem, Legendario } from '../types';

// --- HELPERS DE CONVERSÃO ---

const mapChannel = (c: any): Channel => ({
  id: c.id,
  name: c.name,
  frequency: c.frequency,
  type: c.type
});

const mapItem = (c: any): EquipmentItem => ({
  id: c.id,
  name: c.name,
  createdAt: c.created_at,
  createdBy: c.created_by
});

const mapUser = (u: any): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as UserRole,
  avatarInitials: u.avatar_initials || u.name.substring(0, 2).toUpperCase(),
  preferredName: u.preferred_name,
  phone: u.phone,
  isActive: u.is_active !== false // Default true se for nulo
});

const mapSector = (s: any): Sector => ({
  id: s.id,
  name: s.name,
  coordinatorName: s.coordinator_name,
  coordinatorPhone: s.coordinator_phone,
  channelId: s.channel_id
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
  serialNumber: r.serial_number,
  startDate: r.start_date,
  expectedReturnDate: r.expected_return_date,
  actualReturnDate: r.actual_return_date,
  status: r.status as RentalStatus,
  notes: r.notes,
  registeredBy: r.registered_by,
  accessories: r.accessories, 
  returnedAccessories: r.returned_accessories,
  radioModel: r.radio_model
});

const mapMerchandise = (m: any): MerchandiseItem => ({
  id: m.id,
  name: m.name,
  currentStock: m.current_stock,
  minThreshold: m.min_threshold
});

const mapLegendario = (l: any): Legendario => ({
  id: l.id,
  cpf: l.cpf,
  name: l.name,
  email: l.email,
  phone: l.phone,
  registrationNumber: l.registration_number,
  deliveries: {} // Será populado separadamente ou via join
});

// --- API METHODS ---

export const api = {
  // CANAIS
  fetchChannels: async () => {
    const { data, error } = await supabase.from('channels').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapChannel);
  },
  createChannel: async (ch: Omit<Channel, 'id'>) => {
    const { data, error } = await supabase.from('channels').insert(ch).select().single();
    if (error) throw error;
    return mapChannel(data);
  },
  updateChannel: async (ch: Channel) => {
    const { data, error } = await supabase.from('channels').update({
        name: ch.name,
        frequency: ch.frequency,
        type: ch.type
    }).eq('id', ch.id).select().single();
    if (error) throw error;
    return mapChannel(data);
  },
  deleteChannel: async (id: string) => {
    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (error) throw error;
  },

  fetchItems: async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('id, name, created_at, created_by')
        .order('name');
      
      if (error) throw error;
      return (data || []).map(mapItem);
    } catch (err) {
      console.error("Falha na API fetchItems:", err);
      return [];
    }
  },
  createItem: async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .insert({ 
        name: name,
        created_by: userId
      })
      .select('id, name, created_at, created_by')
      .single();
      
    if (error) throw error;
    return mapItem(data);
  },
  updateItem: async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .update({ name })
      .eq('id', id)
      .select('id, name, created_at, created_by');
    
    if (error) throw error;
    return mapItem(data![0]);
  },
  deleteItem: async (id: string) => {
    const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
    if (error) throw error;
  },

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

  fetchSectors: async () => {
    const { data, error } = await supabase.from('sectors').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapSector);
  },
  createSector: async (sec: Omit<Sector, 'id'>) => {
    const { data, error } = await supabase.from('sectors').insert({
        name: sec.name,
        coordinator_name: sec.coordinatorName,
        coordinator_phone: sec.coordinatorPhone,
        channel_id: sec.channelId || null 
    }).select().single();
    if (error) throw error;
    return mapSector(data);
  },
  updateSector: async (sec: Sector) => {
    const { data, error } = await supabase.from('sectors').update({
        name: sec.name,
        coordinator_name: sec.coordinatorName,
        coordinator_phone: sec.coordinatorPhone,
        channel_id: sec.channelId || null
    }).eq('id', sec.id).select().single();
    if (error) throw error;
    return mapSector(data);
  },
  deleteSector: async (id: string) => {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) throw error;
  },

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
          preferred_name: user.preferredName,
          is_active: user.isActive
      }).select().single();
      if (error) throw error;
      return mapUser(data);
  },
  updateProfile: async (user: User) => {
      const { data, error } = await supabase.from('profiles').update({
          name: user.name,
          role: user.role,
          phone: user.phone,
          preferred_name: user.preferredName,
          is_active: user.isActive
      }).eq('id', user.id).select().single();
      if (error) throw error;
      return mapUser(data);
  },

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
      const { data, error } = await supabase.from('rentals').update(updates).eq('id', id).select();
      if (error) throw error;
      return mapRental(data[0]);
  },

  // --- NOVOS MÉTODOS PINS & PATCHES ---
  
  fetchMerchandise: async () => {
    const { data, error } = await supabase.from('merchandise').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapMerchandise);
  },
  createMerchandise: async (item: Omit<MerchandiseItem, 'id'>) => {
    const { data, error } = await supabase.from('merchandise').insert({
      name: item.name,
      current_stock: item.currentStock,
      min_threshold: item.minThreshold
    }).select().single();
    if (error) throw error;
    return mapMerchandise(data);
  },
  updateMerchandise: async (item: MerchandiseItem) => {
    const { data, error } = await supabase.from('merchandise').update({
      name: item.name,
      current_stock: item.currentStock,
      min_threshold: item.minThreshold
    }).eq('id', item.id).select().single();
    if (error) throw error;
    return mapMerchandise(data);
  },
  deleteMerchandise: async (id: string) => {
    const { error } = await supabase.from('merchandise').delete().eq('id', id);
    if (error) throw error;
  },
  
  // Buscar Legendários (e suas entregas)
  searchLegendarios: async (term: string) => {
    const termLike = `%${term}%`;
    const { data, error } = await supabase
      .from('legendarios')
      .select(`
        *,
        deliveries ( merchandise_id, delivered_at )
      `)
      .or(`name.ilike.${termLike},cpf.ilike.${termLike},registration_number.ilike.${termLike}`)
      .limit(50);
      
    if (error) throw error;

    return (data || []).map((l: any) => {
      const leg = mapLegendario(l);
      // Mapear entregas para um objeto { item_id: data_entrega }
      leg.deliveries = {};
      if (l.deliveries && Array.isArray(l.deliveries)) {
        l.deliveries.forEach((d: any) => {
           leg.deliveries![d.merchandise_id] = d.delivered_at;
        });
      }
      return leg;
    });
  },

  // Importação em massa
  importLegendarios: async (legendarios: Omit<Legendario, 'id'>[]) => {
    const { data, error } = await supabase.from('legendarios').insert(
      legendarios.map(l => ({
        cpf: l.cpf,
        name: l.name,
        email: l.email,
        phone: l.phone,
        registration_number: l.registrationNumber
      }))
    ).select();
    if (error) throw error;
    return data.length;
  },

  // Verificar CPFs existentes para importação
  checkExistingCPFs: async (cpfs: string[]) => {
    const { data, error } = await supabase.from('legendarios').select('cpf').in('cpf', cpfs);
    if (error) throw error;
    return (data || []).map((i: any) => i.cpf);
  },

  // Registrar entrega
  deliverItem: async (legendarioId: string, merchandiseId: string, userId: string) => {
    // 1. Decrementar estoque
    const { error: stockError } = await supabase.rpc('decrement_stock', { item_id: merchandiseId });
    // Se a função RPC não existir, fazemos via update normal (menos seguro para concorrência, mas funcional)
    if (stockError) {
       // Fallback: Ler e atualizar
       const { data: item } = await supabase.from('merchandise').select('current_stock').eq('id', merchandiseId).single();
       if (item && item.current_stock > 0) {
          await supabase.from('merchandise').update({ current_stock: item.current_stock - 1 }).eq('id', merchandiseId);
       } else {
          throw new Error("Estoque insuficiente");
       }
    }

    // 2. Registrar entrega
    const { error } = await supabase.from('deliveries').insert({
      legendario_id: legendarioId,
      merchandise_id: merchandiseId,
      delivered_by: userId
    });

    if (error) throw error;
    return new Date().toISOString();
  }
};
