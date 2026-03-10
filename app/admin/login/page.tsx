"use client"

import { Suspense, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const unauthorized = searchParams.get("error") === "unauthorized"

  // Check if already logged in
  useEffect(() => {
    let cancelled = false
    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) return

        const { data: adminProfile, error } = await supabase
          .from("admin_profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (cancelled) return
        if (error || !adminProfile || !["admin", "super_admin"].includes(adminProfile.role)) return

        router.replace("/admin/dashboard")
      } catch (err) {
        console.error("[admin-login] checkSession error", err)
      }
    }
    void checkSession()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        toast.error(data.error || "Login failed")
        setIsLoading(false)
        return
      }

      toast.success("Login successful!")
      router.replace("/admin/dashboard")
    } catch (err) {
      console.error("[admin-login] Login error:", err)
      setError("An unexpected error occurred")
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")
    try {
      // Check if running in iframe (like v0 preview) - use popup instead
      const isInIframe = window.self !== window.top
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: isInIframe,
        },
      })

      if (error) {
        console.error("[admin-oauth] Google sign-in error", error)
        toast.error("Failed to initiate Google sign-in")
        setIsGoogleLoading(false)
        return
      }

      // If in iframe, open OAuth in a new window/tab
      if (isInIframe && data?.url) {
        const popup = window.open(data.url, "_blank", "noopener,noreferrer")
        if (!popup) {
          toast.error("Please allow popups for this site to sign in with Google")
          setIsGoogleLoading(false)
          return
        }
        
        // Listen for auth state changes when user completes OAuth in popup
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe()
            router.replace("/admin/dashboard")
          }
        })
        
        // Reset loading state after a timeout if popup is closed without completing
        setTimeout(() => {
          setIsGoogleLoading(false)
        }, 60000) // 1 minute timeout
      }
      // If not in iframe, the redirect will happen automatically
    } catch (err) {
      console.error("[admin-oauth] Unexpected error", err)
      toast.error("An unexpected error occurred")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md border-0 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo.jpeg"
              alt="AD Club Logo"
              width={80}
              height={80}
              className="rounded-xl"
              priority
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Admin Login</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access the admin portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(unauthorized || error) && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error || "You must be an admin to access that page. Please sign in with an admin account."}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Only authorized admins can access this portal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}

