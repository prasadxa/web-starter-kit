import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { HeartPulse, LayoutDashboard, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <HeartPulse className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Medi<span className="text-primary">Book</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className={`text-sm font-semibold transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Home
            </Link>
            <Link 
              href="/departments" 
              className={`text-sm font-semibold transition-colors hover:text-primary ${location === '/departments' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Departments
            </Link>
            <Link 
              href="/doctors" 
              className={`text-sm font-semibold transition-colors hover:text-primary ${location === '/doctors' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Find Doctors
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 pl-2 pr-4 rounded-full border-border hover:border-primary/50 transition-colors bg-card hover:bg-card">
                    <img 
                      src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName}`} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full bg-muted object-cover" 
                    />
                    <span className="hidden sm:inline font-semibold text-sm">
                      {user?.firstName || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-lg font-medium">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="w-4 h-4 mr-3 text-primary" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="p-3 cursor-pointer rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={login} 
                className="font-bold rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full">
        {children}
      </main>
      
      <footer className="border-t border-border/50 bg-muted/30 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <HeartPulse className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Medi<span className="text-primary">Book</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Your trusted partner in healthcare. Book appointments with top doctors instantly and manage your health journey with ease.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/doctors" className="text-muted-foreground hover:text-primary transition-colors">Find a Doctor</Link></li>
              <li><button onClick={isAuthenticated ? () => window.location.href='/dashboard' : login} className="text-muted-foreground hover:text-primary transition-colors">My Appointments</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
