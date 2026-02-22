export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token && process.env.NODE_ENV !== "production") {
    return true;
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY not configured");
    return process.env.NODE_ENV !== "production";
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!data.success) {
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      return false;
    }
    if (data.score < 0.5) return false;
    if (data.action !== "contact_form_submit") return false;

    return true;
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err instanceof Error ? err.message : "unknown");
    return process.env.NODE_ENV !== "production";
  }
}
