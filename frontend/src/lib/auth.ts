/**
 * Auth0 configuration stub.
 *
 * Uses @auth0/nextjs-auth0 — the SDK auto-reads env vars:
 *   AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL,
 *   AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
 *
 * RBAC Roles defined in Auth0 dashboard:
 *   - "creator"  → Access to Creator Dashboard (upload / process)
 *   - "brand"    → Access to Brand Dashboard (bid / analytics)
 */

// Re-export the SDK helpers so components import from a single place.
export {
    UserProvider,
    useUser,
    withPageAuthRequired,
} from "@auth0/nextjs-auth0/client";

/**
 * Helper to check a user's RBAC role from the JWT claims.
 */
export function hasRole(
    user: { [key: string]: unknown } | undefined,
    role: "creator" | "brand"
): boolean {
    if (!user) return false;

    const roles = (user["https://vpp.app/roles"] as string[]) || [];
    return roles.includes(role);
}
