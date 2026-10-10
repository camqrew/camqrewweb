export interface PasswordRuleChecks {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  isValid: boolean;
  checks: PasswordRuleChecks;
}

export const evaluatePasswordStrength = (password: string): PasswordStrengthResult => {
  const checks: PasswordRuleChecks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      level: 'Weak',
      color: '#64748b',
      isValid: false,
      checks,
    };
  }

  // Count criteria met
  let passedCount = 0;
  if (checks.hasMinLength) passedCount++;
  if (checks.hasUppercase) passedCount++;
  if (checks.hasLowercase) passedCount++;
  if (checks.hasNumber) passedCount++;
  if (checks.hasSpecial) passedCount++;

  let score = 0;
  let level: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = '#ef4444'; // Red

  if (!checks.hasMinLength) {
    // Shorter than 8 chars is always weak
    score = 1;
    level = 'Weak';
    color = '#ef4444';
  } else if (passedCount <= 2) {
    score = 1;
    level = 'Weak';
    color = '#ef4444';
  } else if (passedCount === 3) {
    score = 2;
    level = 'Fair';
    color = '#f97316'; // Orange
  } else if (passedCount === 4) {
    score = 3;
    level = 'Good';
    color = '#eab308'; // Amber
  } else {
    score = 4;
    level = 'Strong';
    color = '#3fb668'; // Camqrew Accent Green
  }

  // Minimum accepted for registration/reset: length >= 8 and at least 3 other rules
  const isValid = checks.hasMinLength && passedCount >= 4;

  return {
    score,
    level,
    color,
    isValid,
    checks,
  };
};
