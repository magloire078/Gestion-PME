import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/*
        REMPLACEZ LE CODE SVG CI-DESSOUS PAR LE VÔTRE.
        Ouvrez votre fichier .svg avec un éditeur de texte, copiez le code, et collez-le ici.
      */}
      <svg
        className="h-7 w-7 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 7V17M8 7V17M12 7V17M16 7V17M20 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Fin du code SVG à remplacer */}
      <span className="text-xl font-bold text-foreground whitespace-nowrap">Gestion PME</span>
    </div>
  );
}
