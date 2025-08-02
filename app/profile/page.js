import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Mail, Phone, MapPin, Calendar, User } from "lucide-react"

export default function ProfilePage() {
  const activityStats = [
    {
      label: "Orders Processed",
      value: "1,247",
    },
    {
      label: "Items Managed",
      value: "15,632",
    },
    {
      label: "Accuracy Rate",
      value: "99.2%",
    },
    {
      label: "Team Members",
      value: "12",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-2">Manage your personal information and account details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                    <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                      <Camera className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  <div className="text-center mt-4">
                    <h2 className="text-xl font-semibold">John Smith</h2>
                    <p>Warehouse Manager</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300 mt-2">
                      Operations
                    </span>
                  </div>
                  <div className="w-full mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2" />
                      john.smith@quantus.com
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      +1 (555) 123-4567
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      New York, NY
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Joined January 2020
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2" />
                      ID: EMP-001
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{stat.label}</span>
                      <span className="font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </div>
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" className="bg-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Smith" className="bg-gray-800 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john.smith@quantus.com"
                    className="bg-gray-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" className="bg-gray-800 text-white" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue="New York, NY" className="bg-gray-800 text-white" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    defaultValue="Warehouse Manager with 8+ years of experience in inventory management and logistics operations."
                    className="bg-gray-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="Operations" disabled className="bg-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input id="employeeId" defaultValue="EMP-001" disabled className="bg-gray-800 text-white" />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
