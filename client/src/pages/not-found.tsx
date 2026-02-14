import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
      <Card className="w-full max-w-md mx-4" style={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)' }}>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#D4AF37] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>404</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Page not found</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold">
              Go Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
