import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Check, X } from 'lucide-react';
import Input from '../ui/Input';
import ReCAPTCHA from 'react-google-recaptcha';
import Button from '../ui/Button';

const RegisterForm = ({
  onSubmit,
  loading = false,
  error = '',
}) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);

  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return { label: 'Weak', color: 'bg-error-500' };
    if (passwordStrength <= 2) return { label: 'Fair', color: 'bg-warning-500' };
    if (passwordStrength <= 3) return { label: 'Good', color: 'bg-primary-500' };
    return { label: 'Strong', color: 'bg-success-500' };
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password), text: 'Upper and lowercase letters' },
    { met: /\d/.test(formData.password), text: 'At least one number' },
    { met: /[^a-zA-Z0-9]/.test(formData.password), text: 'At least one special character' },
  ];

  const validateForm = () => {
    const errors = {};
    
    if (formData.displayName && formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!captchaToken) {
      // simple inline alert; replace with UI feedback as needed
      alert('Please complete the reCAPTCHA verification.');
      return;
    }
    if (validateForm()) {
      // Include captcha token in the submitted data
      onSubmit({ ...formData, captchaToken });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const strength = getStrengthLabel();

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* General Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl"
        >
          <p className="text-sm text-error-600 dark:text-error-400 text-center">
            {error}
          </p>
        </motion.div>
      )}

      {/* Display Name Field */}
      <Input
        id="displayName"
        type="text"
        label="Display Name"
        placeholder="John Doe"
        value={formData.displayName}
        onChange={(e) => handleChange('displayName', e.target.value)}
        error={formErrors.displayName}
        icon={<User className="w-5 h-5" />}
        disabled={loading}
        autoComplete="name"
        helperText="This is how others will see you"
      />

      {/* Email Field */}
      <Input
        id="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={formErrors.email}
        icon={<Mail className="w-5 h-5" />}
        disabled={loading}
        required
        autoComplete="email"
      />

      {/* Password Field */}
      <div>
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={formErrors.password}
          icon={<Lock className="w-5 h-5" />}
          disabled={loading}
          required
          autoComplete="new-password"
        />
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${strength.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className={`text-xs font-medium ${
                passwordStrength <= 1 ? 'text-error-500' :
                passwordStrength <= 2 ? 'text-warning-500' :
                passwordStrength <= 3 ? 'text-primary-500' :
                'text-success-500'
              }`}>
                {strength.label}
              </span>
            </div>
            
            {/* Password Requirements */}
            <div className="grid grid-cols-2 gap-1">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 text-xs ${
                    req.met ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {req.met ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>{req.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirm Password Field */}
      <Input
        id="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        error={formErrors.confirmPassword}
        icon={<Lock className="w-5 h-5" />}
        disabled={loading}
        required
        autoComplete="new-password"
        success={formData.confirmPassword && formData.password === formData.confirmPassword}
      />

      {/* Terms Agreement */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Privacy Policy
        </Link>
      </p>
      
      {/* reCAPTCHA */}
      <div className="my-4 flex justify-center">
        <ReCAPTCHA
          sitekey="YOUR_RECAPTCHA_SITE_KEY"
          onChange={(token) => setCaptchaToken(token)}
        />
      </div>
      {/* Display captcha error if not completed */}
      {!captchaToken && (
        <p className="text-sm text-error-600 text-center mb-2">Please verify you are not a robot.</p>
      )}
      
      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading || !captchaToken}
        className="h-12"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Create Account'
        )}
      </Button>
    </motion.form>
  );
};

export default RegisterForm;
