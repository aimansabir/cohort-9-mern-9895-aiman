import { useState } from 'react';
import type { ReactElement } from 'react';

import { EyeIcon, EyeOffIcon } from './icons';

interface PasswordFieldProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

// Password input with a button that switches the field between password
// and text, so people can check what they typed.
export default function PasswordField({
  id,
  value,
  placeholder,
  onChange,
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
