
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useStorage, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Company } from "@/lib/types";


const formSchema = z.object({
  name: z.string().min(2, "Le nom de l'entreprise doit comporter au moins 2 caractères."),
  address: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email("Adresse e-mail invalide.").optional().or(z.literal('')),
  taxId: z.string().optional(),
});

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "companies", user.uid);
  }, [firestore, user]);

  const { data: company, isLoading } = useDoc<Company>(companyRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      contactEmail: "",
      taxId: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({ 
        name: company.name,
        address: company.address || "",
        phone: company.phone || "",
        contactEmail: company.contactEmail || "",
        taxId: company.taxId || "",
       });
    }
  }, [company, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!companyRef) return;
    updateDocumentNonBlocking(companyRef, values);
    toast({
      title: "Paramètres enregistrés",
      description: "Les informations de votre entreprise ont été mises à jour.",
    });
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);

    try {
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL });
        }

        toast({
            title: "Avatar mis à jour",
            description: "Votre nouvelle image de profil a été enregistrée.",
        });
        // Recharger pour voir le nouvel avatar partout
        window.location.reload(); 
    } catch (error) {
        console.error("Error uploading avatar:", error);
        toast({
            variant: "destructive",
            title: "Erreur de téléversement",
            description: "Impossible de téléverser votre avatar. Veuillez réessayer.",
        });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profil de l'entreprise</CardTitle>
          <CardDescription>
            Mettez à jour les informations de votre profil et de votre entreprise ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>
                        <UserIcon className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Changer l'avatar
                    </Button>
                    <Input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF jusqu'à 2MB.</p>
                </div>
            </div>

          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre Entreprise SAS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Rue de la République, 75001 Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 1 23 45 67 89" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contact</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@votre-entreprise.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro d'identification fiscale</FormLabel>
                      <FormControl>
                        <Input placeholder="FR123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
