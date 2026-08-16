// Email delivery for password reset codes.
//
// In production, reset codes must reach the user through a trusted email
// provider instead of being returned by the API. This module delivers the
// code via the Resend API when RESEND_API_KEY is configured.
//
// If no provider is configured, delivery reports failure; the caller decides
// whether to surface the code for local development.

const isProduction = () => process.env.NODE_ENV === 'production';

export interface ResetEmailResult {
  delivered: boolean;
  channel: 'resend' | 'console' | 'none';
}

export async function deliverResetCode(email: string, code: string): Promise<ResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const from = process.env.RESEND_FROM || 'SkillTrack <no-reply@skilltrack.app>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Your SkillTrack password reset code',
          text: `Your SkillTrack password reset code is ${code}. It expires in 15 minutes.\n\nIf you did not request this reset, you can ignore this email.`,
        }),
      });

      if (!res.ok) {
        console.error('[password-reset] Resend delivery failed:', res.status, await res.text().catch(() => ''));
        return { delivered: false, channel: 'none' };
      }
      return { delivered: true, channel: 'resend' };
    } catch (error) {
      console.error('[password-reset] Resend delivery error:', error);
      return { delivered: false, channel: 'none' };
    }
  }

  // No provider configured. The code is only exposed locally, never in production.
  if (!isProduction()) {
    console.log(`[password-reset] code for ${email}: ${code}`);
    return { delivered: true, channel: 'console' };
  }

  console.error('[password-reset] No email provider configured; reset code not delivered.');
  return { delivered: false, channel: 'none' };
}
