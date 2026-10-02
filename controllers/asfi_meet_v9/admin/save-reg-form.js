const dbPromise = require("../../../routes/dbPromise.config");
const meetingExists = require("../meetingExists");

const saveRegForm = async(req, res) => {
    try {
        const { meetingId, questions } = req.body;

        // Check meeting exists and user permissions (same as before)
        const meetingData = await meetingExists(meetingId);
        if (!meetingData?.channel) {
            return res.status(404).json({ error: "Meeting does not exist" });
        }
        const isGroupOwner = meetingData.isGroupOwner == req.user.id || req.user.acct_type === "administrator";
        if(!isGroupOwner) return res.json({ error: "Unauthorized Access" });

        // Process each question
        const results = await Promise.all(
            questions.map(async (question) => {
                const { text: questionText, type: questionType, required: isRequired, options } = question;
                const extras = options ? JSON.stringify({ options }) : null;

                // Check if question exists
                const [existing] = await dbPromise.query(
                    "SELECT id FROM pre_reg_questions WHERE meeting_id = ? AND question = ?",
                    [meetingId, questionText]
                );

                if (existing.length > 0) {
                    // Update existing question
                    await dbPromise.query(
                        "UPDATE pre_reg_questions SET question_type = ?, is_required = ?, extras = ? WHERE id = ?",
                        [questionType, isRequired ? 1 : 0, extras, existing[0].id]
                    );
                    return { id: existing[0].id, action: "updated" };
                } else {
                    // Insert new question
                    const [result] = await dbPromise.query(
                        "INSERT INTO pre_reg_questions (meeting_id, question_type, question, is_required, extras, is_custom) VALUES (?, ?, ?, ?, ?, 1)",
                        [meetingId, questionType, questionText, isRequired ? 1 : 0, extras]
                    );
                    return { id: result.insertId, action: "created" };
                }
            })
        );

        return res.json({ 
            success: true,
            message: "Form questions updated successfully",
            data: {
                meetingId,
                results
            }
        });

    } catch(error) {
        console.error("Error saving registration form:", error);
        return res.status(500).json({ 
            error: error.message,
            details: "Failed to save form questions"
        });
    }
};

module.exports = saveRegForm;