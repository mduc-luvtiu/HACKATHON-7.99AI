"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Loader2, Mail, Lock, User } from "lucide-react"
import { api } from "@/lib/api"

interface AuthFormProps {
  onAuth: (token: string, user: any) => void
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")

  // Form data
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus("loading")
    setError("")

    try {
      let response
      
      if (isLogin) {
        response = await api.auth.login(email, password)
      } else {
        response = await api.auth.register(email, password, fullName)
      }

      // If we reach here, authentication was successful
      // Store token in localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Call onAuth callback
      onAuth(response.token, response.user)
      
    } catch (err: any) {
      // Handle API errors
      const errorMessage = err.message || "Có lỗi xảy ra. Vui lòng thử lại."
      setError(errorMessage)
      setStatus("error")
      console.error("Auth error:", err)
    } finally {
      setIsLoading(false)
      if (status !== "error") setStatus("idle")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Video Hub</h1>
          <p className="text-gray-600 mt-2">Nền tảng video thông minh với AI</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Đăng nhập để truy cập vào hệ thống" 
                : "Tạo tài khoản mới để bắt đầu"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nhập họ và tên"
                      className="pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {status === "loading" && <div className="text-blue-600 mt-2">Đang xử lý...</div>}
              {status === "error" && error && <div className="text-red-600 mt-2">{error}</div>}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Đang đăng nhập..." : "Đang đăng ký..."}
                  </>
                ) : (
                  isLogin ? "Đăng nhập" : "Đăng ký"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {isLogin 
                  ? "Chưa có tài khoản? Đăng ký ngay" 
                  : "Đã có tài khoản? Đăng nhập"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
