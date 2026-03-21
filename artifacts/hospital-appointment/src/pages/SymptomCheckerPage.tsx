import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SymptomChecker from "@/components/SymptomChecker";

export default function SymptomCheckerPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-display font-bold mb-2">AI Symptom Checker</h1>
        <p className="text-muted-foreground mb-8">Describe your symptoms and get AI-powered guidance on which specialist to see</p>
        <SymptomChecker />
      </div>
    </AppLayout>
  );
}
