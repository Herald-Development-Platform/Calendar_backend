const { timeDifference } = require("../utils/date.utils");

const getNewEventNotificationEmailContent = (username, event) => {
    const {
        title: eventName,
        start: eventDate,
        location: eventLocation,
        description: eventDescription,
        departments: eventDepartments,
        createdBy: eventCreatedBy
    } = event;

    const eventTime = new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 1px solid #eeeeee;
            }
            .header img {
                width: 150px;
            }
            .content {
                padding: 20px 0;
            }
            .content h1 {
                font-size: 22px;
                color: #333333;
                margin-bottom: 10px;
            }
            .content p {
                font-size: 16px;
                color: #555555;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .event-details {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .event-details p {
                margin: 5px 0;
                font-size: 16px;
                color: #333333;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 12px;
                color: #888888;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
            .gotolink {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                </div>
                <div class="content">
                    <h1>New Event Scheduled</h1>
                    <p>Dear ${username},</p>
                    <p>We are pleased to announce that a new event, <strong>${eventName}</strong>, has been scheduled in department ${eventDepartments[0]?.code}.</p>
                    <a class="gotolink" style="color:white;" href="${process.env.FRONTEND_URL}?id=${event._id}">Go to event ↗</a>
                    <div class="event-details">
                        <p><strong>Event Details:</strong></p>
                        <p><strong>Title:</strong> ${eventName}</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        <p><strong>Location:</strong> ${eventLocation}</p>
                        <p><strong>Description:</strong> ${eventDescription}</p>
                        <p><strong>Created By:</strong> ${eventCreatedBy?.username}</p>
                        <p><strong>Departments:</strong> ${eventDepartments?.map(d => d.code).filter(d => d).join(", ")}</p>
                        </div>
                    <p>We hope you can join us and make this event a great success.</p>
                    <p>Best regards,<br>Herald College Kathmandu</p>
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
                <div class="footer">
                    <p>&copy; 2024 Herald College Kathmandu. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

const getEventUpdatedNotificationEmailContent = (username, event) => {
    const {
        title: eventName,
        start: eventDate,
        location: eventLocation,
        description: eventDescription,
        departments: eventDepartments,
        createdBy: eventCreatedBy
    } = event;

    const eventTime = new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 1px solid #eeeeee;
            }
            .header img {
                width: 150px;
            }
            .content {
                padding: 20px 0;
            }
            .content h1 {
                font-size: 22px;
                color: #333333;
                margin-bottom: 10px;
            }
            .content p {
                font-size: 16px;
                color: #555555;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .event-details {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .event-details p {
                margin: 5px 0;
                font-size: 16px;
                color: #333333;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 12px;
                color: #888888;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
            .gotolink {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                </div>
                <div class="content">
                    <h1>Event Updated</h1>
                    <p>Dear ${username},</p>
                    <p>It is to notify that the event ${eventName} is updated!</p>
                    
                    <a class="gotolink" style="color:white;" href="${process.env.FRONTEND_URL}?id=${event._id}">Go to event ↗</a>

                    <div class="event-details">
                        <p><strong>Updated Event Details:</strong></p>
                        <p><strong>Title:</strong> ${eventName}</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        <p><strong>Location:</strong> ${eventLocation}</p>
                        <p><strong>Description:</strong> ${eventDescription}</p>
                        <p><strong>Created By:</strong> ${eventCreatedBy?.username}</p>
                        <p><strong>Departments:</strong> ${eventDepartments?.map(d => d.code).filter(d => d).join(", ")}</p>
                    </div>
                    <p>We hope you can join us and make this event a great success.</p>
                    <p>Best regards,<br>Herald College Kathmandu</p>
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
                <div class="footer">
                    <p>&copy; 2024 Herald College Kathmandu. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

const getUpcomingEmailNotificationContent = (username, event) => {
    const {
        title: eventName,
        start: eventDate,
        location: eventLocation,
        description: eventDescription,
        departments: eventDepartments,
        createdBy: eventCreatedBy
    } = event;

    const eventTime = new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const remaningTime = timeDifference(event.start);

    return `
    <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 1px solid #eeeeee;
            }
            .header img {
                width: 150px;
            }
            .content {
                padding: 20px 0;
            }
            .content h1 {
                font-size: 22px;
                color: #333333;
                margin-bottom: 10px;
            }
            .content p {
                font-size: 16px;
                color: #555555;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .event-details {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .event-details p {
                margin: 5px 0;
                font-size: 16px;
                color: #333333;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 12px;
                color: #888888;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
            .gotolink {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #75bf43;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <h1>Upcoming Event</h1>
                    <p>Dear ${username},</p>
                    <p>It is to notify that <strong>${eventName}</strong>, is happening ${remaningTime}</p>
                    
                    <a class="gotolink" style="color:white;" href="${process.env.FRONTEND_URL}?id=${event._id}">Go to event ↗</a>

                    <div class="event-details">
                        <p><strong>Event Details:</strong></p>
                        <p><strong>Title:</strong> ${eventName}</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        <p><strong>Location:</strong> ${eventLocation}</p>
                        <p><strong>Description:</strong> ${eventDescription}</p>
                        <p><strong>Created By:</strong> ${eventCreatedBy?.username}</p>
                        <p><strong>Departments:</strong> ${eventDepartments?.map(d => d.code).filter(d => d).join(", ")}</p>
                    </div>
                    <p>Best regards,<br>Herald College Kathmandu</p>
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
                <div class="footer">
                    <p>&copy; 2024 Herald College Kathmandu. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

const getEventDeletedNotificationEmailContent = (username, event) => {
    const {
        title: eventName,
        start: eventDate,
        location: eventLocation,
        description: eventDescription
    } = event;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eeeeee;
                }
                .header img {
                    width: 150px;
                }
                .content {
                    padding: 20px 0;
                }
                .content h1 {
                    font-size: 22px;
                    color: #333333;
                    margin-bottom: 10px;
                }
                .content p {
                    font-size: 16px;
                    color: #555555;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                .event-details {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .event-details p {
                    margin: 5px 0;
                    font-size: 16px;
                    color: #333333;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #eeeeee;
                    font-size: 12px;
                    color: #888888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <h1>Event Cancelled</h1>
                    <p>Dear ${username},</p>
                    <p>We would like to inform you that the event: <strong>${eventName}</strong>, scheduled to take place on <strong>${eventDate}</strong> at <strong>${eventLocation}</strong>, has been cancelled.</p>
                    <div class="event-details">
                    <p><strong>Event Details:</strong></p>
                    <p><strong>Title:</strong> ${eventName}</p>
                    <p><strong>Date:</strong> ${eventDate}</p>
                    <p><strong>Location:</strong> ${eventLocation}</p>
                    <p><strong>Description:</strong> ${eventDescription}</p>
                    </div>
                    <p>We apologize for any inconvenience this may cause and appreciate your understanding.</p>
                    <p>Best regards,<br>Herald College Kathmandu</p>
                    <svg fill=none viewBox="0 0 33 32" width=70 xmlns=http://www.w3.org/2000/svg>
                    <g clip-path=url(#clip0_1_452)>
                        <path d="M31.3315 4.01041H1.6875V32.0007H31.3315V4.01041Z" fill=white />
                        <path d="M0.5 0V32H2.76751L6.51117 11.5117L11.4148 12.3816L7.82652 32H12.4248L13.7618 24.6849L18.6655 25.5547L17.4837 32H22.1255L25.318 14.5288L30.2216 15.3987L27.1881 32H32.5V0H0.5ZM14.5513 20.2801L17.2001 5.78519L22.1037 6.65333L19.4513 21.1413L14.5513 20.2801Z" fill=#75BF43 />
                    </g>
                    <defs>
                        <clipPath id=clip0_1_452>
                            <rect fill=white height=32 transform=translate(0.5) width=32 />
                        </clipPath>
                    </defs>
                    </svg>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Herald College Kathmandu. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};


module.exports = {
    getNewEventNotificationEmailContent,
    getEventUpdatedNotificationEmailContent,
    getUpcomingEmailNotificationContent,
    getEventDeletedNotificationEmailContent,
}
