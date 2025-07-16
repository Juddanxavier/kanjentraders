'use client'

import { cn } from "@/lib/utils"
import { useState } from "react"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type LoginMethod = 'email' | 'phone'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })
      
      if (result.error) {
        toast.error(result.error.message || "Login failed")
      } else {
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Email login failed", error)
      toast.error("Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      })
      
      if (result.error) {
        toast.error(result.error.message || "Failed to send OTP")
      } else {
        setIsOtpSent(true)
        toast.success("OTP sent to your phone!")
      }
    } catch (error) {
      console.error("Phone OTP request failed", error)
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await authClient.phoneNumber.verifyOtp({
        phoneNumber: phone,
        otp: otpCode,
      })
      
      if (result.error) {
        toast.error(result.error.message || "Invalid OTP")
      } else {
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Phone OTP verification failed", error)
      toast.error("Invalid OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-1">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Kajen Traders account
                </p>
              </div>

              {/* Login method toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    loginMethod === 'email' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setLoginMethod('email')
                    setIsOtpSent(false)
                  }}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    loginMethod === 'phone' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setLoginMethod('phone')
                    setIsOtpSent(false)
                  }}
                >
                  Phone OTP
                </button>
              </div>

              {/* Email Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="superadmin@kajentraders.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="superadmin123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              )}

              {/* Phone OTP Form */}
              {loginMethod === 'phone' && (
                <div className="space-y-4">
                  {!isOtpSent ? (
                    <form onSubmit={handlePhoneOtpRequest} className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+65 1234 5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handlePhoneOtpVerify} className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          OTP sent to {phone}
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Verifying..." : "Verify OTP"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsOtpSent(false)}
                      >
                        Back to phone number
                      </Button>
                    </form>
                  )}
                </div>
              )}

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-muted-foreground text-center text-xs text-balance">
        <p className="mb-2">
          <strong>Demo Credentials:</strong>
        </p>
        <p>Email: superadmin@kajentraders.com</p>
        <p>Password: superadmin123</p>
      </div>
      
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
