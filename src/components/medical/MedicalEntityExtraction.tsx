import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Pill,
  AlertTriangle,
  Zap,
  Shield,
  Plus,
  RefreshCw,
  Loader2,
  Activity,
  TestTube,
  Eye,
  List,
  Grid3X3,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface MedicalEntityExtractionProps {
  consultationId: Id<"consultations">;
}

interface ExtractedEntity {
  conditions: Array<{
    name: string;
    severity: "mild" | "moderate" | "severe";
    status: "active" | "resolved" | "chronic";
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
  }>;
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: "mild" | "moderate" | "severe";
  }>;
  symptoms: Array<{
    name: string;
    severity: "mild" | "moderate" | "severe";
    duration: string;
    onset: string;
  }>;
  comorbidities: Array<{
    name: string;
    status: "active" | "resolved" | "chronic";
  }>;
  vitals: Record<string, string>;
  labResults: Record<string, string>;
}

const MedicalEntityExtraction = ({
  consultationId,
}: MedicalEntityExtractionProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "structured">("structured");
  const [activeCategory, setActiveCategory] = useState<string>("conditions");
  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false);

  // Fetch consultation data
  const consultation = useQuery(api.consultations.get, {
    id: consultationId,
  });

  // Action to extract entities using Gemini
  const extractEntitiesAction = useAction(
    api.medicalEntityExtraction.extractMedicalEntitiesWithGemini
  );

  // Get extracted entities from consultation data
  const extractedEntities = consultation?.geminiExtractedData || null;

  // Extract entities using Gemini
  const handleExtractEntities = async () => {
    if (!consultation?.transcription) {
      toast({
        title: "No Transcription Available",
        description:
          "Please complete the audio recording and transcription first.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      await extractEntitiesAction({
        consultationId,
      });
      toast({
        title: "Medical Entities Extracted",
        description:
          "AI has successfully identified medical information from the transcription.",
      });
    } catch (error) {
      console.error("Error extracting entities:", error);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract medical entities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "conditions":
        return <Heart className="h-5 w-5 text-red-600" />;
      case "medications":
        return <Pill className="h-5 w-5 text-primary" />;
      case "allergies":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "symptoms":
        return <Zap className="h-5 w-5 text-accent-foreground" />;
      case "comorbidities":
        return <Shield className="h-5 w-5 text-green-600" />;
      case "vitals":
        return <Activity className="h-5 w-5 text-pink-600" />;
      case "labResults":
        return <TestTube className="h-5 w-5 text-primary" />;
      default:
        return <Eye className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "conditions":
        return "text-red-700 border-red-300 bg-red-50";
      case "medications":
        return "text-primary border-primary/25 bg-primary/5";
      case "allergies":
        return "text-orange-700 border-orange-300 bg-orange-50";
      case "symptoms":
        return "text-accent-foreground border-marker bg-accent";
      case "comorbidities":
        return "text-green-700 border-green-300 bg-green-50";
      case "vitals":
        return "text-pink-700 border-pink-300 bg-pink-50";
      case "labResults":
        return "text-primary border-primary/25 bg-primary/5";
      default:
        return "text-muted-foreground border-border bg-muted/50";
    }
  };

  const renderListView = () => {
    if (!extractedEntities) return null;

    const categories = [
      {
        key: "conditions",
        label: "Conditions",
        data: extractedEntities.conditions,
      },
      {
        key: "medications",
        label: "Medications",
        data: extractedEntities.medications,
      },
      {
        key: "allergies",
        label: "Allergies",
        data: extractedEntities.allergies,
      },
      { key: "symptoms", label: "Symptoms", data: extractedEntities.symptoms },
      {
        key: "comorbidities",
        label: "Comorbidities",
        data: extractedEntities.comorbidities,
      },
    ];

    return (
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(category.key)}
              <h3 className="text-lg font-semibold text-foreground">
                {category.label}
              </h3>
            </div>
            {category.data.length === 0 ? (
              <p className="text-muted-foreground text-sm ml-7">None detected</p>
            ) : (
              <div className="ml-7 space-y-2">
                {category.data.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`font-medium ${getCategoryColor(category.key)}`}
                      >
                        {item.name || item.allergen}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.severity && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Severity:
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              item.severity === "severe"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.severity === "moderate"
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                            }`}
                          >
                            {item.severity}
                          </Badge>
                        </div>
                      )}
                      {item.status && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Status:
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              item.status === "active"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.status === "resolved"
                                  ? "bg-primary/10 text-primary border-primary/25"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      )}
                      {item.dosage && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Dosage:
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-primary border-primary/25"
                          >
                            {item.dosage}
                          </Badge>
                        </div>
                      )}
                      {item.frequency && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Frequency:
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-200"
                          >
                            {item.frequency}
                          </Badge>
                        </div>
                      )}
                      {item.reaction && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Reaction:
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-orange-600 border-orange-200"
                          >
                            {item.reaction}
                          </Badge>
                        </div>
                      )}
                      {item.duration && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Duration:
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-accent-foreground border-marker"
                          >
                            {item.duration}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Vitals and Lab Results */}
        {Object.keys(extractedEntities.vitals).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon("vitals")}
              <h3 className="text-lg font-semibold text-foreground">Vitals</h3>
            </div>
            <div className="ml-7 grid grid-cols-2 gap-3">
              {Object.entries(extractedEntities.vitals).map(([key, value]) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${getCategoryColor("vitals")}`}
                >
                  <div className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </div>
                  <div className="text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(extractedEntities.labResults).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon("labResults")}
              <h3 className="text-lg font-semibold text-foreground">
                Lab Results
              </h3>
            </div>
            <div className="ml-7 space-y-2">
              {Object.entries(extractedEntities.labResults).map(
                ([test, result]) => (
                  <div
                    key={test}
                    className={`p-3 rounded-lg border ${getCategoryColor("labResults")}`}
                  >
                    <div className="font-medium">{test}</div>
                    <div className="text-lg font-bold">{result}</div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStructuredView = () => {
    if (!extractedEntities) return null;

    const categories = [
      {
        key: "conditions",
        label: "Conditions",
        data: extractedEntities.conditions,
      },
      {
        key: "medications",
        label: "Medications",
        data: extractedEntities.medications,
      },
      {
        key: "allergies",
        label: "Allergies",
        data: extractedEntities.allergies,
      },
      { key: "symptoms", label: "Symptoms", data: extractedEntities.symptoms },
      {
        key: "comorbidities",
        label: "Comorbidities",
        data: extractedEntities.comorbidities,
      },
    ];

    return (
      <div className="space-y-4">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.key}
              variant={activeCategory === category.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.key)}
              className="flex items-center space-x-2"
            >
              {getCategoryIcon(category.key)}
              <span>{category.label}</span>
              <Badge variant="secondary" className="ml-1">
                {category.data.length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Active Category Content */}
        <div className="min-h-[200px]">
          {categories
            .filter((cat) => cat.key === activeCategory)
            .map((category) => (
              <div key={category.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(category.key)}
                    <h3 className="text-xl font-bold text-foreground">
                      {category.label}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {category.data.length}{" "}
                    {category.data.length === 1 ? "item" : "items"}
                  </Badge>
                </div>

                {category.data.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">None detected</div>
                    <p className="text-sm text-muted-foreground">
                      No {category.label.toLowerCase()} were identified in the
                      transcription
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.data.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border-2 border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="secondary"
                            className={`font-semibold text-sm ${getCategoryColor(category.key)}`}
                          >
                            {item.name || item.allergen}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.severity && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Severity:
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  item.severity === "severe"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : item.severity === "moderate"
                                      ? "bg-orange-100 text-orange-700 border-orange-200"
                                      : "bg-green-100 text-green-700 border-green-200"
                                }`}
                              >
                                {item.severity}
                              </Badge>
                            </div>
                          )}
                          {item.status && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Status:
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  item.status === "active"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : item.status === "resolved"
                                      ? "bg-primary/10 text-primary border-primary/25"
                                      : "bg-amber-100 text-amber-700 border-amber-200"
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </div>
                          )}
                          {item.dosage && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Dosage:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-primary border-primary/25"
                              >
                                {item.dosage}
                              </Badge>
                            </div>
                          )}
                          {item.frequency && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Frequency:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-green-600 border-green-200"
                              >
                                {item.frequency}
                              </Badge>
                            </div>
                          )}
                          {item.route && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Route:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-primary border-primary/25"
                              >
                                {item.route}
                              </Badge>
                            </div>
                          )}
                          {item.reaction && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Reaction:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-orange-600 border-orange-200"
                              >
                                {item.reaction}
                              </Badge>
                            </div>
                          )}
                          {item.duration && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Duration:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-accent-foreground border-marker"
                              >
                                {item.duration}
                              </Badge>
                            </div>
                          )}
                          {item.onset && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Onset:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs text-pink-600 border-pink-200"
                              >
                                {item.onset}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (!consultation) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Extracted Medical Entities
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-identified medical information from the transcription
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isAddEntityOpen} onOpenChange={setIsAddEntityOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Medical Entity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entity-type">Entity Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="condition">Condition</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="allergy">Allergy</SelectItem>
                        <SelectItem value="symptom">Symptom</SelectItem>
                        <SelectItem value="comorbidity">Comorbidity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entity-name">Name</Label>
                    <Input id="entity-name" placeholder="Enter entity name" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddEntityOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddEntityOpen(false)}>
                      Add Entity
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleExtractEntities}
              disabled={isExtracting || !consultation.transcription}
              className="flex items-center"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {extractedEntities ? "Re-extract" : "Extract"} Entities
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!consultation.transcription ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No transcription available</p>
            <p className="text-sm text-muted-foreground">
              Complete the audio recording and transcription to extract medical
              entities
            </p>
          </div>
        ) : !extractedEntities ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No medical entities extracted yet
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Extract Entities" to analyze the transcription with AI
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-center">
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "list" | "structured")
                }
              >
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger
                    value="structured"
                    className="flex items-center space-x-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Structured View</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="flex items-center space-x-2"
                  >
                    <List className="h-4 w-4" />
                    <span>List View</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            {viewMode === "list" ? renderListView() : renderStructuredView()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalEntityExtraction;
