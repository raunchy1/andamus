"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  Car, 
  Calendar, 
  AlertTriangle, 
  Search, 
  Shield, 
  CheckCircle, 
  
  Ban,
  Unlock,
  Check,
  X,
  MapPin,
  Clock,
  Star,
  FileText,
  Phone,
  Mail,
  CreditCard,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { completeGamificationAction } from "@/lib/gamification";

const ADMIN_EMAILS = [
  'cristianermurache@gmail.com',
  'cristiermurache@gmail.com'
];

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  rating: number;
  created_at: string;
  is_blocked: boolean;
}

interface SafetyReport {
  id: string;
  reporter_name: string;
  reporter_avatar: string | null;
  reported_name: string;
  reported_avatar: string | null;
  type: string;
  description: string;
  created_at: string;
  status: string;
}

interface Verification {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  type: string;
  status: string;
  created_at: string;
  document_url: string | null;
}

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  status: string;
  driver_name: string;
  driver_avatar: string | null;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_rides: number;
  total_bookings: number;
  pending_reports: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_rides: 0,
    total_bookings: 0,
    pending_reports: 0
  });
  
  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  
  // Safety Reports
  const [reports, setReports] = useState<SafetyReport[]>([]);
  
  // Verifications
  const [verifications, setVerifications] = useState<Verification[]>([]);
  
  // Rides
  const [rides, setRides] = useState<Ride[]>([]);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
        router.push("/");
        return;
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [router, supabase]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Fetch stats
      const { data: statsData } = await supabase
        .rpc('get_admin_stats')
        .single();
      
      if (statsData) {
        const stats = statsData as { total_users: number; total_rides: number; total_bookings: number; pending_reports: number };
        setStats({
          total_users: Number(stats.total_users),
          total_rides: Number(stats.total_rides),
          total_bookings: Number(stats.total_bookings),
          pending_reports: Number(stats.pending_reports)
        });
      }

      // Fetch users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(profilesData?.map(u => ({
        id: u.id,
        name: u.name || 'Utente',
        email: '', // Email not directly available in profiles
        avatar_url: u.avatar_url,
        rating: u.rating || 5,
        created_at: u.created_at,
        is_blocked: u.is_blocked || false
      })) || []);

      // Fetch safety reports with reporter and reported names
      const { data: reportsData } = await supabase
        .from('safety_reports')
        .select(`
          *,
          reporter:reporter_id(name, avatar_url),
          reported:reported_id(name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      setReports(reportsData?.map(r => ({
        id: r.id,
        reporter_name: r.reporter?.name || 'Utente',
        reporter_avatar: r.reporter?.avatar_url,
        reported_name: r.reported?.name || 'Utente',
        reported_avatar: r.reported?.avatar_url,
        type: r.type,
        description: r.description,
        created_at: r.created_at,
        status: r.status
      })) || []);

      // Fetch pending verifications
      const { data: verifData } = await supabase
        .from('verifications')
        .select(`
          *,
          user:user_id(name, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setVerifications(verifData?.map(v => ({
        id: v.id,
        user_id: v.user_id,
        user_name: v.user?.name || 'Utente',
        user_avatar: v.user?.avatar_url,
        type: v.type,
        status: v.status,
        created_at: v.created_at,
        document_url: v.document_url
      })) || []);

      // Fetch recent rides
      const { data: ridesData } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id(name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setRides(ridesData?.map(r => ({
        id: r.id,
        from_city: r.from_city,
        to_city: r.to_city,
        date: r.date,
        time: r.time,
        seats: r.seats,
        price: r.price,
        status: r.status,
        driver_name: r.driver?.name || 'Utente',
        driver_avatar: r.driver?.avatar_url,
        created_at: r.created_at
      })) || []);

    } catch (_error) {
      // console.error("Error fetching admin data:", _error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Block/Unblock user
  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_blocked: !currentStatus,
          blocked_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(currentStatus ? "Utente sbloccato" : "Utente bloccato");
      fetchData();
    } catch {
      toast.error("Errore nell'aggiornamento dello stato");
    }
  };

  // Resolve report
  const resolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('safety_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);
      
      if (error) throw error;
      
      toast.success("Segnalazione risolta");
      fetchData();
    } catch {
      toast.error("Errore nella risoluzione");
    }
  };

  // Approve verification
  const approveVerification = async (verification: Verification) => {
    try {
      // Update verification status
      const { error: verifError } = await supabase
        .from('verifications')
        .update({ 
          status: 'approved',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);
      
      if (verifError) throw verifError;
      
      // Update profile verification field
      const fieldMap: Record<string, string> = {
        'phone': 'phone_verified',
        'email': 'email_verified',
        'id_document': 'id_verified',
        'driver_license': 'driver_verified'
      };
      
      const field = fieldMap[verification.type];
      if (field) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ [field]: true })
          .eq('id', verification.user_id);
        
        if (profileError) throw profileError;
      }
      
      // Add gamification points for identity verification (only for ID and driver license)
      if (verification.type === 'id_document' || verification.type === 'driver_license') {
        await completeGamificationAction(verification.user_id, 'identity_verified');
      }
      
      toast.success("Verifica approvata");
      fetchData();
    } catch {
      toast.error("Errore nell'approvazione");
    }
  };

  // Reject verification
  const rejectVerification = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from('verifications')
        .update({ status: 'rejected' })
        .eq('id', verificationId);
      
      if (error) throw error;
      
      toast.success("Verifica rifiutata");
      fetchData();
    } catch {
      toast.error("Errore nel rifiuto");
    }
  };

  // Disable ride
  const disableRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);
      
      if (error) throw error;
      
      toast.success("Corsa disattivata");
      fetchData();
    } catch {
      toast.error("Errore nella disattivazione");
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT');
  };

  // Get verification type label
  const getVerifTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'phone': 'Telefono',
      'email': 'Email',
      'id_document': 'Documento ID',
      'driver_license': 'Patente'
    };
    return labels[type] || type;
  };

  // Get verification icon
  const getVerifIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'id_document': return <CreditCard className="w-4 h-4" />;
      case 'driver_license': return <Award className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Get report type label
  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'inappropriate_behavior': 'Comportamento inappropriato',
      'no_show': 'Mancata presenza',
      'fake_profile': 'Profilo falso',
      'unsafe_driving': 'Guida pericolosa',
      'harassment': 'Molestie',
      'other': 'Altro'
    };
    return labels[type] || type;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pannello Admin</h1>
          <p className="text-white/60">Gestione piattaforma Andamus</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946]"></div>
          </div>
        ) : (
          <>
            {/* STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white/60 text-sm">Utenti</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_users}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Car className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white/60 text-sm">Corse</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_rides}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white/60 text-sm">Prenotazioni</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_bookings}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-white/60 text-sm">Segnalazioni</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.pending_reports}</p>
              </div>
            </div>

            {/* GESTIONE UTENTI */}
            <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#e63946]" />
                  Gestione Utenti
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Cerca utente..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-full md:w-64"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Utente</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Rating</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Registrato</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Stato</th>
                      <th className="text-right py-3 px-4 text-white/60 font-medium text-sm">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 10).map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-white/60" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium text-sm">{user.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white text-sm">{user.rating}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60 text-sm">{formatDate(user.created_at)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_blocked 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {user.is_blocked ? 'Bloccato' : 'Attivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserBlock(user.id, user.is_blocked)}
                            className={user.is_blocked 
                              ? "border-green-500/50 text-green-400 hover:bg-green-500/10" 
                              : "border-red-500/50 text-red-400 hover:bg-red-500/10"
                            }
                          >
                            {user.is_blocked ? (
                              <><Unlock className="w-3 h-3 mr-1" /> Sblocca</>
                            ) : (
                              <><Ban className="w-3 h-3 mr-1" /> Blocca</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-center text-white/40 py-8">Nessun utente trovato</p>
                )}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* SEGNALAZIONI SICUREZZA */}
              <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 text-[#e63946]" />
                  Segnalazioni Sicurezza
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reports.filter(r => r.status === 'pending').slice(0, 5).map((report) => (
                    <div key={report.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            {getReportTypeLabel(report.type)}
                          </span>
                          <span className="text-white/40 text-xs">{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-white/60 text-sm">Da:</span>
                        <span className="text-white text-sm font-medium">{report.reporter_name}</span>
                        <span className="text-white/40">→</span>
                        <span className="text-white text-sm font-medium">{report.reported_name}</span>
                      </div>
                      
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">{report.description}</p>
                      
                      <Button
                        size="sm"
                        onClick={() => resolveReport(report.id)}
                        className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Segna come risolto
                      </Button>
                    </div>
                  ))}
                  
                  {reports.filter(r => r.status === 'pending').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-white/60">Nessuna segnalazione pendente</p>
                    </div>
                  )}
                </div>
              </section>

              {/* VERIFICHE IN ATTESA */}
              <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-[#e63946]" />
                  Verifiche in Attesa
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {verifications.map((verif) => (
                    <div key={verif.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        {verif.user_avatar ? (
                          <Image src={verif.user_avatar} alt={verif.user_name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white/60" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{verif.user_name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e63946]">{getVerifIcon(verif.type)}</span>
                            <span className="text-white/60 text-xs">{getVerifTypeLabel(verif.type)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {verif.document_url && (
                        <a 
                          href={verif.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 text-sm mb-3 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          Visualizza documento
                        </a>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveVerification(verif)}
                          className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approva
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => rejectVerification(verif.id)}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rifiuta
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {verifications.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-white/60">Nessuna verifica in attesa</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* CORSE RECENTI */}
            <section className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <Car className="w-5 h-5 text-[#e63946]" />
                Corse Recenti
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Percorso</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Autista</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Data</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Posti</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Prezzo</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Stato</th>
                      <th className="text-right py-3 px-4 text-white/60 font-medium text-sm">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((ride) => (
                      <tr key={ride.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-white text-sm">
                            <MapPin className="w-4 h-4 text-[#e63946]" />
                            {ride.from_city}
                            <span className="text-white/40">→</span>
                            {ride.to_city}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {ride.driver_avatar ? (
                              <Image src={ride.driver_avatar} alt={ride.driver_name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <Users className="w-3 h-3 text-white/60" />
                              </div>
                            )}
                            <span className="text-white text-sm">{ride.driver_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ride.date)}
                            <Clock className="w-3 h-3 ml-1" />
                            {ride.time?.slice(0, 5)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white text-sm">{ride.seats}</td>
                        <td className="py-3 px-4 text-white text-sm">€{ride.price}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ride.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {ride.status === 'active' ? 'Attiva' : 'Disattivata'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ride.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => disableRide(ride.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Disattiva
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
