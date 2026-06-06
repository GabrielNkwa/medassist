import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSymptomConsultations, 
  useCreateSymptomConsultation, 
  useDeleteSymptomConsultation,
  getListSymptomConsultationsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  patientAge: z.coerce.number().min(0).max(120),
  patientSex: z.string().min(1, "Required"),
  symptoms: z.string().min(5, "Please describe symptoms in detail"),
  duration: z.string().optional(),
  medicalHistory: z.string().optional(),
  vitals: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SymptomChecker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: consultations, isLoading } = useListSymptomConsultations();
  const createConsultation = useCreateSymptomConsultation();
  const deleteConsultation = useDeleteSymptomConsultation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientAge: undefined,
      patientSex: "",
      symptoms: "",
      duration: "",
      medicalHistory: "",
      vitals: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    createConsultation.mutate({
      data: {
        patientAge: values.patientAge,
        patientSex: values.patientSex,
        symptoms: values.symptoms,
        duration: values.duration || null,
        medicalHistory: values.medicalHistory || null,
        vitals: values.vitals || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Consultation saved" });
        queryClient.invalidateQueries({ queryKey: getListSymptomConsultationsQueryKey() });
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", variant: "destructive" });
      }
    });
  };

  const getUrgencyColor = (urgency: string) => {
    const u = urgency.toLowerCase();
    if (u.includes('high') || u.includes('emergency')) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (u.includes('medium') || u.includes('moderate')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-green-500/10 text-green-600 border-green-500/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Symptom Checker
        </h2>
        <p className="text-muted-foreground text-sm mt-1">AI-assisted diagnosis and clinical recommendations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Patient Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="patientSex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                             
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chief Complaint & Symptoms</FormLabel>
                        <FormControl>
                          <Textarea className="h-24" placeholder="Describe symptoms in detail..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 3 days, 2 weeks" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vitals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vitals (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="BP, HR, Temp..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History (Optional)</FormLabel>
                        <FormControl>
                          <Textarea className="h-16" placeholder="Relevant past conditions..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createConsultation.isPending}>
                    {createConsultation.isPending ? "Generating..." : "Generate Assessment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7 space-y-4">
          <h3 className="text-lg font-medium tracking-tight">Recent Consultations</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
            </div>
          ) : Array.isArray(consultations) && consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map(consult => (
                <Card key={consult.id} className="border-primary/10 hover:border-primary/30 transition-all">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-primary">{consult.diagnosis}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {consult.patientAge}yo {consult.patientSex} • {format(new Date(consult.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className={getUrgencyColor(consult.urgency)}>
                      {consult.urgency}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <span className="font-medium">Symptoms:</span> {consult.symptoms}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-muted/50 rounded-md">
                        <span className="font-semibold block mb-1">Differentials</span>
                        <p className="text-muted-foreground">{consult.differentials}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <span className="font-semibold block mb-1">Plan / Treatment</span>
                        <p className="text-muted-foreground">{consult.treatment}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-2">
                      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tests:</span> {consult.recommendedTests}</p>
                      <Button variant="ghost" size="sm" onClick={() => deleteConsultation.mutate({ id: consult.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSymptomConsultationsQueryKey() }) })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-primary/30 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <Stethoscope className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No consultations</p>
                <p className="text-xs text-muted-foreground mt-1">Fill out the intake form to generate a new AI assessment.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
