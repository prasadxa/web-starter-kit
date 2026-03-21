import { useState } from "react";
import { format } from "date-fns";
import { FileText, Plus, Download, Loader2, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useGetMedicalRecords, useCreateMedicalRecord } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";

export default function MedicalRecords() {
  const { isAuthenticated, login } = useAuth();
  const { data, isLoading, refetch } = useGetMedicalRecords();
  const createRecord = useCreateMedicalRecord();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", fileUrl: "" });

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-32">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Medical Records</h2>
          <p className="text-muted-foreground mb-6">Sign in to view your medical records</p>
          <Button onClick={login}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createRecord.mutate({
      data: {
        patientId: "self",
        title: form.title,
        description: form.description || undefined,
        fileUrl: form.fileUrl || undefined,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: "", description: "", fileUrl: "" });
        refetch();
      }
    });
  };

  const records = data ?? [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => window.history.back()} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-display font-bold">Medical Records</h1>
            <p className="text-muted-foreground mt-1">Your health documents and records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Medical Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Title</label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Blood Test Report" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Notes about this record..." className="rounded-xl resize-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">File URL (optional)</label>
                  <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." className="rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={createRecord.isPending || !form.title.trim()} className="rounded-xl">
                  {createRecord.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No medical records yet</p>
            <Button onClick={() => setOpen(true)} variant="outline" className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Your First Record
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record: any) => (
              <Card key={record.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{record.title}</h3>
                        {record.description && (
                          <p className="text-sm text-muted-foreground mt-2">{record.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(record.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    {record.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
