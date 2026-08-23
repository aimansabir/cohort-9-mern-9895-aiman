import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from './LoginPage';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const login = jest.fn();

function renderPage() {
  mockedUseAuth.mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    login,
    signup: async () => undefined,
    logout: async () => undefined,
  });

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

function fillAndSubmit(email = 'aiman@example.com', password = 'GoodPass1') {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    login.mockResolvedValue(undefined);
  });

  it('greets the returning user', () => {
    renderPage();
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('offers a way to sign up instead', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  it('sends what was typed', async () => {
    renderPage();
    fillAndSubmit();

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith('aiman@example.com', 'GoodPass1'),
    );
  });

  it('goes to the notes once signed in', async () => {
    renderPage();
    fillAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes'));
  });

  it('says it is working while the request is in flight', async () => {
    let release: () => void = () => undefined;
    login.mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );

    renderPage();
    fillAndSubmit();

    expect(await screen.findByRole('button', { name: 'Logging in...' })).toBeDisabled();
    release();
  });

  describe('when the credentials are wrong', () => {
    it('shows the message the server sent', async () => {
      login.mockRejectedValue(new ApiError('Email or password is incorrect', 401));

      renderPage();
      fillAndSubmit();

      expect(await screen.findByText('Email or password is incorrect')).toBeInTheDocument();
    });

    it('stays on the page', async () => {
      login.mockRejectedValue(new ApiError('Email or password is incorrect', 401));

      renderPage();
      fillAndSubmit();

      await screen.findByText('Email or password is incorrect');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('lets you try again', async () => {
      login.mockRejectedValue(new ApiError('Email or password is incorrect', 401));

      renderPage();
      fillAndSubmit();

      await screen.findByText('Email or password is incorrect');
      expect(screen.getByRole('button', { name: 'Log in' })).not.toBeDisabled();
    });
  });

  // Anything that is not an ApiError is unexpected, so the raw message is
  // not something to put in front of someone
  it('hides an unexpected error behind a plain message', async () => {
    login.mockRejectedValue(new TypeError('reading undefined of undefined'));

    renderPage();
    fillAndSubmit();

    expect(
      await screen.findByText('Something went wrong, please try again'),
    ).toBeInTheDocument();
  });
});
