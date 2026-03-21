import { useState } from "react";
import { useLocation } from "wouter";
import { Stethoscope, Heart, Brain, Eye, Bone, Search, ChevronRight, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { useGetDepartments, useGetDoctors } from "@workspace/api-client-react";

function getIconForDept(name: string) {
  const n = name.toLowerCase();
  if (n.includes('cardio')) return <Heart className="w-8 h-8" />;
  if (n.includes('neuro')) return <Brain className="w-8 h-8" />;
  if (n.includes('ophthal')) return <Eye className="w-8 h-8" />;
  if (n.includes('ortho')) return <Bone className="w-8 h-8" />;
  return <Stethoscope className="w-8 h-8" />;
}

export default function Departments() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: departments, isLoading } = useGetDepartments();
  const { data: doctorsData } = useGetDoctors({ limit: 200 });

  const allDoctors = doctorsData?.doctors ?? [];

  const getDoctorCount = (deptId: number) =>
    allDoctors.filter(d => d.departmentId === deptId).length;

  const filtered = departments?.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.description ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <AppLayout>
      <div className="bg-primary/5 py-14 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-display font-bold text-foreground mb-3">Departments</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Browse our specialties and find the right doctor for your needs.
          </p>
          <div className="mt-6 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search departments..."
              className="pl-11 h-12 rounded-2xl text-base shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Stethoscope className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No departments found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(dept => {
            const count = getDoctorCount(dept.id);
            return (
              <button
                key={dept.id}
                onClick={() => setLocation(`/doctors?departmentId=${dept.id}`)}
                className="group bg-card border border-border/60 rounded-3xl p-7 text-left hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {getIconForDept(dept.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-1">{dept.name}</h2>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{dept.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {count} doctor{count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    Browse <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
