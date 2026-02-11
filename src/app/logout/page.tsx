import { redirect } from "next/navigation";

/**
 * /logout - Clears session server-side and redirects to login.
 * Handles GET (e.g. link click) by redirecting to the logout API.
 */
export default function LogoutPage() {
  redirect("/api/auth/logout");
}
