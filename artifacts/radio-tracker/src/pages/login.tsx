import { useState, FormEvent } from "react";
import { useAuth } from "@/context/auth-context";
import { RadioTower, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <RadioTower className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">校园之声广播站</h1>
          <p className="text-muted-foreground text-sm">管理员登录</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-5 px-5">
            <p className="text-sm text-muted-foreground">请使用广播站工作人员账号登录，同学点歌请直接进入「<a href="/submissions" className="text-primary hover:underline">点歌审核</a>」页面。</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">用户名</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">密码</label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="输入密码"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2 font-semibold" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? "登录中…" : "登录"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">演示账号</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  className="text-left bg-muted/60 rounded-lg p-2 hover:bg-muted transition-colors"
                  onClick={() => { setUsername("admin"); setPassword("admin2024"); }}
                >
                  <div className="font-semibold text-primary">管理员</div>
                  <div className="text-muted-foreground">admin / admin2024</div>
                </button>
                <button
                  type="button"
                  className="text-left bg-muted/60 rounded-lg p-2 hover:bg-muted transition-colors"
                  onClick={() => { setUsername("broadcaster"); setPassword("bc2024"); }}
                >
                  <div className="font-semibold text-blue-600">播音员</div>
                  <div className="text-muted-foreground">broadcaster / bc2024</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          校园之声广播站 · 让音乐连接校园生活
        </p>
      </div>
    </div>
  );
}
