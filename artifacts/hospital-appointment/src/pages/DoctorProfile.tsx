import { useParams, Link } from "wouter";
import { Star, MapPin, Award, BookOpen, CalendarCheck, UserCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetDoctor } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function DoctorProfile() {
  const { id } = useParams();
  const doctorId = parseInt(id || "0", 10);
  const { data: doctor, isLoading } = useGetDoctor(doctorId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-8">
          <div className="h-64 bg-muted/40 rounded-3xl" />
          <div className="h-96 bg-muted/40 rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (!doctor) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Doctor Not Found</h2>
          <Link href="/doctors">
            <Button>Back to Doctors</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="relative shrink-0">
              <img 
                src={doctor.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${doctor.firstName} ${doctor.lastName}`} 
                alt={`Dr. ${doctor.firstName}`}
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-white shadow-xl"
              />
              {doctor.isTopRated && (
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl px-3 py-1.5 shadow-lg shadow-amber-500/30 text-white flex items-center gap-1.5 text-sm font-bold border-2 border-white">
                  <Award className="w-4 h-4" /> Top Rated
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{doctor.departmentName}</Badge>
                <Badge variant="outline" className="bg-white">{doctor.experience} Years Exp.</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {doctor.specialization || "General Medicine"}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground">
                <div className="flex items-center text-amber-600 dark:text-amber-500">
                  <Star className="w-5 h-5 mr-1 fill-current" />
                  <span className="text-base">{doctor.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">({doctor.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-1.5 text-primary/70" />
                  {doctor.hospitalName}
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto bg-card border border-border/60 p-6 rounded-3xl shadow-sm text-center">
              <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Consultation Fee</p>
              <p className="text-3xl font-display font-bold text-primary mb-4">${doctor.consultationFee}</p>
              <Link href={`/doctors/${doctor.id}/book`}>
                <Button size="lg" className="w-full rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1 space-y-10">
          <section>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-primary" /> About Doctor
            </h3>
            <div className="bg-card border border-border/50 rounded-3xl p-6 text-muted-foreground leading-relaxed shadow-sm">
              {doctor.bio ? (
                <p>{doctor.bio}</p>
              ) : (
                <p>Dr. {doctor.firstName} {doctor.lastName} is a highly skilled specialist at {doctor.hospitalName} with {doctor.experience} years of experience in providing excellent patient care.</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Qualifications
            </h3>
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <p className="font-medium text-foreground">{doctor.qualification || "MBBS, MD"}</p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" /> Patient Reviews
            </h3>
            <div className="space-y-4">
              {doctor.recentReviews && doctor.recentReviews.length > 0 ? (
                doctor.recentReviews.map(review => (
                  <div key={review.id} className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {review.patientFirstName?.[0]}{review.patientLastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{review.patientFirstName} {review.patientLastName}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), 'MMMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                        <span className="font-bold text-sm text-amber-700 dark:text-amber-400">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground italic">"{review.comment}"</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No reviews yet. Book an appointment to leave a review!</p>
              )}
            </div>
          </section>
        </div>

        <div className="w-full md:w-80 shrink-0">
          <div className="sticky top-24 bg-card border border-border/60 rounded-3xl p-6 shadow-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-secondary" /> Next Available
            </h3>
            <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20 mb-6">
              {doctor.nextAvailableSlot ? (
                <div className="text-center">
                  <p className="text-secondary font-bold text-lg mb-1">
                    {format(new Date(doctor.nextAvailableSlot), 'MMM d, yyyy')}
                  </p>
                  <p className="text-foreground font-medium">
                    {format(new Date(doctor.nextAvailableSlot), 'h:mm a')}
                  </p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground font-medium">No upcoming slots</p>
              )}
            </div>
            
            <Link href={`/doctors/${doctor.id}/book`}>
              <Button className="w-full rounded-xl shadow-lg font-bold" size="lg">
                View All Slots
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
