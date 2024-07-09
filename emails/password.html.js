
const getForgetPasswordHTML = (username, OTP) => {
    return `
    <!doctypehtml>
    <html lang=en>
    <meta charset=UTF-8>
    <meta content="width=device-width,initial-scale=1"name=viewport>
    <style>body{margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f2f0}.container{max-width:800px;margin:0 auto;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,.1)}.logo{max-width:100%;margin-bottom:20px}.message{text-align:center}.otp{background-color:#f9f9f9;border:1px solid #ccc;border-radius:5px;padding:15px;text-align:center;font-size:24px;margin-bottom:30px}.info{text-align:center;margin-bottom:30px}.info p{margin:0;font-size:16px;color:#777}.app{text-align:center;margin-bottom:30px}.app img{max-width:100%;margin-top:20px}.footer{text-align:center;margin-top:30px;color:#777;font-size:14px}</style>
    <div class=container>
        <div style=display:flex;flex-direction:column;align-items:center>
            <p>Hi ${username},</p>
            <p >We have received a forget password request for your account.</p>
        </div>
        <div class=otp>
            <p>Your Reset Password PIN: <strong>${OTP}</strong></p>
        </div>
        <div class=info>
            <p>Please note that this PIN will expire after 5 minutes. If it expires, you will need to sign up again.</p><br />
            <p>If you didn't request this, kindly ignore this.</p>
        </div>
        <div class=footer>
            <p>Herald College Kathmandu
            <p>Copyright © 2023
        </div>
    </div>
    `;
};

module.exports = {
    getForgetPasswordHTML,
};