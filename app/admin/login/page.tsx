"use client"

import { Suspense, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
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

  const handleGoogleLogin = async () => {
    setIsLoading(true)
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
        setIsLoading(false)
        return
      }

      // If in iframe, open OAuth in a new window/tab
      if (isInIframe && data?.url) {
        const popup = window.open(data.url, "_blank", "noopener,noreferrer")
        if (!popup) {
          toast.error("Please allow popups for this site to sign in with Google")
          setIsLoading(false)
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
          setIsLoading(false)
        }, 60000) // 1 minute timeout
      }
      // If not in iframe, the redirect will happen automatically
    } catch (err) {
      console.error("[admin-oauth] Unexpected error", err)
      toast.error("An unexpected error occurred")
      setIsLoading(false)
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
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Admin Login</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in with your Google account to access the admin portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unauthorized && (
            <div className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
              You must be an admin to access that page. Please sign in with an admin account.
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
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

