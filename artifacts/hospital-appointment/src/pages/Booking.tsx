import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, ArrowLeft, Video, Building2, CreditCard, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetDoctor, 
  useGetDoctorAvailability, 
  useCreateAppointment,
  useCreatePaymentSession,
  getGetAppointmentsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";

export default function Booking() {
  const { id } = useParams();
  const doctorId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, login } = useAuth();
  
  const { data: doctor, isLoading: doctorLoading } = useGetDoctor(doctorId);
  
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const { data: availability, isLoading: availLoading } = useGetDoctorAvailability(doctorId, { startDate, endDate });
  
  const createBooking = useCreateAppointment();
  const createPayment = useCreatePaymentSession();
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<"offline" | "online">("offline");
  const [notes, setNotes] = useState("");
  const [payingAppointmentId, setPayingAppointmentId] = useState<number | null>(null);
  
  const upcomingDays = Array.from({ length: 14 }).map((_, i) => {
    const d = addDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayAvail = availability?.find(a => a.date === dateStr);
    return {
      date: d,
      dateStr,
      isAvailable: !!dayAvail && dayAvail.timeSlots.length > 0,
      slots: dayAvail ? dayAvail.timeSlots : []
    };
  });

  const selectedDayInfo = upcomingDays.find(d => d.dateStr === selectedDate);

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast({ title: "Authentication required", description: "Please sign in to book an appointment." });
      login();
      return;
    }

    if (!selectedDate || !selectedSlot || !doctor) return;

    createBooking.mutate({
      data: {
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: notes.trim() ? notes : undefined,
        consultationType
      }
    }, {
      onSuccess: (appointment) => {
        const apptId = (appointment as { id?: number })?.id;
        if (apptId) {
          setPayingAppointmentId(apptId);
          createPayment.mutate({ data: { appointmentId: apptId } }, {
            onSuccess: (paymentRes) => {
              const url = (paymentRes as { url?: string })?.url;
              if (url && url.startsWith("http")) {
                window.open(url, "_blank");
              }
              toast({
                title: "Appointment Booked!",
                description: `Your ${consultationType === "online" ? "video" : "in-person"} appointment with Dr. ${doctor.firstName} is scheduled for ${format(new Date(selectedDate), 'MMM d')} at ${selectedSlot}.`,
              });
              queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
              setLocation("/dashboard");
            },
            onError: () => {
              toast({
                title: "Appointment Booked!",
                description: `Payment will be collected later. Your appointment with Dr. ${doctor.firstName} is confirmed for ${format(new Date(selectedDate), 'MMM d')} at ${selectedSlot}.`,
              });
              queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
              setLocation("/dashboard");
            }
          });
        } else {
          toast({
            title: "Appointment Confirmed!",
            description: `Your appointment with Dr. ${doctor.firstName} is scheduled for ${format(new Date(selectedDate), 'MMM d')} at ${selectedSlot}.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
          setLocation("/dashboard");
        }
      },
      onError: (err: Error) => {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: err.message || "The selected slot might no longer be available.",
        });
      }
    });
  };

  if (doctorLoading) return <AppLayout><div className="flex h-[60vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AppLayout>;
  if (!doctor) return <AppLayout><div className="text-center py-20">Doctor not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Button>
        
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Book Appointment</h1>
          <p className="text-muted-foreground">Select a date and time for your consultation with Dr. {doctor.firstName} {doctor.lastName}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Video className="w-5 h-5 text-primary" /> 1. Consultation Type
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConsultationType("offline")}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                    ${consultationType === "offline"
                      ? "border-primary bg-primary/10 text-primary shadow-md"
                      : "border-border/50 bg-background hover:border-primary/40 text-foreground"}`}
                >
                  <Building2 className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-bold">In-Person Visit</p>
                    <p className="text-xs text-muted-foreground mt-1">Visit the hospital</p>
                  </div>
                </button>
                <button
                  onClick={() => setConsultationType("online")}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                    ${consultationType === "online"
                      ? "border-primary bg-primary/10 text-primary shadow-md"
                      : "border-border/50 bg-background hover:border-primary/40 text-foreground"}`}
                >
                  <Video className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-bold">Video Consultation</p>
                    <p className="text-xs text-muted-foreground mt-1">Online video call</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <CalendarIcon className="w-5 h-5 text-primary" /> 2. Select Date
              </h2>
              
              {availLoading ? (
                <div className="flex gap-4 overflow-hidden"><div className="w-20 h-24 bg-muted animate-pulse rounded-2xl" /><div className="w-20 h-24 bg-muted animate-pulse rounded-2xl" /></div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x scrollbar-hide">
                  {upcomingDays.map((day, i) => (
                    <button
                      key={i}
                      disabled={!day.isAvailable}
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedSlot(null);
                      }}
                      className={`
                        snap-start shrink-0 w-[4.5rem] h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all
                        ${selectedDate === day.dateStr 
                          ? 'border-primary bg-primary/10 text-primary shadow-md' 
                          : day.isAvailable 
                            ? 'border-border/50 bg-background hover:border-primary/40 hover:bg-primary/5 text-foreground' 
                            : 'border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed'}
                      `}
                    >
                      <span className="text-xs font-bold uppercase mb-1">{format(day.date, 'EEE')}</span>
                      <span className="text-2xl font-display font-bold">{format(day.date, 'd')}</span>
                      <span className="text-xs">{format(day.date, 'MMM')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`bg-card border border-border/60 rounded-3xl p-6 shadow-sm transition-opacity duration-300 ${selectedDate ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-primary" /> 3. Select Time
              </h2>
              
              {!selectedDate ? (
                <p className="text-muted-foreground text-center py-8">Please select a date first</p>
              ) : selectedDayInfo?.slots.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No slots available on this date</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {selectedDayInfo?.slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        py-3 px-2 rounded-xl font-bold text-sm transition-all border-2
                        ${selectedSlot === slot 
                          ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105' 
                          : 'bg-background border-border/50 text-foreground hover:border-primary/40 hover:bg-primary/5'}
                      `}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`bg-card border border-border/60 rounded-3xl p-6 shadow-sm transition-opacity duration-300 ${selectedSlot ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-xl font-bold mb-4">4. Additional Notes (Optional)</h2>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit..."
                className="rounded-xl border-border/60 focus-visible:ring-primary/20 min-h-[100px]"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border/60 rounded-3xl p-6 shadow-lg shadow-black/5">
              <h3 className="font-bold text-lg mb-6 border-b border-border/50 pb-4">Booking Summary</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={doctor.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${doctor.firstName}`} 
                  alt="" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/10" 
                />
                <div>
                  <p className="font-bold text-foreground">Dr. {doctor.firstName} {doctor.lastName}</p>
                  <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {consultationType === "online" ? <><Video className="w-3.5 h-3.5 text-blue-500" /> Video Call</> : <><Building2 className="w-3.5 h-3.5 text-emerald-500" /> In-Person</>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-bold text-foreground">{selectedDate ? format(new Date(selectedDate), 'MMM d, yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-bold text-foreground">{selectedSlot || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital</span>
                  <span className="font-bold text-foreground text-right max-w-[150px] truncate">{doctor.hospitalName}</span>
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-muted-foreground">Consultation Fee</span>
                  <span className="text-2xl font-display font-bold text-primary">${doctor.consultationFee}</span>
                </div>
              </div>

              <Button 
                onClick={handleBooking}
                disabled={!selectedDate || !selectedSlot || createBooking.isPending || createPayment.isPending}
                size="lg" 
                className="w-full rounded-xl shadow-lg font-bold"
              >
                {(createBooking.isPending || createPayment.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" /> Book & Pay</>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Secure payment processing. You'll be redirected to complete payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
