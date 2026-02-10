import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext'; // Updated import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (isLogin) {
      result = await signIn(email, password);
    } else {
      result = await signUp(name, email, password, companyName);
    }

    if (!result.error) {
      navigate('/dashboard', { replace: true });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Login' : 'Sign Up'} - Invoice App</title>
        <meta name="description" content="Login to manage your invoices." />
      </Helmet>
      <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
        <div className="hidden lg:block bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          {/* Animations kept simple for brevity but matching original style */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
            className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
            className="absolute -bottom-24 -right-16 w-96 h-96 bg-white/10 rounded-full"
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8" />
              <h1 className="text-3xl font-bold tracking-wider">Invoice App</h1>
            </div>
            <div className="mt-auto absolute bottom-12">
              <h2 className="text-4xl font-bold leading-tight">
                Streamline Your Invoicing Process.
              </h2>
              <p className="mt-4 text-lg text-blue-200">
                Effortlessly create, manage, and track your invoices all in one place.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md space-y-8"
          >
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {isLogin ? 'Sign in to your account' : 'Create a new account'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? 'Welcome back! Please enter your details.' : 'Get started by creating your account.'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4 rounded-md shadow-sm">
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="name" className="sr-only">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="relative block w-full appearance-none rounded-md border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm h-12"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyName" className="sr-only">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        className="relative block w-full appearance-none rounded-md border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm h-12"
                        placeholder="Company Name (Optional)"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email" className="sr-only">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full appearance-none rounded-md border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm h-12"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="password" className="sr-only">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    className="relative block w-full appearance-none rounded-md border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm h-12 pr-10"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Button type="submit" className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" disabled={loading}>
                  {loading ? (isLogin ? 'Signing in...' : 'Signing up...') : (isLogin ? 'Sign in' : 'Sign up')}
                </Button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;