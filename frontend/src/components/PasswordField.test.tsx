import { useState } from 'react';
import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import PasswordField from './PasswordField';

// The real field is controlled by its page, so the tests drive it the same
// way rather than leaving value frozen.
function Harness({ onChange }: { onChange?: (value: string) => void }): ReactElement {
  const [value, setValue] = useState('');

  return (
    <PasswordField
      id="password"
      value={value}
      placeholder="Enter your password"
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

function field(): HTMLInputElement {
  return screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
}

describe('PasswordField', () => {
  it('hides the password to begin with', () => {
    render(<Harness />);
    expect(field().type).toBe('password');
  });

  it('offers to show the password', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('shows the password when the eye is clicked', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Show password'));

    expect(field().type).toBe('text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('hides it again on a second click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Show password'));
    fireEvent.click(screen.getByLabelText('Hide password'));

    expect(field().type).toBe('password');
  });

  // Inside a form a button without an explicit type submits it, so toggling
  // the password would try to log you in.
  it('does not submit the form it sits in', () => {
    const onSubmit = jest.fn((event: React.FormEvent) => {
      event.preventDefault();
    });

    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    );
    fireEvent.click(screen.getByLabelText('Show password'));

    expect(screen.getByLabelText('Hide password')).toHaveAttribute('type', 'button');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports what was typed', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(field(), { target: { value: 'hunter22' } });

    expect(onChange).toHaveBeenCalledWith('hunter22');
    expect(field().value).toBe('hunter22');
  });

  it('keeps what was typed when the password is revealed', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: 'hunter22' } });
    fireEvent.click(screen.getByLabelText('Show password'));

    expect(field().value).toBe('hunter22');
  });

  it('passes signup validation through when it is given', () => {
    render(
      <PasswordField
        id="password"
        value=""
        placeholder="Create a password"
        onChange={() => undefined}
        minLength={8}
        pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
      />,
    );

    const input = screen.getByPlaceholderText('Create a password');
    expect(input).toHaveAttribute('minLength', '8');
    expect(input).toHaveAttribute('pattern');
  });

  // Login must not demand the signup rule, someone whose password predates
  // it still has to get in
  it('has no validation rule unless one is given', () => {
    render(<Harness />);
    expect(field()).not.toHaveAttribute('pattern');
    expect(field()).not.toHaveAttribute('minLength');
  });
});
