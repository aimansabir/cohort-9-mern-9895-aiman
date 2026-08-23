import { clearStoredToken, getStoredToken, storeToken } from './tokenStorage';

describe('tokenStorage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('gives back nothing when no one has signed in', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('round trips a token', () => {
    storeToken('a-token');
    expect(getStoredToken()).toBe('a-token');
  });

  it('forgets the token on clear', () => {
    storeToken('a-token');
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });

  // Private browsing and blocked site data both make localStorage throw.
  // getStoredToken runs while AuthProvider renders, so a throw there used to
  // blank the whole app rather than just losing the session.
  describe('when the browser will not allow storage', () => {
    it('reads as signed out instead of throwing', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });

      expect(() => getStoredToken()).not.toThrow();
      expect(getStoredToken()).toBeNull();
    });

    it('carries on when the token cannot be saved', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });

      expect(() => storeToken('a-token')).not.toThrow();
    });

    it('carries on when the token cannot be removed', () => {
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });

      expect(() => clearStoredToken()).not.toThrow();
    });
  });
});
