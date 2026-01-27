import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  MessageSquare,
  LogOut,
  ChevronDown,
  Check,
  X,
  DollarSign,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Mail,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Settings,
  Smartphone,
  Copy,
  Plus,
  Pencil,
  Monitor,
  ShieldX,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  unreadMessages: number;
}

interface Device {
  id: number;
  name: string;
  browser_info: string;
  last_used: string | null;
  registered_via: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_path: string;
  is_available: number;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "messages" | "devices" | "menu">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  
  // Devices state
  const [devices, setDevices] = useState<Device[]>([]);
  const [showGenerateCodeDialog, setShowGenerateCodeDialog] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Change password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deviceRevoked, setDeviceRevoked] = useState(false);
  
  // Confirmation dialogs
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<number | null>(null);
  
  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [menuFilter, setMenuFilter] = useState<"all" | "cookies" | "cupcakes" | "cakepops">("all");
  
  // Edit item dialog state
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: "", description: "", price: "", category: "", image_path: "" });
  const [isSavingItem, setIsSavingItem] = useState(false);
  
  // Add item dialog state
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ name: "", description: "", price: "", category: "cookies", image_path: "" });
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Add category dialog state
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Delete confirmation
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Check if device is still valid (poll every 5 seconds)
  useEffect(() => {
    const checkDeviceValidity = async () => {
      const deviceToken = localStorage.getItem("admin_device_token");
      if (!deviceToken) return;
      
      try {
        const res = await fetch(`${API_URL}/auth/check-device`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken }),
        });
        
        if (!res.ok) {
          // Device was revoked!
          setDeviceRevoked(true);
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          localStorage.removeItem("admin_device_token");
        }
      } catch (error) {
        // Network error, don't logout
        console.error("Device check failed:", error);
      }
    };

    // Check immediately and then every 5 seconds
    checkDeviceValidity();
    const interval = setInterval(checkDeviceValidity, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const user = localStorage.getItem("admin_user");

    if (!token) {
      navigate("/joy-manage-2024", { replace: true });
      return;
    }

    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, [navigate]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersRes, messagesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/admin/orders`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/admin/messages`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/admin/stats`, { headers: getAuthHeaders() }),
      ]);

      if (!ordersRes.ok || !messagesRes.ok || !statsRes.ok) {
        // Handle both 401 (invalid token) and 403 (device revoked)
        if (ordersRes.status === 401 || ordersRes.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          if (ordersRes.status === 403) {
            localStorage.removeItem("admin_device_token"); // Device was revoked
            alert("Your device access has been revoked. Please contact the administrator.");
          }
          navigate("/joy-manage-2024", { replace: true });
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const [ordersData, messagesData, statsData] = await Promise.all([
        ordersRes.json(),
        messagesRes.json(),
        statsRes.json(),
      ]);

      setOrders(ordersData.orders);
      setMessages(messagesData.messages);
      setStats(statsData.stats);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/joy-manage-2024", { replace: true });
  }, [navigate]);

  const confirmLogout = useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  // Change password handler
  const handleChangePassword = useCallback(async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password");
        return;
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowPasswordDialog(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error) {
      setPasswordError("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, getAuthHeaders]);

  // ============================================
  // DEVICE MANAGEMENT FUNCTIONS
  // ============================================

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/devices`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  }, [getAuthHeaders]);

  // ============================================
  // MENU MANAGEMENT FUNCTIONS
  // ============================================

  const fetchMenu = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/products/all`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/products/categories`, { headers: getAuthHeaders() })
      ]);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setMenuItems(data);
      }
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [getAuthHeaders]);

  const toggleItemAvailability = useCallback(async (id: string, currentStatus: number) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_available: currentStatus === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(item => 
          item.id === id ? { ...item, is_available: currentStatus === 1 ? 0 : 1 } : item
        ));
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  }, [getAuthHeaders]);

  const updateItemPrice = useCallback(async (id: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ price }),
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(item => 
          item.id === id ? { ...item, price } : item
        ));
        setEditingPriceId(null);
        setEditPrice("");
      }
    } catch (error) {
      console.error("Error updating price:", error);
    }
  }, [getAuthHeaders, editPrice]);

  const saveEditedItem = useCallback(async () => {
    if (!editingItem) return;
    setIsSavingItem(true);
    try {
      const res = await fetch(`${API_URL}/products/${editingItem.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editItemForm.name,
          description: editItemForm.description,
          price: parseFloat(editItemForm.price),
          category: editItemForm.category,
          image_path: editItemForm.image_path,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(prev => prev.map(item => 
          item.id === editingItem.id ? data.product : item
        ));
        setShowEditItemDialog(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSavingItem(false);
    }
  }, [getAuthHeaders, editingItem, editItemForm]);

  const addNewItem = useCallback(async () => {
    if (!newItemForm.name || !newItemForm.price || !newItemForm.category) {
      alert("Please fill in name, price, and category");
      return;
    }
    setIsAddingItem(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newItemForm.name,
          description: newItemForm.description,
          price: parseFloat(newItemForm.price),
          category: newItemForm.category,
          image_path: newItemForm.image_path,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(prev => [...prev, data.product]);
        setShowAddItemDialog(false);
        setNewItemForm({ name: "", description: "", price: "", category: "cookies", image_path: "" });
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAddingItem(false);
    }
  }, [getAuthHeaders, newItemForm]);

  const deleteItem = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      const res = await fetch(`${API_URL}/products/${itemToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== itemToDelete.id));
        setShowDeleteItemDialog(false);
        setItemToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeletingItem(false);
    }
  }, [getAuthHeaders, itemToDelete]);

  const addNewCategory = useCallback(async () => {
    if (!newCategoryName) {
      alert("Please enter a category name");
      return;
    }
    setIsAddingCategory(true);
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => [...prev, data.category]);
        setShowAddCategoryDialog(false);
        setNewCategoryName("");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsAddingCategory(false);
    }
  }, [getAuthHeaders, newCategoryName]);

  const updateCategoryPrice = useCallback(async (category: string, price: number) => {
    try {
      const res = await fetch(`${API_URL}/products/category/${category}/price`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ price }),
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(item => 
          item.category === category ? { ...item, price } : item
        ));
      }
    } catch (error) {
      console.error("Error updating category price:", error);
    }
  }, [getAuthHeaders]);

  const generateDeviceCode = useCallback(async () => {
    setIsGeneratingCode(true);
    setGeneratedCode(null);
    try {
      const res = await fetch(`${API_URL}/auth/devices/generate-code`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCode(data.code);
        setCodeExpiresAt(data.expiresAt);
      }
    } catch (error) {
      console.error("Error generating code:", error);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [getAuthHeaders]);

  const copyCodeToClipboard = useCallback(() => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }, [generatedCode]);

  const initiateRevokeDevice = useCallback((deviceId: number) => {
    // Check if this is the last device
    if (devices.length <= 1) {
      alert("Cannot revoke the last remaining device! You would lose all admin access.");
      return;
    }
    setDeviceToRevoke(deviceId);
    setShowRevokeDialog(true);
  }, [devices.length]);

  const deleteDevice = useCallback(async () => {
    if (!deviceToRevoke) return;
    try {
      const res = await fetch(`${API_URL}/auth/devices/${deviceToRevoke}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Delete failed:", data);
        alert(`Failed to delete device: ${data.error || 'Unknown error'}`);
        return;
      }
      setShowRevokeDialog(false);
      setDeviceToRevoke(null);
      fetchDevices();
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("Network error while deleting device");
    }
  }, [getAuthHeaders, fetchDevices, deviceToRevoke]);

  const saveDeviceName = useCallback(async (deviceId: number) => {
    try {
      await fetch(`${API_URL}/auth/devices/${deviceId}/name`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editDeviceName }),
      });
      setEditingDeviceId(null);
      fetchDevices();
    } catch (error) {
      console.error("Error renaming device:", error);
    }
  }, [getAuthHeaders, editDeviceName, fetchDevices]);

  // Fetch devices when switching to devices tab
  useEffect(() => {
    if (activeTab === "devices") {
      fetchDevices();
    }
  }, [activeTab, fetchDevices]);

  // Fetch menu when switching to menu tab
  useEffect(() => {
    if (activeTab === "menu") {
      fetchMenu();
    }
  }, [activeTab, fetchMenu]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      try {
        await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),
        });
        fetchData();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    [getAuthHeaders, fetchData]
  );

  const togglePaid = useCallback(
    async (orderId: string, currentStatus: string) => {
      const paid = currentStatus !== "paid";
      try {
        await fetch(`${API_URL}/admin/orders/${orderId}/paid`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ paid }),
        });
        fetchData();
      } catch (error) {
        console.error("Error updating payment:", error);
      }
    },
    [getAuthHeaders, fetchData]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!confirm("Are you sure you want to delete this order?")) return;
      try {
        await fetch(`${API_URL}/admin/orders/${orderId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    },
    [getAuthHeaders, fetchData]
  );

  const markMessageRead = useCallback(
    async (messageId: string) => {
      try {
        await fetch(`${API_URL}/admin/messages/${messageId}/read`, {
          method: "PATCH",
          headers: getAuthHeaders(),
        });
        fetchData();
      } catch (error) {
        console.error("Error marking message read:", error);
      }
    },
    [getAuthHeaders, fetchData]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!confirm("Are you sure you want to delete this message?")) return;
      try {
        await fetch(`${API_URL}/admin/messages/${messageId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    },
    [getAuthHeaders, fetchData]
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Show revoked overlay if device was deleted
  if (deviceRevoked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Revoked</h1>
            <p className="text-gray-500 mb-6">Your device access has been revoked by an administrator. Please contact them if you need access restored.</p>
            <Button 
              onClick={() => navigate("/joy-manage-2024", { replace: true })}
              variant="outline"
            >
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                🍪 Joy Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordDialog(true)}
                className="gap-2"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Password</span>
              </Button>
              <span className="text-sm text-gray-500 hidden sm:inline">
                {adminUser?.name || adminUser?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={confirmLogout}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {passwordSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError("");
                setPasswordSuccess("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="gap-2"
            >
              {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="bg-white rounded-xl p-5 shadow-sm border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-5 shadow-sm border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-5 shadow-sm border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-5 shadow-sm border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unread Messages</p>
                  <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Orders ({orders.length})
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "outline"}
            onClick={() => setActiveTab("messages")}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Messages ({messages.length})
          </Button>
          <Button
            variant={activeTab === "devices" ? "default" : "outline"}
            onClick={() => setActiveTab("devices")}
            className="gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Devices
          </Button>
          <Button
            variant={activeTab === "menu" ? "default" : "outline"}
            onClick={() => setActiveTab("menu")}
            className="gap-2"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Menu
          </Button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="bg-white rounded-xl p-5 shadow-sm border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-lg">
                          {order.order_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.order_status]
                          }`}
                        >
                          {order.order_status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.payment_status === "paid" ? "💰 Paid" : "⏳ Unpaid"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)} at {formatTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Customer</p>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.customer_email}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-600">{order.customer_phone}</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Pickup</p>
                      <p className="font-medium">
                        {formatDate(order.pickup_date)}
                      </p>
                      <p className="text-sm text-gray-600">{order.pickup_time}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Items</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="text-gray-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant={order.payment_status === "paid" ? "outline" : "default"}
                      size="sm"
                      onClick={() => togglePaid(order.id, order.payment_status)}
                      className="gap-1"
                    >
                      {order.payment_status === "paid" ? (
                        <>
                          <X className="w-4 h-4" /> Mark Unpaid
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Mark Paid
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteOrder(order.id)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                No messages yet
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border ${
                    !message.is_read ? "border-l-4 border-l-primary" : ""
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{message.name}</span>
                        {!message.is_read && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <a
                        href={`mailto:${message.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {message.email}
                      </a>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(message.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {message.message}
                  </p>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={`mailto:${message.email}?subject=Re: Your message to Joy Cookies %26 Cupcakes`}>
                        <Mail className="w-4 h-4 mr-1" />
                        Reply
                      </a>
                    </Button>
                    {!message.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markMessageRead(message.id)}
                        className="gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(message.id)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            {/* Generate Code Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Device Access Codes</h3>
                  <p className="text-sm text-gray-500">Generate one-time codes for new devices</p>
                </div>
                <Button
                  onClick={() => {
                    setGeneratedCode(null);
                    setShowGenerateCodeDialog(true);
                    generateDeviceCode();
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Generate Code
                </Button>
              </div>
            </div>

            {/* Devices List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold">Registered Devices ({devices.length})</h3>
              </div>
              {devices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No devices registered yet
                </div>
              ) : (
                <div className="divide-y">
                  {devices.map((device) => (
                    <div key={device.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-green-100">
                          <Monitor className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingDeviceId === device.id ? (
                            <div className="flex items-center gap-2 mb-1">
                              <Input
                                value={editDeviceName}
                                onChange={(e) => setEditDeviceName(e.target.value)}
                                className="h-8 w-48"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveDeviceName(device.id);
                                  if (e.key === 'Escape') setEditingDeviceId(null);
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={() => saveDeviceName(device.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingDeviceId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{device.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingDeviceId(device.id);
                                  setEditDeviceName(device.name);
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>{device.browser_info || 'Unknown browser'}</p>
                            <p className="text-xs">
                              Registered: {new Date(device.created_at).toLocaleDateString()} via {device.registered_via}
                              {device.last_used && (
                                <> • Last used: {new Date(device.last_used).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initiateRevokeDevice(device.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Menu Management</h2>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddItemDialog(true)}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                  <Select value={menuFilter} onValueChange={(v) => setMenuFilter(v as typeof menuFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="cupcakes">Cupcakes</SelectItem>
                      <SelectItem value="cakepops">Cake Pops</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMenu}
                    disabled={isLoadingMenu}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingMenu ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {isLoadingMenu ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {["cookies", "cupcakes", "cakepops"].map((category) => {
                    if (menuFilter !== "all" && menuFilter !== category) return null;
                    const categoryItems = menuItems.filter(item => item.category === category);
                    if (categoryItems.length === 0 && menuFilter === "all") return null;
                    
                    const categoryLabel = category === "cakepops" ? "Cake Pops" : category.charAt(0).toUpperCase() + category.slice(1);
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-700 capitalize">{categoryLabel}</h3>
                          <span className="text-sm text-gray-500">
                            {categoryItems.filter(i => i.is_available).length}/{categoryItems.length} available
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {categoryItems.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No items in this category</p>
                          ) : categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                item.is_available ? 'bg-white' : 'bg-gray-50 opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => toggleItemAvailability(item.id, item.is_available)}
                                  className={`transition-colors ${
                                    item.is_available ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                                  }`}
                                  title={item.is_available ? 'Click to make unavailable' : 'Click to make available'}
                                >
                                  {item.is_available ? (
                                    <ToggleRight className="w-8 h-8" />
                                  ) : (
                                    <ToggleLeft className="w-8 h-8" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium ${!item.is_available && 'text-gray-500'}`}>
                                    {item.name}
                                  </p>
                                  <p className="text-sm text-gray-500 max-w-md truncate">
                                    {item.description}
                                  </p>
                                  {item.image_path && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                      Image: {item.image_path}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingPriceId === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-20 h-8"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateItemPrice(item.id);
                                        if (e.key === 'Escape') {
                                          setEditingPriceId(null);
                                          setEditPrice("");
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-green-600"
                                      onClick={() => updateItemPrice(item.id)}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-500"
                                      onClick={() => {
                                        setEditingPriceId(null);
                                        setEditPrice("");
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingPriceId(item.id);
                                      setEditPrice(item.price.toFixed(2));
                                    }}
                                    className="flex items-center gap-1 text-lg font-semibold text-gray-700 hover:text-primary transition-colors min-w-[70px]"
                                  >
                                    ${item.price.toFixed(2)}
                                  </button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditItemForm({
                                      name: item.name,
                                      description: item.description,
                                      price: item.price.toFixed(2),
                                      category: item.category,
                                      image_path: item.image_path,
                                    });
                                    setShowEditItemDialog(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setItemToDelete(item);
                                    setShowDeleteItemDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Item
              </DialogTitle>
              <DialogDescription>
                Add a new item to your menu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-item-name">Name</Label>
                <Input
                  id="new-item-name"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-description">Description</Label>
                <Textarea
                  id="new-item-description"
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-item-price">Price ($)</Label>
                  <Input
                    id="new-item-price"
                    type="number"
                    step="0.01"
                    value={newItemForm.price}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-item-category">Category</Label>
                  <Select 
                    value={newItemForm.category} 
                    onValueChange={(v) => setNewItemForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger id="new-item-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="cupcakes">Cupcakes</SelectItem>
                      <SelectItem value="cakepops">Cake Pops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-image">Image Path</Label>
                <Input
                  id="new-item-image"
                  value={newItemForm.image_path}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, image_path: e.target.value }))}
                  placeholder="e.g., cookies/My Cookie.webp"
                />
                <p className="text-xs text-gray-500">Path relative to the assets folder</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addNewItem} disabled={isAddingItem}>
                {isAddingItem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Edit Item
              </DialogTitle>
              <DialogDescription>
                Update the item details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-item-name">Name</Label>
                <Input
                  id="edit-item-name"
                  value={editItemForm.name}
                  onChange={(e) => setEditItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-description">Description</Label>
                <Textarea
                  id="edit-item-description"
                  value={editItemForm.description}
                  onChange={(e) => setEditItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-price">Price ($)</Label>
                  <Input
                    id="edit-item-price"
                    type="number"
                    step="0.01"
                    value={editItemForm.price}
                    onChange={(e) => setEditItemForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-category">Category</Label>
                  <Select 
                    value={editItemForm.category} 
                    onValueChange={(v) => setEditItemForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger id="edit-item-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="cupcakes">Cupcakes</SelectItem>
                      <SelectItem value="cakepops">Cake Pops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-image">Image Path</Label>
                <Input
                  id="edit-item-image"
                  value={editItemForm.image_path}
                  onChange={(e) => setEditItemForm(prev => ({ ...prev, image_path: e.target.value }))}
                  placeholder="e.g., cookies/My Cookie.webp"
                />
                <p className="text-xs text-gray-500">Path relative to the assets folder</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditedItem} disabled={isSavingItem}>
                {isSavingItem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Item Confirmation Dialog */}
        <Dialog open={showDeleteItemDialog} onOpenChange={setShowDeleteItemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Item
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDeleteItemDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteItem} disabled={isDeletingItem}>
                {isDeletingItem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Code Dialog */}
        <Dialog open={showGenerateCodeDialog} onOpenChange={setShowGenerateCodeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device Access Code
              </DialogTitle>
              <DialogDescription>
                Share this code with someone to register their device. It expires in 24 hours and can only be used once.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isGeneratingCode ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : generatedCode ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-3xl font-mono font-bold tracking-widest text-primary">
                      {generatedCode}
                    </p>
                  </div>
                  <Button
                    onClick={copyCodeToClipboard}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {codeCopied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Expires: {codeExpiresAt ? new Date(codeExpiresAt).toLocaleString() : '24 hours'}
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                    <p className="text-amber-800">
                      <strong>Instructions:</strong> Send this code to the person who needs access. 
                      They should go to <span className="font-mono">/joy-setup-device</span> and enter this code.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to generate code. Please try again.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateCodeDialog(false)}>
                Close
              </Button>
              {generatedCode && (
                <Button onClick={generateDeviceCode} disabled={isGeneratingCode}>
                  Generate New Code
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-red-600" />
                Confirm Logout
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You'll need to sign in again to access the dashboard.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowLogoutDialog(false);
                  handleLogout();
                }}
              >
                Yes, Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Device Confirmation Dialog */}
        <Dialog open={showRevokeDialog} onOpenChange={(open) => {
          setShowRevokeDialog(open);
          if (!open) setDeviceToRevoke(null);
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldX className="w-5 h-5 text-red-600" />
                Revoke Device Access
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this device's access? The user will be logged out immediately and won't be able to access the admin panel from that device.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowRevokeDialog(false);
                setDeviceToRevoke(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteDevice}
              >
                Yes, Revoke Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
