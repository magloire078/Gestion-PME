
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FileText, Coins, BarChart } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function Home() {
  const carouselImages = PlaceHolderImages.filter((p) => p.id.startsWith('carousel-'));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/auth/signin">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">S'inscrire</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    La gestion d'entreprise, simplifiée.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Gestion PME est la solution tout-en-un pour les petites et moyennes entreprises. Créez des factures, suivez vos dépenses et obtenez des rapports financiers clairs.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/auth/signup">Commencer gratuitement</Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto w-full max-w-full lg:order-last">
                <Carousel
                  className="w-full"
                  plugins={[
                    Autoplay({
                      delay: 3000,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                >
                  <CarouselContent>
                    {carouselImages.map((image) => (
                      <CarouselItem key={image.id}>
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          width={1200}
                          height={900}
                          data-ai-hint={image.imageHint}
                          className="aspect-video w-full overflow-hidden rounded-xl object-cover object-center shadow-lg"
                          priority={carouselImages.indexOf(image) === 0}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex" />
                </Carousel>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Fonctionnalités Clés</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Tout ce dont vous avez besoin pour réussir
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  De la facturation à l'analyse financière, nous avons les outils pour vous aider à développer votre entreprise.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              <div className="grid gap-2 text-center">
                <div className="flex justify-center items-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Génération de Factures</h3>
                <p className="text-sm text-muted-foreground">
                  Créez et envoyez des factures professionnelles en quelques clics. Suivez les paiements et ne manquez jamais une échéance.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="flex justify-center items-center">
                  <Coins className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Suivi des Dépenses</h3>
                <p className="text-sm text-muted-foreground">
                  Enregistrez facilement toutes vos dépenses professionnelles. Gardez une trace de vos finances pour la saison des impôts.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="flex justify-center items-center">
                  <BarChart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Rapports Financiers IA</h3>
                <p className="text-sm text-muted-foreground">
                  Obtenez des informations précieuses grâce à des rapports générés par l'IA sur votre rentabilité et vos dépenses.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Gestion PME. Tous droits réservés.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Termes & Conditions
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Politique de confidentialité
          </Link>
        </nav>
      </footer>
    </div>
  );
}
