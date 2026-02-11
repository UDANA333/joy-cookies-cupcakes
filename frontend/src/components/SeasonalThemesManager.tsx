import { memo, useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  PowerOff, 
  RefreshCw, 
  Loader2,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

// Get API base URL
function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

const API_URL = getApiBaseUrl();

// Types
interface SeasonalTheme {
  id: string;
  name: string;
  slug: string;
  category_slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  icon: string;
  banner_text: string | null;
  banner_subtext: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SeasonalPreset {
  name: string;
  icon: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  banner_text: string;
  banner_subtext: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface SeasonalThemesManagerProps {
  categories: Category[];
}

const SeasonalThemesManager = memo(({ categories }: SeasonalThemesManagerProps) => {
  const [themes, setThemes] = useState<SeasonalTheme[]>([]);
  const [presets, setPresets] = useState<SeasonalPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<SeasonalTheme | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category_slug: "",
    primary_color: "#FF6B9A",
    secondary_color: "#8B0A1A",
    accent_color: "#FFD700",
    icon: "🎉",
    banner_text: "",
    banner_subtext: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Get auth token (same as Dashboard uses)
  const getAuthToken = () => sessionStorage.getItem("admin_token");

  // Fetch themes
  const fetchThemes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/seasonal/themes`);
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch presets
  const fetchPresets = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/seasonal/presets`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Error fetching presets:", error);
    }
  }, []);

  // Fetch themes on mount for the header display
  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Fetch presets when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchPresets();
    }
  }, [isExpanded, fetchPresets]);

  // Apply preset to form
  const applyPreset = (preset: SeasonalPreset) => {
    setFormData({
      ...formData,
      name: preset.name,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
      icon: preset.icon,
      banner_text: preset.banner_text,
      banner_subtext: preset.banner_subtext
    });
  };

  // Create theme
  const handleCreate = async () => {
    if (!formData.name || !formData.category_slug) {
      toast({ title: "Error", description: "Name and category are required", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/seasonal/themes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Seasonal theme created" });
        setShowAddDialog(false);
        resetForm();
        fetchThemes();
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.error || "Failed to create theme", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create theme", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Update theme
  const handleUpdate = async () => {
    if (!selectedTheme) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/seasonal/themes/${selectedTheme.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Theme updated" });
        setShowEditDialog(false);
        resetForm();
        fetchThemes();
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.error || "Failed to update theme", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update theme", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete theme
  const handleDelete = async () => {
    if (!selectedTheme) return;
    
    try {
      const response = await fetch(`${API_URL}/seasonal/themes/${selectedTheme.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Theme deleted" });
        setShowDeleteDialog(false);
        setSelectedTheme(null);
        fetchThemes();
      } else {
        toast({ title: "Error", description: "Failed to delete theme", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete theme", variant: "destructive" });
    }
  };

  // Toggle theme active state
  const handleToggleActive = async (theme: SeasonalTheme) => {
    try {
      const url = theme.is_active 
        ? `${API_URL}/seasonal/deactivate`
        : `${API_URL}/seasonal/themes/${theme.id}/activate`;
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: theme.is_active ? "Theme deactivated" : `${theme.name} is now active!` 
        });
        fetchThemes();
      } else {
        toast({ title: "Error", description: "Failed to toggle theme", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle theme", variant: "destructive" });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      category_slug: "",
      primary_color: "#FF6B9A",
      secondary_color: "#8B0A1A",
      accent_color: "#FFD700",
      icon: "🎉",
      banner_text: "",
      banner_subtext: ""
    });
    setSelectedTheme(null);
  };

  // Open edit dialog
  const openEditDialog = (theme: SeasonalTheme) => {
    setSelectedTheme(theme);
    setFormData({
      name: theme.name,
      category_slug: theme.category_slug,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      icon: theme.icon,
      banner_text: theme.banner_text || "",
      banner_subtext: theme.banner_subtext || ""
    });
    setShowEditDialog(true);
  };

  // Theme preview component
  const ThemePreview = ({ colors, icon, text }: { colors: { primary: string; secondary: string; accent: string }; icon: string; text: string }) => (
    <div 
      className="rounded-lg p-3 text-white text-center"
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        borderBottom: `3px solid ${colors.accent}`
      }}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-medium mt-1">{text || "Banner Preview"}</p>
    </div>
  );

  const activeTheme = themes.find(t => t.is_active);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <h3 className="font-semibold">Seasonal Themes</h3>
                <p className="text-sm text-gray-500">
                  {activeTheme 
                    ? `Active: ${activeTheme.icon} ${activeTheme.name}` 
                    : "No seasonal theme active"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTheme && (
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: activeTheme.primary_color }}
                >
                  Live
                </Badge>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Header with Add button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Create seasonal promotions with custom themes that highlight special products on your homepage.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchThemes()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowAddDialog(true);
                  }}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Theme
                </Button>
              </div>
            </div>

            {/* Themes List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : themes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No seasonal themes yet</p>
                <p className="text-sm">Create your first theme to highlight special products!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {themes.map((theme) => (
                  <div 
                    key={theme.id}
                    className={`rounded-lg border p-4 ${theme.is_active ? 'ring-2 ring-offset-2' : ''}`}
                    style={{ 
                      borderColor: theme.is_active ? theme.primary_color : undefined,
                      ['--tw-ring-color' as string]: theme.primary_color 
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.primary_color}20 0%, ${theme.secondary_color}20 100%)` 
                          }}
                        >
                          {theme.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{theme.name}</h4>
                            {!!theme.is_active && (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Category: {categories.find(c => c.slug === theme.category_slug)?.name || theme.category_slug}
                          </p>
                          {theme.banner_text && (
                            <p className="text-sm text-gray-600 mt-1">"{theme.banner_text}"</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Color swatches */}
                        <div className="flex gap-1">
                          <div 
                            className="w-5 h-5 rounded-full border border-gray-200" 
                            style={{ backgroundColor: theme.primary_color }}
                            title="Primary"
                          />
                          <div 
                            className="w-5 h-5 rounded-full border border-gray-200" 
                            style={{ backgroundColor: theme.secondary_color }}
                            title="Secondary"
                          />
                          <div 
                            className="w-5 h-5 rounded-full border border-gray-200" 
                            style={{ backgroundColor: theme.accent_color }}
                            title="Accent"
                          />
                        </div>
                        
                        <Button
                          variant={theme.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(theme)}
                          title={theme.is_active ? "Deactivate" : "Activate"}
                        >
                          {theme.is_active ? (
                            <><PowerOff className="w-4 h-4 mr-1" /> Deactivate</>
                          ) : (
                            <><Power className="w-4 h-4 mr-1" /> Activate</>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(theme)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTheme(theme);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Theme Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Seasonal Theme</DialogTitle>
            <DialogDescription>
              Add a new seasonal promotion with custom styling.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Presets */}
            {presets.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Quick Start from Preset</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="gap-1"
                    >
                      {preset.icon} {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Valentine's Day"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category_slug} 
                  onValueChange={(v) => setFormData({ ...formData, category_slug: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon (Emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="❤️"
                className="text-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Text</Label>
              <Input
                value={formData.banner_text}
                onChange={(e) => setFormData({ ...formData, banner_text: e.target.value })}
                placeholder="Valentine's Treats Available!"
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Subtext</Label>
              <Input
                value={formData.banner_subtext}
                onChange={(e) => setFormData({ ...formData, banner_subtext: e.target.value })}
                placeholder="Show your love with something sweet"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <ThemePreview 
                colors={{ 
                  primary: formData.primary_color, 
                  secondary: formData.secondary_color, 
                  accent: formData.accent_color 
                }}
                icon={formData.icon}
                text={formData.banner_text}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Theme Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Theme: {selectedTheme?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category_slug} 
                  onValueChange={(v) => setFormData({ ...formData, category_slug: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="text-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Text</Label>
              <Input
                value={formData.banner_text}
                onChange={(e) => setFormData({ ...formData, banner_text: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Subtext</Label>
              <Input
                value={formData.banner_subtext}
                onChange={(e) => setFormData({ ...formData, banner_subtext: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <ThemePreview 
                colors={{ 
                  primary: formData.primary_color, 
                  secondary: formData.secondary_color, 
                  accent: formData.accent_color 
                }}
                icon={formData.icon}
                text={formData.banner_text}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTheme?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

SeasonalThemesManager.displayName = "SeasonalThemesManager";

export default SeasonalThemesManager;
