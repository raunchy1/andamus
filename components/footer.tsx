import Link from "next/link";
import { Car, Heart } from "lucide-react";

const footerLinks = [
  { href: "/cerca", label: "Cerca passaggi" },
  { href: "/offri", label: "Offri un passaggio" },
  { href: "/profilo", label: "Il tuo profilo" },
];

const legalLinks = [
  { href: "/termini-e-condizioni", label: "Termini e Condizioni" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[#1a1a2e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-[#e63946]" />
              <span className="text-lg font-bold">Andamus</span>
            </Link>
            <p className="text-sm text-gray-400">
              Il carpooling sardo per viaggiare insieme. 
              Connettiamo persone per condividere passaggi in tutta la Sardegna.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Navigazione
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Legale
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-400">
              Made with{" "}
              <Heart className="inline h-4 w-4 text-[#e63946]" />{" "}
              in Sardegna
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-white/10 pt-8">
          <p className="text-center text-sm text-gray-400">
            © {currentYear} Andamus. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
