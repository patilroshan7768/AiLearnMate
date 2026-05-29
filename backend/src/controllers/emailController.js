const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Use standard fetch to bypass Render's SMTP block
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY, 
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: "AI LearnMate", email: process.env.EMAIL_USER }, 
          to: [{ email: email }],
          subject: "Your OTP Code",
          htmlContent: `<p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`
        })
      });

      if (!response.ok) {
        console.error("Brevo API Error:", await response.text());
        throw new Error("Failed to send email via Brevo");
      }
      
      console.log(`HTTP Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Failed to deliver email:", emailError.message);
      return res.status(500).json({ success: false, message: "Failed to send email" });
    }

    res.status(200).json({ success: true, message: "OTP sent", otp });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendOtp };