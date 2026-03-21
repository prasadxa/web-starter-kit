import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Star, UserPlus, FileText, PieChart as PieChartIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetUserProfile, 
  useGetAppointments, 
  useUpdateAppointment, 
  useCreateReview,
  useGetAdminAnalytics,
  useSetDoctorAvailability,
  useGetDoctorAvailability,
  useGetHospitals,
  useUpdateHospital,
  useGetDoctors,
  getGetAppointmentsQueryKey,
  getGetAdminAnalyticsQueryKey,
  getGetHospitalsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

// ----------------------------------------------------------------------
// DASHBOARD WRAPPER
// ----------------------------------------------------------------------
export default function Dashboard() {
  const { data: profile, isLoading } = useGetUserProfile();

  if (isLoading) return <AppLayout><div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AppLayout>;
  
  if (!profile) return (
    <AppLayout>
      <div className="text-center py-32">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome, {profile.firstName || 'User'}!</h1>
          <p className="text-muted-foreground mt-1 capitalize">{profile.role.replace('_', ' ')} Dashboard</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {profile.role === 'patient' && <PatientDashboard />}
        {profile.role === 'doctor' && <DoctorDashboard doctorId={profile.doctorId!} />}
        {profile.role === 'super_admin' && <SuperAdminDashboard />}
        {profile.role === 'hospital_admin' && <HospitalAdminDashboard hospitalId={profile.hospitalId!} />}
      </div>
    </AppLayout>
  );
}

// ----------------------------------------------------------------------
// PATIENT DASHBOARD
// ----------------------------------------------------------------------
function PatientDashboard() {
  const { data: apptsData } = useGetAppointments({ limit: 50 });
  const updateAppointment = useUpdateAppointment();
  const createReview = useCreateReview();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    if(!confirm("Are you sure you want to cancel this appointment?")) return;
    updateAppointment.mutate({ id, data: { status: 'cancelled' } }, {
      onSuccess: () => {
        toast({ title: "Appointment Cancelled" });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
      }
    });
  };

  const ReviewDialog = ({ appointmentId, doctorId, doctorName }: any) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [open, setOpen] = useState(false);

    const submitReview = () => {
      createReview.mutate({ data: { appointmentId, doctorId, rating, comment } }, {
        onSuccess: () => {
          toast({ title: "Review submitted successfully!" });
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        }
      });
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline" className="border-primary text-primary">Leave a Review</Button></DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Review Dr. {doctorName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <Star key={r} onClick={() => setRating(r)} className={`w-8 h-8 cursor-pointer ${r <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
              ))}
            </div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={submitReview} disabled={createBookingLoading} className="rounded-xl">Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const createBookingLoading = createReview.isPending;

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="mb-8 bg-muted/50 p-1 border border-border/50 rounded-xl">
        <TabsTrigger value="upcoming" className="rounded-lg">Upcoming Appointments</TabsTrigger>
        <TabsTrigger value="past" className="rounded-lg">Past Appointments</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upcoming" className="space-y-4">
        {apptsData?.appointments.filter(a => a.status === 'booked' || a.status === 'pending').length === 0 && (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed"><p className="text-muted-foreground">No upcoming appointments.</p></div>
        )}
        {apptsData?.appointments.filter(a => a.status === 'booked' || a.status === 'pending').map(appt => (
          <div key={appt.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0">
                <span className="font-bold text-lg leading-none">{format(new Date(appt.date), 'dd')}</span>
                <span className="text-xs uppercase">{format(new Date(appt.date), 'MMM')}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.doctorFirstName} {appt.doctorLastName}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {appt.timeSlot}</p>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {appt.hospitalName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleCancel(appt.id)}>Cancel</Button>
            </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="past" className="space-y-4">
        {apptsData?.appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').map(appt => (
          <div key={appt.id} className="bg-card border border-border/60 rounded-3xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 opacity-80">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground shrink-0">
                <span className="font-bold text-lg leading-none">{format(new Date(appt.date), 'dd')}</span>
                <span className="text-xs uppercase">{format(new Date(appt.date), 'MMM')}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.doctorFirstName} {appt.doctorLastName}</h3>
                <p className="text-sm font-medium mb-1">
                  {appt.status === 'completed' ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Completed</span> : <span className="text-destructive flex items-center gap-1"><XCircle className="w-4 h-4"/> Cancelled</span>}
                </p>
              </div>
            </div>
            <div>
              {appt.status === 'completed' && !appt.hasReview && (
                <ReviewDialog appointmentId={appt.id} doctorId={appt.doctorId} doctorName={appt.doctorLastName} />
              )}
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------------
// DOCTOR DASHBOARD
// ----------------------------------------------------------------------
function DoctorDashboard({ doctorId }: { doctorId: number }) {
  const { data: apptsData } = useGetAppointments({ doctorId, limit: 50 });
  const updateAppointment = useUpdateAppointment();
  const setAvailability = useSetDoctorAvailability();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [availDate, setAvailDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slotsStr, setSlotsStr] = useState("09:00, 10:00, 11:00");

  const handleUpdateStatus = (id: number, status: 'booked' | 'cancelled' | 'completed') => {
    updateAppointment.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Appointment marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
      }
    });
  };

  const handleSetAvailability = () => {
    const timeSlots = slotsStr.split(',').map(s => s.trim()).filter(Boolean);
    setAvailability.mutate({ id: doctorId, data: { date: availDate, timeSlots } }, {
      onSuccess: () => toast({ title: "Availability updated!" })
    });
  };

  return (
    <Tabs defaultValue="appointments" className="w-full">
      <TabsList className="mb-8 bg-muted/50 p-1 border border-border/50 rounded-xl">
        <TabsTrigger value="appointments" className="rounded-lg">My Appointments</TabsTrigger>
        <TabsTrigger value="schedule" className="rounded-lg">Manage Schedule</TabsTrigger>
      </TabsList>
      
      <TabsContent value="appointments" className="space-y-4">
        <h3 className="font-bold text-xl mb-4">Pending & Upcoming</h3>
        {apptsData?.appointments.filter(a => a.status === 'booked' || a.status === 'pending').map(appt => (
          <div key={appt.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{appt.patientFirstName} {appt.patientLastName}</span>
                  {appt.status === 'pending' && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md font-bold uppercase">New Request</span>}
                </div>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.timeSlot}
                </p>
                {appt.notes && <p className="text-sm mt-2 p-3 bg-muted/30 rounded-xl border border-border/50 italic">"{appt.notes}"</p>}
              </div>
              <div className="flex gap-2">
                {appt.status === 'pending' && <Button onClick={() => handleUpdateStatus(appt.id, 'booked')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">Accept</Button>}
                {appt.status === 'booked' && <Button onClick={() => handleUpdateStatus(appt.id, 'completed')} className="rounded-xl" variant="outline">Mark Complete</Button>}
                <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleUpdateStatus(appt.id, 'cancelled')}>Cancel</Button>
              </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="schedule">
        <div className="max-w-xl bg-card border border-border/60 rounded-3xl p-8 shadow-sm">
          <h3 className="font-bold text-xl mb-6">Add Available Slots</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Date</label>
              <Input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Time Slots (comma separated)</label>
              <Input value={slotsStr} onChange={e => setSlotsStr(e.target.value)} className="rounded-xl h-12" placeholder="e.g. 09:00, 09:30, 10:00" />
            </div>
            <Button onClick={handleSetAvailability} disabled={setAvailability.isPending} className="w-full h-12 rounded-xl text-base font-bold shadow-md">
              Save Availability
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------------
// SUPER ADMIN DASHBOARD
// ----------------------------------------------------------------------
function SuperAdminDashboard() {
  const { data: analytics } = useGetAdminAnalytics();
  const { data: hospitals } = useGetHospitals({ approved: false });
  const updateHospital = useUpdateHospital();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    updateHospital.mutate({ id, data: { approved: true } }, {
      onSuccess: () => {
        toast({ title: "Hospital Approved" });
        queryClient.invalidateQueries({ queryKey: getGetHospitalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminAnalyticsQueryKey() });
      }
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const pieData = analytics ? Object.entries(analytics.appointmentsByStatus).map(([name, value]) => ({ name, value })) : [];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-8 bg-muted/50 p-1 border border-border/50 rounded-xl">
        <TabsTrigger value="overview" className="rounded-lg">Platform Overview</TabsTrigger>
        <TabsTrigger value="hospitals" className="rounded-lg">Pending Hospitals {hospitals?.length ? `(${hospitals.length})` : ''}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {analytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Hospitals", val: analytics.totalHospitals, icon: MapPin },
                { label: "Total Doctors", val: analytics.totalDoctors, icon: UserPlus },
                { label: "Total Patients", val: analytics.totalPatients, icon: FileText },
                { label: "Total Appointments", val: analytics.totalAppointments, icon: Calendar },
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col">
                  <stat.icon className="w-8 h-8 text-primary/40 mb-4" />
                  <span className="text-3xl font-display font-bold text-foreground">{stat.val}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6">Appointments by Status</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="hospitals" className="space-y-4">
        {hospitals?.length === 0 && <div className="text-center py-12 text-muted-foreground">No pending hospital approvals.</div>}
        {hospitals?.map(h => (
          <div key={h.id} className="bg-card border border-amber-500/30 rounded-3xl p-6 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-bold text-xl">{h.name}</h3>
              <p className="text-muted-foreground">{h.location} • {h.email}</p>
            </div>
            <Button onClick={() => handleApprove(h.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">Approve Hospital</Button>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------------
// HOSPITAL ADMIN DASHBOARD
// ----------------------------------------------------------------------
function HospitalAdminDashboard({ hospitalId }: { hospitalId: number }) {
  const { data: apptsData, isLoading: apptsLoading } = useGetAppointments({ hospitalId, limit: 100 });
  const { data: hospitalsData } = useGetHospitals();
  const { data: doctorsData } = useGetDoctors({ hospitalId });
  const updateAppointment = useUpdateAppointment();
  const updateHospital = useUpdateHospital();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hospital = hospitalsData?.find((h: { id: number }) => h.id === hospitalId);

  const handleUpdateStatus = (id: number, status: 'booked' | 'cancelled' | 'completed') => {
    updateAppointment.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Appointment marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
      }
    });
  };

  const appointments = apptsData?.appointments ?? [];
  const upcomingAppts = appointments.filter(a => a.status === 'booked' || a.status === 'pending');
  const completedAppts = appointments.filter(a => a.status === 'completed');
  const cancelledAppts = appointments.filter(a => a.status === 'cancelled');
  const doctors = (doctorsData as any)?.doctors ?? [];

  const stats = [
    { label: "Total Doctors", value: doctors.length, icon: <UserPlus className="w-5 h-5 text-primary" /> },
    { label: "Upcoming", value: upcomingAppts.length, icon: <Calendar className="w-5 h-5 text-blue-500" /> },
    { label: "Completed", value: completedAppts.length, icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
    { label: "Cancelled", value: cancelledAppts.length, icon: <XCircle className="w-5 h-5 text-destructive" /> },
  ];

  return (
    <div className="space-y-8">
      {hospital && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">{hospital.name}</h2>
              <p className="text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin className="w-4 h-4" /> {hospital.location}</p>
              <span className={`mt-2 inline-block text-xs px-3 py-1 rounded-full font-medium ${hospital.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {hospital.approved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-sm text-muted-foreground">{s.label}</span></div>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border border-border/50 rounded-xl">
          <TabsTrigger value="appointments" className="rounded-lg">All Appointments</TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-lg">Doctors</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          {apptsLoading && <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>}
          {!apptsLoading && appointments.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
              <p className="text-muted-foreground">No appointments at your hospital yet.</p>
            </div>
          )}
          {appointments.map(appt => (
            <div key={appt.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0">
                  <span className="font-bold text-base leading-none">{format(new Date(appt.date), 'dd')}</span>
                  <span className="text-xs uppercase">{format(new Date(appt.date), 'MMM')}</span>
                </div>
                <div>
                  <h3 className="font-semibold">Dr. {appt.doctorFirstName} {appt.doctorLastName}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.timeSlot}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    appt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                    appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{appt.status}</span>
                </div>
              </div>
              {appt.status === 'booked' && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="rounded-xl text-emerald-600 border-emerald-600 hover:bg-emerald-50" onClick={() => handleUpdateStatus(appt.id, 'completed')}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => handleUpdateStatus(appt.id, 'cancelled')}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          {doctors.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
              <p className="text-muted-foreground">No doctors assigned to your hospital yet.</p>
            </div>
          )}
          {doctors.map((doc: any) => (
            <div key={doc.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex justify-between items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {doc.firstName?.[0] ?? 'D'}
                </div>
                <div>
                  <h3 className="font-semibold">Dr. {doc.firstName} {doc.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{(doc.averageRating ?? 0).toFixed(1)}</span>
                    <span className="text-muted-foreground">({doc.totalReviews ?? 0} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-primary">₹{doc.consultationFee}</p>
                <p className="text-xs text-muted-foreground">{doc.experience} yr exp.</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
