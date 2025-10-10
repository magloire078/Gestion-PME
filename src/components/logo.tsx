import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/*
        REMPLACEZ LE CODE SVG CI-DESSOUS PAR LE VÔTRE.
        Ouvrez votre fichier .svg avec un éditeur de texte, copiez le code, et collez-le ici.
      */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M19.5 5.5V18.5"></path>
        <path d="M12.5 10.5V18.5"></path>
        <path d="M5.5 14.5V18.5"></path>
        <rect width="23" height="23" x="0.5" y="0.5" rx="4"></rect>
      </svg>
      {/* Fin du code SVG à remplacer */}
      <span className="text-xl font-bold text-foreground whitespace-nowrap">Gestion PME</span>
    </div>
  );
}
