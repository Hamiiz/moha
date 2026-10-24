"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { instructorLogin } from "@/lib/api";
import { Shield, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InstructorLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error("Please enter your passcode");
      return;
    }

    setLoading(true);
    try {
      const data = await instructorLogin(pin.trim());
      localStorage.setItem("instructor_token", data.token);
      toast.success("Welcome back, Instructor!");
      router.push("/instructor/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid passcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-slate-900 text-brand-500 mb-2">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Instructor Portal</h1>
          <p className="text-sm text-slate-500">
            Enter your instructor passcode to manage schedule, pickup hubs, and working hours.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="pin">Passcode / PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type="password"
                placeholder="Enter passcode (default: 123456)"
                value={pin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)}
                className="pl-10 tracking-widest font-mono"
                required
              />
              <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Authenticating...
              </span>
            ) : (
              "Sign In to Dashboard"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
