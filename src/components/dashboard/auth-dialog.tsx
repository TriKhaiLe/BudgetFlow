"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, Mail, User } from "lucide-react";

export function AuthDialog() {
  const auth = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
      setActiveTab("login");
    }
  }, [open, resetForm]);

  const handleLogin = async () => {
    if (!auth.isSupabaseConfigured) {
      toast({
        title: "Auth not configured",
        description: "Set Supabase env vars to enable login.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.login(email.trim(), password);
      toast({ title: "Signed in", description: "Welcome back." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!auth.isSupabaseConfigured) {
      toast({
        title: "Auth not configured",
        description: "Set Supabase env vars to enable signup.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Confirm password does not match.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.signup(email.trim(), password);
      toast({
        title: "Account created",
        description: "Check your email for verification if required.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth.isSupabaseConfigured) {
      toast({
        title: "Auth not configured",
        description: "Set Supabase env vars to enable Google login.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.loginWithGoogle();
    } catch (error) {
      toast({
        title: "Google login failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await auth.logout();
      toast({ title: "Signed out", description: "Session cleared." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel = auth.isAnonymous ? "Sign In" : "Account";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 whitespace-nowrap flex-shrink-0"
        >
          <User className="h-4 w-4" />
          <span className="md:hidden">{buttonLabel}</span>
          <span className="hidden md:inline sr-only">{buttonLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            {auth.isAnonymous
              ? "Sign in to sync across devices."
              : "Manage your session and sync account."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {!auth.isSupabaseConfigured && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.
            </div>
          )}

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>
                {auth.isAnonymous
                  ? "Guest session"
                  : auth.email || "Signed in"}
              </span>
            </div>
          </div>

          {auth.isAnonymous ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleLogin}
                    disabled={isSubmitting || !auth.isSupabaseConfigured}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting || !auth.isSupabaseConfigured}
                  >
                    Continue with Google
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSignup}
                  disabled={isSubmitting || !auth.isSupabaseConfigured}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
