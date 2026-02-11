import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Rush <noreply@rushapp.com>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!resend) {
    console.error("RESEND_API_KEY not set; cannot send email");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your Rush password",
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color: #000; font-weight: 600;">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error("Failed to send reset email:", error);
    return false;
  }
  return true;
}
