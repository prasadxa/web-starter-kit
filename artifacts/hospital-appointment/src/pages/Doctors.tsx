import { useState, useEffect } from "react";
import { Search, Filter, Stethoscope } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DoctorCard } from "@/components/DoctorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useGetDoctors, useGetDepartments } from "@workspace/api-client-react";

export default function Doctors() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  const initialSearch = searchParams?.get('search') || "";
  const initialDept = searchParams?.get('departmentId') || "all";

  const [search, setSearch] = useState(initialSearch);
  const [departmentId, setDepartmentId] = useState<string>(initialDept);
  const [sort, setSort] = useState<"score" | "rating" | "reviews" | "availability">("score");

  useEffect(() => {
    if (searchParams) {
      setSearch(searchParams.get('search') || "");
      setDepartmentId(searchParams.get('departmentId') || "all");
    }
  }, [searchParams]);

  const { data: departments } = useGetDepartments();
  const { data: doctorsData, isLoading } = useGetDoctors({
    search: search.length > 0 ? search : undefined,
    departmentId: departmentId !== "all" ? parseInt(departmentId) : undefined,
    sort,
    limit: 20
  });

  return (
    <AppLayout>
      <div className="bg-primary/5 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Find Your Doctor</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse our extensive network of trusted medical professionals and book your consultation instantly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-lg mb-6 pb-4 border-b border-border/50">
              <Filter className="w-5 h-5 text-primary" />
              Filters
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Doctor name..."
                    className="pl-9 bg-background border-border/60 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Specialty</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-full rounded-xl bg-background border-border/60">
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Sort By</Label>
                <Select value={sort} onValueChange={(v) => setSort(v as "score" | "rating" | "reviews" | "availability")}>
                  <SelectTrigger className="w-full rounded-xl bg-background border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Recommended</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviewed</SelectItem>
                    <SelectItem value="availability">Earliest Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {isLoading ? "Searching..." : `${doctorsData?.total || 0} Doctors Available`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 bg-muted/30 border border-border/50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : doctorsData && doctorsData.doctors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {doctorsData.doctors.map(doc => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          ) : (
            <div className="bg-muted/20 border border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No doctors found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any doctors matching your current filters. Try adjusting your search criteria or selecting a different specialty.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-xl"
                onClick={() => { setSearch(""); setDepartmentId("all"); setSort("score"); }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
