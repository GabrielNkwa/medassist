import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDosageCalculations, 
  useCreateDosageCalculation, 
  useDeleteDosageCalculation,
  useListDrugs,
  getListDosageCalculationsQueryKey,
  DosageCalculationInputPatientType
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Trash2, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  drugName: z.string().min(1, "Select a drug"),
  patientType: z.nativeEnum(DosageCalculationInputPatientType),
  patientWeight: z.coerce.number().optional().or(z.literal("")),
  patientAge: z.coerce.number().optional().or(z.literal("")),
  indication: z.string().optional(),
  specialConditions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DosageCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: calculations, isLoading: isLoadingCalcs } = useListDosageCalculations();
  const { data: drugs, isLoading: isLoadingDrugs } = useListDrugs();
  
  const createCalc = useCreateDosageCalculation();
  const deleteCalc = useDeleteDosageCalculation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drugName: "",
      patientType: DosageCalculationInputPatientType.adult,
      patientWeight: "",
      patientAge: "",
      indication: "",
      specialConditions: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    createCalc.mutate({
      data: {
        drugName: values.drugName,
        patientType: values.patientType,
        patientWeight: values.patientWeight === "" ? null : Number(values.patientWeight),
        patientAge: values.patientAge === "" ? null : Number(values.patientAge),
        indication: values.indication || null,
        specialConditions: values.specialConditions || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Calculation successful" });
        queryClient.invalidateQueries({ queryKey: getListDosageCalculationsQueryKey() });
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", variant: "destructive" });
      }
    });
  };

  const filteredDrugs = useMemo(() => {
    if (!drugs) return [];
    if (!search) return drugs;
    const lower = search.toLowerCase();
    return drugs.filter(d => d.name.toLowerCase().includes(lower) || d.category.toLowerCase().includes(lower));
  }, [drugs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dose Calculator</h2>
        <p className="text-muted-foreground text-sm mt-1">Precise medication dosing based on patient parameters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculate</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="drugName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drug</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a medication" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="flex items-center px-2 pb-2 sticky top-0 bg-popover z-10">
                              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input 
                                placeholder="Search..." 
                                className="h-8 border-none focus-visible:ring-0 shadow-none px-0" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                              />
                            </div>
                            {isLoadingDrugs ? (
                              <div className="p-2 text-sm text-muted-foreground">Loading drugs...</div>
                            ) : filteredDrugs.map(d => (
                              <SelectItem key={d.id} value={d.name}>
                                {d.name} <span className="text-muted-foreground ml-1 text-xs">({d.category})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(DosageCalculationInputPatientType).map(t => (
                              <SelectItem key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  </div>

                  <FormField
                    control={form.control}
                    name="indication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indication (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Community acquired pneumonia" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createCalc.isPending}>
                    {createCalc.isPending ? "Calculating..." : "Calculate Dose"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8 space-y-4">
          <h3 className="text-lg font-medium tracking-tight">Recent Calculations</h3>
          
          {isLoadingCalcs ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
            </div>
          ) : calculations && calculations.length > 0 ? (
            <div className="space-y-4">
              {calculations.map(calc => (
                <Card key={calc.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="bg-muted/30 pb-3 py-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base font-semibold">{calc.drugName}</CardTitle>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background border text-muted-foreground uppercase tracking-wider">
                        {calc.patientType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{format(new Date(calc.createdAt), "MMM d, h:mm a")}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCalc.mutate({ id: calc.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDosageCalculationsQueryKey() }) })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Recommended Dose</span>
                        <div className="text-lg font-bold text-foreground">{calc.recommendedDose}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground block text-xs">Route</span>
                          <span className="font-medium">{calc.route}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Frequency</span>
                          <span className="font-medium">{calc.frequency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {calc.warnings && (
                        <div className="bg-destructive/10 text-destructive-foreground p-2 rounded flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs leading-tight text-destructive font-medium">{calc.warnings}</p>
                        </div>
                      )}
                      {calc.adjustments && (
                        <div className="bg-primary/5 border border-primary/10 p-2 rounded">
                          <span className="block text-xs font-semibold text-primary mb-0.5">Adjustments</span>
                          <p className="text-xs text-muted-foreground">{calc.adjustments}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <Pill className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No calculations</p>
                <p className="text-xs text-muted-foreground mt-1">Select a drug to calculate dosing.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
