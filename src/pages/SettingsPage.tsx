import { Moon, Sun, Download, User, DollarSign, Tag, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CURRENCIES } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences and account</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">A</div>
              <div>
                <p className="font-medium">Alex Johnson</p>
                <p className="text-sm text-muted-foreground">alex.johnson@gmail.com</p>
              </div>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Display Name</Label>
                <Input defaultValue="Alex Johnson" />
              </div>
              <div>
                <Label className="text-xs">Monthly Income</Label>
                <Input type="number" defaultValue="5200" className="font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Currency</CardTitle>
            <CardDescription>Set your primary and display currencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Primary Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Budget Alerts</p>
                <p className="text-xs text-muted-foreground">Notify when spending exceeds 80% of budget</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Goal Reminders</p>
                <p className="text-xs text-muted-foreground">Weekly progress updates on savings goals</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Insights</p>
                <p className="text-xs text-muted-foreground">Daily spending tips from SmartSpend AI</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" /> Export All Data (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              Delete All Data
            </Button>
          </CardContent>
        </Card>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">SmartSpend AI v1.0 • Your data is stored securely</p>
        </div>
      </div>
    </AppLayout>
  );
}
