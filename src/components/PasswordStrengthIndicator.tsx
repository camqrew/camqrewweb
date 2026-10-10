import React from 'react';
import { Check, X } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRules?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRules = true,
}) => {
  if (!password) {
    return null;
  }

  const { score, level, color, checks } = evaluatePasswordStrength(password);

  const rulesList = [
    { label: 'At least 8 characters', met: checks.hasMinLength },
    { label: 'One uppercase letter (A-Z)', met: checks.hasUppercase },
    { label: 'One lowercase letter (a-z)', met: checks.hasLowercase },
    { label: 'One number (0-9)', met: checks.hasNumber },
    { label: 'One special character (!@#$...)', met: checks.hasSpecial },
  ];

  return (
    <div style={{ marginTop: '8px', marginBottom: '14px', width: '100%' }}>
      {/* Strength Bar & Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
          Password strength:
        </span>
        <span style={{ fontSize: '12px', color, fontWeight: 700 }}>
          {level}
        </span>
      </div>

      {/* 4-Segment Progress Bar (Flat, no glow, no strokes) */}
      <div style={{ display: 'flex', gap: '5px', height: '4px', width: '100%', marginBottom: showRules ? '10px' : '0' }}>
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              style={{
                flex: 1,
                borderRadius: '3px',
                backgroundColor: isActive ? color : 'rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.25s ease',
              }}
            />
          );
        })}
      </div>

      {/* Interactive Rules Checklist (Flat, zero strokes) */}
      {showRules && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', marginTop: '6px' }}>
          {rulesList.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                color: rule.met ? '#3fb668' : '#64748b',
                transition: 'color 0.2s ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: rule.met ? 'rgba(63, 182, 104, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: rule.met ? '#3fb668' : '#64748b',
                  flexShrink: 0,
                }}
              >
                {rule.met ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
              </span>
              <span>{rule.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
