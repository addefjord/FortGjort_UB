/**
 * Password policy validation (client-side enforcement matching Supabase Dashboard settings)
 */

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    label: 'Minst 8 tegn',
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: 'lowercase',
    label: 'En liten bokstav (a-z)',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'uppercase',
    label: 'En stor bokstav (A-Z)',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'digit',
    label: 'Ett tall (0-9)',
    test: (pwd) => /\d/.test(pwd),
  },
];

/**
 * Validates password against all requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  failedRequirements: PasswordRequirement[];
} {
  const failedRequirements = PASSWORD_REQUIREMENTS.filter((req) => !req.test(password));
  return {
    valid: failedRequirements.length === 0,
    failedRequirements,
  };
}

/**
 * Get array of requirement pass/fail status for UI display
 */
export function getPasswordRequirementStatus(password: string): Array<{
  requirement: PasswordRequirement;
  passed: boolean;
}> {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    requirement: req,
    passed: req.test(password),
  }));
}
