'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { getClient } from '../lib/supabase';
import { 
  Shield, Users, BarChart3, Briefcase, Phone, MessageSquare, 
  CheckCircle2, Clock, XCircle, Search, RefreshCw, Star, 
  ArrowUpRight, IndianRupee, MapPin, Mail, Sparkles, Filter, 
  ChevronRight, ExternalLink, Award, AlertCircle, TrendingUp,
  Flame, Droplet, Hammer, Paintbrush, Scissors, Car, Bug, Wrench, Zap,
  Key, UserPlus, Trash2, Lock, LogOut, Check, ShieldAlert, Calendar
} from 'lucide-react';

const SUPER_ADMIN_PHONE = '7975182162';

type AdminTab = 'overview' | 'today' | 'bookings' | 'workers' | 'customers' | 'reviews' | 'admins';

interface AdminUserRecord {
  id: string;
  name: string;
  phone: string;
  role: 'super_admin' | 'admin';
  created_at: string;
}

interface AdminBooking {
  id: string;
  created_at: string;
  completed_at?: string;
  status: string;
  description?: string;
  price_estimate?: number;
  final_price?: number;
  address_text?: string;
  category_id?: string;
  category_name?: string;
  customer?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
  worker?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
    rating?: number;
  };
}

interface AdminWorker {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  years_experience: number;
  is_online: boolean;
  is_verified: boolean;
  rating: number;
  total_jobs: number;
  service_radius_km?: number;
  location?: { lat: number; lng: number } | null;
  categories: string[];
  created_at?: string;
}

function parseWorkerLocation(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;
  if (typeof loc === 'object' && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  if (typeof loc === 'object' && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
    return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
  }
  if (typeof loc === 'string') {
    try {
      const parsed = JSON.parse(loc);
      if (parsed.lat && parsed.lng) return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
      if (Array.isArray(parsed.coordinates)) return { lat: Number(parsed.coordinates[1]), lng: Number(parsed.coordinates[0]) };
    } catch {}
    const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
    }
  }
  return null;
}

interface AdminCustomer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  language?: string;
  created_at: string;
  bookings_count: number;
  total_spent: number;
}

interface AdminReview {
  id: string;
  booking_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  worker_name?: string;
  worker_phone?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  electrician: Zap,
  plumber: Droplet,
  carpenter: Hammer,
  painter: Paintbrush,
  cleaning: Sparkles,
  pestcontrol: Bug,
  acrepair: Flame,
  salon: Scissors,
  mechanic: Car,
  mason: Wrench,
};

const isSameDay = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export default function AdminDashboard({ onLogout, credentials }: { onLogout?: () => void; credentials?: { phone: string; pin: string } }) {
  const [tab, setTab] = useState<AdminTab>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Admin Access List
  const [adminsList, setAdminsList] = useState<AdminUserRecord[]>(() => {
    if (typeof window === 'undefined') return [{ id: '1', name: 'Super Admin', phone: SUPER_ADMIN_PHONE, role: 'super_admin', created_at: new Date().toISOString() }];
    try {
      const saved = localStorage.getItem('hoh_admin_team');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ id: '1', name: 'Super Admin', phone: SUPER_ADMIN_PHONE, role: 'super_admin', created_at: new Date().toISOString() }];
  });

  // New Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'finance' | 'support'>('admin');
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // PIN settings
  const [masterPassword, setMasterPassword] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hoh_admin_master_pin') || '7975';
    }
    return '7975';
  });
  const [newMasterPin, setNewMasterPin] = useState('');

  // Filters & Search
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [workerCategoryFilter, setWorkerCategoryFilter] = useState<string>('all');
  const [workerSearch, setWorkerSearch] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const loadAllData = async () => {
    try {
      const client = getClient();
      if (!client) return;

      // Try secure server-side RPC first
      try {
        const { data: rpcData, error: rpcError } = await client.rpc('get_admin_dashboard_data', {
          p_phone: credentials?.phone || SUPER_ADMIN_PHONE,
          p_pin: credentials?.pin || '7975',
        });

        if (!rpcError && rpcData && rpcData.success) {
          const catMap: Record<string, { name: string; slug: string }> = {};
          const catCounts: Record<string, number> = {};
          (rpcData.categories || []).forEach((c: any) => {
            catMap[c.id] = { name: c.name_en, slug: c.slug };
            catCounts[c.name_en] = 0;
          });

          const parsedBookings: AdminBooking[] = (rpcData.bookings || []).map((b: any) => {
            const catInfo = b.category_id ? catMap[b.category_id] : undefined;
            return {
              id: b.id,
              created_at: b.created_at,
              completed_at: b.completed_at || (b.status === 'completed' ? b.created_at : undefined),
              status: b.status || 'searching',
              description: b.description,
              price_estimate: Number(b.price_estimate) || 350,
              final_price: Number(b.final_price) || (b.price_estimate ? Number(b.price_estimate) : 350),
              address_text: b.address_text || 'Standard Location',
              category_id: b.category_id,
              category_name: catInfo?.name || 'Home Service',
              customer: b.customer,
              worker: b.worker,
            };
          });
          setBookings(parsedBookings);

          const workerCatMap: Record<string, string[]> = {};
          (rpcData.worker_categories || []).forEach((wc: any) => {
            const catName = catMap[wc.category_id]?.name || 'General';
            if (!workerCatMap[wc.worker_id]) workerCatMap[wc.worker_id] = [];
            workerCatMap[wc.worker_id].push(catName);
          });

          const parsedWorkers: AdminWorker[] = (rpcData.workers || []).map((w: any) => {
            const cats = workerCatMap[w.id] || ['General Specialist'];
            cats.forEach(c => {
              catCounts[c] = (catCounts[c] || 0) + 1;
            });
            return {
              id: w.id,
              full_name: w.full_name,
              phone: w.phone || '',
              email: w.email || '',
              avatar_url: w.avatar_url,
              bio: w.bio,
              years_experience: Number(w.years_experience) || 0,
              is_online: !!w.is_online,
              is_verified: !!w.is_verified,
              rating: Number(w.rating) || 5.0,
              total_jobs: Number(w.total_jobs) || 0,
              service_radius_km: Number(w.service_radius_km) || 8,
              categories: cats,
              created_at: w.created_at,
            };
          });
          setWorkers(parsedWorkers);
          setCategoryCounts(catCounts);

          const parsedCustomers: AdminCustomer[] = (rpcData.customers || []).map((c: any) => ({
            id: c.id,
            full_name: c.full_name,
            phone: c.phone || '',
            email: c.email || '',
            avatar_url: c.avatar_url,
            language: c.language || 'en',
            created_at: c.created_at,
          }));
          setCustomers(parsedCustomers);

          const parsedReviews: AdminReview[] = (rpcData.reviews || []).map((r: any) => ({
            id: r.id,
            booking_id: r.booking_id,
            rating: Number(r.rating) || 5,
            comment: r.comment,
            created_at: r.created_at,
            customer_name: r.customer_name,
            customer_phone: r.customer_phone,
            worker_name: r.worker_name,
            worker_phone: r.worker_phone,
          }));
          setReviews(parsedReviews);

          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (e) {
        console.warn('RPC admin load failed, falling back to direct table queries:', e);
      }

      // 1. Fetch Categories
      const { data: catData } = await client.from('service_categories').select('id, slug, name_en');
      const catMap: Record<string, { name: string; slug: string }> = {};
      (catData || []).forEach((c: any) => {
        catMap[c.id] = { name: c.name_en, slug: c.slug };
      });

      // 2. Fetch Bookings with Customer and Worker profiles
      const { data: rawBookings } = await client
        .from('bookings')
        .select(`
          id, created_at, completed_at, status, description, price_estimate, final_price, address_text, category_id,
          customer:customer_id (id, full_name, phone, email, avatar_url),
          worker:worker_id (id, full_name, phone, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      const parsedBookings: AdminBooking[] = (rawBookings || []).map((b: any) => {
        const catInfo = b.category_id ? catMap[b.category_id] : undefined;
        return {
          id: b.id,
          created_at: b.created_at,
          completed_at: b.completed_at || (b.status === 'completed' ? b.created_at : undefined),
          status: b.status || 'searching',
          description: b.description,
          price_estimate: b.price_estimate ? Number(b.price_estimate) : 350,
          final_price: b.final_price ? Number(b.final_price) : (b.price_estimate ? Number(b.price_estimate) : 350),
          address_text: b.address_text || 'Standard Location',
          category_id: b.category_id,
          category_name: catInfo?.name || 'Home Service',
          customer: b.customer,
          worker: b.worker,
        };
      });
      setBookings(parsedBookings);

      // 3. Fetch Worker Profiles with joins
      const { data: rawWorkers } = await client
        .from('worker_profiles')
        .select(`
          profile_id, bio, years_experience, is_online, is_verified, avg_rating, total_jobs, service_radius_km, location,
          profiles:profile_id (id, full_name, phone, email, avatar_url, created_at)
        `);

      const { data: rawWorkerCats } = await client
        .from('worker_categories')
        .select('worker_id, category_id');

      const workerCatMap: Record<string, string[]> = {};
      (rawWorkerCats || []).forEach((wc: any) => {
        const catName = catMap[wc.category_id]?.name || 'General';
        if (!workerCatMap[wc.worker_id]) workerCatMap[wc.worker_id] = [];
        workerCatMap[wc.worker_id].push(catName);
      });

      const parsedWorkers: AdminWorker[] = (rawWorkers || []).map((w: any) => {
        const p = w.profiles || {};
        return {
          id: w.profile_id,
          full_name: p.full_name || 'Technician',
          phone: p.phone || '',
          email: p.email || '',
          avatar_url: p.avatar_url,
          bio: w.bio,
          years_experience: Number(w.years_experience) || 0,
          is_online: !!w.is_online,
          is_verified: !!w.is_verified,
          rating: Number(w.avg_rating) || 5.0,
          total_jobs: Number(w.total_jobs) || 0,
          service_radius_km: Number(w.service_radius_km) || 8,
          location: parseWorkerLocation(w.location),
          categories: workerCatMap[w.profile_id] || ['General Specialist'],
          created_at: p.created_at,
        };
      });
      setWorkers(parsedWorkers);

      // Category Distribution Counts
      const catCounts: Record<string, number> = {};
      (catData || []).forEach((c: any) => {
        catCounts[c.name_en] = 0;
      });
      parsedWorkers.forEach(w => {
        w.categories.forEach(c => {
          catCounts[c] = (catCounts[c] || 0) + 1;
        });
      });
      setCategoryCounts(catCounts);

      // 4. Fetch Customers
      const { data: rawProfiles } = await client
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url, language, created_at, role')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      const customerStats: Record<string, { count: number; spend: number }> = {};
      parsedBookings.forEach(b => {
        if (b.customer?.id) {
          if (!customerStats[b.customer.id]) customerStats[b.customer.id] = { count: 0, spend: 0 };
          customerStats[b.customer.id].count += 1;
          if (b.status === 'completed') {
            customerStats[b.customer.id].spend += (b.final_price || 0);
          }
        }
      });

      const parsedCustomers: AdminCustomer[] = (rawProfiles || []).map((cp: any) => ({
        id: cp.id,
        full_name: cp.full_name || 'Customer',
        phone: cp.phone || '',
        email: cp.email || '',
        avatar_url: cp.avatar_url,
        language: cp.language || 'en',
        created_at: cp.created_at,
        bookings_count: customerStats[cp.id]?.count || 0,
        total_spent: customerStats[cp.id]?.spend || 0,
      }));
      setCustomers(parsedCustomers);

      // 5. Fetch Reviews
      const { data: rawReviews } = await client
        .from('reviews')
        .select(`
          id, booking_id, rating, comment, created_at,
          customer:customer_id (full_name, phone),
          worker:worker_id (full_name, phone)
        `)
        .order('created_at', { ascending: false });

      const parsedReviews: AdminReview[] = (rawReviews || []).map((r: any) => ({
        id: r.id,
        booking_id: r.booking_id,
        rating: Number(r.rating) || 5,
        comment: r.comment,
        created_at: r.created_at,
        customer_name: r.customer?.full_name,
        customer_phone: r.customer?.phone,
        worker_name: r.worker?.full_name,
        worker_phone: r.worker?.phone,
      }));
      setReviews(parsedReviews);

    } catch (err) {
      console.error('[Admin Load Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Admin Management Handlers
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newAdminPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAdminActionMsg('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (!newAdminName.trim()) {
      setAdminActionMsg('Please enter the admin name.');
      return;
    }
    if (adminsList.some(a => a.phone === cleanPhone)) {
      setAdminActionMsg('This phone number is already registered as an Admin.');
      return;
    }

    const updated = [
      ...adminsList,
      {
        id: Date.now().toString(),
        name: newAdminName.trim(),
        phone: cleanPhone,
        role: 'admin' as const,
        created_at: new Date().toISOString(),
      }
    ];

    setAdminsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hoh_admin_team', JSON.stringify(updated));
      if (newAdminPin) {
        localStorage.setItem(`hoh_admin_pin_${cleanPhone}`, newAdminPin);
      }
    }

    setNewAdminName('');
    setNewAdminPhone('');
    setNewAdminPin('');
    setAdminActionMsg(`✓ Admin "${newAdminName.trim()}" (+91 ${cleanPhone}) added successfully!`);
    setTimeout(() => setAdminActionMsg(''), 4000);
  };

  const handleDeleteAdmin = (phoneToDelete: string) => {
    if (phoneToDelete === SUPER_ADMIN_PHONE) {
      alert('Cannot delete the primary Super Admin (7975182162).');
      return;
    }
    if (window.confirm(`Are you sure you want to revoke admin access for +91 ${phoneToDelete}?`)) {
      const updated = adminsList.filter(a => a.phone !== phoneToDelete);
      setAdminsList(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hoh_admin_team', JSON.stringify(updated));
        localStorage.removeItem(`hoh_admin_pin_${phoneToDelete}`);
      }
    }
  };

  const handleUpdateMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPin || newMasterPin.length < 4) {
      setAdminActionMsg('PIN must be at least 4 digits.');
      return;
    }
    setMasterPassword(newMasterPin);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hoh_admin_master_pin', newMasterPin);
    }
    setNewMasterPin('');
    setAdminActionMsg('✓ Master Super Admin PIN updated successfully!');
    setTimeout(() => setAdminActionMsg(''), 4000);
  };

  const handleToggleVerification = async (workerId: string, currentStatus: boolean) => {
    try {
      const client = getClient();
      if (!client) return;

      const { data, error } = await client.rpc('admin_toggle_worker_verification', {
        p_phone: credentials?.phone || SUPER_ADMIN_PHONE,
        p_pin: credentials?.pin || '7975',
        p_worker_id: workerId,
        p_status: !currentStatus,
      });

      if (!error && data && data.success) {
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_verified: !currentStatus } : w));
        return;
      }

      await client.from('worker_profiles').update({ is_verified: !currentStatus }).eq('profile_id', workerId);
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_verified: !currentStatus } : w));
    } catch (e) {
      console.error('Verify error:', e);
    }
  };

  // Financial & Stats Calculations
  const stats = useMemo(() => {
    const totalJobs = bookings.length;
    const completedJobs = bookings.filter(b => b.status === 'completed');
    const completedCount = completedJobs.length;
    const inProgressCount = bookings.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status)).length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    // Today's Work Done
    const todayDone = bookings.filter(b => b.status === 'completed' && (isSameDay(b.completed_at) || isSameDay(b.created_at)));
    const todayGMV = todayDone.reduce((sum, b) => sum + (b.final_price || 0), 0);
    const todayCommission = Math.round(todayGMV * 0.08);

    const totalGMV = completedJobs.reduce((sum, b) => sum + (b.final_price || 0), 0);
    const totalCommission = Math.round(totalGMV * 0.08); // 8% Platform Commission
    const workerNetPayout = totalGMV - totalCommission;

    const onlineWorkers = workers.filter(w => w.is_online).length;
    const verifiedWorkers = workers.filter(w => w.is_verified).length;

    return {
      totalJobs,
      completedCount,
      inProgressCount,
      cancelledCount,
      totalGMV,
      totalCommission,
      workerNetPayout,
      todayDoneCount: todayDone.length,
      todayGMV,
      todayCommission,
      todayDoneList: todayDone,
      totalWorkers: workers.length,
      onlineWorkers,
      verifiedWorkers,
      totalCustomers: customers.length,
    };
  }, [bookings, workers, customers]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      const q = bookingSearch.toLowerCase();
      const matchesSearch = !q || 
        b.customer?.full_name?.toLowerCase().includes(q) ||
        b.customer?.phone?.includes(q) ||
        b.worker?.full_name?.toLowerCase().includes(q) ||
        b.worker?.phone?.includes(q) ||
        b.category_name?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingStatusFilter, bookingSearch]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesCat = workerCategoryFilter === 'all' || w.categories.some(c => c.toLowerCase() === workerCategoryFilter.toLowerCase());
      const q = workerSearch.toLowerCase();
      const matchesSearch = !q ||
        w.full_name.toLowerCase().includes(q) ||
        w.phone?.includes(q) ||
        w.email?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [workers, workerCategoryFilter, workerSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = customerSearch.toLowerCase();
      return !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q);
    });
  }, [customers, customerSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>Completed</span>;
      case 'in_progress':
      case 'on_the_way':
      case 'accepted':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>In Progress</span>;
      case 'cancelled':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>Cancelled</span>;
      default:
        return <span style={{ background: '#E0F2FE', color: '#075985', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>Searching</span>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      
      {/* ── Top Header ── */}
      <header style={{ background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)', color: 'white', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <img src="/logo.png" alt="Hands of ShramiXs" style={{ width: 42, height: 42, objectFit: 'contain' }} onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} />
              <Shield size={26} color="#F59E0B" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>
                  Hands of ShramiXs
                </h1>
                <span style={{ background: '#F59E0B', color: '#041B30', fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin Hub
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '3px 0 0', fontWeight: 500 }}>
                Platform Operations · Daily Work Done & Review Engine
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setRefreshing(true); loadAllData(); }}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Live Sync'}
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 10, padding: '8px 14px', color: '#FCA5A5', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={14} /> Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs ── */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
          {[
            { key: 'today', label: "Today's Work Done", icon: CheckCircle2, badge: stats.todayDoneCount > 0 ? `${stats.todayDoneCount} Done Today` : null, highlight: true },
            { key: 'overview', label: 'Overview & Finances', icon: BarChart3, badge: null },
            { key: 'bookings', label: 'All Tasks & Calling', icon: Briefcase, badge: stats.totalJobs },
            { key: 'workers', label: 'Workers by Category', icon: Wrench, badge: stats.totalWorkers },
            { key: 'customers', label: 'Customers Directory', icon: Users, badge: stats.totalCustomers },
            { key: 'reviews', label: 'Ratings & Reviews', icon: Star, badge: reviews.length },
            { key: 'admins', label: 'Admin Access & Passwords', icon: Key, badge: adminsList.length },
          ].map(t => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as AdminTab)}
                style={{
                  padding: '14px 18px',
                  border: 'none',
                  background: t.highlight && !isActive ? '#F0FDF4' : 'none',
                  borderBottom: `3px solid ${isActive ? '#0B3D66' : 'transparent'}`,
                  color: isActive ? '#0B3D66' : (t.highlight ? '#15803D' : '#64748B'),
                  fontWeight: isActive ? 900 : 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#0B3D66' : (t.highlight ? '#16A34A' : '#64748B')} strokeWidth={2.2} />
                <span>{t.label}</span>
                {t.badge !== null && (
                  <span style={{ background: t.highlight ? '#DCFCE7' : (isActive ? '#0B3D66' : '#F1F5F9'), color: t.highlight ? '#166534' : (isActive ? 'white' : '#475569'), fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Dashboard Content ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1 }}>

        {/* ══════════════════════════════════════════════════════════════
            TAB 0: TODAY'S WORK DONE (NEW DEDICATED VIEW)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Top Summary Banner */}
            <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', color: 'white', borderRadius: 20, padding: '24px 28px', boxShadow: '0 8px 24px rgba(6,95,70,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} color="#86EFAC" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                    Today's Completed Work ({new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })})
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: '#D1FAE5', margin: 0 }}>
                  Live feed of jobs finished today. Call customer immediately for quality rating & feedback.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{stats.todayDoneCount}</div>
                  <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>Tasks Done Today</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FDE047' }}>₹{stats.todayGMV.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>Today's Total GMV</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#86EFAC' }}>₹{stats.todayCommission.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>Today's 8% Revenue</div>
                </div>
              </div>
            </div>

            {/* List of Tasks Done Today */}
            {stats.todayDoneList.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8' }}>
                <Calendar size={42} style={{ margin: '0 auto 14px', opacity: 0.4, color: '#0B3D66' }} />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>No completed tasks recorded for today yet</h3>
                <p style={{ fontSize: 13, margin: '0 0 16px', color: '#64748B' }}>
                  As technicians mark orders as completed today, they will automatically appear here with full customer & worker phone numbers for review calling.
                </p>
                <button
                  onClick={() => setTab('bookings')}
                  style={{ background: '#0B3D66', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  View All Completed Tasks ({stats.completedCount}) →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {stats.todayDoneList.map(b => {
                  const jobAmount = b.final_price || b.price_estimate || 350;
                  const commission = Math.round(jobAmount * 0.08);
                  const workerPayout = jobAmount - commission;
                  const custPhone = b.customer?.phone?.replace(/\D/g, '') || '';
                  const workerPhone = b.worker?.phone?.replace(/\D/g, '') || '';
                  const timeFormatted = b.completed_at ? new Date(b.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today';

                  return (
                    <div
                      key={b.id}
                      style={{
                        background: 'white',
                        borderRadius: 18,
                        border: '1.5px solid #BBF7D0',
                        padding: '20px 24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Top Bar with Time & Category */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={13} /> Completed Today at {timeFormatted}
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                            {b.category_name}
                          </span>
                        </div>
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}>
                          Task ID: {b.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* 3 Grid Columns: Customer, Worker, Financials */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        
                        {/* Customer Column */}
                        <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 16px', border: '1px solid #DBEAFE' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 6 }}>
                            👤 Customer Details (Call For Review)
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 3 }}>
                            {b.customer?.full_name || 'Guest User'}
                          </div>
                          <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Phone size={13} color="#2563EB" />
                            {b.customer?.phone ? `+91 ${b.customer.phone}` : 'No phone saved'}
                          </div>
                          {b.customer?.email && (
                            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Mail size={12} color="#64748B" />
                              <span>{b.customer.email}</span>
                            </div>
                          )}

                          {custPhone && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                              <a
                                href={`tel:+91${custPhone}`}
                                style={{
                                  flex: 1,
                                  background: '#0B3D66',
                                  color: 'white',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                }}
                              >
                                <Phone size={13} /> Call for Review
                              </a>
                              <a
                                href={`https://wa.me/91${custPhone}?text=${encodeURIComponent(`Hello ${b.customer?.full_name || 'there'}, this is Hands of ShramiXs Management following up on your ${b.category_name} service completed today. How was your experience with the technician?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#22C55E',
                                  color: 'white',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                }}
                              >
                                <MessageSquare size={13} /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Worker Column */}
                        <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                            🛠️ Technician Who Did The Work
                          </div>
                          {b.worker ? (
                            <>
                              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 3 }}>
                                {b.worker.full_name}
                              </div>
                              <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Phone size={13} color="#0B3D66" />
                                {b.worker.phone ? `+91 ${b.worker.phone}` : 'No phone saved'}
                              </div>
                              {workerPhone && (
                                <a
                                  href={`tel:+91${workerPhone}`}
                                  style={{
                                    display: 'inline-flex',
                                    background: '#F1F5F9',
                                    color: '#0F172A',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 8,
                                    padding: '7px 12px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    alignItems: 'center',
                                    gap: 5,
                                    marginTop: 4,
                                  }}
                                >
                                  <Phone size={13} /> Call Worker
                                </a>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                              Technician details not linked
                            </div>
                          )}
                        </div>

                        {/* Financials Column */}
                        <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '14px 16px', border: '1px solid #DCFCE7' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>
                            💰 Today's Money Taken
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                            <span>Total Job Amount:</span>
                            <span>₹{jobAmount}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16A34A', fontWeight: 800, marginBottom: 2 }}>
                            <span>Worker Payout (92%):</span>
                            <span>₹{workerPayout}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0B3D66', fontWeight: 900 }}>
                            <span>Platform 8% Revenue:</span>
                            <span>₹{commission}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & FINANCES
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {/* Gross GMV */}
              <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Gross Volume</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IndianRupee size={18} color="#2563EB" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                  ₹{stats.totalGMV.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                  ₹{stats.workerNetPayout.toLocaleString('en-IN')} paid to technicians (92%)
                </div>
              </div>

              {/* 8% Platform Commission */}
              <div style={{ background: 'linear-gradient(145deg, #065F46 0%, #047857 100%)', color: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 4px 14px rgba(6,95,70,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>8% Platform Revenue</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color="#FDE047" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  ₹{stats.totalCommission.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 12, color: '#D1FAE5', fontWeight: 600 }}>
                  Hands of ShramiXs net commission
                </div>
              </div>

              {/* Completed Jobs */}
              <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Completed Jobs</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#16A34A" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                  {stats.completedCount} <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>/ {stats.totalJobs} total</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  {stats.inProgressCount} active now · {stats.cancelledCount} cancelled
                </div>
              </div>

              {/* Active Workers */}
              <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Registered Technicians</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#D97706" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                  {stats.totalWorkers}
                </div>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                  🟢 {stats.onlineWorkers} online · 🛡️ {stats.verifiedWorkers} verified pros
                </div>
              </div>
            </div>

            {/* Category Workers Breakdown Grid */}
            <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Technician Distribution by Service Category
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                    Number of active pros ready for dispatch across each home skill
                  </p>
                </div>
                <button
                  onClick={() => setTab('workers')}
                  style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#0B3D66', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View All Workers <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {Object.entries(categoryCounts).map(([catName, count]) => {
                  const slug = catName.toLowerCase().replace(/\s+/g, '');
                  const IconComp = CATEGORY_ICONS[slug] || Wrench;
                  return (
                    <div
                      key={catName}
                      onClick={() => { setWorkerCategoryFilter(catName); setTab('workers'); }}
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 12,
                        padding: '14px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={18} color="#0B3D66" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{catName}</span>
                      </div>
                      <span style={{ background: count > 0 ? '#0B3D66' : '#CBD5E1', color: 'white', fontSize: 12, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: ALL TASKS & BOOKINGS (WITH 1-TAP REVIEW CALLING)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'bookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  All Tasks & Service Bookings ({filteredBookings.length})
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                  Monitor task financial splits and call customers directly for quality reviews
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: 220 }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    placeholder="Search customer, worker, phone..."
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', padding: 3 }}>
                  {['all', 'completed', 'in_progress', 'cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => setBookingStatusFilter(st)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: bookingStatusFilter === st ? '#0B3D66' : 'transparent',
                        color: bookingStatusFilter === st ? 'white' : '#64748B',
                        textTransform: 'capitalize',
                      }}
                    >
                      {st === 'in_progress' ? 'Active' : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8' }}>
                <Briefcase size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No bookings found</h3>
                <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your search query.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredBookings.map(b => {
                  const jobAmount = b.final_price || b.price_estimate || 350;
                  const commission = Math.round(jobAmount * 0.08);
                  const workerPayout = jobAmount - commission;
                  const custPhone = b.customer?.phone?.replace(/\D/g, '') || '';
                  const workerPhone = b.worker?.phone?.replace(/\D/g, '') || '';

                  return (
                    <div
                      key={b.id}
                      style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        padding: '18px 20px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                            {b.category_name}
                          </span>
                          {getStatusBadge(b.status)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#64748B' }}>
                          <span>{new Date(b.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>ID: {b.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        {/* Customer Column */}
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                            👤 Customer (For Reviews)
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                            {b.customer?.full_name || 'Guest User'}
                          </div>
                          <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} color="#64748B" />
                            {b.customer?.phone ? `+91 ${b.customer.phone}` : 'No phone saved'}
                          </div>

                          {custPhone && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <a
                                href={`tel:+91${custPhone}`}
                                style={{
                                  flex: 1,
                                  background: '#0B3D66',
                                  color: 'white',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}
                              >
                                <Phone size={12} /> Call Customer
                              </a>
                              <a
                                href={`https://wa.me/91${custPhone}?text=${encodeURIComponent(`Hello ${b.customer?.full_name || 'there'}, this is Hands of ShramiXs Support following up on your ${b.category_name} service. How was your experience with the technician?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#22C55E',
                                  color: 'white',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}
                              >
                                <MessageSquare size={12} /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Worker Column */}
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                            🛠️ Technician
                          </div>
                          {b.worker ? (
                            <>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                                {b.worker.full_name}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} color="#64748B" />
                                {b.worker.phone ? `+91 ${b.worker.phone}` : 'No phone saved'}
                              </div>
                              {workerPhone && (
                                <a
                                  href={`tel:+91${workerPhone}`}
                                  style={{
                                    display: 'inline-flex',
                                    background: '#F1F5F9',
                                    color: '#0F172A',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 8,
                                    padding: '6px 12px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <Phone size={12} /> Call Worker
                                </a>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                              Auto-searching nearby technicians...
                            </div>
                          )}
                        </div>

                        {/* Financials Column */}
                        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', border: '1px solid #DCFCE7' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>
                            💰 Financial Breakdown
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                            <span>Total Job Amount:</span>
                            <span>₹{jobAmount}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16A34A', fontWeight: 700, marginBottom: 2 }}>
                            <span>Worker Payout (92%):</span>
                            <span>₹{workerPayout}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0B3D66', fontWeight: 800 }}>
                            <span>Platform 8% Cut:</span>
                            <span>₹{commission}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: WORKERS DIRECTORY & CATEGORY BREAKDOWN
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'workers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Technicians & Service Specialists ({workers.length})
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                  Manage technician verification, categories, jobs, and contact details
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={workerSearch}
                  onChange={e => setWorkerSearch(e.target.value)}
                  placeholder="Search worker by name, phone..."
                  style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                />
                <select
                  value={workerCategoryFilter}
                  onChange={e => setWorkerCategoryFilter(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, background: 'white', fontWeight: 600 }}
                >
                  <option value="all">All Categories</option>
                  {Object.keys(categoryCounts).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {filteredWorkers.map(w => {
                const cleanPhone = w.phone?.replace(/\D/g, '') || '';
                return (
                  <div
                    key={w.id}
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      padding: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {w.avatar_url ? (
                          <img src={w.avatar_url} alt={w.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 20 }}>🔧</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {w.full_name}
                          </span>
                          {w.is_verified && (
                            <Award size={16} color="#0B3D66" fill="#BFDBFE" />
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#D97706', fontWeight: 700 }}>
                            <Star size={12} fill="#F59E0B" color="#F59E0B" /> {w.rating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{w.total_jobs} jobs done</span>
                          <span>·</span>
                          <span style={{ color: w.is_online ? '#16A34A' : '#94A3B8', fontWeight: 700 }}>
                            {w.is_online ? '🟢 Online' : '⚪ Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {w.categories.map((c, i) => (
                        <span key={i} style={{ background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                          {c}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: 12, color: '#475569', background: '#F8FAFC', padding: '8px 10px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {w.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={12} color="#64748B" />
                          <span>+91 {w.phone}</span>
                        </div>
                      )}
                      {w.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={12} color="#64748B" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Live GPS Coordinates & Google Maps Link */}
                    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color={w.location ? '#059669' : '#94A3B8'} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: w.location ? '#0F172A' : '#94A3B8' }}>
                          {w.location ? `${w.location.lat.toFixed(4)}°, ${w.location.lng.toFixed(4)}° (${w.service_radius_km || 8} km)` : 'No GPS Locked'}
                        </span>
                      </div>
                      {w.location && (
                        <a
                          href={`https://www.google.com/maps?q=${w.location.lat},${w.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#059669',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <ExternalLink size={10} /> Live Map
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      {cleanPhone && (
                        <a
                          href={`tel:+91${cleanPhone}`}
                          style={{
                            flex: 1,
                            background: '#0B3D66',
                            color: 'white',
                            borderRadius: 8,
                            padding: '6px',
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <Phone size={12} /> Call
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleVerification(w.id, w.is_verified)}
                        style={{
                          flex: 1,
                          background: w.is_verified ? '#F1F5F9' : '#DCFCE7',
                          color: w.is_verified ? '#64748B' : '#166534',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {w.is_verified ? 'Unverify' : '✓ Verify Pro'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: CUSTOMERS DIRECTORY
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'customers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Registered Customers ({customers.length})
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                  All users who have signed up and booked through Hands of ShramiXs
                </p>
              </div>

              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search by customer name, phone, email..."
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none', minWidth: 260 }}
              />
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Customer Name</th>
                      <th style={{ padding: '12px 16px' }}>Contact Phone</th>
                      <th style={{ padding: '12px 16px' }}>Email Address</th>
                      <th style={{ padding: '12px 16px' }}>Bookings Made</th>
                      <th style={{ padding: '12px 16px' }}>Total Spent</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => {
                      const cleanPhone = c.phone?.replace(/\D/g, '') || '';
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#0369A1' }}>
                                {c.full_name.charAt(0).toUpperCase()}
                              </div>
                              {c.full_name}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                            {c.phone ? `+91 ${c.phone}` : <span style={{ color: '#94A3B8' }}>Pending</span>}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748B' }}>
                            {c.email || '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                            {c.bookings_count} tasks
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#16A34A' }}>
                            ₹{c.total_spent.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            {cleanPhone && (
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <a
                                  href={`tel:+91${cleanPhone}`}
                                  style={{ background: '#0B3D66', color: 'white', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Phone size={11} /> Call
                                </a>
                                <a
                                  href={`https://wa.me/91${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ background: '#22C55E', color: 'white', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <MessageSquare size={11} /> WhatsApp
                                </a>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: RATINGS & REVIEWS
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Customer Ratings & Feedback ({reviews.length})
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                Direct reviews submitted by customers after job completions
              </p>
            </div>

            {reviews.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8' }}>
                <Star size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No reviews recorded yet</h3>
                <p style={{ fontSize: 13, margin: 0 }}>Customer reviews will automatically populate here as jobs complete.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= r.rating ? '#F59E0B' : '#E2E8F0'}
                            color={star <= r.rating ? '#F59E0B' : '#E2E8F0'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, margin: 0, lineHeight: 1.5, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
                      "{r.comment || 'Great service and on-time technician!'}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      <span>Customer: <b>{r.customer_name || 'Verified User'}</b></span>
                      <span>Worker: <b>{r.worker_name || 'Specialist'}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 6: ADMIN ACCESS & SECURITY MANAGEMENT
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Admin Access & Security Controls
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                Manage authorized admin accounts, grant access, and update security credentials.
              </p>
            </div>

            {adminActionMsg && (
              <div style={{ background: adminActionMsg.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: adminActionMsg.startsWith('✓') ? '#166534' : '#991B1B', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                {adminActionMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              
              {/* Existing Admins List */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} color="#F59E0B" /> Authorized Admin Accounts ({adminsList.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {adminsList.map(a => {
                    const isSuper = a.phone === SUPER_ADMIN_PHONE;
                    return (
                      <div
                        key={a.id}
                        style={{
                          background: isSuper ? '#FFFBEB' : '#F8FAFC',
                          border: `1px solid ${isSuper ? '#FDE68A' : '#E2E8F0'}`,
                          borderRadius: 12,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{a.name}</span>
                            {isSuper && (
                              <span style={{ background: '#F59E0B', color: '#041B30', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            📱 +91 {a.phone}
                          </div>
                        </div>

                        {!isSuper ? (
                          <button
                            onClick={() => handleDeleteAdmin(a.phone)}
                            style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706' }}>Primary Master</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Admin Form */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} color="#0B3D66" /> Add Authorized Admin
                </h3>

                <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Admin Full Name
                    </label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={e => setNewAdminName(e.target.value)}
                      placeholder="e.g. Operations Manager"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newAdminPhone}
                      onChange={e => setNewAdminPhone(e.target.value)}
                      placeholder="10-digit mobile (e.g. 9876543210)"
                      maxLength={10}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Set Admin Password / PIN (Optional)
                    </label>
                    <input
                      type="password"
                      value={newAdminPin}
                      onChange={e => setNewAdminPin(e.target.value)}
                      placeholder="Custom PIN or leave empty to use master PIN"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <UserPlus size={15} /> Grant Admin Access
                  </button>
                </form>
              </div>

              {/* Master Super Admin Password / PIN Settings */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} color="#0B3D66" /> Change Super Admin Master PIN
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
                  Update your master security PIN anytime to keep your portal secure.
                </p>

                <form onSubmit={handleUpdateMasterPin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      New Master Security PIN
                    </label>
                    <input
                      type="password"
                      value={newMasterPin}
                      onChange={e => setNewMasterPin(e.target.value)}
                      placeholder="Enter new 4-8 digit PIN"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#F59E0B',
                      color: '#041B30',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Key size={15} /> Update Master PIN
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
