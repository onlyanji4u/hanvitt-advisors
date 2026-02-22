import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const interestLabels: Record<string, string> = {
  health_insurance: "Health Insurance",
  term_insurance: "Term Insurance",
  retirement_planning: "Retirement Planning",
  child_plan: "Child Plan",
  sme_insurance: "SME Insurance",
  general_query: "General Query",
};

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface ContactEmailData {
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  interestType: string;
  message: string;
  ipAddress?: string | null;
  timestamp: string;
}

export async function sendAdminNotification(data: ContactEmailData): Promise<void> {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || `"Hanvitt Advisors" <hanvitt.advisors@gmail.com>`;
    const to = process.env.SMTP_USER || "hanvitt.advisors@gmail.com";

    const safeName = escapeHtml(data.fullName);
    const safeEmail = escapeHtml(data.email);
    const safePhone = escapeHtml(data.phone || "N/A");
    const safeCity = escapeHtml(data.city || "N/A");
    const safeInterest = escapeHtml(interestLabels[data.interestType] || data.interestType);
    const safeMessage = escapeHtml(data.message);

    await transporter.sendMail({
      from,
      to,
      subject: `New Contact Request – Hanvitt Advisors`,
      text: `Name: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone || "N/A"}\nCity: ${data.city || "N/A"}\nInterest: ${interestLabels[data.interestType] || data.interestType}\nMessage: ${data.message}\nTimestamp: ${data.timestamp}\nIP: ${data.ipAddress || "N/A"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a2332; padding: 20px; text-align: center;">
            <h2 style="color: #D4AF37; margin: 0;">New Contact Request</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safeName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safeEmail}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safePhone}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">City</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safeCity}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Interest</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safeInterest}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${safeMessage}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Timestamp</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.timestamp)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">IP</td><td style="padding: 8px;">${escapeHtml(data.ipAddress || "N/A")}</td></tr>
            </table>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin email failed:", err instanceof Error ? err.message : "unknown");
  }
}

export async function sendCustomerThankYou(fullName: string, email: string, interestType: string): Promise<void> {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || `"Hanvitt Advisors" <hanvitt.advisors@gmail.com>`;
    const interest = interestLabels[interestType] || interestType;

    await transporter.sendMail({
      from,
      to: email,
      subject: "Thank You for Contacting Hanvitt Advisors",
      text: `Dear ${fullName},\n\nThank you for reaching out regarding ${interest}.\nOur team will contact you shortly.\n\nVisit: https://hanvitt.in\n\nRegards,\nTeam Hanvitt Advisors`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a2332; padding: 20px; text-align: center;">
            <h2 style="color: #D4AF37; margin: 0;">Hanvitt Advisors</h2>
          </div>
          <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px; color: #333;">Dear ${escapeHtml(fullName)},</p>
            <p style="font-size: 15px; color: #555;">Thank you for reaching out regarding <strong>${escapeHtml(interest)}</strong>.</p>
            <p style="font-size: 15px; color: #555;">Our team will contact you shortly to assist you with your query.</p>
            <div style="margin: 25px 0; text-align: center;">
              <a href="https://hanvitt.in" style="background: #D4AF37; color: #1a2332; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Visit Our Website</a>
            </div>
            <p style="font-size: 14px; color: #777;">Regards,<br/>Team Hanvitt Advisors</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Customer thank-you email failed:", err instanceof Error ? err.message : "unknown");
  }
}
