/**
 * Auth0 v4 helpers for VPP.
 *
 * Server-side: use `auth0` from "@/lib/auth0" for session checks.
 * Client-side: this file re-exports helpers for components.
 *
 * RBAC Roles defined in Auth0 dashboard:
 *   - "creator" → Access to Creator Dashboard (upload / process)
 *   - "brand"   → Access to Brand Dashboard (bid / analytics)
 *
 * Auto-mounted routes by the middleware:
 *   /auth/login    — Redirects to Auth0 login page
 *   /auth/logout   — Logs out the user
 *   /auth/callback — Handles the OAuth callback
 *   /auth/profile  — Returns the user profile as JSON
 */

/**
 * Helper to check a user's RBAC role from the session claims.
 */
export function hasRole(
    user: { [key: string]: unknown } | undefined,
    role: "creator" | "brand"
): boolean {
    if (!user) return false;

    const roles = (user["https://vpp.app/roles"] as string[]) || [];
    return roles.includes(role);
}
