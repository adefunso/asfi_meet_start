const { configDotenv } = require('dotenv');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const client = SibApiV3Sdk.ApiClient.instance;


// Configure API key authorization
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API;

const sendEmail = async (useremail, subject, message) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();


        try {
            async function SendMain(email) {
                const response = await apiInstance.sendTransacEmail(email);
                console.log("Brevo Response:", response);
                return true
            }
            const messageHtml = `${message}`
            const year = new Date().getFullYear()
            const footerMessage = `
            <p>Best regards,<br>The ASFI Team</p>
    </div>
    
    <div class="footer">
        <p>ASFI - African Science Frontiers Initiatives</p>
        <p>&copy; ${year} ASFI. All rights reserved.</p>
        <p>
            <a href="https://asfischolar.org" style="color: rgb(107, 2, 110); text-decoration: none;">asfischolar.org</a> | 
            <a href="mailto:info@asfischolar.org" style="color: rgb(107, 2, 110); text-decoration: none;">info@asfischolar.org</a>
        </p>
        <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
            You're receiving this email because you registered for an ASFI event. 
            <a href="#" style="color: rgb(107, 2, 110);">Unsubscribe</a> from future emails.
        </p>
    </div>
          `;
          
                const email = {
                    to: [{ email: useremail }],
                    sender: { email: 'support@asfischolar.org', name: 'ASFI Support' },
                    subject:subject,
                    htmlContent: `<html>                 <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASFIMeet Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: rgb(107, 2, 110);
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px 20px;
            background-color: #f9fafb;
        }
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color:rgb(253, 253, 255);
            background-color:rgb(107, 2, 110);
            border-radius: 0 0 8px 8px;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: rgb(107, 2, 110);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .details {
            background-color: white;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .details-row {
            display: flex;
            margin-bottom: 8px;
        }
        .details-label {
            font-weight: bold;
            width: 120px;
            color:rgb(95, 75, 99);
        }
        .logo {
            height: 40px;
            margin-bottom: 15px;
        }
    </style>
</head>

       
                    ${messageHtml}
                    ${footerMessage}
                        </body></html>`
                };
                await SendMain(email);

        } catch (error) {
            console.log("Error sending email:", error);
            return false
           
        }

};

module.exports = sendEmail;