import SibApiV3Sdk from "@sendinblue/client";

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log(`[Email Skipped] To: ${to} | Subject: ${subject}`);
    return;
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.sender = {
    email: process.env.BREVO_FROM_EMAIL,
    name: process.env.BREVO_FROM_NAME || process.env.APP_NAME,
  };
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  if (text) sendSmtpEmail.textContent = text;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email Sent] To: ${to}`);
  } catch (error) {
    console.error("[Email Error]", error.message);
    throw new Error("Failed to send email");
  }
};
