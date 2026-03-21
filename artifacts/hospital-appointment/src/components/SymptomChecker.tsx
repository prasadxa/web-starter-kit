import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, AlertTriangle, Stethoscope } from "lucide-react";
import { useCheckSymptoms } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const mutation = useCheckSymptoms();
  const [, navigate] = useLocation();

  const handleCheck = () => {
    if (!symptoms.trim()) return;
    mutation.mutate({ data: { symptoms } });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Symptom Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe your symptoms in detail (e.g., 'I have a persistent headache for 3 days with mild fever and fatigue')..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleCheck}
          disabled={mutation.isPending || !symptoms.trim()}
          className="w-full"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Symptoms...
            </>
          ) : (
            <>
              <Stethoscope className="mr-2 h-4 w-4" />
              Check Symptoms
            </>
          )}
        </Button>

        {mutation.data && (
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                This is not a medical diagnosis. Please consult a doctor.
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Possible Conditions</h4>
              <div className="space-y-2">
                {mutation.data.conditions?.map((c: any, i: number) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                    </div>
                    <Badge variant={c.probability === "High" ? "destructive" : c.probability === "Medium" ? "default" : "secondary"}>
                      {c.probability}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-1">Recommended Department</h4>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate(`/doctors?search=${encodeURIComponent(mutation.data.recommendedDepartment)}`)}
              >
                {mutation.data.recommendedDepartment} →
              </Button>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Advice</h4>
              <p className="text-sm text-muted-foreground">{mutation.data.advice}</p>
            </div>
          </div>
        )}

        {mutation.error && (
          <p className="text-sm text-destructive">Failed to analyze symptoms. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
