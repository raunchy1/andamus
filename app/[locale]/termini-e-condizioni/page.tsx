"use client";

import Link from "next/link";
import { ChevronLeft, Shield, FileText, AlertTriangle } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="ml-4 text-lg font-bold">Termini e Condizioni</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e63946]/10 mb-6">
            <FileText className="w-8 h-8 text-[#e63946]" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Termini e Condizioni d&apos;Uso</h2>
          <p className="text-white/60">
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-[#e63946]/5 border border-[#e63946]/20 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-[#e63946] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#e63946] mb-2">Importante</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Andamus è una piattaforma di <strong>carpooling tra privati</strong>. Non è un servizio di 
                trasporto pubblico né una società di noleggio. Gli utenti sono responsabili del rispetto 
                delle normative vigenti in materia di trasporto non di linea.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">1</span>
              Definizioni
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                <strong>Piattaforma:</strong> il sito web e le applicazioni mobili Andamus che permettono 
                di mettere in contatto autisti e passeggeri per condividere viaggi in automobile.
              </p>
              <p>
                <strong>Autista:</strong> l&apos;utente che pubblica un passaggio offrendo dei posti disponibili 
                nel proprio veicolo.
              </p>
              <p>
                <strong>Passeggero:</strong> l&apos;utente che cerca e prenota un passaggio offerto da un autista.
              </p>
              <p>
                <strong>Contributo spese:</strong> la somma richiesta dall&apos;autista per partecipare alle spese 
                del viaggio (carburante, pedaggi, etc.).
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">2</span>
              Natura del servizio
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Andamus è una <strong>piattaforma di intermediazione gratuita</strong> che mette in contatto 
                privati per la condivisione di spese di viaggio. Non forniamo servizi di trasporto e non 
                siamo parte delle transazioni tra utenti.
              </p>
              <p>
                Il carpooling è regolamentato dall&apos;art. 2, comma 2-bis del D.Lgs. 285/1992 (Nuovo Codice 
                della Strada), che consente la condivisione delle spese di viaggio a condizione che:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Il veicolo sia di proprietà o in uso dell&apos;autista</li>
                <li>Il contributo richiesto non ecceda le spese effettivamente sostenute</li>
                <li>Il viaggio non abbia scopo di lucro</li>
                <li>L&apos;autista non svolga attività di trasporto abituale dei passeggeri</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">3</span>
              Registrazione e account
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Per utilizzare Andamus devi avere almeno <strong>18 anni</strong> e registrarti con un 
                account Google verificato. Sei responsabile della veridicità delle informazioni fornite 
                e della sicurezza del tuo account.
              </p>
              <p>
                Ci riserviamo il diritto di sospendere o eliminare account che:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Forniscono informazioni false o fuorvianti</li>
                <li>Violano le presenti condizioni d&apos;uso</li>
                <li>Ricevono segnalazioni gravi da parte di altri utenti</li>
                <li>Utilizzano la piattaforma per scopi commerciali</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">4</span>
              Responsabilità degli utenti
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p className="font-semibold text-white">Come autista:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Devi possedere patente valida e veicolo assicurato regolarmente</li>
                <li>Sei responsabile della sicurezza dei passeggeri durante il viaggio</li>
                <li>Devi rispettare il Codice della Strada e le normative vigenti</li>
                <li>Non puoi richiedere contributi superiori alle spese effettive</li>
              </ul>
              <p className="font-semibold text-white mt-4">Come passeggero:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Devi rispettare l&apos;autista e gli altri passeggeri</li>
                <li>Devi presentarsi puntualmente al punto di incontro</li>
                <li>Sei responsabile della veridicità delle tue informazioni</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">5</span>
              Limitazione di responsabilità
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                <strong>Andamus non è responsabile:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Di eventuali incidenti, danni o infortuni occorsi durante i viaggi</li>
                <li>Della veridicità delle informazioni fornite dagli utenti</li>
                <li>Della condotta degli utenti durante i viaggi</li>
                <li>Della mancata o tardiva esecuzione dei viaggi</li>
                <li>Della perdita o danneggiamento di oggetti durante il viaggio</li>
              </ul>
              <p className="mt-4">
                Gli utenti accettano di utilizzare la piattaforma a proprio rischio e si impegnano a 
                risarcire Andamus di eventuali danni derivanti dalla violazione delle presenti condizioni.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">6</span>
              Comportamento e sicurezza
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>È severamente vietato:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utilizzare la piattaforma per attività illecite o fraudolente</li>
                <li>Condurre in stato di ebbrezza o sotto l&apos;influenza di sostanze</li>
                <li>Comportamenti molesti, discriminatori o violenti</li>
                <li>Trasportare merci illegali o pericolose</li>
                <li>Utilizzare la piattaforma per scopi di lucro commerciale</li>
              </ul>
              <p className="mt-4">
                Gli utenti possono segnalare comportamenti inappropriati attraverso il pulsante SOS 
                o contattando il supporto. Le segnalazioni vengono verificate e possono comportare 
                la sospensione permanente dall&apos;uso della piattaforma.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">7</span>
              Pagamenti
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                I pagamenti tra autisti e passeggeri avvengono <strong>direttamente</strong> senza 
                intermediazione di Andamus. La piattaforma non gestisce pagamenti né trattiene commissioni.
              </p>
              <p>
                Gli autisti possono offrire passaggi gratuiti o richiedere un contributo per le spese. 
                Il passeggero accetta il contributo indicato al momento della prenotazione.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">8</span>
              Modifiche ai termini
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                Ci riserviamo il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento. 
                Le modifiche entreranno in vigore dalla data di pubblicazione sulla piattaforma. 
                L&apos;utilizzo continuato della piattaforma costituisce accettazione dei nuovi termini.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center text-sm text-[#e63946]">9</span>
              Legge applicabile
            </h3>
            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                I presenti Termini e Condizioni sono regolati dalla legge italiana. Per qualsiasi 
                controversia sarà competente il foro di Cagliari.
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
                Per qualsiasi domanda sui presenti termini, puoi contattarci all&apos;indirizzo:
              </p>
              <p className="font-semibold text-white">support@andamus.it</p>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50 text-sm">
            Utilizzando Andamus, accetti integralmente i presenti Termini e Condizioni.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-[#e63946] hover:underline text-sm"
            >
              Privacy Policy
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
