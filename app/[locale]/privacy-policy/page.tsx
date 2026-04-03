"use client";

import Link from "next/link";
import { ChevronLeft, Shield, Lock, Eye, Trash2, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Indietro</span>
          </Link>
          <h1 className="ml-4 text-lg font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e63946]/10 mb-6">
            <Shield className="w-8 h-8 text-[#e63946]" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Informativa sulla Privacy</h2>
          <p className="text-white/60">
            La tua privacy è importante per noi. Scopri come proteggiamo i tuoi dati.
          </p>
        </div>

        {/* GDPR Notice */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <UserCheck className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-400 mb-2">Conformità GDPR</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Andamus tratta i tuoi dati personali nel rispetto del Regolamento (UE) 2016/679 
                (GDPR). Questa informativa ti spiega quali dati raccogliamo, perché li usiamo 
                e quali sono i tuoi diritti.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#e63946]" />
              Titolare del trattamento
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Il Titolare del trattamento dei dati personali è Andamus, con sede in Sardegna, Italia.
              </p>
              <p>
                <strong>Contatti:</strong><br />
                Email: privacy@andamus.it<br />
                PEC: andamus@pec.it
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">1</span>
              Dati che raccogliamo
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>Raccogliamo i seguenti tipi di dati:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Dati di registrazione:</strong> nome, email, foto profilo (forniti tramite 
                  Google OAuth)
                </li>
                <li>
                  <strong>Dati di profilo:</strong> numero di telefono (opzionale), foto documento 
                  d&apos;identità (opzionale, per verifica)
                </li>
                <li>
                  <strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, dispositivo 
                  utilizzato, cookie tecnici
                </li>
                <li>
                  <strong>Dati delle corse:</strong> città di partenza e arrivo, data e orario delle 
                  corse pubblicate o prenotate
                </li>
                <li>
                  <strong>Dati di comunicazione:</strong> messaggi scambiati tramite la chat della 
                  piattaforma
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">2</span>
              Finalità del trattamento
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>Utilizziamo i tuoi dati per:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Permetterti di registrarti e utilizzare la piattaforma</li>
                <li>Metterti in contatto con autisti o passeggeri</li>
                <li>Gestire le prenotazioni e le comunicazioni</li>
                <li>Verificare l&apos;identità degli utenti (opzionale)</li>
                <li>Migliorare i nostri servizi e prevenire frodi</li>
                <li>Inviarti notifiche push su prenotazioni e messaggi</li>
                <li>Adempiere agli obblighi di legge</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">3</span>
              Base giuridica
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>Il trattamento dei tuoi dati si basa su:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Esecuzione del contratto:</strong> i dati necessari per fornirti il servizio 
                  di carpooling
                </li>
                <li>
                  <strong>Consenso:</strong> per l&apos;invio di notifiche push e la verifica opzionale 
                  dell&apos;identità
                </li>
                <li>
                  <strong>Obblighi legali:</strong> adempimento a normative vigenti
                </li>
                <li>
                  <strong>Legittimo interesse:</strong> prevenzione frodi e sicurezza della piattaforma
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">4</span>
              Conservazione dei dati
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>I tuoi dati sono conservati per:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Dati account:</strong> fino alla cancellazione dell&apos;account o 2 anni 
                  dall&apos;ultimo accesso
                </li>
                <li>
                  <strong>Dati delle corse:</strong> 1 anno dalla data della corsa
                </li>
                <li>
                  <strong>Messaggi chat:</strong> 6 mesi dall&apos;invio
                </li>
                <li>
                  <strong>Log di sistema:</strong> 12 mesi per sicurezza
                </li>
              </ul>
              <p className="mt-4">
                I dati possono essere conservati oltre questi termini solo se necessario per obblighi 
                legali o per la tutela di diritti in sede giudiziaria.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">5</span>
              Condivisione dei dati
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>I tuoi dati personali <strong>non sono venduti a terzi</strong>. Possono essere condivisi con:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Altri utenti:</strong> nome, foto profilo, valutazioni sono visibili agli 
                  altri utenti della piattaforma
                </li>
                <li>
                  <strong>Fornitori di servizi:</strong> hosting (Supabase), analytics (anonimizzate), 
                  servizi di notifica push
                </li>
                <li>
                  <strong>Autorità competenti:</strong> solo su richiesta legittima o ordine dell&apos;autorità giudiziaria
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#e63946]" />
              Sicurezza
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Adottiamo misure tecniche e organizzative per proteggere i tuoi dati:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Connessione crittografata SSL/TLS</li>
                <li>Autenticazione sicura tramite OAuth 2.0</li>
                <li>Database protetti e backup regolari</li>
                <li>Accesso limitato ai dati solo al personale autorizzato</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">6</span>
              I tuoi diritti (GDPR)
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>In qualità di interessato, hai i seguenti diritti:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Accesso:</strong> ottenere conferma del trattamento e copia dei tuoi dati
                </li>
                <li>
                  <strong>Rettifica:</strong> richiedere la correzione di dati inesatti
                </li>
                <li>
                  <strong>Cancellazione (&quot;diritto all&apos;oblio&quot;):</strong> richiedere la cancellazione 
                  dei tuoi dati (con alcune eccezioni di legge)
                </li>
                <li>
                  <strong>Limitazione:</strong> richiedere la limitazione del trattamento
                </li>
                <li>
                  <strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato
                </li>
                <li>
                  <strong>Opposizione:</strong> opporti al trattamento per finalità di marketing
                </li>
                <li>
                  <strong>Reclamo:</strong> proporre reclamo al Garante per la protezione dei dati personali
                </li>
              </ul>
              <p className="mt-4">
                Per esercitare i tuoi diritti, contattaci a: <strong>privacy@andamus.it</strong>
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">7</span>
              Cookie
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Utilizziamo solo cookie tecnici necessari al funzionamento della piattaforma 
                (autenticazione, preferenze). Non utilizziamo cookie di profilazione o di terze parti 
                per il marketing.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#e63946]" />
              Cancellazione account
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Puoi richiedere la cancellazione del tuo account in qualsiasi momento dal tuo profilo 
                o scrivendo a <strong>privacy@andamus.it</strong>. I dati saranno cancellati entro 30 
                giorni, salvo obblighi di legge che richiedano conservazione più prolungata.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">8</span>
              Modifiche alla privacy policy
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Ci riserviamo il diritto di aggiornare questa informativa. Le modifiche saranno 
                pubblicate su questa pagina con la data di aggiornamento. Ti invitiamo a consultare 
                regolarmente questa pagina.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#e63946]" />
              Contatti
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti:
              </p>
              <p className="font-semibold text-white">privacy@andamus.it</p>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50 text-sm">
            Utilizzando Andamus, accetti la nostra Privacy Policy.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/termini-e-condizioni"
              className="text-[#e63946] hover:underline text-sm"
            >
              Termini e Condizioni
            </Link>
            <span className="text-white/30">·</span>
            <Link href="/" className="text-white/70 hover:text-white text-sm">
              Torna alla home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
