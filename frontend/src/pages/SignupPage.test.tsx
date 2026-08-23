import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SignupPage from './SignupPage';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const signup = jest.fn();

function renderPage() {
  mockedUseAuth.mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    login: async () => undefined,
    signup,
    logout: async () => undefined,
  });

  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { value: 'Aiman' },
  });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'aiman@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Create a password'), {
    target: { value: 'GoodPass1' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
}

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signup.mockResolvedValue(undefined);
  });

  it('asks the visitor to create an account', () => {
    renderPage();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('offers a way to log in instead', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  // The rule is shown so it has to be enforced, otherwise the server
  // rejects something the form said was fine
  it('spells out the password rule and enforces it', () => {
    renderPage();

    expect(screen.getByText('At least 8 characters, with a letter and a number.')).toBeInTheDocument();

    const password = screen.getByPlaceholderText('Create a password');
    expect(password).toHaveAttribute('minLength', '8');
    expect(password).toHaveAttribute('pattern');
  });

  it('sends the name, email and password', async () => {
    renderPage();
    fillAndSubmit();

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith('Aiman', 'aiman@example.com', 'GoodPass1'),
    );
  });

  it('goes straight to the notes after signing up', async () => {
    renderPage();
    fillAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes'));
  });

  it('says it is working while the request is in flight', async () => {
    let release: () => void = () => undefined;
    signup.mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );

    renderPage();
    fillAndSubmit();

    expect(await screen.findByRole('button', { name: 'Creating account...' })).toBeDisabled();
    release();
  });

  // A duplicate email is the most likely failure here
  it('shows the message when the email is already taken', async () => {
    signup.mockRejectedValue(new ApiError('Email is already registered', 409));

    renderPage();
    fillAndSubmit();

    expect(await screen.findByText('Email is already registered')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
