import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Stethoscope, Heart, Brain, Eye, Bone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { DoctorCard } from "@/components/DoctorCard";
import HospitalMap from "@/components/HospitalMap";
import { useGetDoctors, useGetDepartments, useGetHospitals } from "@workspace/api-client-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: doctorsData, isLoading: docsLoading } = useGetDoctors({ sort: 'score', limit: 4 });
  const { data: departments, isLoading: deptsLoading } = useGetDepartments();
  const { data: hospitals } = useGetHospitals();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/doctors?search=${encodeURIComponent(search)}`);
    } else {
      setLocation(`/doctors`);
    }
  };

  const getIconForDept = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cardio')) return <Heart className="w-8 h-8" />;
    if (n.includes('neuro')) return <Brain className="w-8 h-8" />;
    if (n.includes('ophthal')) return <Eye className="w-8 h-8" />;
    if (n.includes('ortho')) return <Bone className="w-8 h-8" />;
    return <Stethoscope className="w-8 h-8" />;
  };

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative rounded-[2rem] overflow-hidden bg-primary/5 min-h-[500px] flex flex-col justify-center shadow-sm border border-primary/10">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-medical.png`} 
            alt="Hero Medical" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent mix-blend-multiply" />
          
          <div className="relative z-10 p-8 md:p-16 max-w-3xl">
            <Badge className="bg-primary/20 text-blue-100 hover:bg-primary/30 border-primary/30 backdrop-blur-md mb-6 px-4 py-1.5 text-sm">
              Healthcare you can trust
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight text-white mb-6">
              Find and book the <span className="text-blue-300">best doctors</span> near you.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed">
              Access world-class healthcare from top-rated hospitals. Instantly book appointments that fit your schedule.
            </p>
            
            <form onSubmit={handleSearch} className="flex max-w-xl bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl">
              <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden px-4">
                <Search className="w-5 h-5 text-muted-foreground mr-2" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctors, specialties, or symptoms..." 
                  className="border-0 focus-visible:ring-0 shadow-none text-base h-14 placeholder:text-muted-foreground/60 rounded-xl"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 ml-2 rounded-xl px-8 font-bold text-base shadow-lg hover:shadow-xl transition-all">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Featured Departments */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Browse by Specialty</h2>
              <p className="text-muted-foreground">Find experienced specialists across various departments.</p>
            </div>
            <Link href="/doctors">
              <Button variant="ghost" className="hidden sm:flex group font-semibold text-primary hover:text-primary/80 hover:bg-primary/5">
                See All <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {deptsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {departments?.slice(0, 8).map(dept => (
                <Link key={dept.id} href={`/doctors?departmentId=${dept.id}`}>
                  <div className="group bg-card border border-border/50 hover:border-primary/40 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {getIconForDept(dept.name)}
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{dept.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Doctors */}
      <section className="py-20 bg-muted/20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Top Rated Doctors</h2>
              <p className="text-muted-foreground">Highly recommended by patients like you.</p>
            </div>
            <Link href="/doctors">
              <Button variant="ghost" className="hidden sm:flex group font-semibold text-primary hover:text-primary/80 hover:bg-primary/5">
                View More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {docsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-background border border-border/50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctorsData?.doctors.map(doc => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
              {doctorsData?.doctors.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-background rounded-3xl border border-dashed">
                  No doctors found.
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/doctors">
              <Button variant="outline" className="w-full rounded-xl">View All Doctors</Button>
            </Link>
          </div>
        </div>
      </section>

      {hospitals && hospitals.length > 0 && (
        <section className="py-20 bg-background border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4">
            <HospitalMap hospitals={hospitals} />
          </div>
        </section>
      )}
    </AppLayout>
  );
}
