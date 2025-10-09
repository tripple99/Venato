const Mailtemplates = {
  forgotPasswordTemplate:`
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f9f9f9; color:#333;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9f9f9; padding:20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 8px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#2b2b2b;">Password Reset</h2>
              <p style="margin:8px 0 0; font-size:14px; color:#555;">Use the OTP below to reset your password</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 0;">
              <div style="display:inline-block; padding:12px 24px; background:#007bff; color:#fff; font-size:22px; letter-spacing:4px; border-radius:8px; font-weight:bold;">
                {{OTP_CODE}}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0; font-size:13px; color:#777;">This code will expire in 10 minutes.</p>
              <p style="margin:8px 0 0; font-size:13px; color:#777;">If you didn’t request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
        <p style="margin-top:15px; font-size:12px; color:#aaa;">© 2025 Venato Ventures. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>

  `
}

export default Mailtemplates;