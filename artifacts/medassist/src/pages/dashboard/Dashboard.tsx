import { useState } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Stethoscope, Pill, ArrowRight, Clock, FileDown, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/patient-history");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medassist-history-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "PDF downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate the PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Overview
          </h2>
          <p className="text-muted-foreground text-sm mt-1">System activity and consultation metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary w-full sm:w-auto"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isExporting ? "Generating PDF…" : "Export History"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Radiology Analyses</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {summary?.totalRadiologyAnalyses || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Images processed</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Symptom Consultations</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {summary?.totalSymptomConsultations || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">AI diagnoses generated</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dosage Calculations</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Pill className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {summary?.totalDosageCalculations || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Calculations performed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest interactions across modules</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(summary?.recentActivity) && summary.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {summary.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 p-2.5">
                      {activity.type === "radiology" && <Activity className="h-5 w-5 text-primary" />}
                      {activity.type === "symptom" && <Stethoscope className="h-5 w-5 text-primary" />}
                      {activity.type === "dosage" && <Pill className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No recent activity found.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Link href="/radiology" className="block">
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Activity className="h-5 w-5 text-primary" />
                  Radiology Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload X-rays, MRIs, or CT scans for instant AI-assisted preliminary findings and recommendations.
                </p>
                <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  New Analysis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/symptoms" className="block">
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Symptom Checker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Input patient symptoms and history to receive differential diagnoses, recommended tests, and treatment plans.
                </p>
                <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Start Consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dosage" className="block">
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Pill className="h-5 w-5 text-primary" />
                  Dose Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Calculate precise medication dosages based on patient parameters, conditions, and selected drugs.
                </p>
                <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Calculate Dose <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
