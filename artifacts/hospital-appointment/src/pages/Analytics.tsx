import { ArrowLeft, TrendingUp, Users, DollarSign, Award, Activity } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetEnhancedAnalytics } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { isAuthenticated, login } = useAuth();
  const { data, isLoading } = useGetEnhancedAnalytics();

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-32">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
          <p className="text-muted-foreground mb-6">Sign in to view analytics</p>
          <Button onClick={login}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="text-center py-32 text-muted-foreground">No analytics data available.</div>
      </AppLayout>
    );
  }

  const statusData = data.appointmentsByStatus ? Object.entries(data.appointmentsByStatus).map(([name, value]) => ({ name, value })) : [];
  const deptData = data.topDepartments ?? [];
  const doctorData = data.topDoctors ?? [];
  const trendData = data.dailyTrends ?? [];
  const revenueData = data.dailyTrends ?? [];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-display font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground mb-8">Comprehensive platform insights and trends</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Appointments", value: data.totalAppointments, icon: Activity, color: "text-blue-500" },
            { label: "Total Doctors", value: data.totalDoctors, icon: Users, color: "text-emerald-500" },
            { label: "Total Patients", value: data.totalPatients, icon: Users, color: "text-purple-500" },
            { label: "Total Revenue", value: `$${(data.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-500" },
          ].map((stat, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-5">
                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {trendData.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Appointment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {revenueData.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Revenue by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {statusData.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Appointments by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                        {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {deptData.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Top Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {doctorData.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-amber-500" />
                Top Rated Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {doctorData.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-amber-600">{doc.rating?.toFixed(1)} / 5</p>
                      <p className="text-xs text-muted-foreground">{doc.totalAppointments} appointments</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
