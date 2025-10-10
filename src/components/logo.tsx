import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/*
        REMPLACEZ LE CODE SVG CI-DESSOUS PAR LE VÔTRE.
        Ouvrez votre fichier .svg avec un éditeur de texte, copiez le code, et collez-le ici.
      */}
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
        {/* Icône de croissance */}
        <g transform="translate(10,10)">
          <rect x="0" y="0" width="60" height="60" rx="10" fill="none" stroke="#003366" strokeWidth="2"/>
          <rect x="10" y="40" width="8" height="10" fill="#003366"/>
          <rect x="25" y="30" width="8" height="20" fill="#003366"/>
          <rect x="40" y="20" width="8" height="30" fill="#003366"/>
          <path d="M10 50 L25 35 L40 25" stroke="#003366" strokeWidth="2" fill="none"/>
          <polygon points="40,25 45,20 42,28" fill="#003366"/>
        </g>

        {/* Texte */}
        <text x="80" y="40" fontFamily="Arial, sans-serif" fontSize="24" fill="#003366">Gestion</text>
        <text x="80" y="70" fontFamily="Arial, sans-serif" fontSize="24" fill="#3399cc">PME</text>
      </svg>
      {/* Fin du code SVG à remplacer */}
      <span className="text-xl font-bold text-foreground whitespace-nowrap">Gestion PME</span>
    </div>
  );
}
