import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'TradeX <onboarding@resend.dev>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your TradeX password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset your password</title>
        </head>
        <body style="margin:0;padding:0;background:#f7fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#00d4aa,#00a88e);padding:32px 40px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;margin-right:12px;">
                            <span style="color:#ffffff;font-size:18px;font-weight:700;">↗</span>
                          </td>
                          <td style="padding-left:12px;">
                            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">TradeX</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a202c;">Reset your password</h1>
                      <p style="margin:0 0 24px;font-size:15px;color:#718096;line-height:1.6;">
                        We received a request to reset your TradeX password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                        <tr>
                          <td style="background:linear-gradient(135deg,#00d4aa,#00a88e);border-radius:8px;">
                            <a href="${resetLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 8px;font-size:13px;color:#a0aec0;">Or copy and paste this link into your browser:</p>
                      <p style="margin:0 0 32px;font-size:13px;color:#00d4aa;word-break:break-all;">${resetLink}</p>
                      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
                      <p style="margin:0;font-size:13px;color:#a0aec0;line-height:1.6;">
                        If you didn't request a password reset, you can safely ignore this email — your account is secure and your password won't be changed.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f7fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center;">
                        © 2026 TradeX. Built for Frostbyte Hackathon 2026.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  })

  if (error) {
    console.error('[Email] Failed to send password reset email:', error)
    throw new Error('Failed to send email')
  }

  console.log('[Email] Password reset email sent to:', email, '| ID:', data.id)
  return data
}
