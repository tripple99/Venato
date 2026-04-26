const Mailtemplates = {
  // REDESIGNED: Forgot Password
  forgotPasswordTemplate: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
      .container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      .header { background-color: #2E7D32; padding: 40px 20px; text-align: center; color: white; }
      .content { padding: 40px; text-align: center; }
      .otp-box { display: inline-block; padding: 16px 32px; background: #E8F5E9; color: #2E7D32; font-size: 32px; letter-spacing: 6px; border-radius: 12px; font-weight: 700; margin: 24px 0; border: 2px dashed #2E7D32; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #757575; background: #fafafa; }
      h1 { margin: 0; font-size: 24px; }
      p { color: #546e7a; line-height: 1.6; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Venato</h1>
      </div>
      <div class="content">
        <h2 style="color: #263238; margin-bottom: 8px;">Reset Your Password</h2>
        <p>You requested a password reset. Use the code below to proceed. This code is valid for 10 minutes.</p>
        <div class="otp-box">{{OTP_CODE}}</div>
        <p style="font-size: 13px;">If you did not request this, please ignore this email or contact support if you have concerns.</p>
      </div>
      <div class="footer">
        <p>© 2026 Venato. Empowering Agricultural Trade.</p>
      </div>
    </div>
  </body>
  </html>
  `,

  // NEW: User Verification (Registration OTP)
  userVerificationTemplate: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
      .container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      .header { background-color: #2E7D32; padding: 40px 20px; text-align: center; color: white; }
      .content { padding: 40px; text-align: center; }
      .otp-box { display: inline-block; padding: 16px 32px; background: #E8F5E9; color: #2E7D32; font-size: 32px; letter-spacing: 6px; border-radius: 12px; font-weight: 700; margin: 24px 0; border: 2px dashed #2E7D32; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #757575; background: #fafafa; }
      h1 { margin: 0; font-size: 24px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Venato</h1>
      </div>
      <div class="content">
        <h2 style="color: #263238;">Verify Your Account</h2>
        <p style="color: #546e7a;">Welcome to Venato! Please use the following One-Time Password (OTP) to complete your registration and secure your account.</p>
        <div class="otp-box">{{OTP_CODE}}</div>
        <p style="color: #90a4ae; font-size: 13px;">This code will expire shortly. Do not share this code with anyone.</p>
      </div>
      <div class="footer">
        <p>© 2026 Venato. Your bridge to better trade.</p>
      </div>
    </div>
  </body>
  </html>
  `,

  // NEW: Welcome Email
  welcomeTemplate: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      .hero { background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); padding: 60px 40px; text-align: center; color: white; }
      .content { padding: 40px; color: #37474f; line-height: 1.8; }
      .cta-button { display: inline-block; padding: 14px 30px; background-color: #2E7D32; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
      .footer { padding: 30px; text-align: center; font-size: 12px; color: #90a4ae; background: #fafafa; border-top: 1px solid #eeeeee; }
      h1 { margin: 0; font-size: 32px; }
      .feature-list { text-align: left; margin: 20px 0; padding: 0; list-style: none; }
      .feature-list li { margin-bottom: 10px; padding-left: 25px; position: relative; }
      .feature-list li::before { content: '✓'; position: absolute; left: 0; color: #2E7D32; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="hero">
        <h1>Welcome to Venato!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">The future of agricultural trade is here.</p>
      </div>
      <div class="content">
        <p>Hi {{USER_NAME}},</p>
        <p>We’re thrilled to have you join the Venato community. Our platform is designed to help you stay ahead of the market with real-time data and seamless trade tools.</p>
        <p><strong>Here is what you can do now:</strong></p>
        <ul class="feature-list">
          <li>Set real-time price alerts for your favorite products.</li>
          <li>Track market trends across Nigeria.</li>
          <li>Connect with verified traders and farmers.</li>
        </ul>
        <div style="text-align: center;">
          <a href="https://venato.ng/dashboard" class="cta-button">Go to Dashboard</a>
        </div>
      </div>
      <div class="footer">
        <p>You received this email because you signed up for Venato.<br>Lagos, Nigeria</p>
        <p>© 2026 Venato Ventures.</p>
      </div>
    </div>
  </body>
  </html>
  `,

  // NEW: Price Alert Triggered
  priceAlertTemplate: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      .header { background-color: #2E7D32; padding: 30px; text-align: center; color: white; }
      .content { padding: 40px; text-align: center; }
      .alert-card { background: #F1F8E9; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #C5E1A5; }
      .price-value { font-size: 36px; font-weight: 700; color: #2E7D32; margin: 8px 0; }
      .condition-badge { display: inline-block; padding: 6px 14px; background: #DCEDC8; color: #33691E; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px; }
      .product-info { margin-top: 20px; border-top: 1px solid #eeeeee; padding-top: 20px; color: #546e7a; }
      .cta-button { display: inline-block; padding: 14px 30px; background-color: #2E7D32; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
      .footer { padding: 30px; text-align: center; font-size: 12px; color: #90a4ae; background: #fafafa; border-top: 1px solid #eeeeee; }
      h1 { margin: 0; font-size: 24px; }
      p { color: #546e7a; line-height: 1.6; margin: 10px 0; }
      .icon-circle { width: 64px; height: 64px; background: #E8F5E9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 32px; line-height: 64px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Venato Alert</h1>
      </div>
      <div class="content">
        <div class="icon-circle">🔔</div>
        <h2 style="color: #263238; margin-bottom: 8px; font-size: 24px;">Price Alert Triggered!</h2>
        <p>Your price alert for <strong style="color: #2E7D32;">{{PRODUCT_NAME}}</strong> has been activated.</p>
        
        <div class="alert-card">
          <div class="condition-badge">{{CONDITION}} {{TARGET_VALUE}}</div>
          <p style="margin: 0; font-size: 13px; color: #689F38; font-weight: 600;">CURRENT MARKET PRICE</p>
          <div class="price-value">{{CURRENCY}}{{CURRENT_PRICE}}</div>
        </div>

        <div class="product-info">
          <p>Product: <strong>{{PRODUCT_NAME}}</strong></p>
        </div>

        <div style="margin-top: 30px;">
          <a href="https://venato.ng/dashboard" class="cta-button">Analyze Market</a>
        </div>
      </div>
      <div class="footer">
        <p>You are receiving this because you set a price alert on Venato.<br>Lagos, Nigeria</p>
        <p>© 2026 Venato Ventures. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `,
  // NEW: User Invite Template
 userInviteTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background-color: #2E7D32; padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 40px; text-align: center; }
    .cta-button { display: inline-block; padding: 14px 30px; background-color: #2E7D32; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #757575; background: #fafafa; }
    h1 { margin: 0; font-size: 24px; }
    p { color: #546e7a; line-height: 1.6; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Venato</h1>
    </div>
    <div class="content">
      <h2 style="color: #263238; margin-bottom: 8px;">You've Been Invited!</h2>
      <p>You have been invited to join the Venato platform. Please click the button below to set up your password and activate your account.</p>
      <div style="margin-top: 30px;">
        <a href="{{INVITE_LINK}}" class="cta-button">Set Password</a>
      </div>
      <p style="font-size: 13px; margin-top: 30px;">This link will expire in 30 minutes.</p>
    </div>
    <div class="footer">
      <p>© 2026 Venato. Empowering Agricultural Trade.</p>
    </div>
  </div>
</body>
</html>
`
  }

  

export default Mailtemplates;