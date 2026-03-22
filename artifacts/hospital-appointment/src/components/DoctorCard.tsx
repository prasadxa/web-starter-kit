import { Star, MapPin, Award, Clock, ChevronRight, MessageSquare, IndianRupee, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Doctor } from "@workspace/api-client-react";
import { format } from "date-fns";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const isTopRated = doctor.averageRating >= 4.5 && doctor.totalReviews >= 10;
  const isMostBooked = doctor.totalReviews >= 25;

  return (
    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full group">
      <div className="p-6 flex gap-5">
        <div className="relative shrink-0">
          <img 
            src={doctor.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${doctor.firstName} ${doctor.lastName}`} 
            alt={`Dr. ${doctor.firstName}`}
            className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/5 shadow-sm group-hover:scale-105 transition-transform duration-500"
          />
          {isTopRated && (
            <div className="absolute -bottom-3 -right-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full p-1.5 shadow-lg shadow-amber-500/30 text-white" title="Top Rated">
              <Award className="w-4 h-4" />
            </div>
          )}
          {!isTopRated && isMostBooked && (
            <div className="absolute -bottom-3 -right-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full p-1.5 shadow-lg shadow-blue-500/30 text-white" title="Most Booked">
              <TrendingUp className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-display font-bold text-xl text-foreground truncate pr-2 group-hover:text-primary transition-colors">
              Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{doctor.averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-primary font-semibold text-sm mb-2 truncate">
            {doctor.specialization || doctor.departmentName}
          </p>
          
          <div className="space-y-1.5">
            <div className="flex items-center text-sm text-muted-foreground">
              <Award className="w-4 h-4 mr-2 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{doctor.experience} Years Experience</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{doctor.hospitalName}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center text-muted-foreground gap-1">
                <MessageSquare className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                <span>{doctor.totalReviews} review{doctor.totalReviews !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center font-semibold text-emerald-700 dark:text-emerald-400 gap-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>{doctor.consultationFee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto px-6 py-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Available</p>
          <div className="flex items-center text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 mr-1.5 text-secondary" />
            {doctor.nextAvailableSlot ? format(new Date(doctor.nextAvailableSlot), 'MMM d, h:mm a') : 'Check Schedule'}
          </div>
        </div>
        
        <Link href={`/doctors/${doctor.id}`}>
          <Button className="rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 group/btn transition-all">
            Book <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
