import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Moon, Sun, Bell, Lock, User, Volume2, Palette, HelpCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your MedAssist preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how MedAssist looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch id="dark-mode" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="notifications">Notifications</Label>
              </div>
              <Switch id="notifications" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <div className="p-3 bg-muted rounded-lg">Dr. User</div>
            </div>
            <Button className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/10 hover:border-primary/30 transition-all md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              About
            </CardTitle>
            <CardDescription>MedAssist information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">API Status</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1">
                <HelpCircle className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" className="flex-1">
                <Activity className="h-4 w-4 mr-2" />
                Changelog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
