import { memo, useState, useEffect, useCallback, useMemo } from "react";
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
  Upload,
  ImageIcon,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

// Product image imports
import chocolateChipCookie from "@/assets/cookies/Chocolate Chip.webp";
import sugarCookie from "@/assets/cookies/Sugar Cookie.webp";
import germanChocolateCookie from "@/assets/cookies/German Chocolate Cookie.webp";
import doubleChocolateCookie from "@/assets/cookies/Double Chocolate Cookie.webp";
import biscoffCookie from "@/assets/cookies/Biscoff Cookie.webp";
import oatmealRaisinCookie from "@/assets/cookies/Oatmeal Raisin Cookie.webp";
import whiteChocolateMacadamiaCookie from "@/assets/cookies/White Chocolate Macadamia Cookie.webp";
import peanutButterCookie from "@/assets/cookies/Peanut Butter Cookie.webp";
import vanillaCupcake from "@/assets/cupcakes/Vanilla Cupcake.webp";
import chocolateCupcake from "@/assets/cupcakes/Chocolate Cupcake.webp";
import lemonBlueberryCupcake from "@/assets/cupcakes/Lemon Blueberry Cupcake.webp";
import cookiesAndCreamCupcake from "@/assets/cupcakes/Cookies and Cream Cupcake.webp";
import saltedCaramelCupcake from "@/assets/cupcakes/Salted Caramel Cupcake.webp";
import funfettiCupcake from "@/assets/cupcakes/Funfetti Cupcake.webp";
import chocolateCakePop from "@/assets/cakepops/Chocolate Cake Pop.webp";
import vanillaCakePop from "@/assets/cakepops/Vanilla Cake Pop.webp";
import SeasonalThemesManager from "@/components/SeasonalThemesManager";

// Map image paths to imported images
const imageMap: Record<string, string> = {
  'cookies/Chocolate Chip.webp': chocolateChipCookie,
  'cookies/Sugar Cookie.webp': sugarCookie,
  'cookies/German Chocolate Cookie.webp': germanChocolateCookie,
  'cookies/Double Chocolate Cookie.webp': doubleChocolateCookie,
  'cookies/Biscoff Cookie.webp': biscoffCookie,
  'cookies/Oatmeal Raisin Cookie.webp': oatmealRaisinCookie,
  'cookies/White Chocolate Macadamia Cookie.webp': whiteChocolateMacadamiaCookie,
  'cookies/Peanut Butter Cookie.webp': peanutButterCookie,
  'cupcakes/Vanilla Cupcake.webp': vanillaCupcake,
  'cupcakes/Chocolate Cupcake.webp': chocolateCupcake,
  'cupcakes/Lemon Blueberry Cupcake.webp': lemonBlueberryCupcake,
  'cupcakes/Cookies and Cream Cupcake.webp': cookiesAndCreamCupcake,
  'cupcakes/Salted Caramel Cupcake.webp': saltedCaramelCupcake,
  'cupcakes/Funfetti Cupcake.webp': funfettiCupcake,
  'cakepops/Chocolate Cake Pop.webp': chocolateCakePop,
  'cakepops/Vanilla Cake Pop.webp': vanillaCakePop,
};

// Parse timestamp - handles both old format (UTC without Z) and new ISO format
function parseTimestamp(dateStr: string): Date {
  // If it's already ISO format with Z or timezone offset, parse directly
  if (dateStr.includes('T') || dateStr.includes('Z') || dateStr.includes('+')) {
    return new Date(dateStr);
  }
  // Old format: "2026-01-27 16:10:37" - this is UTC, add Z suffix
  return new Date(dateStr.replace(' ', 'T') + 'Z');
}

// Helper to get image URL from image_path
function getImageUrl(imagePath: string): string | null {
  if (!imagePath) return null;
  // Check if it's a bundled asset
  if (imageMap[imagePath]) return imageMap[imagePath];
  // Check if it's an uploaded image
  if (imagePath.startsWith('uploads/')) return `/${imagePath}`;
  return null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  items: { id: string; name: string; price: number; quantity: number; category?: string }[];
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  deposit_amount: number;
  remaining_balance: number;
  payment_transaction_id: string | null;
  deposit_method: string | null;
  balance_method: string | null;
  created_at: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: number;
  replied_at: string | null;
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

interface StorageUsage {
  totalSize: number;
  formattedSize: string;
  files: { name: string; size: number }[];
  tableCounts: Record<string, number>;
  diskSpace: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  } | null;
}

// Format bytes to human-readable string
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  // Legacy statuses for backwards compatibility
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  pending: "⏳ Pending",
  ready: "✅ Ready",
  picked_up: "📦 Picked Up",
  cancelled: "❌ Cancelled",
  // Legacy statuses for backwards compatibility
  confirmed: "Confirmed",
  completed: "Completed",
};

// Chart colors
const CHART_COLORS = [
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#a78bfa", // violet-400
  "#4ade80", // green-400
  "#60a5fa", // blue-400
  "#f87171", // red-400
  "#facc15", // yellow-400
  "#2dd4bf", // teal-400
];

const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "messages" | "devices" | "menu" | "analytics">("analytics");
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
  const [menuFilter, setMenuFilter] = useState<string>("all");
  
  // Edit item dialog state
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: "", description: "", price: "", category: "", image_path: "" });
  const [isSavingItem, setIsSavingItem] = useState(false);
  
  // Add item dialog state
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ name: "", description: "", price: "", category: "cookies", image_path: "", is_box: false, box_category: "cookies", box_size: "6" });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  
  // Edit item image upload state
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  
  // Add category dialog state
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Delete confirmation
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  
  // Reply to message state
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // Analytics time period
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"week" | "month" | "year">("month");
  
  // Storage & maintenance state
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupMonths, setCleanupMonths] = useState("6");
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ aggregated: number; deleted: number } | null>(null);

  // Analytics data calculations
  const analyticsData = useMemo(() => {
    if (!orders.length) return null;

    const now = new Date();
    const getStartDate = () => {
      const date = new Date();
      if (analyticsPeriod === "week") date.setDate(date.getDate() - 7);
      else if (analyticsPeriod === "month") date.setMonth(date.getMonth() - 1);
      else date.setFullYear(date.getFullYear() - 1);
      return date;
    };
    
    const startDate = getStartDate();
    const filteredOrders = orders.filter(o => parseTimestamp(o.created_at) >= startDate);
    // Include both paid and deposit_paid orders for revenue tracking
    const paidFilteredOrders = filteredOrders.filter(o => o.payment_status === "paid" || o.payment_status === "deposit_paid");
    
    // Generate calendar-based timeline
    const generateTimelineKeys = () => {
      const keys: { key: string; sortKey: number }[] = [];
      const current = new Date(startDate);
      const end = new Date(now);
      
      if (analyticsPeriod === "week") {
        // Daily for week view
        while (current <= end) {
          keys.push({
            key: current.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
            sortKey: current.getTime(),
          });
          current.setDate(current.getDate() + 1);
        }
      } else if (analyticsPeriod === "month") {
        // Daily for month view
        while (current <= end) {
          keys.push({
            key: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            sortKey: current.getTime(),
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Monthly for year view
        current.setDate(1); // Start from first of month
        while (current <= end) {
          keys.push({
            key: current.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            sortKey: current.getTime(),
          });
          current.setMonth(current.getMonth() + 1);
        }
      }
      return keys;
    };
    
    const timelineKeys = generateTimelineKeys();
    
    // Initialize all timeline slots with zeros
    const revenueByDate: Record<string, { revenue: number; orders: number; sortKey: number }> = {};
    timelineKeys.forEach(({ key, sortKey }) => {
      revenueByDate[key] = { revenue: 0, orders: 0, sortKey };
    });
    
    // Fill in actual order data
    filteredOrders.forEach(order => {
      const date = parseTimestamp(order.created_at);
      let key: string;
      if (analyticsPeriod === "week") {
        key = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      } else if (analyticsPeriod === "month") {
        key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }
      
      if (!revenueByDate[key]) {
        revenueByDate[key] = { revenue: 0, orders: 0, sortKey: date.getTime() };
      }
      
      // Only count paid orders for revenue
      if (order.payment_status === "paid") {
        revenueByDate[key].revenue += order.total;
      }
      revenueByDate[key].orders += 1;
    });

    // Sort chart data chronologically using the stored timestamp
    const revenueChartData = Object.entries(revenueByDate)
      .map(([date, data]) => ({
        date,
        revenue: Number(data.revenue.toFixed(2)),
        orders: data.orders,
        sortKey: data.sortKey,
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ date, revenue, orders }) => ({ date, revenue, orders }));

    // Order status breakdown
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      statusCounts[order.order_status] = (statusCounts[order.order_status] || 0) + 1;
    });
    const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));

    // Top selling products (only from paid orders)
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    paidFilteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // Category performance (only from paid orders)
    // Use category from order items directly, fall back to menu lookup, then "other"
    const categoryRevenue: Record<string, number> = {};
    paidFilteredOrders.forEach(order => {
      order.items.forEach(item => {
        // First try to get category from the order item itself
        let category = item.category;
        // If not in order, try to find from menu items
        if (!category) {
          const menuItem = menuItems.find(m => m.id === item.id);
          category = menuItem?.category;
        }
        // Default to "other" if still not found
        category = category || "other";
        categoryRevenue[category] = (categoryRevenue[category] || 0) + item.price * item.quantity;
      });
    });
    const categoryChartData = Object.entries(categoryRevenue).map(([category, revenue]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      revenue: Number(revenue.toFixed(2)),
    }));

    // Period comparison
    const prevStartDate = new Date(startDate);
    if (analyticsPeriod === "week") prevStartDate.setDate(prevStartDate.getDate() - 7);
    else if (analyticsPeriod === "month") prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    else prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    
    const prevOrders = orders.filter(o => {
      const date = parseTimestamp(o.created_at);
      return date >= prevStartDate && date < startDate;
    });
    // Include both paid and deposit_paid orders for revenue tracking
    const paidPrevOrders = prevOrders.filter(o => o.payment_status === "paid" || o.payment_status === "deposit_paid");

    const currentRevenue = paidFilteredOrders.reduce((sum, o) => sum + o.total, 0);
    const prevRevenue = paidPrevOrders.reduce((sum, o) => sum + o.total, 0);
    // If previous revenue was 0 but current > 0, show 100% increase. If both 0, show 0%
    const revenueChange = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : (currentRevenue > 0 ? 100 : 0);
    
    const currentOrderCount = filteredOrders.length;
    const prevOrderCount = prevOrders.length;
    // If previous orders was 0 but current > 0, show 100% increase
    const orderChange = prevOrderCount > 0 
      ? ((currentOrderCount - prevOrderCount) / prevOrderCount) * 100 
      : (currentOrderCount > 0 ? 100 : 0);

    const paidOrderCount = paidFilteredOrders.length;
    const paidPrevOrderCount = paidPrevOrders.length;
    const avgOrderValue = paidOrderCount > 0 ? currentRevenue / paidOrderCount : 0;
    const prevAvgOrderValue = paidPrevOrderCount > 0 ? prevRevenue / paidPrevOrderCount : 0;
    // If previous avg was 0 but current > 0, show 100% increase
    const avgOrderChange = prevAvgOrderValue > 0 
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 
      : (avgOrderValue > 0 ? 100 : 0);

    // Payment status - count by status type
    const paidOrders = filteredOrders.filter(o => o.payment_status === "paid").length;
    const depositPaidOrders = filteredOrders.filter(o => o.payment_status === "deposit_paid").length;
    const unpaidOrders = filteredOrders.filter(o => o.payment_status === "pending" || !o.payment_status).length;

    return {
      revenueChartData,
      statusChartData,
      topProducts,
      categoryChartData,
      currentRevenue,
      revenueChange,
      currentOrderCount,
      orderChange,
      avgOrderValue,
      avgOrderChange,
      paidOrders,
      depositPaidOrders,
      unpaidOrders,
    };
  }, [orders, menuItems, analyticsPeriod]);

  // Filter categories to only show ones that have at least 1 item
  const categoriesWithItems = useMemo(() => {
    const categorySlugsWithItems = new Set(menuItems.map(item => item.category));
    return categories.filter(cat => categorySlugsWithItems.has(cat.slug));
  }, [categories, menuItems]);

  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Check if device is still valid (poll every 30 seconds)
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
        
        // Only revoke on explicit 403 (device actually revoked by admin)
        // Don't revoke on network errors, server down, etc.
        if (res.status === 403) {
          // Device was actually revoked by an admin
          setDeviceRevoked(true);
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_user");
          localStorage.removeItem("admin_device_token");
        }
        // Ignore other errors (500, network issues, etc.) - user stays logged in
      } catch (error) {
        // Network error, don't logout - server might just be temporarily unavailable
        console.error("Device check failed (network):", error);
      }
    };

    // Check immediately and then every 30 seconds (reduced frequency)
    checkDeviceValidity();
    const interval = setInterval(checkDeviceValidity, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    const user = sessionStorage.getItem("admin_user");

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
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_user");
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
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    navigate("/joy-manage-2024", { replace: true });
  }, [navigate]);

  // Inactivity timeout - logout after 1 hour of no activity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Logging out due to inactivity");
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Events that indicate user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [handleLogout]);

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
  // STORAGE & MAINTENANCE FUNCTIONS
  // ============================================

  const fetchStorageUsage = useCallback(async () => {
    setIsLoadingStorage(true);
    try {
      const res = await fetch(`${API_URL}/admin/storage`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStorageUsage(data.storage);
      }
    } catch (error) {
      console.error("Error fetching storage:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  }, [getAuthHeaders]);

  const runCleanup = useCallback(async () => {
    setIsRunningCleanup(true);
    setCleanupResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/maintenance/cleanup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ monthsOld: parseInt(cleanupMonths) }),
      });
      if (res.ok) {
        const data = await res.json();
        setCleanupResult(data.result);
        setStorageUsage(data.storage);
      }
    } catch (error) {
      console.error("Error running cleanup:", error);
    } finally {
      setIsRunningCleanup(false);
    }
  }, [getAuthHeaders, cleanupMonths]);

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
          is_box: newItemForm.is_box,
          box_category: newItemForm.is_box ? newItemForm.box_category : null,
          box_size: newItemForm.is_box ? parseInt(newItemForm.box_size) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(prev => [...prev, data.product]);
        setShowAddItemDialog(false);
        setNewItemForm({ name: "", description: "", price: "", category: "cookies", image_path: "", is_box: false, box_category: "cookies", box_size: "6" });
        setUploadedImagePreview(null);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAddingItem(false);
    }
  }, [getAuthHeaders, newItemForm]);

  // Image upload handler for new item
  const handleImageUpload = useCallback(async (file: File, isEdit: boolean = false) => {
    const category = isEdit ? editItemForm.category : newItemForm.category;
    if (!category) {
      alert("Please select a category first");
      return;
    }
    
    if (isEdit) {
      setIsUploadingEditImage(true);
    } else {
      setIsUploadingImage(true);
    }
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/products/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setEditItemForm(prev => ({ ...prev, image_path: data.image_path }));
          setEditImagePreview(URL.createObjectURL(file));
        } else {
          setNewItemForm(prev => ({ ...prev, image_path: data.image_path }));
          setUploadedImagePreview(URL.createObjectURL(file));
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      if (isEdit) {
        setIsUploadingEditImage(false);
      } else {
        setIsUploadingImage(false);
      }
    }
  }, [newItemForm.category, editItemForm.category]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent, isEdit: boolean = false) => {
    e.preventDefault();
    if (isEdit) {
      setIsDraggingEdit(false);
    } else {
      setIsDragging(false);
    }
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, isEdit);
    }
  }, [handleImageUpload]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, isEdit);
    }
  }, [handleImageUpload]);

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

  // Create category inline (from Add/Edit item dialog)
  const createCategoryInline = useCallback(async (categoryName: string, forEdit: boolean = false) => {
    if (!categoryName.trim()) {
      alert("Please enter a category name");
      return;
    }
    
    // Generate slug from name
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
    
    setIsAddingCategory(true);
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: categoryName, slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => [...prev, data.category]);
        // Set the new category as selected
        if (forEdit) {
          setEditItemForm(prev => ({ ...prev, category: data.category.slug }));
        } else {
          setNewItemForm(prev => ({ ...prev, category: data.category.slug }));
        }
        setNewCategoryInput("");
        setShowNewCategoryInput(false);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsAddingCategory(false);
    }
  }, [getAuthHeaders]);

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

  // Fetch storage usage when switching to analytics tab
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchStorageUsage();
    }
  }, [activeTab, fetchStorageUsage]);

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

  const updatePaymentStatus = useCallback(
    async (orderId: string, status: string, balanceMethod?: string) => {
      try {
        await fetch(`${API_URL}/admin/orders/${orderId}/payment-status`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status, balanceMethod }),
        });
        fetchData();
      } catch (error) {
        console.error("Error updating payment status:", error);
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

  const sendReply = useCallback(
    async () => {
      if (!replyingToMessage || !replyText.trim()) return;
      
      setIsSendingReply(true);
      try {
        const response = await fetch(`${API_URL}/admin/messages/${replyingToMessage.id}/reply`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reply: replyText.trim() }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to send reply");
        }
        
        // Close dialog and reset
        setShowReplyDialog(false);
        setReplyingToMessage(null);
        setReplyText("");
        fetchData();
      } catch (error) {
        console.error("Error sending reply:", error);
        alert("Failed to send reply. Please try again.");
      } finally {
        setIsSendingReply(false);
      }
    },
    [replyingToMessage, replyText, getAuthHeaders, fetchData]
  );

  const formatDate = (dateStr: string) => {
    return parseTimestamp(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return parseTimestamp(dateStr).toLocaleTimeString("en-US", {
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <nav className="flex lg:flex-col gap-2">
                <Button
                  variant={activeTab === "analytics" ? "default" : "ghost"}
                  onClick={() => { setActiveTab("analytics"); fetchData(); }}
                  className="justify-start gap-3 w-full"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden lg:inline">Analytics</span>
                </Button>
                <Button
                  variant={activeTab === "orders" ? "default" : "ghost"}
                  onClick={() => { setActiveTab("orders"); fetchData(); }}
                  className="justify-start gap-3 w-full"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden lg:inline">Orders</span>
                  <span className="ml-auto bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
                </Button>
                <Button
                  variant={activeTab === "messages" ? "default" : "ghost"}
                  onClick={() => { setActiveTab("messages"); fetchData(); }}
                  className="justify-start gap-3 w-full"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden lg:inline">Messages</span>
                  {stats && stats.unreadMessages > 0 && (
                    <span className="ml-auto bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.unreadMessages}</span>
                  )}
                </Button>
                <Button
                  variant={activeTab === "devices" ? "default" : "ghost"}
                  onClick={() => { setActiveTab("devices"); fetchData(); }}
                  className="justify-start gap-3 w-full"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden lg:inline">Devices</span>
                </Button>
                <Button
                  variant={activeTab === "menu" ? "default" : "ghost"}
                  onClick={() => { setActiveTab("menu"); fetchData(); }}
                  className="justify-start gap-3 w-full"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="hidden lg:inline">Menu</span>
                </Button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

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
                          {statusLabels[order.order_status] || order.order_status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.payment_status === "deposit_paid"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.payment_status === "paid" 
                            ? "💰 Fully Paid" 
                            : order.payment_status === "deposit_paid"
                            ? "💳 Deposit Paid"
                            : "⏳ Unpaid"}
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
                      {/* Payment Breakdown */}
                      {order.deposit_amount > 0 && (
                        <div className="text-xs mt-1 space-y-0.5">
                          <p className="text-green-600">
                            ✓ Deposit: ${order.deposit_amount.toFixed(2)} ({order.deposit_method || order.payment_method})
                          </p>
                          {order.payment_status === "paid" ? (
                            <p className="text-green-600">
                              ✓ Balance: ${(order.total - order.deposit_amount).toFixed(2)} ({order.balance_method || 'Paid'})
                            </p>
                          ) : order.remaining_balance > 0 && (
                            <p className="text-amber-600">
                              ○ Due: ${order.remaining_balance.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Show payment method for orders without deposit */}
                      {order.deposit_amount === 0 && order.payment_status === "paid" && order.balance_method && (
                        <div className="text-xs mt-1">
                          <p className="text-green-600">
                            ✓ Paid: ${order.total.toFixed(2)} ({order.balance_method})
                          </p>
                        </div>
                      )}
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
                        <div key={idx} className="text-sm">
                          <div className="flex justify-between">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-gray-600">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {/* Display box items if this is a box product */}
                          {item.isBox && item.boxItems && item.boxItems.length > 0 && (
                            <p className="text-xs text-primary ml-2 mt-0.5">
                              Contains: {(() => {
                                const counts = item.boxItems.reduce((acc: Record<string, number>, bi: { id: string; name: string }) => {
                                  acc[bi.name] = (acc[bi.name] || 0) + 1;
                                  return acc;
                                }, {});
                                return Object.entries(counts)
                                  .map(([name, count]) => count > 1 ? `${name} ×${count}` : name)
                                  .join(', ');
                              })()}
                            </p>
                          )}
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
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="ready">✅ Ready</SelectItem>
                        <SelectItem value="picked_up">📦 Picked Up</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Payment Status Control */}
                    <Select
                      value={order.payment_status === "paid" 
                        ? `paid_${order.balance_method || 'Cash'}` 
                        : order.payment_status}
                      onValueChange={(value) => {
                        if (value.startsWith('paid_')) {
                          const method = value.replace('paid_', '');
                          updatePaymentStatus(order.id, 'paid', method);
                        } else {
                          updatePaymentStatus(order.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className={`w-[180px] ${
                        order.payment_status === "paid" 
                          ? "bg-green-50 border-green-200" 
                          : order.payment_status === "deposit_paid"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Unpaid</SelectItem>
                        <SelectItem value="deposit_paid">💳 Deposit Paid</SelectItem>
                        <SelectItem value="paid_Cash">💰 Paid (Cash)</SelectItem>
                        <SelectItem value="paid_PayPal">💰 Paid (PayPal)</SelectItem>
                        <SelectItem value="paid_Venmo">💰 Paid (Venmo)</SelectItem>
                      </SelectContent>
                    </Select>

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
                        {message.replied_at && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Replied
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
                      onClick={() => {
                        setReplyingToMessage(message);
                        setReplyText("");
                        setShowReplyDialog(true);
                      }}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Reply
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
                              Registered: {parseTimestamp(device.created_at).toLocaleDateString()} via {device.registered_via}
                              {device.last_used && (
                                <> • Last used: {parseTimestamp(device.last_used).toLocaleDateString()}</>
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
            {/* Seasonal Themes Section */}
            <SeasonalThemesManager categories={categories} />
            
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
                  <Select value={menuFilter} onValueChange={(v) => setMenuFilter(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {categoriesWithItems.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                      {categoriesWithItems.length === 0 && (
                        <>
                          <SelectItem value="cookies">Cookies</SelectItem>
                          <SelectItem value="cupcakes">Cupcakes</SelectItem>
                          <SelectItem value="cakepops">Cake Pops</SelectItem>
                        </>
                      )}
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
                  {/* Get unique categories from menu items or use loaded categories */}
                  {(() => {
                    const categoryList = categories.length > 0 
                      ? categories.map(c => c.slug) 
                      : [...new Set(menuItems.map(item => item.category))];
                    
                    return categoryList.map((categorySlug) => {
                      if (menuFilter !== "all" && menuFilter !== categorySlug) return null;
                      const categoryItems = menuItems.filter(item => item.category === categorySlug);
                      if (categoryItems.length === 0 && menuFilter === "all") return null;
                      
                      // Get category name from categories array or format slug
                      const categoryObj = categories.find(c => c.slug === categorySlug);
                      const categoryLabel = categoryObj?.name || 
                        (categorySlug === "cakepops" ? "Cake Pops" : categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
                      
                      return (
                        <div key={categorySlug}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-700">{categoryLabel}</h3>
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
                                {/* Product Image Thumbnail */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {getImageUrl(item.image_path) ? (
                                    <img
                                      src={getImageUrl(item.image_path)!}
                                      alt={item.name}
                                      className={`w-full h-full object-cover ${!item.is_available && 'opacity-50'}`}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <UtensilsCrossed className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium ${!item.is_available && 'text-gray-500'}`}>
                                    {item.name}
                                  </p>
                                  <p className="text-sm text-gray-500 max-w-md truncate">
                                    {item.description}
                                  </p>
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
                                    setEditImagePreview(null);
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
                  });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Overview Stats - Always visible */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm border border-blue-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">All-Time Orders</p>
                      <p className="text-3xl font-black text-blue-900">{stats.totalOrders.toLocaleString()}</p>
                      <p className="text-xs text-blue-500 mt-1">orders fulfilled 🎉</p>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 shadow-sm border border-green-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Total Revenue</p>
                      <p className="text-3xl font-black text-green-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-green-500 mt-1">lifetime earnings 💰</p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-5 shadow-sm border border-yellow-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600 mb-1">Pending Orders</p>
                      <p className="text-3xl font-black text-amber-900">{stats.pendingOrders.toLocaleString()}</p>
                      <p className="text-xs text-amber-500 mt-1">needs attention ⏳</p>
                    </div>
                    <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-5 shadow-sm border border-pink-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600 mb-1">Unread Messages</p>
                      <p className="text-3xl font-black text-pink-900">{stats.unreadMessages.toLocaleString()}</p>
                      <p className="text-xs text-pink-500 mt-1">customer inquiries 💬</p>
                    </div>
                    <div className="p-3 bg-pink-500 rounded-xl shadow-lg">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Period Analytics</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={analyticsPeriod === "week" ? "default" : "outline"}
                  onClick={() => setAnalyticsPeriod("week")}
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  variant={analyticsPeriod === "month" ? "default" : "outline"}
                  onClick={() => setAnalyticsPeriod("month")}
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={analyticsPeriod === "year" ? "default" : "outline"}
                  onClick={() => setAnalyticsPeriod("year")}
                >
                  Year
                </Button>
              </div>
            </div>

            {!analyticsData ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                No order data available for analytics
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Paid Revenue</p>
                        <p className="text-2xl font-bold">${analyticsData.currentRevenue.toFixed(2)}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${analyticsData.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {analyticsData.revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(analyticsData.revenueChange).toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Period Orders</p>
                        <p className="text-2xl font-bold">{analyticsData.currentOrderCount}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${analyticsData.orderChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {analyticsData.orderChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(analyticsData.orderChange).toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg Order Value</p>
                        <p className="text-2xl font-bold">${analyticsData.avgOrderValue.toFixed(2)}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${analyticsData.avgOrderChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {analyticsData.avgOrderChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(analyticsData.avgOrderChange).toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <p className="text-2xl font-bold">
                          {analyticsData.paidOrders + analyticsData.depositPaidOrders + analyticsData.unpaidOrders > 0
                            ? (((analyticsData.paidOrders + analyticsData.depositPaidOrders) / (analyticsData.paidOrders + analyticsData.depositPaidOrders + analyticsData.unpaidOrders)) * 100).toFixed(0)
                            : 0}%
                        </p>
                        <p className="text-xs text-gray-400">deposits received</p>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-right">
                        <span className="text-green-600">✓ {analyticsData.paidOrders} fully paid</span>
                        <span className="text-blue-600">◐ {analyticsData.depositPaidOrders} deposit</span>
                        <span className="text-yellow-600">○ {analyticsData.unpaidOrders} unpaid</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Over Time */}
                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                      Paid Revenue Over Time
                    </h3>
                    <div className="h-64">
                      {analyticsData.revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData.revenueChartData}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                            <Tooltip
                              formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#f472b6"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          No data for this period
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Orders Over Time */}
                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      Orders Over Time
                    </h3>
                    <div className="h-64">
                      {analyticsData.revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                              formatter={(value: number) => [value, "Orders"]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Bar dataKey="orders" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          No data for this period
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Status Breakdown */}
                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-violet-500" />
                      Order Status Breakdown
                    </h3>
                    <div className="h-64">
                      {analyticsData.statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={analyticsData.statusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analyticsData.statusChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [value, name]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          No data for this period
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Category Performance */}
                  <motion.div
                    className="bg-white rounded-xl p-5 shadow-sm border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      Revenue by Category
                    </h3>
                    <div className="h-64">
                      {analyticsData.categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.categoryChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                            <Tooltip
                              formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                              {analyticsData.categoryChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          No data for this period
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Top Selling Products */}
                <motion.div
                  className="bg-white rounded-xl p-5 shadow-sm border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Top Selling Products
                  </h3>
                  {analyticsData.topProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Product</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Qty Sold</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.topProducts.map((product, index) => (
                            <tr key={index} className="border-b last:border-0">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-gray-800">{product.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right text-gray-600">{product.quantity}</td>
                              <td className="py-3 px-3 text-right font-medium text-gray-800">${product.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      No product data for this period
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {/* Storage & Maintenance Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Storage & Maintenance
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Storage Usage Card */}
                <motion.div
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      Database Storage
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={fetchStorageUsage}
                      disabled={isLoadingStorage}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  {isLoadingStorage ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : storageUsage ? (
                    <div className="space-y-4">
                      {/* Server Disk Space */}
                      {storageUsage.diskSpace && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Server Disk</span>
                            <span>{storageUsage.diskSpace.usedPercent}% used</span>
                          </div>
                          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                storageUsage.diskSpace.usedPercent > 90 ? 'bg-red-500' :
                                storageUsage.diskSpace.usedPercent > 75 ? 'bg-amber-500' :
                                'bg-gradient-to-r from-green-400 to-emerald-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${storageUsage.diskSpace.usedPercent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">
                              {formatBytes(storageUsage.diskSpace.free)} free
                            </span>
                            <span className="text-gray-800 font-medium">
                              {formatBytes(storageUsage.diskSpace.total)} total
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Database Size */}
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-indigo-700">Database Size</span>
                          <span className="text-lg font-bold text-indigo-600">
                            {storageUsage.formattedSize}
                          </span>
                        </div>
                        {storageUsage.diskSpace && (
                          <p className="text-xs text-indigo-500 mt-1">
                            {((storageUsage.totalSize / storageUsage.diskSpace.total) * 100).toFixed(4)}% of server disk
                          </p>
                        )}
                      </div>
                      
                      {/* Table Counts */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(storageUsage.tableCounts)
                          .filter(([name]) => ['orders', 'products', 'contact_messages', 'order_analytics'].includes(name))
                          .map(([name, count]) => (
                            <div key={name} className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-gray-600 capitalize">{name.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-800">{count.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Unable to load storage info</p>
                  )}
                </motion.div>

                {/* Cleanup Card */}
                <motion.div
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Trash2 className="w-4 h-4 text-amber-500" />
                    Data Cleanup
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Aggregate old orders into summaries and delete detailed data. 
                    Analytics will be preserved!
                  </p>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Label className="text-sm whitespace-nowrap">Delete orders older than:</Label>
                    <Select value={cleanupMonths} onValueChange={setCleanupMonths}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => setShowCleanupDialog(true)}
                    variant="outline"
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    disabled={isRunningCleanup}
                  >
                    {isRunningCleanup ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Cleanup...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Run Cleanup
                      </>
                    )}
                  </Button>
                  
                  {cleanupResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Aggregated {cleanupResult.aggregated} months, deleted {cleanupResult.deleted} orders
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </div>
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
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createCategoryInline(newCategoryInput, false);
                          }
                          if (e.key === 'Escape') {
                            setShowNewCategoryInput(false);
                            setNewCategoryInput("");
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => createCategoryInline(newCategoryInput, false)}
                        disabled={isAddingCategory}
                      >
                        {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryInput("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      value={newItemForm.category} 
                      onValueChange={(v) => {
                        if (v === "__new__") {
                          setShowNewCategoryInput(true);
                        } else {
                          setNewItemForm(prev => ({ ...prev, category: v }));
                        }
                      }}
                    >
                      <SelectTrigger id="new-item-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        {/* Fallback if no categories loaded */}
                        {categories.length === 0 && (
                          <>
                            <SelectItem value="cookies">Cookies</SelectItem>
                            <SelectItem value="cupcakes">Cupcakes</SelectItem>
                            <SelectItem value="cakepops">Cake Pops</SelectItem>
                          </>
                        )}
                        <SelectItem value="__new__" className="text-primary font-medium">
                          <span className="flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add New Category
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Box Configuration */}
              <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="new-item-is-box"
                    checked={newItemForm.is_box}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, is_box: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="new-item-is-box" className="text-sm font-medium cursor-pointer">
                    This is a "Build Your Own Box" product
                  </Label>
                </div>
                {newItemForm.is_box && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="new-box-category" className="text-xs">Items Category</Label>
                      <Select 
                        value={newItemForm.box_category} 
                        onValueChange={(v) => setNewItemForm(prev => ({ ...prev, box_category: v }))}
                      >
                        <SelectTrigger id="new-box-category" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Show all categories except the selected product category and boxes */}
                          {categoriesWithItems
                            .filter(cat => cat.slug !== newItemForm.category && cat.slug !== 'boxes')
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.slug}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          {/* Fallback if no categories loaded */}
                          {categoriesWithItems.filter(cat => cat.slug !== newItemForm.category && cat.slug !== 'boxes').length === 0 && (
                            <>
                              {newItemForm.category !== 'cookies' && <SelectItem value="cookies">Cookies</SelectItem>}
                              {newItemForm.category !== 'cupcakes' && <SelectItem value="cupcakes">Cupcakes</SelectItem>}
                              {newItemForm.category !== 'cakepops' && <SelectItem value="cakepops">Cake Pops</SelectItem>}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Category of items customers can choose</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-box-size" className="text-xs">Box Size</Label>
                      <Input
                        id="new-box-size"
                        type="number"
                        min="1"
                        max="24"
                        value={newItemForm.box_size}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, box_size: e.target.value }))}
                        className="h-9"
                      />
                      <p className="text-xs text-gray-500">Number of items in the box</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => handleDrop(e, false)}
                >
                  {isUploadingImage ? (
                    <div className="py-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                    </div>
                  ) : uploadedImagePreview || newItemForm.image_path ? (
                    <div className="space-y-2 overflow-hidden">
                      <img 
                        src={uploadedImagePreview || getImageUrl(newItemForm.image_path) || ''} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-xs text-gray-500 truncate max-w-full px-2">{newItemForm.image_path}</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewItemForm(prev => ({ ...prev, image_path: "" }));
                          setUploadedImagePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600 mt-2">
                        Drag & drop an image here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, false)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddItemDialog(false);
                setShowNewCategoryInput(false);
                setNewCategoryInput("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={addNewItem} 
                disabled={
                  isAddingItem || 
                  showNewCategoryInput || 
                  !newItemForm.name.trim() || 
                  !newItemForm.price || 
                  !newItemForm.category ||
                  parseFloat(newItemForm.price) <= 0
                }
                title={
                  showNewCategoryInput 
                    ? "Please save the new category first" 
                    : !newItemForm.name.trim() 
                    ? "Name is required"
                    : !newItemForm.price || parseFloat(newItemForm.price) <= 0
                    ? "Valid price is required"
                    : !newItemForm.category
                    ? "Category is required"
                    : ""
                }
              >
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
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createCategoryInline(newCategoryInput, true);
                          }
                          if (e.key === 'Escape') {
                            setShowNewCategoryInput(false);
                            setNewCategoryInput("");
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => createCategoryInline(newCategoryInput, true)}
                        disabled={isAddingCategory}
                      >
                        {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryInput("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      value={editItemForm.category} 
                      onValueChange={(v) => {
                        if (v === "__new__") {
                          setShowNewCategoryInput(true);
                        } else {
                          setEditItemForm(prev => ({ ...prev, category: v }));
                        }
                      }}
                    >
                      <SelectTrigger id="edit-item-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        {categories.length === 0 && (
                          <>
                            <SelectItem value="cookies">Cookies</SelectItem>
                            <SelectItem value="cupcakes">Cupcakes</SelectItem>
                            <SelectItem value="cakepops">Cake Pops</SelectItem>
                          </>
                        )}
                        <SelectItem value="__new__" className="text-primary font-medium">
                          <span className="flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add New Category
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDraggingEdit 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingEdit(true); }}
                  onDragLeave={() => setIsDraggingEdit(false)}
                  onDrop={(e) => handleDrop(e, true)}
                >
                  {isUploadingEditImage ? (
                    <div className="py-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                    </div>
                  ) : editImagePreview || editItemForm.image_path ? (
                    <div className="space-y-2 overflow-hidden">
                      <img 
                        src={editImagePreview || getImageUrl(editItemForm.image_path) || ''} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-xs text-gray-500 truncate max-w-full px-2">{editItemForm.image_path}</p>
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>Change Image</span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, true)}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600 mt-2">
                        Drag & drop an image here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, true)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditItemDialog(false);
                setShowNewCategoryInput(false);
                setNewCategoryInput("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={saveEditedItem} 
                disabled={
                  isSavingItem || 
                  showNewCategoryInput || 
                  !editItemForm.name.trim() || 
                  !editItemForm.price || 
                  !editItemForm.category ||
                  parseFloat(editItemForm.price) <= 0
                }
                title={
                  showNewCategoryInput 
                    ? "Please save the new category first" 
                    : !editItemForm.name.trim() 
                    ? "Name is required"
                    : !editItemForm.price || parseFloat(editItemForm.price) <= 0
                    ? "Valid price is required"
                    : !editItemForm.category
                    ? "Category is required"
                    : ""
                }
              >
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
                Share this code with someone to register their device. It expires in 15 minutes and can only be used once.
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

        {/* Reply to Message Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={(open) => {
          setShowReplyDialog(open);
          if (!open) {
            setReplyingToMessage(null);
            setReplyText("");
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Reply to Message
              </DialogTitle>
              <DialogDescription>
                Send a reply to {replyingToMessage?.name} ({replyingToMessage?.email})
              </DialogDescription>
            </DialogHeader>
            
            {replyingToMessage && (
              <div className="space-y-4">
                {/* Original message preview */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">Original message:</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{replyingToMessage.message}</p>
                </div>
                
                {/* Reply textarea */}
                <div className="space-y-2">
                  <Label htmlFor="reply">Your Reply</Label>
                  <Textarea
                    id="reply"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReplyDialog(false);
                  setReplyingToMessage(null);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={sendReply}
                disabled={!replyText.trim() || isSendingReply}
              >
                {isSendingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cleanup Confirmation Dialog */}
        <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-amber-600" />
                Confirm Data Cleanup
              </DialogTitle>
              <DialogDescription>
                This will aggregate orders older than {cleanupMonths} months into monthly summaries 
                and delete the detailed order data. Analytics will be preserved. 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setShowCleanupDialog(false);
                  runCleanup();
                }}
                disabled={isRunningCleanup}
              >
                {isRunningCleanup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Yes, Run Cleanup"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
