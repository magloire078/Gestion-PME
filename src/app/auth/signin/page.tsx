
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Logo } from "@/components/logo";
import { useAuth } from "@/firebase";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";

const formSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    initiateEmailSignIn(auth, values.email, values.password)
      .then(() => {
        router.push("/dashboard");
      })
      .catch((error) => {
        let description = "Une erreur inattendue s'est produite. Veuillez réessayer.";
        
        if (error instanceof FirebaseError) {
          if (error.code === 'auth/invalid-credential') {
            description = "L'adresse e-mail ou le mot de passe est incorrect. Veuillez vérifier vos informations.";
          } else if (error.code === 'auth/too-many-requests') {
            description = "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
          } else {
              console.error("Firebase Auth Error:", error);
          }
        } else {
          console.error("Unexpected Error:", error);
        }

        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description,
        });
      });
  }

  return (
    <Card className="mx-auto max-w-sm w-full shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl">Bienvenue</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte pour continuer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@votre-entreprise.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Vous n'avez pas de compte?{" "}
          <Link href="/auth/signup" className="underline">
            S'inscrire
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
