import { memo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, Loader2, AlertCircle, CheckCircle, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dynamically determine API URL based on current host
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

// Get browser info for device identification
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  // Order matters! Check specific browsers BEFORE generic ones
  // Edge, Opera, and others are Chromium-based and include "Chrome" in UA
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/') || ua.includes('Edge')) browser = 'Edge';  // Edge uses "Edg/" in modern versions
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'; // Opera uses "OPR/"
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : /Android/.test(ua) ? 'Android' : /iOS|iPhone|iPad/.test(ua) ? 'iOS' : 'Unknown';
  
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}

const AdminSetup = memo(() => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isBootstrap, setIsBootstrap] = useState<boolean | null>(null);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [isExistingTokenValid, setIsExistingTokenValid] = useState<boolean | null>(null);

  // Check if device is already registered
  const existingToken = localStorage.getItem('admin_device_token');

  // Verify existing token is actually valid
  useEffect(() => {
    const verifyExistingToken = async () => {
      if (!existingToken) {
        setIsExistingTokenValid(false);
        return;
      }
      
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/auth/check-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceToken: existingToken }),
        });
        
        if (res.ok) {
          setIsExistingTokenValid(true);
        } else {
          // Token is invalid - clear it
          localStorage.removeItem('admin_device_token');
          setIsExistingTokenValid(false);
        }
      } catch (err) {
        // Network error - clear token to be safe
        localStorage.removeItem('admin_device_token');
        setIsExistingTokenValid(false);
      }
    };
    
    verifyExistingToken();
  }, [existingToken]);

  // Check bootstrap status on mount
  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log('Checking bootstrap at:', apiUrl);
        const response = await fetch(`${apiUrl}/auth/bootstrap-status`);
        const data = await response.json();
        setIsBootstrap(data.bootstrapAvailable);
        setError(null); // Clear any previous error
      } catch (err: any) {
        console.error('Failed to check bootstrap status:', err);
        setError(`Connection failed: ${err.message || 'Unable to reach server'}`);
        setIsBootstrap(false);
      } finally {
        setCheckingBootstrap(false);
      }
    };
    
    // Only check bootstrap if token is invalid or doesn't exist
    if (isExistingTokenValid === false) {
      checkBootstrap();
    } else if (isExistingTokenValid === true) {
      setCheckingBootstrap(false);
    }
  }, [isExistingTokenValid]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const browserInfo = getBrowserInfo();
      const apiUrl = getApiUrl();
      console.log('Registering device at:', apiUrl);
      
      const response = await fetch(`${apiUrl}/auth/register-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          deviceName: deviceName || `${browserInfo} - ${new Date().toLocaleDateString()}`,
          browserInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store device token
      localStorage.setItem('admin_device_token', data.deviceToken);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/joy-manage-2024', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, [code, deviceName, navigate]);

  // Show loading while verifying existing token
  if (isExistingTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExistingTokenValid && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Device Already Registered</h1>
            <p className="text-gray-500 mb-6">This device is already authorized for admin access.</p>
            <Button onClick={() => navigate('/joy-manage-2024')} className="w-full">
              Go to Admin Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (checkingBootstrap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Device Registered!</h1>
              <p className="text-gray-500">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  {isBootstrap ? (
                    <Sparkles className="w-8 h-8 text-primary" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isBootstrap ? 'First Time Setup' : 'Register Device'}
                </h1>
                <p className="text-gray-500 mt-2">
                  {isBootstrap 
                    ? 'Enter the bootstrap code to set up the first admin device' 
                    : 'Enter your one-time device code to register'}
                </p>
              </div>

              {isBootstrap && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Bootstrap Mode</p>
                      <p className="text-amber-700 mt-1">
                        This is the first device being registered. After setup, you can generate one-time codes for additional devices from the dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  <Label htmlFor="code">
                    {isBootstrap ? 'Bootstrap Code' : 'Device Code'}
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={isBootstrap ? "Enter bootstrap code" : "e.g., JOY-X7K9M2"}
                    required
                    autoComplete="off"
                    className="font-mono tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name (optional)</Label>
                  <Input
                    id="deviceName"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g., My iPhone, Office Computer"
                  />
                  <p className="text-xs text-gray-400">
                    Helps identify this device later. Default: {getBrowserInfo()}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !code}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Device'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
});

AdminSetup.displayName = "AdminSetup";

export default AdminSetup;
