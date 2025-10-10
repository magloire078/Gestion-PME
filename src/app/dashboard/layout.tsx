
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DollarSign,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { useState, useEffect } from "react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/dashboard/invoices", icon: FileText, label: "Factures" },
  { href: "/dashboard/expenses", icon: DollarSign, label: "Dépenses" },
  { href: "/dashboard/reports", icon: LineChart, label: "Rapports" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

interface Company {
    name: string;
}

function UserNav() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.photoURL ?? undefined}
              alt="Avatar"
            />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.displayName ?? user?.email ?? 'Mon Compte'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard/settings">
            <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
            </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            Clair
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            Sombre
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
              onClick={() => setIsOpen(false)}
            >
              <Logo />
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    pathname === item.href
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const companyRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, "companies", user.uid);
      }, [firestore, user]);
    
    const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

    useEffect(() => {
      if (!isUserLoading && !user) {
        router.push("/auth/signin");
      }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="loader">Chargement...</div>
        </div>
      );
    }
    
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-auto flex-col items-center border-b px-4 py-4 lg:h-auto lg:px-6">
            <Link href="/dashboard" className="flex flex-col items-center gap-2 font-semibold">
              <Logo />
              {isCompanyLoading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                company && <span className="text-xs text-muted-foreground">{company.name}</span>
              )}
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    pathname === item.href
                      ? "text-primary bg-muted"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <MobileNav />
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
