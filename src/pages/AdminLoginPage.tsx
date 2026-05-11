import React, { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, User, Shield } from "lucide-react";
import adminData from "../data/adminData.json";

interface AdminLoginPageProps {
  onLogin: (success: boolean) => void;
}

export default function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call with delay
    setTimeout(() => {
      // Validate credentials against JSON data
      if (credentials.username === adminData.credentials.username && credentials.password === adminData.credentials.password) {
        onLogin(true);
      } else {
        setError("Username atau password salah");
      }
      setIsLoading(false);
    }, 1000);
  };

  const inputClass = "w-full bg-surface border border-surface-dark rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }} 
        transition={{ duration: 12, repeat: Infinity }} 
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" 
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2] }} 
        transition={{ duration: 15, repeat: Infinity }} 
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" 
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-accent" />
            </motion.div>
            <h1 className="font-display font-black text-primary text-3xl mb-2">Admin Login</h1>
            <p className="text-text-light text-sm">Masuk ke dashboard administrasi Wolio Hills</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className={`${inputClass} pl-10`}
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-text text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className={`${inputClass} pl-10 pr-10`}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error/10 border border-error/30 rounded-lg p-3 text-error text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold text-sm tracking-wider uppercase px-6 py-3.5 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Login"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
