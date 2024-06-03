
const getDepartmentRequestHtml = (request) => {

    const {
        adminName,
        requestorName,
        requestorEmail,
        departmentName,
        requestorReason,
        approveLink,
        rejectLink,
    } = request;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approval Request</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #f3f2f0;
            }

            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            .header {
                text-align: center;
                margin-bottom: 20px;
            }

            .header img {
                max-width: 100%;
                margin-bottom: 20px;
            }

            .content {
                text-align: center;
                margin-bottom: 30px;
            }

            .content h1 {
                font-size: 24px;
                margin-bottom: 10px;
            }

            .content p {
                font-size: 16px;
                margin-bottom: 20px;
                color: #555;
            }

            .details {
                background-color: #f9f9f9;
                border: 1px solid #ccc;
                border-radius: 5px;
                padding: 15px;
                text-align: left;
                font-size: 16px;
                margin-bottom: 30px;
            }

            .details p {
                margin: 5px 0;
            }

            .footer {
                text-align: center;
                margin-top: 30px;
                color: #777;
                font-size: 14px;
            }

            .button {
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: #fff;
                background-color: #28a745;
                border-radius: 5px;
                text-decoration: none;
                margin: 0 5px;
            }

            .button.reject {
                background-color: #dc3545;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
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
            </div>
            <div class="content">
                <h1>Approval Request</h1>
                <p>Dear ${adminName},</p>
                <p>A new user has requested to join your department. Please review the details below and approve or reject the request.</p>
            </div>
            <div class="details">
                <p><strong>Requestor Name:</strong> ${requestorName}</p>
                <p><strong>Email:</strong> ${requestorEmail}</p>
                <p><strong>Department:</strong> ${departmentName}</p>
                <p><strong>Reason for Joining:</strong> ${requestorReason}</p>
            </div>
            <div class="content">
                <a href="${approveLink}" class="button">Approve</a>
                <a href="${rejectLink}" class="button reject">Reject</a>
            </div>
            <div class="footer">
                <p>Void Nepal Pvt Ltd, Kathmandu, Nepal</p>
                <p>Copyright © 2023</p>
            </div>
        </div>
    </body>
    </html>    
    `
}