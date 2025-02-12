
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AuthError } from "@supabase/supabase-js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        navigate("/");
      } else if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    // Handle email confirmation
    const handleEmailConfirmation = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token_hash') || params.get('token'); // Check both formats
      const type = params.get('type');

      if (token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any || 'signup'
          });
          
          if (error) {
            console.error('Verification error:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Error confirming email. Please try again.",
            });
          } else {
            toast({
              title: "Success",
              description: "Email confirmed successfully! You can now log in.",
            });
            navigate('/');
          }
        } catch (error) {
          console.error('Error in email confirmation:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error confirming email. Please try again.",
          });
        }
      }
    };

    handleEmailConfirmation();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error:", error);
    let description = "An error occurred during authentication.";
    
    if (error.message.includes("Email not confirmed")) {
      description = "Please check your email and click the confirmation link to verify your account.";
    } else if (error.message.includes("Invalid login credentials")) {
      description = "Invalid email or password. Please check your credentials and try again.";
    } else if (error.message.includes("Email already registered")) {
      description = "This email is already registered. Please try signing in instead.";
    } else if (error.message.includes("Password")) {
      description = "Password should be at least 6 characters long.";
    }

    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: description,
    });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `http://localhost:8080/auth`, // Explicitly set the port
          data: {
            email: email,
          }
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Please check your email for the confirmation link to complete your registration.",
      });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your email below to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
