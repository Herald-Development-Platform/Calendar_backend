
const getRegistrationHTML = (username, OTP, email) => {
    return `
    <!doctypehtml>
<html lang=en>
   <meta charset=UTF-8>
   <meta content="width=device-width,initial-scale=1"name=viewport>
   <style>body{margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f2f0}.container{max-width:800px;margin:0 auto;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,.1)}.logo{max-width:100%;margin-bottom:20px}.message{text-align:center}.otp{background-color:#f9f9f9;border:1px solid #ccc;border-radius:5px;padding:15px;text-align:center;font-size:24px;margin-bottom:30px}.info{text-align:center;margin-bottom:30px}.info p{margin:0;font-size:16px;color:#777}.app{text-align:center;margin-bottom:30px}.app img{max-width:100%;margin-top:20px}.footer{text-align:center;margin-top:30px;color:#777;font-size:14px}</style>
   <div class=container>
      <div style=display:flex;align-items:center;justify-content:center;gap:20px>
         <svg fill=none viewBox="0 0 33 32"width=70 xmlns=http://www.w3.org/2000/svg>
            <g clip-path=url(#clip0_1_452)>
               <path d="M31.3315 4.01041H1.6875V32.0007H31.3315V4.01041Z"fill=white />
               <path d="M0.5 0V32H2.76751L6.51117 11.5117L11.4148 12.3816L7.82652 32H12.4248L13.7618 24.6849L18.6655 25.5547L17.4837 32H22.1255L25.318 14.5288L30.2216 15.3987L27.1881 32H32.5V0H0.5ZM14.5513 20.2801L17.2001 5.78519L22.1037 6.65333L19.4513 21.1413L14.5513 20.2801Z"fill=#75BF43 />
            </g>
            <defs>
               <clipPath id=clip0_1_452>
                  <rect fill=white height=32 transform=translate(0.5) width=32 />
               </clipPath>
            </defs>
         </svg>
         <div class=message>
            <h1>Welcome to Herald Intra Calendar</h1>
         </div>
      </div>
      <div style=display:flex;flex-direction:column;align-items:center>
         <p>Hi ${username},
         <p>Welcome to Herald Intra Calendar where you can schedule and view events for your departments.
      </div>
      <div class=otp>
         <p>Your One-Time Password (OTP) for email verification:</p>
         <strong>${OTP}</strong><br><br><span>Or,</span>
         <p>You can <a href="${process.env.BACKEND_BASE_URL}/api/verifyOTP?email=${email}&OTP=${OTP}">click here</a> to verify the OTP.
      </div>
      <div class=info>
         <p>Please note that this OTP will expire after 5 minutes. If it expires, you will need to sign up again.
      </div>
      <div class=footer>
         <p>Herald College Kathmandu
         <p>Copyright © 2023
      </div>
   </div>
    `
}

module.exports = {
    getRegistrationHTML
}