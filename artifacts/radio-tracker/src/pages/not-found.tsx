import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-sm">
        <CardContent className="flex flex-col items-center text-center pt-10 pb-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">页面未找到</h1>
            <p className="text-muted-foreground mt-2 text-sm">您访问的页面不存在，请返回广播中心。</p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors">
            返回广播中心
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
