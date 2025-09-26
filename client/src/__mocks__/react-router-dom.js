
export const useNavigate = vitest.fn();
export const useSearchParams = vitest.fn(() => [new URLSearchParams(), vitest.fn()]); // Mock for ResetPassword
export const Link = vitest.fn(({ to, children }) => <a href={to}>{children}</a>); // Simple mock for Link