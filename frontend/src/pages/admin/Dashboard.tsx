import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "messages">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const user = localStorage.getItem("admin_user");

    if (!token) {
      navigate("/admin", { replace: true });
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
        if (ordersRes.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin", { replace: true });
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
    navigate("/admin", { replace: true });
  }, [navigate]);

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
              <span className="text-sm text-gray-500">
                {adminUser?.name || adminUser?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        <div className="flex gap-2 mb-6">
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
      </main>
    </div>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
