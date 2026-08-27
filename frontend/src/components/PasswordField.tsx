import { useState } from 'react';
import type { ReactElement } from 'react';

import { EyeIcon, EyeOffIcon } from './icons';

interface PasswordFieldProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  // Signup passes these so the browser checks the rule shown under the
  // field. Login leaves them out, because an existing password only has
  // to be non-empty.
  minLength?: number;
  pattern?: string;
  title?: string;
}

// Password input with a button that switches the field between password
// and text, so people can check what they typed.
export default function PasswordField({
  id,
  value,
  placeholder,
  onChange,
  minLength,
  pattern,
  title,
}: PasswordFieldProps): ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        pattern={pattern}
        title={title}
        required
      />

      <button
        type="button"
        className="password-toggle"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
