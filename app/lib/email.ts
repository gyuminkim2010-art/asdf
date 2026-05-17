import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export function generateVerifyCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerifyEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"Project.noNAME" <${process.env.GMAIL_USER}>`,
    to,
    subject: "[한자퀴즈] 이메일 인증 코드",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f6f5f1;border-radius:24px;">
        <h2 style="font-size:24px;font-weight:900;color:#171717;margin:0 0 8px;">이메일 인증</h2>
        <p style="color:#666;margin:0 0 24px;font-size:14px;">아래 6자리 코드를 입력해 인증을 완료해 주세요.<br>코드는 10분간 유효합니다.</p>
        <div style="background:#fff;border-radius:16px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:900;color:#171717;border:1px solid #e5e5e5;">
          ${code}
        </div>
        <p style="color:#aaa;font-size:12px;margin:24px 0 0;text-align:center;">본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>
      </div>
    `,
  });
}
