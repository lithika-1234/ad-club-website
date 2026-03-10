import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("[admin-login] Auth error:", authError.message)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }

    // Check if user is an admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[admin-login] Profile error:", profileError.message)
      return NextResponse.json(
        { error: "Error checking admin status" },
        { status: 500 }
      )
    }

    if (!adminProfile || !["admin", "super_admin"].includes(adminProfile.role)) {
      // Sign out the user if they're not an admin
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: "You do not have admin access" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: adminProfile.role,
      },
    })
  } catch (error) {
    console.error("[admin-login] Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
