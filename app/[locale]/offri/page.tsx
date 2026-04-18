"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, ArrowLeft, User, CircleDot, MapPin, ArrowDown, X, Plus, ChevronRight, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { completeGamificationAction } from "@/lib/gamification";
import { Calculator, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useDeviceType } from "@/components/view-mode";
import Image from "next/image";
import { ShareApp } from "@/components/ShareApp";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer",
  "Bosa", "Castelsardo"
];

interface OfferViewProps {
  user: SupabaseUser;
  formData: {
    origin: string;
    destination: string;
    date: string;
    time: string;
    seats: string;
    isFree: boolean;
    price: string;
    meetingPoint: string;
    notes: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    largeLuggage: boolean;
    musicPreference: string;
    womenOnly: boolean;
    studentsOnly: boolean;
    isRecurring: boolean;
    recurrenceDays: number[];
    stops: string[];
    useSavedCar: boolean;
    carModel: string;
    carColor: string;
    carPlate: string;
    carYear: string;
  };
  errors: Record<string, string>;
  submitError: string;
  isSubmitting: boolean;
  suggestedPrice: number | null;
  distanceKm: number | null;
  calculatingPrice: boolean;
  today: string;
  handleChange: (field: string, value: string | boolean | number[] | string[]) => void;
  handleSubmit: (e: React.FormEvent) => void;
  savedCarInfo: {
    car_model?: string | null;
    car_color?: string | null;
    car_plate?: string | null;
    car_year?: number | null;
  } | null;
}

function OfferMobile({
  user,
  formData,
  errors,
  submitError,
  isSubmitting,
  suggestedPrice,
  distanceKm,
  calculatingPrice,
  today,
  handleChange,
  handleSubmit,
  savedCarInfo,
}: OfferViewProps) {
  const t = useTranslations('offer');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Top Navigation */}
      <header className="bg-[#0e0e0e] flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#e5e2e1] hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold tracking-tighter text-3xl text-[#e5e2e1]">Andamus</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
          {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
            <Image src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="Profile" width={40} height={40} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
          ) : (
            <User className="w-5 h-5 text-on-surface-variant" />
          )}
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10 max-w-2xl mx-auto overflow-x-hidden">
        {/* Hero Heading */}
        <section>
          <span className="font-semibold uppercase tracking-widest text-[11px] text-primary mb-2 block">{t('newTrip')}</span>
          <h2 className="text-4xl font-extrabold tracking-tighter leading-none text-on-surface">{t('createRide')}</h2>
        </section>

        {/* Error Message */}
        {submitError && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-error" />
              <p className="text-sm text-error">{submitError}</p>
            </div>
          </div>
        )}

        {/* Route Form Section */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-6">
            {/* Location Inputs */}
            <div className="space-y-4">
              <div className="relative">
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline mb-2 block">{t('departure')}</label>
                <div className={`flex items-center gap-4 bg-surface-container-highest p-4 rounded-xl focus-within:ring-1 transition-all ${errors.origin || errors.sameCity ? 'ring-1 ring-error' : 'ring-primary'}`}>
                  <CircleDot className="w-5 h-5 text-primary" />
                  <select
                    value={formData.origin}
                    onChange={(e) => handleChange("origin", e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-surface-container-highest">{t('departurePlaceholder')}</option>
                    {sardinianCities.map((city) => (
                      <option key={city} value={city} className="bg-surface-container-highest">{city}</option>
                    ))}
                  </select>
                </div>
                {errors.origin && <p className="mt-1 text-sm text-error">{errors.origin}</p>}
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-8 h-8 bg-background flex items-center justify-center rounded-full border border-surface-container-highest">
                  <ArrowDown className="w-4 h-4 text-outline" />
                </div>
              </div>
              <div className="relative">
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline mb-2 block">{t('arrival')}</label>
                <div className={`flex items-center gap-4 bg-surface-container-highest p-4 rounded-xl focus-within:ring-1 transition-all ${errors.destination || errors.sameCity ? 'ring-1 ring-error' : 'ring-primary'}`}>
                  <MapPin className="w-5 h-5 text-primary" />
                  <select
                    value={formData.destination}
                    onChange={(e) => handleChange("destination", e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-surface-container-highest">{t('arrivalPlaceholder')}</option>
                    {sardinianCities.map((city) => (
                      <option key={city} value={city} className="bg-surface-container-highest">{city}</option>
                    ))}
                  </select>
                </div>
                {errors.destination && <p className="mt-1 text-sm text-error">{errors.destination}</p>}
                {errors.sameCity && <p className="mt-1 text-sm text-error">{errors.sameCity}</p>}
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-surface-container-highest p-4 rounded-xl space-y-1 border-b-2 transition-all ${errors.date ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('date')}</label>
                <input
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                />
                {errors.date && <p className="text-sm text-error">{errors.date}</p>}
              </div>
              <div className={`bg-surface-container-highest p-4 rounded-xl space-y-1 border-b-2 transition-all ${errors.time ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('time')}</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                />
                {errors.time && <p className="text-sm text-error">{errors.time}</p>}
              </div>
            </div>

            {/* Seats */}
            <div className={`bg-surface-container-highest p-4 rounded-xl space-y-1 border-b-2 transition-all ${errors.seats ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('availableSeats')}</label>
              <input
                type="number"
                min="1"
                max="8"
                placeholder={t('seatsPlaceholder')}
                value={formData.seats}
                onChange={(e) => handleChange("seats", e.target.value)}
                className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
              />
              {errors.seats && <p className="text-sm text-error">{errors.seats}</p>}
            </div>

            {/* Payment Toggle Section */}
            <div className="space-y-4 pt-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('travelMode')}</label>
              <div className="flex p-1 bg-surface-container-lowest rounded-xl border border-surface-container-highest">
                <button
                  type="button"
                  onClick={() => handleChange("isFree", true)}
                  className={`flex-1 py-3 px-2 rounded-lg font-extrabold text-[12px] uppercase tracking-wider transition-all ${
                    formData.isFree ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {t('free')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("isFree", false)}
                  className={`flex-1 py-3 px-2 rounded-lg font-extrabold text-[12px] uppercase tracking-wider transition-all ${
                    !formData.isFree ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {t('paid')}
                </button>
              </div>
              <p className="text-[11px] text-outline leading-relaxed italic px-1">
                {t('freeRideBonus')}
              </p>
            </div>

            {!formData.isFree && (
              <div className={`bg-surface-container-highest p-4 rounded-xl space-y-2 border-b-2 transition-all ${errors.price ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('priceEuro')}</label>
                <input
                  type="number"
                  min="1"
                  placeholder={t('pricePlaceholder')}
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                />
                
                {/* Intelligent Price Calculator UI */}
                {calculatingPrice ? (
                  <div className="flex items-center gap-2 text-[11px] text-outline">
                    <Calculator className="w-3 h-3 animate-pulse" />
                    {t('calculatingPrice')}
                  </div>
                ) : distanceKm !== null && suggestedPrice !== null && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t('smartPrice')}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-on-surface">{t('distanceLabel')}</span>
                      <span className="text-sm font-bold text-on-surface">{distanceKm} km</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-on-surface">{t('suggestedPrice')}</span>
                      <span className="text-lg font-extrabold text-primary">{suggestedPrice}€</span>
                    </div>
                    <p className="text-[10px] text-outline mt-1">
                      {t('priceCalculationNote')}
                    </p>
                  </div>
                )}
                
                {errors.price && <p className="text-sm text-error">{errors.price}</p>}
              </div>
            )}

            {/* Meeting Point & Notes */}
            <div className="space-y-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('optionalDetails')}</label>
              <div className="bg-surface-container-highest p-4 rounded-xl focus-within:ring-1 ring-primary transition-all">
                <input
                  type="text"
                  placeholder={t('meetingPointPlaceholder')}
                  value={formData.meetingPoint}
                  onChange={(e) => handleChange("meetingPoint", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight"
                />
              </div>
              <div className="bg-surface-container-highest p-4 rounded-xl focus-within:ring-1 ring-primary transition-all">
                <textarea
                  rows={3}
                  placeholder={t('notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight resize-none"
                />
              </div>
            </div>

            {/* Car Info Section */}
            <div className="space-y-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('vehicle')}</label>
              
              {savedCarInfo?.car_model && (
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="useSavedCar"
                    checked={formData.useSavedCar}
                    onChange={(e) => handleChange("useSavedCar", e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <label htmlFor="useSavedCar" className="text-sm text-on-surface">
                    {t('useSavedCar')}: <span className="font-semibold">{savedCarInfo.car_model}</span>
                    {savedCarInfo.car_color && ` (${savedCarInfo.car_color})`}
                  </label>
                </div>
              )}
              
              {!formData.useSavedCar || !savedCarInfo?.car_model ? (
                <div className="space-y-3 bg-surface-container-highest p-4 rounded-xl">
                  <input
                    type="text"
                    placeholder={t('carModelPlaceholder')}
                    value={formData.carModel}
                    onChange={(e) => handleChange("carModel", e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={t('carColorPlaceholder')}
                      value={formData.carColor}
                      onChange={(e) => handleChange("carColor", e.target.value)}
                      className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder={t('carYearPlaceholder')}
                      value={formData.carYear}
                      onChange={(e) => handleChange("carYear", e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder={t('carPlatePlaceholder')}
                      value={formData.carPlate}
                      onChange={(e) => handleChange("carPlate", e.target.value.toUpperCase().slice(0, 7))}
                      className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Intermediate Stops */}
            <div className="space-y-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('intermediateStops')}</label>
              <div className="space-y-3">
                {formData.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={stop}
                      onChange={(e) => {
                        const next = [...formData.stops];
                        next[index] = e.target.value;
                        handleChange("stops", next);
                      }}
                      className="h-12 flex-1 rounded-xl border-none bg-surface-container-highest pl-4 pr-10 text-on-surface font-semibold outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">{t('cityPlaceholder')}</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const next = formData.stops.filter((_, i) => i !== index);
                        handleChange("stops", next);
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {formData.stops.length < 3 && (
                  <button
                    type="button"
                    onClick={() => handleChange("stops", [...formData.stops, ""])}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-2 text-sm font-medium text-outline hover:bg-surface-container-low transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t('addStop')}
                  </button>
                )}
                {errors.stops && <p className="text-sm text-error">{errors.stops}</p>}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('travelPreferences')}</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${formData.smokingAllowed ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                  <input type="checkbox" checked={formData.smokingAllowed} onChange={(e) => handleChange("smokingAllowed", e.target.checked)} className="hidden" />
                  <span className="text-sm font-semibold">{t('smokersAllowed')}</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${formData.petsAllowed ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                  <input type="checkbox" checked={formData.petsAllowed} onChange={(e) => handleChange("petsAllowed", e.target.checked)} className="hidden" />
                  <span className="text-sm font-semibold">{t('petsAllowed')}</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${formData.largeLuggage ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                  <input type="checkbox" checked={formData.largeLuggage} onChange={(e) => handleChange("largeLuggage", e.target.checked)} className="hidden" />
                  <span className="text-sm font-semibold">{t('largeLuggage')}</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${formData.womenOnly ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                  <input type="checkbox" checked={formData.womenOnly} onChange={(e) => handleChange("womenOnly", e.target.checked)} className="hidden" />
                  <span className="text-sm font-semibold">{t('womenOnly')}</span>
                </label>
              </div>

              <div className="bg-surface-container-highest p-4 rounded-xl focus-within:ring-1 ring-primary transition-all">
                <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block mb-2">{t('music')}</label>
                <select
                  value={formData.musicPreference}
                  onChange={(e) => handleChange("musicPreference", e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold appearance-none cursor-pointer"
                >
                  <option value="" className="bg-surface-container-highest">{t('musicAny')}</option>
                  <option value="quiet" className="bg-surface-container-highest">{t('musicQuiet')}</option>
                  <option value="music" className="bg-surface-container-highest">{t('musicMusic')}</option>
                  <option value="talk" className="bg-surface-container-highest">{t('musicTalk')}</option>
                </select>
              </div>
              {errors.musicPreference && <p className="text-sm text-error">{errors.musicPreference}</p>}
            </div>

            {/* Recurring Option */}
            <div className="space-y-4">
              <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">{t('repeat')}</label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${formData.isRecurring ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                <input type="checkbox" checked={formData.isRecurring} onChange={(e) => handleChange("isRecurring", e.target.checked)} className="hidden" />
                <span className="text-sm font-semibold">{t('repeatWeekly')}</span>
              </label>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { day: 1, label: "Lun" },
                      { day: 2, label: "Mar" },
                      { day: 3, label: "Mer" },
                      { day: 4, label: "Gio" },
                      { day: 5, label: "Ven" },
                      { day: 6, label: "Sab" },
                      { day: 0, label: "Dom" },
                    ].map(({ day, label }) => {
                      const selected = formData.recurrenceDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? formData.recurrenceDays.filter((d) => d !== day)
                              : [...formData.recurrenceDays, day];
                            handleChange("recurrenceDays", next);
                          }}
                          className={`h-10 w-12 rounded-xl text-sm font-semibold transition-colors ${
                            selected
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.recurrenceDays && <p className="text-sm text-error">{errors.recurrenceDays}</p>}
                  <p className="text-xs text-outline">
                    {t('recurringNote')}
                  </p>
                </div>
              )}
            </div>

            {/* Map Preview */}
            <div className="pt-6">
              <div className="w-full h-32 rounded-2xl overflow-hidden grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 relative bg-surface-container-high">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface">{t('liveTracking')}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:opacity-90 text-on-primary font-extrabold text-lg py-5 rounded-xl shadow-lg transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting
                ? formData.isRecurring ? t('creating') : t('publishing')
                : formData.isRecurring ? t('createRecurringRide') : t('publishRide')
              }
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function OfferDesktop({
  user,
  formData,
  errors,
  submitError,
  isSubmitting,
  suggestedPrice,
  distanceKm,
  calculatingPrice,
  today,
  handleChange,
  handleSubmit,
  savedCarInfo,
}: OfferViewProps) {
  const t = useTranslations('offer');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation */}
      <header className="bg-[#0e0e0e] border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#e5e2e1] hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-extrabold tracking-tighter text-2xl text-[#e5e2e1]">Andamus</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
            {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
              <Image src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="Profile" width={40} height={40} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
            ) : (
              <User className="w-5 h-5 text-on-surface-variant" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8 lg:py-10 overflow-x-hidden">
        {/* Hero Heading */}
        <section className="mb-10">
          <span className="font-semibold uppercase tracking-widest text-xs text-primary mb-2 block">{t('newTrip')}</span>
          <h2 className="text-5xl font-extrabold tracking-tighter leading-tight text-on-surface">{t('createRide')}</h2>
        </section>

        {/* Error Message */}
        {submitError && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-error" />
              <p className="text-sm text-error">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column — Route & Details */}
            <div className="space-y-8">
              <div className="space-y-6">
                {/* Location Inputs */}
                <div className="space-y-4">
                  <div className="relative">
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline mb-2 block">{t('departure')}</label>
                    <div className={`flex items-center gap-4 bg-surface-container-highest p-5 rounded-2xl focus-within:ring-1 transition-all ${errors.origin || errors.sameCity ? 'ring-1 ring-error' : 'ring-primary'}`}>
                      <CircleDot className="w-6 h-6 text-primary" />
                      <select
                        value={formData.origin}
                        onChange={(e) => handleChange("origin", e.target.value)}
                        className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight appearance-none cursor-pointer text-lg"
                      >
                        <option value="" className="bg-surface-container-highest">{t('departurePlaceholder')}</option>
                        {sardinianCities.map((city) => (
                          <option key={city} value={city} className="bg-surface-container-highest">{city}</option>
                        ))}
                      </select>
                    </div>
                    {errors.origin && <p className="mt-1 text-sm text-error">{errors.origin}</p>}
                  </div>
                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="w-10 h-10 bg-background flex items-center justify-center rounded-full border border-surface-container-highest">
                      <ArrowDown className="w-5 h-5 text-outline" />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline mb-2 block">{t('arrival')}</label>
                    <div className={`flex items-center gap-4 bg-surface-container-highest p-5 rounded-2xl focus-within:ring-1 transition-all ${errors.destination || errors.sameCity ? 'ring-1 ring-error' : 'ring-primary'}`}>
                      <MapPin className="w-6 h-6 text-primary" />
                      <select
                        value={formData.destination}
                        onChange={(e) => handleChange("destination", e.target.value)}
                        className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight appearance-none cursor-pointer text-lg"
                      >
                        <option value="" className="bg-surface-container-highest">{t('arrivalPlaceholder')}</option>
                        {sardinianCities.map((city) => (
                          <option key={city} value={city} className="bg-surface-container-highest">{city}</option>
                        ))}
                      </select>
                    </div>
                    {errors.destination && <p className="mt-1 text-sm text-error">{errors.destination}</p>}
                    {errors.sameCity && <p className="mt-1 text-sm text-error">{errors.sameCity}</p>}
                  </div>
                </div>

                {/* Date, Time, Seats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`bg-surface-container-highest p-5 rounded-2xl space-y-1 border-b-2 transition-all ${errors.date ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('date')}</label>
                    <input
                      type="date"
                      min={today}
                      value={formData.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                    />
                    {errors.date && <p className="text-sm text-error">{errors.date}</p>}
                  </div>
                  <div className={`bg-surface-container-highest p-5 rounded-2xl space-y-1 border-b-2 transition-all ${errors.time ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('time')}</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                    />
                    {errors.time && <p className="text-sm text-error">{errors.time}</p>}
                  </div>
                  <div className={`bg-surface-container-highest p-5 rounded-2xl space-y-1 border-b-2 transition-all ${errors.seats ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('availableSeats')}</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      placeholder="1-8"
                      value={formData.seats}
                      onChange={(e) => handleChange("seats", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold"
                    />
                    {errors.seats && <p className="text-sm text-error">{errors.seats}</p>}
                  </div>
                </div>

                {/* Payment Toggle — Prominent */}
                <div className="space-y-4 pt-2">
                  <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('travelMode')}</label>
                  <div className="flex p-1.5 bg-surface-container-lowest rounded-2xl border border-surface-container-highest">
                    <button
                      type="button"
                      onClick={() => handleChange("isFree", true)}
                      className={`flex-1 py-4 px-4 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all ${
                        formData.isFree ? 'bg-primary text-on-primary shadow-lg' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      {t('free')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("isFree", false)}
                      className={`flex-1 py-4 px-4 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all ${
                        !formData.isFree ? 'bg-primary text-on-primary shadow-lg' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      {t('paid')}
                    </button>
                  </div>
                  <p className="text-xs text-outline leading-relaxed italic">
                    I viaggi gratuiti favoriscono la community e aumentano il tuo punteggio &quot;Nomad&quot; del 20%.
                  </p>
                </div>

                {!formData.isFree && (
                  <div className={`bg-surface-container-highest p-5 rounded-2xl space-y-2 border-b-2 transition-all ${errors.price ? 'border-error' : 'border-transparent focus-within:border-primary'}`}>
                    <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('priceEuro')}</label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t('pricePlaceholder')}
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full p-0 text-on-surface font-bold text-lg"
                    />
                    
                    {/* Intelligent Price Calculator UI */}
                    {calculatingPrice ? (
                      <div className="flex items-center gap-2 text-xs text-outline">
                        <Calculator className="w-4 h-4 animate-pulse" />
                        {t('calculatingPrice')}
                      </div>
                    ) : distanceKm !== null && suggestedPrice !== null && (
                      <div className="mt-3 p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{t('smartPrice')}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm text-on-surface">{t('distanceLabel')}</span>
                            <span className="text-lg font-bold text-on-surface">{distanceKm} km</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm text-on-surface">{t('priceLabel')}</span>
                            <span className="text-2xl font-extrabold text-primary">{suggestedPrice}€</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-outline mt-2">
                          {t('priceCalculationNote')}
                        </p>
                      </div>
                    )}
                    
                    {errors.price && <p className="text-sm text-error">{errors.price}</p>}
                  </div>
                )}

                {/* Meeting Point & Notes */}
                <div className="space-y-4">
                  <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('optionalDetails')}</label>
                  <div className="bg-surface-container-highest p-5 rounded-2xl focus-within:ring-1 ring-primary transition-all">
                    <input
                      type="text"
                      placeholder={t('meetingPointPlaceholder')}
                      value={formData.meetingPoint}
                      onChange={(e) => handleChange("meetingPoint", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight"
                    />
                  </div>
                  <div className="bg-surface-container-highest p-5 rounded-2xl focus-within:ring-1 ring-primary transition-all">
                    <textarea
                      rows={4}
                      placeholder={t('notesPlaceholder')}
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold tracking-tight resize-none"
                    />
                  </div>
                </div>

                {/* Intermediate Stops */}
                <div className="space-y-4">
                  <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('intermediateStops')}</label>
                  <div className="space-y-3">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={stop}
                          onChange={(e) => {
                            const next = [...formData.stops];
                            next[index] = e.target.value;
                            handleChange("stops", next);
                          }}
                          className="h-12 flex-1 rounded-xl border-none bg-surface-container-highest pl-4 pr-10 text-on-surface font-semibold outline-none focus:ring-1 focus:ring-primary appearance-none"
                        >
                          <option value="">{t('cityPlaceholder')}</option>
                          {sardinianCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.stops.filter((_, i) => i !== index);
                            handleChange("stops", next);
                          }}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {formData.stops.length < 3 && (
                      <button
                        type="button"
                        onClick={() => handleChange("stops", [...formData.stops, ""])}
                        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-2 text-sm font-medium text-outline hover:bg-surface-container-low transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('addStop')}
                      </button>
                    )}
                    {errors.stops && <p className="text-sm text-error">{errors.stops}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column — Preferences, Recurrence, Map Preview, Action */}
            <div className="space-y-8">
              {/* Preferences */}
              <div className="space-y-4">
                <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('travelPreferences')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-5 transition-colors ${formData.smokingAllowed ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                    <input type="checkbox" checked={formData.smokingAllowed} onChange={(e) => handleChange("smokingAllowed", e.target.checked)} className="hidden" />
                    <span className="text-sm font-semibold">{t('smokersAllowed')}</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-5 transition-colors ${formData.petsAllowed ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                    <input type="checkbox" checked={formData.petsAllowed} onChange={(e) => handleChange("petsAllowed", e.target.checked)} className="hidden" />
                    <span className="text-sm font-semibold">{t('petsAllowed')}</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-5 transition-colors ${formData.largeLuggage ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                    <input type="checkbox" checked={formData.largeLuggage} onChange={(e) => handleChange("largeLuggage", e.target.checked)} className="hidden" />
                    <span className="text-sm font-semibold">{t('largeLuggage')}</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-5 transition-colors ${formData.womenOnly ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                    <input type="checkbox" checked={formData.womenOnly} onChange={(e) => handleChange("womenOnly", e.target.checked)} className="hidden" />
                    <span className="text-sm font-semibold">{t('womenOnly')}</span>
                  </label>
                </div>

                <div className="bg-surface-container-highest p-5 rounded-2xl focus-within:ring-1 ring-primary transition-all">
                  <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block mb-2">{t('music')}</label>
                  <select
                    value={formData.musicPreference}
                    onChange={(e) => handleChange("musicPreference", e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-surface-container-highest">{t('musicAny')}</option>
                    <option value="quiet" className="bg-surface-container-highest">{t('musicQuiet')}</option>
                    <option value="music" className="bg-surface-container-highest">{t('musicMusic')}</option>
                    <option value="talk" className="bg-surface-container-highest">{t('musicTalk')}</option>
                  </select>
                </div>
                {errors.musicPreference && <p className="text-sm text-error">{errors.musicPreference}</p>}
              </div>

              {/* Recurring Option */}
              <div className="space-y-4">
                <label className="font-semibold uppercase tracking-widest text-[11px] text-outline block">{t('repeat')}</label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-5 transition-colors ${formData.isRecurring ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                  <input type="checkbox" checked={formData.isRecurring} onChange={(e) => handleChange("isRecurring", e.target.checked)} className="hidden" />
                  <span className="text-sm font-semibold">{t('repeatWeekly')}</span>
                </label>

                {formData.isRecurring && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { day: 1, label: "Lun" },
                        { day: 2, label: "Mar" },
                        { day: 3, label: "Mer" },
                        { day: 4, label: "Gio" },
                        { day: 5, label: "Ven" },
                        { day: 6, label: "Sab" },
                        { day: 0, label: "Dom" },
                      ].map(({ day, label }) => {
                        const selected = formData.recurrenceDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? formData.recurrenceDays.filter((d) => d !== day)
                                : [...formData.recurrenceDays, day];
                              handleChange("recurrenceDays", next);
                            }}
                            className={`h-11 w-14 rounded-xl text-sm font-semibold transition-colors ${
                              selected
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.recurrenceDays && <p className="text-sm text-error">{errors.recurrenceDays}</p>}
                    <p className="text-xs text-outline">
                      {t('recurringNote')}
                    </p>
                  </div>
                )}
              </div>

              {/* Map Preview */}
              <div className="pt-2">
                <div className="w-full h-56 rounded-3xl overflow-hidden grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 relative bg-surface-container-high">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-5 left-5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface">{t('liveTracking')}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:opacity-90 text-on-primary font-extrabold text-lg py-5 rounded-2xl shadow-lg transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 min-h-[56px]"
                >
                  {isSubmitting
                    ? formData.isRecurring ? t('creating') : t('publishing')
                    : formData.isRecurring ? t('createRecurringRide') : t('publishRide')
                  }
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function OfferPage() {
  const t = useTranslations('offer');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const deviceType = useDeviceType();
  
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: "",
    isFree: true,
    price: "",
    meetingPoint: "",
    notes: "",
    smokingAllowed: false,
    petsAllowed: false,
    largeLuggage: false,
    musicPreference: "",
    womenOnly: false,
    studentsOnly: false,
    isRecurring: false,
    recurrenceDays: [] as number[],
    stops: [] as string[],
    // Car info
    useSavedCar: true,
    carModel: "",
    carColor: "",
    carPlate: "",
    carYear: "",
  });
  
  // User's saved car info
  const [savedCarInfo, setSavedCarInfo] = useState<{
    car_model?: string | null;
    car_color?: string | null;
    car_plate?: string | null;
    car_year?: number | null;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFirstRide, setIsFirstRide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  
  // Refs to track form values without triggering effect re-runs
  const priceRef = useRef(formData.price);
  const isFreeRef = useRef(formData.isFree);
  
  // Update refs when values change
  useEffect(() => {
    priceRef.current = formData.price;
    isFreeRef.current = formData.isFree;
  }, [formData.price, formData.isFree]);

  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();

  // Intelligent Price Calculator using Google Maps Distance Matrix API
  useEffect(() => {
    const calculateDistanceAndPrice = async () => {
      if (!formData.origin || !formData.destination || formData.origin === formData.destination) {
        setSuggestedPrice(null);
        setDistanceKm(null);
        return;
      }

      setCalculatingPrice(true);
      
      // Skip API call if no Google Maps API key is configured
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setCalculatingPrice(false);
        setDistanceKm(null);
        setSuggestedPrice(null);
        return;
      }
      
      try {
        // Use Google Maps Distance Matrix API
        const originEncoded = encodeURIComponent(`${formData.origin}, Sardegna, Italia`);
        const destinationEncoded = encodeURIComponent(`${formData.destination}, Sardegna, Italia`);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originEncoded}&destinations=${destinationEncoded}&mode=driving&units=metric&key=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error('Distance calculation failed');
        }
        
        const data = await response.json();
        
        if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0].distance) {
          const distanceInMeters = data.rows[0].elements[0].distance.value;
          const distanceInKm = Math.round(distanceInMeters / 1000);
          setDistanceKm(distanceInKm);
          
          // Pricing algorithm: €0.09 per km, minimum €2
          const calculatedPrice = Math.round(distanceInKm * 0.09);
          const finalPrice = Math.max(2, calculatedPrice);
          
          setSuggestedPrice(finalPrice);
          
          // Auto-fill price if not already set (use refs to avoid dependency issues)
          if (!priceRef.current && !isFreeRef.current) {
            setFormData(prev => ({ ...prev, price: finalPrice.toString() }));
          }
        } else {
          // Fallback to local estimation if API fails
          setDistanceKm(null);
          setSuggestedPrice(null);
        }
      } catch {
        // Price calculation error
        setDistanceKm(null);
        setSuggestedPrice(null);
      } finally {
        setCalculatingPrice(false);
      }
    };

    calculateDistanceAndPrice();
  }, [formData.origin, formData.destination]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Load saved car info if user is logged in
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("car_model, car_color, car_plate, car_year")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setSavedCarInfo(profile);
          // Pre-fill form with saved car
          setFormData(prev => ({
            ...prev,
            carModel: profile.car_model || "",
            carColor: profile.car_color || "",
            carPlate: profile.car_plate || "",
            carYear: profile.car_year?.toString() || "",
          }));
        }
      }
      
      setAuthLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (field: string, value: string | boolean | number[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
    if (field === "origin" || field === "destination") {
      if (errors.sameCity) {
        setErrors(prev => { const newErrors = { ...prev }; delete newErrors.sameCity; return newErrors; });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin) newErrors.origin = t('errorOriginRequired');
    if (!formData.destination) newErrors.destination = t('errorDestinationRequired');
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      newErrors.sameCity = t('errors.sameCity');
    }
    if (!formData.date) newErrors.date = t('errorDateRequired');
    if (!formData.time) newErrors.time = t('errorTimeRequired');
    if (!formData.seats) newErrors.seats = t('errorSeatsRequired');
    if (!formData.isFree && !formData.price) newErrors.price = t('errorPriceRequired');
    if (formData.musicPreference && !['quiet','music','talk'].includes(formData.musicPreference)) {
      newErrors.musicPreference = t('errorMusicPreference');
    }
    if (formData.isRecurring && formData.recurrenceDays.length === 0) {
      newErrors.recurrenceDays = t('errorRecurrenceDays');
    }
    if (formData.stops.some((s) => s === formData.origin || s === formData.destination)) {
      newErrors.stops = t('errorStops');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    // Validate form with toast feedback
    if (!validateForm()) {
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      } else {
        toast.error(t('fillRequiredFields'));
      }
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error(t('authRequired'));
      setSubmitError(t('authRequired'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(formData.isRecurring ? t('creating') : t('publishing'));

    try {
      let rideId: string | null = null;

      if (formData.isRecurring) {
        const { error: templateError } = await supabase
          .from("ride_templates")
          .insert({
            user_id: currentUser.id,
            from_city: formData.origin,
            to_city: formData.destination,
            time: formData.time,
            seats: parseInt(formData.seats),
            price: formData.isFree ? 0 : parseFloat(formData.price),
            meeting_point: formData.meetingPoint || null,
            notes: formData.notes || null,
            preferences: {
              smoking_allowed: formData.smokingAllowed || null,
              pets_allowed: formData.petsAllowed || null,
              large_luggage: formData.largeLuggage || null,
              music_preference: formData.musicPreference || null,
              women_only: formData.womenOnly || null,
              students_only: formData.studentsOnly || null,
            },
            recurrence_days: formData.recurrenceDays,
          });

        if (templateError) {
          // Template error logged silently
          toast.dismiss(toastId);
          toast.error(t('errorTemplate', { message: templateError.message }));
          setSubmitError(t('errorPublishing', { message: templateError.message }));
          setIsSubmitting(false);
          return;
        }

        const { error: rpcError } = await supabase.rpc("generate_rides_from_templates", { p_days_ahead: 30 });
        
        if (rpcError) {
          // RPC error logged silently
          toast.dismiss(toastId);
          toast.error(t('errorGeneratingRides', { message: rpcError.message }));
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("rides")
          .insert({
            driver_id: currentUser.id,
            from_city: formData.origin,
            to_city: formData.destination,
            date: formData.date,
            time: formData.time,
            seats: parseInt(formData.seats),
            price: formData.isFree ? 0 : parseFloat(formData.price),
            meeting_point: formData.meetingPoint || null,
            notes: formData.notes || null,
            status: "active",
            smoking_allowed: formData.smokingAllowed || null,
            pets_allowed: formData.petsAllowed || null,
            large_luggage: formData.largeLuggage || null,
            music_preference: formData.musicPreference || null,
            women_only: formData.womenOnly || null,
            students_only: formData.studentsOnly || null,
            // Car info
            car_model: formData.carModel || savedCarInfo?.car_model || null,
            car_color: formData.carColor || savedCarInfo?.car_color || null,
            car_plate: formData.carPlate || savedCarInfo?.car_plate || null,
            car_year: formData.carYear ? parseInt(formData.carYear) : savedCarInfo?.car_year || null,
          })
          .select();

        if (error) {
          // Insert error logged silently
          toast.dismiss(toastId);
          toast.error(t('errorTemplate', { message: error.message }));
          setSubmitError(t('errorPublishing', { message: error.message }));
          setIsSubmitting(false);
          return;
        }

        rideId = inserted?.[0]?.id || null;
        if (rideId) {
          if (formData.stops.length > 0) {
            const { error: stopsError } = await supabase.from("ride_stops").insert(
              formData.stops.map((city, index) => ({
                ride_id: rideId,
                city,
                order_index: index,
              }))
            );
            
            if (stopsError) {
              // Stops error logged silently
              toast.error(t('errorStopsMsg', { message: stopsError.message }));
            }
          }

          fetch("/api/alerts/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rideId }),
          }).catch(() => {});
        }
      }
      
      if (currentUser) {
        const { count } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', currentUser.id);
        
        const firstRide = (count || 0) === 0;
        setIsFirstRide(firstRide);
        
        const result = await completeGamificationAction(
          currentUser.id,
          'ride_published',
          firstRide
        );
        
        if (result.pointsAdded > 0) {
          toast.dismiss(toastId);
          toast.success(t('pointsEarned', { points: result.pointsAdded }));
          if (result.leveledUp) {
            toast.success(t('levelUp', { level: result.newLevel ?? '' }));
          }
        } else {
          toast.dismiss(toastId);
          toast.success(formData.isRecurring ? t('recurringSuccess') : t('rideSuccess'));
        }
      } else {
        toast.dismiss(toastId);
        toast.success(formData.isRecurring ? t('recurringSuccess') : t('rideSuccess'));
      }
      
      setIsSubmitted(true);
    } catch (err) {
      // Submit error logged silently
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : t('unexpectedError');
      toast.error(t('errorTemplate', { message: errorMessage }));
      setSubmitError(t('errorUnexpected', { message: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // ignore
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-on-surface">
            {t('offerRide')}
          </h1>
          <p className="mb-8 text-on-surface-variant">
            {t('loginRequired')}
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-extrabold text-on-primary transition-colors hover:opacity-90 active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t('loginWithGoogle')}
          </button>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('success.backHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/20">
            <Check className="h-8 w-8 text-tertiary" />
          </div>
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-on-surface">
            {t('ridePublished')}
          </h1>
          {isFirstRide && (
            <p className="mb-4 text-sm text-primary font-medium">
              {t('firstRideMessage')}
            </p>
          )}
          <p className="mb-6 text-on-surface-variant">
            {t('manageSoon')}
          </p>
          
          {/* Share Section */}
          <div className="mb-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
            <p className="text-sm font-medium text-on-surface mb-3">
              {t('shareRidePrompt')}
            </p>
            <ShareApp variant="button" className="w-full justify-center" />
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/profilo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-on-primary transition-colors hover:opacity-90"
            >
              {t('goToProfile')}
            </Link>
            <Link
              href="/cerca"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-6 py-3 text-sm font-extrabold text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('searchOtherRides')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const commonProps = {
    user,
    formData,
    errors,
    submitError,
    isSubmitting,
    suggestedPrice,
    distanceKm,
    calculatingPrice,
    today,
    handleChange,
    handleSubmit,
    savedCarInfo,
  };

  return deviceType === "desktop" ? <OfferDesktop {...commonProps} /> : <OfferMobile {...commonProps} />;
}
