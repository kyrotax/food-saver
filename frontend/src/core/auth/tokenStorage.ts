/**
 * tokenStorage.ts
 *
 * Lightweight in-memory token store.
 * Breaks the circular dependency:
 *   authStore → apiClient → authStore
 *
 * authStore calls setToken() after login/bootstrap.
 * apiClient calls getToken() in the request interceptor.
 * Neither file imports the other.
 */

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

export function onUnauthorized(callback: () => void): void {
  _onUnauthorized = callback;
}

export function triggerUnauthorized(): void {
  if (_onUnauthorized) {
    _onUnauthorized();
  }
}

