const dbPromise = require("../../routes/dbPromise.config");
const preRegistrationEmail = require("../emails/pre_registration_email");

const preRegistration = async (req, res) => {
    try {
        if (!req.user.id) {
            return res.json({ error: "Invalid Token Provided" });
        }

        const { 
            age,
            firstName, 
            lastName,
            organization,
            jobTitle,
            country,
            email,
            meetingId,
            ...questionAnswers // Captures all other fields (custom questions)
        } = req.body;
        // Check if user already registered
        const checkExists = await dbPromise.query(
            "SELECT * FROM pre_registration WHERE email_address = ? AND meetingId = ? AND userId = ?", 
            [email, meetingId, req.user.id]
        );

        if (checkExists[0].length > 0) {
            return res.json({ error: "This email is already registered for this event" });
        }

        // Extract custom questions (fields starting with 'question_')
        const customAnswers = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (key.startsWith('question_')) {
                const questionId = key.replace('question_', '');
                customAnswers[questionId] = value;
            }
        }

        // Create registration record
        const registrationData = {
            meetingId,
            userId: req.user.id,
            first_name: firstName,
            last_name: lastName,
            age,
            job_title: jobTitle,
            email_address: email,
            country,
            organization,
            custom_answers: JSON.stringify(customAnswers) // Store as JSON in extras column
        };

        const createNew = await dbPromise.query(
            "INSERT INTO pre_registration SET ?", 
            [registrationData]
        );

        await preRegistrationEmail(meetingId, firstName, email);
        console.log("Pre-registration email sent successfully");
        
        return res.json({ success: "Registration Successful" });

    } catch(error) {
        console.log(error);
        return res.json({ error: error.message ? error.message : error });
    }
};

module.exports = preRegistration;