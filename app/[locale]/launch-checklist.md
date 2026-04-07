# Andamus Launch Checklist

## Pre-Launch Checklist

### Environment Variables (Vercel)
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- [x] NEXT_PUBLIC_SITE_URL
- [x] NEXT_PUBLIC_APP_URL
- [x] SUPABASE_ACCESS_TOKEN
- [x] RESEND_API_KEY
- [x] NEXT_PUBLIC_ADMIN_EMAILS
- [x] NEXT_PUBLIC_SENTRY_DSN
- [x] NEXT_PUBLIC_VAPID_PUBLIC_KEY
- [x] VAPID_PRIVATE_KEY
- [x] VAPID_SUBJECT
- [x] CRON_SECRET
- [ ] STRIPE_SECRET_KEY (for premium features - optional for launch)
- [ ] STRIPE_WEBHOOK_SECRET (for premium features - optional for launch)
- [ ] STRIPE_PREMIUM_PRICE_ID (for premium features - optional for launch)
- [ ] STRIPE_DRIVER_PRICE_ID (for premium features - optional for launch)

### Domain & SSL
- [x] Primary domain: https://andamus.vercel.app
- [ ] Custom domain: https://andamus.app (optional for launch)
- [x] SSL certificate (auto-provided by Vercel)

### Database (Supabase)
- [x] All 15 migrations applied
- [x] RLS policies enabled on all tables
- [x] Storage buckets created (avatars, verifications)
- [x] Database indexes for performance
- [x] Triggers for gamification/notifications

### PWA & Push Notifications
- [x] manifest.json configured
- [x] Service Worker with Serwist
- [x] VAPID keys generated
- [x] Icons generated (all sizes)
- [x] Push subscription API ready

### Email System
- [x] Resend API configured
- [x] Email templates ready
- [x] API routes for transactional emails
- [x] Welcome email flow
- [ ] Domain verification in Resend (for production)

### Analytics & Monitoring
- [x] Sentry DSN configured
- [x] Error boundaries in place
- [ ] Vercel Analytics enabled (optional)
- [ ] Custom events tracking (optional)

### Content & Legal
- [x] Privacy Policy page
- [x] Terms & Conditions page
- [x] FAQ/Support info
- [x] Contact email configured

---

## Post-Launch Monitoring Plan

### Week 1 (Critical Period)
**Daily checks:**
- Sentry error dashboard (zero tolerance for new errors)
- Vercel deployment logs
- Database connection health (Supabase dashboard)
- Push notification delivery rates
- Email delivery rates (Resend dashboard)

**Metrics to watch:**
- Daily active users (DAU)
- Ride creations per day
- Booking conversion rate
- Signup completion rate
- Average page load time

### Week 2-4 (Stabilization)
**Weekly checks:**
- Error trends analysis
- Performance metrics
- User feedback collection
- Feature usage analytics

### Ongoing Monitoring
**Monthly:**
- Security audit (dependencies)
- Database performance review
- Cost analysis (Vercel/Supabase/Resend)
- User satisfaction survey

---

## Marketing Ready Text

### Short Description (for Facebook posts)
```
🚗 Andamus - Il carpooling in Sardegna

Trova e offri passaggi in tutta la Sardegna. Risparmia sui costi, riduci le emissioni e conosci nuove persone.

✅ Gratuito da usare
✅ Verifica profili
✅ Chat integrata
✅ Notifiche push

Provalo ora: https://andamus.vercel.app
```

### Longer Description (for group posts)
```
🌟 Andamus è arrivato! 

La prima piattaforma di carpooling dedicata alla Sardegna.

🔸 Cerca passaggi tra tutte le città sarde
🔸 Offri il tuo posto auto e dividi le spese
🔸 Verifica i profili per sicurezza
🔸 Chat privata con passeggeri/autisti
🔸 Notifiche quando trovi un passaggio

Totalmente gratuito. Pensato per gli studenti, i lavoratori e chiunque voglia muoversi in modo sostenibile.

👉 https://andamus.vercel.app

#carpooling #sardegna #sostenibilità #passaggi #condivisione
```

### Key Selling Points (Bullet Points)
- 🆓 **100% Gratuito** - Nessuna commissione nascosta
- 🛡️ **Sicuro** - Verifica profili e sistema di recensioni
- 💬 **Chat Integrata** - Comunica direttamente nell'app
- 🔔 **Notifiche Smart** - Avvisi quando trovi un passaggio
- 📱 **App PWA** - Installa su iPhone/Android come app nativa
- 🌱 **Sostenibile** - Riduci le emissioni viaggiando insieme

### Facebook Groups to Post In
1. Cagliari - Compravendita/Discussioni
2. Sassari Olbia Tempio - Tutto Sardegna
3. Studenti Università Cagliari
4. Studenti Università Sassari
5. Carpooling Sardegna
6. Lavoro Sardegna
7. Eventi Sardegna

---

## Quick Fixes Needed (If Any)
- [ ] Stripe integration (for premium features)
- [ ] Custom domain setup
- [ ] Facebook App ID (for social login)
- [ ] Google Analytics 4 (optional)

## Support Contacts
- Technical: cristianermurache@gmail.com
- User Support: support@andamus.app

---

**Launch Date Target:** [Set your date]
**Status:** ✅ Ready for Beta Launch
