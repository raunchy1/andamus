"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Car, 
  Star, 
  Calendar, 
  LogOut, 
  MapPin,
  Loader2,
  Armchair,
  Banknote,
  Clock,
  MessageCircle,
  Settings,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  status: string;
}

interface Booking {
  id: string;
  ride_id: string;
  status: string;
  rides: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    profiles: {
      name: string;
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rides");

  const supabase = createClient();

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      // Check auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        // Redirect to home if not logged in
        router.push("/");
        return;
      }
      
      setUser(currentUser);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      setProfile(profileData);

      // Load my rides
      const { data: ridesData } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", currentUser.id)
        .order("date", { ascending: false });
      
      setMyRides(ridesData || []);

      // Load my bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          rides(
            from_city,
            to_city,
            date,
            time,
            price,
            profiles(name)
          )
        `)
        .eq("passenger_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      setMyBookings(bookingsData || []);
      setLoading(false);
    };

    loadUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserName = () => {
    if (!user) return "";
    return profile?.name || 
           user.user_metadata?.name || 
           user.user_metadata?.full_name || 
           user.email?.split("@")[0] || 
           "Utente";
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return profile?.avatar_url || 
           user.user_metadata?.avatar_url || 
           user.user_metadata?.picture || 
           null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", { 
      weekday: "short", 
      day: "numeric", 
      month: "short" 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#e63946]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Profile Header */}
      <div className="border-b border-white/10 bg-[#12121e] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e63946]/10">
              {getUserAvatar() ? (
                <img 
                  src={getUserAvatar()} 
                  alt={getUserName()}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-[#e63946]" />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {getUserName()}
              </h1>
              <p className="mt-1 text-white/60">{user?.email}</p>
              
              {/* Stats */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  <span className="font-semibold">{profile?.rating || 5.0}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[#e63946]/10 px-3 py-1 text-sm text-white">
                  <Car className="h-4 w-4 text-[#e63946]" />
                  <span>{myRides.length} corse offerte</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  <span>Membro dal {new Date(user?.created_at).getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-white/10 bg-[#0f0f1a] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl gap-4">
          <Link
            href="/offri"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
          >
            <Car className="h-4 w-4" />
            Offri passaggio
          </Link>
          <Link
            href="/cerca"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" />
            Cerca passaggio
          </Link>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("rides")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "rides"
                  ? "border-[#e63946] text-white"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              Le mie corse ({myRides.length})
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "bookings"
                  ? "border-[#e63946] text-white"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              I miei passaggi ({myBookings.length})
            </button>
          </div>

          {/* My Rides */}
          {activeTab === "rides" && (
            <div>
              {myRides.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
                  <Car className="mx-auto h-12 w-12 text-white/30" />
                  <p className="mt-4 text-white/60">Non hai ancora offerto nessun passaggio.</p>
                  <Link
                    href="/offri"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
                  >
                    Offri un passaggio
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">
                            {ride.from_city} → {ride.to_city}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-[#e63946]" />
                              {formatDate(ride.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-[#e63946]" />
                              {ride.time.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Armchair className="h-4 w-4 text-[#e63946]" />
                              {ride.seats} posti
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold">
                            {ride.price === 0 ? (
                              <span className="text-green-400">Gratuito</span>
                            ) : (
                              <span className="text-white">{ride.price}€</span>
                            )}
                          </span>
                          <Link
                            href={`/corsa/${ride.id}`}
                            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#e63946]"
                          >
                            Gestisci
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Bookings */}
          {activeTab === "bookings" && (
            <div>
              {myBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-white/30" />
                  <p className="mt-4 text-white/60">Non hai ancora prenotato nessun passaggio.</p>
                  <Link
                    href="/cerca"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
                  >
                    Cerca un passaggio
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">
                            {booking.rides.from_city} → {booking.rides.to_city}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-[#e63946]" />
                              {formatDate(booking.rides.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-[#e63946]" />
                              {booking.rides.time.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4 text-[#e63946]" />
                              {booking.rides.profiles.name}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-500/20 text-green-400"
                                : booking.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {booking.status === "confirmed" ? "Confermato" : 
                               booking.status === "pending" ? "In attesa" : "Rifiutato"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold">
                            {booking.rides.price === 0 ? (
                              <span className="text-green-400">Gratuito</span>
                            ) : (
                              <span className="text-white">{booking.rides.price}€</span>
                            )}
                          </span>
                          <Link
                            href={`/chat/${booking.id}`}
                            className="flex items-center gap-2 rounded-xl bg-[#e63946] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chat
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a12] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-white/40">
            Fatto con <span className="text-[#e63946]">♥</span> in Sardegna
          </p>
        </div>
      </footer>
    </div>
  );
}
