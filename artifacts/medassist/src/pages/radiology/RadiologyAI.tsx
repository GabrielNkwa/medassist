import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListRadiologyAnalyses, 
  useCreateRadiologyAnalysis, 
  useDeleteRadiologyAnalysis,
  getListRadiologyAnalysesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, UploadCloud, FileImage, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  patientAge: z.coerce.number().min(0).max(120).optional().or(z.literal("")),
  patientSex: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RadiologyAI() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: analyses, isLoading } = useListRadiologyAnalyses();
  
  const createAnalysis = useCreateRadiologyAnalysis();
  const deleteAnalysis = useDeleteRadiologyAnalysis();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientAge: "",
      patientSex: "",
      clinicalNotes: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setSelectedFile(null);
    setBase64Image(null);

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFileError("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File too large. Maximum size is 5MB.");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract the base64 part, discarding the data:image/jpeg;base64, prefix
      const base64Data = result.split(',')[1];
      setBase64Image(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile || !base64Image) {
      setFileError("An image is required for analysis.");
      return;
    }

    createAnalysis.mutate({
      data: {
        imageBase64: base64Image,
        imageType: selectedFile.type,
        patientAge: values.patientAge === "" ? null : Number(values.patientAge),
        patientSex: values.patientSex || null,
        clinicalNotes: values.clinicalNotes || null,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Analysis complete",
          description: "The AI has finished analyzing the image.",
        });
        queryClient.invalidateQueries({ queryKey: getListRadiologyAnalysesQueryKey() });
        form.reset();
        setSelectedFile(null);
        setBase64Image(null);
      },
      onError: (error) => {
        toast({
          title: "Analysis failed",
          description: "There was an error analyzing the image.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Radiology AI</h2>
          <p className="text-muted-foreground text-sm mt-1">Upload imaging for AI-assisted preliminary findings</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Medical Image</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept={ACCEPTED_IMAGE_TYPES.join(',')} 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {selectedFile ? (
                        <>
                          <FileImage className="h-8 w-8 text-primary mb-2" />
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Click or drag image to upload</p>
                          <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP up to 5MB</p>
                        </>
                      )}
                    </div>
                    {fileError && <p className="text-sm text-destructive font-medium mt-1">{fileError}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 45" {...field} value={field.value ?? ""} />
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
                          <FormLabel>Patient Sex</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clinicalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Reason for exam, patient history..." 
                            className="resize-none h-24" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createAnalysis.isPending || !selectedFile}
                  >
                    {createAnalysis.isPending ? (
                      "Analyzing Image..."
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          <h3 className="text-lg font-medium tracking-tight">Recent Analyses</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : analyses && analyses.length > 0 ? (
            <div className="space-y-4">
              {analyses.map(analysis => (
                <Card key={analysis.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Analysis #{analysis.id}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.createdAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Impression</h4>
                        <p className="text-sm font-medium">{analysis.impression}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Findings</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{analysis.findings}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recommendations</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{analysis.recommendations}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md inline-block">
                          Confidence: {analysis.confidence}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            deleteAnalysis.mutate({ id: analysis.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRadiologyAnalysesQueryKey() })
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <FileImage className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No analyses yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Upload an image using the form to generate your first AI radiology analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
