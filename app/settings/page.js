"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon, Monitor, SettingsIcon, Palette } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [compactMode, setCompactMode] = useState(false)

  const settingsTabs = [
    { name: "General", active: true },
    { name: "Account", active: false },
    { name: "Notifications", active: false },
    { name: "Security", active: false },
    { name: "Integrations", active: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your warehouse system preferences</p>
        </div>

        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            {settingsTabs.map((tab, index) => (
              <Button
                key={index}
                variant="ghost"
                className={tab.active ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}
              >
                {tab.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                System Preferences
              </CardTitle>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="warehouseName">Warehouse Name</Label>
                <Input id="warehouseName" defaultValue="Quantus Main Warehouse" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="est">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">Eastern Standard Time</SelectItem>
                    <SelectItem value="cst">Central Standard Time</SelectItem>
                    <SelectItem value="mst">Mountain Standard Time</SelectItem>
                    <SelectItem value="pst">Pacific Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="cad">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">Save System Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4 mb-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4 mb-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-4 w-4 mb-2" />
                    System
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use smaller spacing and fonts</p>
                </div>
                <Switch id="compact" checked={compactMode} onCheckedChange={setCompactMode} />
              </div>

              <Button className="w-full">Save Appearance Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
