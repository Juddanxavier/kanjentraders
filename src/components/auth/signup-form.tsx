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

type SignupMethod = 'email' | 'phone'

export default function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })
      
      if (result.error) {
        toast.error(result.error.message || "Signup failed")
      } else {
        toast.success("Account created successfully!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Email signup failed", error)
      toast.error("Signup failed. Please try again.")
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

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await authClient.phoneNumber.signUp({
        phoneNumber: phone,
        otp: otpCode,
        name,
      })
      
      if (result.error) {
        toast.error(result.error.message || "Signup failed")
      } else {
        toast.success("Account created successfully!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Phone signup failed", error)
      toast.error("Signup failed. Please try again.")
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
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-balance">
                  Sign up for your Kajen Traders account
                </p>
              </div>

              {/* Signup method toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    signupMethod === 'email' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setSignupMethod('email')
                    setIsOtpSent(false)
                  }}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    signupMethod === 'phone' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setSignupMethod('phone')
                    setIsOtpSent(false)
                  }}
                >
                  Phone OTP
                </button>
              </div>

              {/* Email Signup Form */}
              {signupMethod === 'email' && (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              )}

              {/* Phone OTP Form */}
              {signupMethod === 'phone' && (
                <div className="space-y-4">
                  {!isOtpSent ? (
                    <form onSubmit={handlePhoneOtpRequest} className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor="phone_name">Full Name</Label>
                        <Input
                          id="phone_name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
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
                    <form onSubmit={handlePhoneSignup} className="space-y-4">
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
                        {isLoading ? "Creating account..." : "Create account"}
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
                Already have an account?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
