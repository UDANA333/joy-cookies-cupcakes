import { memo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, AlertCircle, Eye, EyeOff, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dynamically determine API URL based on current host (for mobile access via network IP)
function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

const API_URL = getApiUrl();

const AdminLogin = memo(() => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceToken] = useState(() => localStorage.getItem('admin_device_token'));
  const [isDeviceValid, setIsDeviceValid] = useState<boolean | null>(null); // null = checking

  // Verify device token is actually valid in the database
  useEffect(() => {
    const verifyDevice = async () => {
      if (!deviceToken) {
        setIsDeviceValid(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/auth/check-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceToken }),
        });
        
        if (res.ok) {
          setIsDeviceValid(true);
        } else {
          // Token is invalid - clear it
          localStorage.removeItem('admin_device_token');
          setIsDeviceValid(false);
        }
      } catch (err) {
        // Network error - assume invalid for security
        setIsDeviceValid(false);
      }
    };
    
    verifyDevice();
  }, [deviceToken]);

  // Check if already logged in (must be before any conditional returns - React hooks rule)
  useEffect(() => {
    if (isDeviceValid !== true) return; // Only check if device is valid
    
    const token = localStorage.getItem('admin_token');
    if (token) {
      // Verify token is still valid
      fetch(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok && navigate('/joy-manage-2024/dashboard', { replace: true }))
        .catch(() => localStorage.removeItem('admin_token'));
    }
  }, [navigate, isDeviceValid]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and redirect
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      
      // SECURITY: Update device token (it's regenerated on each login)
      if (data.newDeviceToken) {
        localStorage.setItem('admin_device_token', data.newDeviceToken);
      }
      
      navigate('/joy-manage-2024/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, deviceToken, navigate]);

  // Show loading while checking device
  if (isDeviceValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Device not registered - show error
  if (!isDeviceValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Device Not Authorized</h1>
            <p className="text-gray-500 mb-6">This device is not registered for admin access. Please contact the administrator.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-500 mt-2">Joy Cookies & Cupcakes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@joycookiescupcakes.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
});

AdminLogin.displayName = "AdminLogin";

export default AdminLogin;
