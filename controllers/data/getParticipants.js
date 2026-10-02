const dbPromise = require("../../routes/dbPromise.config");
const meetingExists = require("../asfi_meet_v9/meetingExists");

const getParticipants = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Check if meeting exists
        const meetingData = await meetingExists(req.params.meetingId);
        const meetingId = meetingData.id;

        if (!meetingId) {
            return res.status(400).json({ error: "Meeting ID is required" });
        }
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Check meeting exists and user is owner/admin
        const [meetingCheck] = await dbPromise.query(
            "SELECT * FROM channels WHERE channel = ? OR id = ?", 
            [meetingId, meetingId]
        );
        
        if (meetingCheck.length === 0) {
            return res.status(404).json({ 
                error: "Meeting does not exist" 
            });
        }

        const isOwner = meetingData.isGroupOwner == userId || 
                       req.user.acct_type === "administrator";

        if (!isOwner) {
            return res.status(403).json({ 
                error: "You are not the owner of this meeting" 
            });
        }

        // Get total count for pagination
        const [countResult] = await dbPromise.query(
            "SELECT COUNT(*) as total FROM pre_registration WHERE meetingId = ?",
            [meetingId]
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

            // Fetch participants with their custom answers
        const [participants] = await dbPromise.query(
            `SELECT * FROM pre_registration 
             WHERE meetingId = ? 
             LIMIT ? OFFSET ?`,
            [meetingId, limit, offset]
        );

        // Fetch all custom questions for this meeting
        const [questions] = await dbPromise.query(
            "SELECT * FROM pre_reg_questions WHERE meeting_id = ? AND is_custom = 1",
            [meetingId]
        );

        // Create a map of questions for quick lookup
        const questionMap = {};
        questions.forEach(question => {
            try {
                questionMap[question.id] = {
                    id: question.id,
                    question: question.question,
                    type: question.question_type,
                    required: question.is_required,
                    options: question.extras ? JSON.parse(question.extras).options : null
                };
            } catch (e) {
                console.error(`Error parsing question ${question.id}:`, e);
                questionMap[question.id] = {
                    id: question.id,
                    question: question.question,
                    type: question.question_type,
                    required: question.is_required,
                    options: null
                };
            }
        });

        // Enrich participants with question data
        const enrichedParticipants = participants.map(participant => {
            try {
                // Parse custom answers (handle cases where it might be null or invalid JSON)
                let customAnswers = {};
                if (participant.custom_answers) {
                    // First try to parse as JSON
                    if (typeof participant.custom_answers === 'string') {
                        try {
                            customAnswers = JSON.parse(participant.custom_answers);
                        } catch (e) {
                            console.error(`Error parsing custom_answers for participant ${participant.id}:`, e);
                        }
                    } else if (typeof participant.custom_answers === 'object') {
                        customAnswers = participant.custom_answers;
                    }
                }

                const answersWithQuestions = {};
                
                // Match answers with their questions
                for (const [questionId, answer] of Object.entries(customAnswers)) {
                    if (questionMap[questionId]) {
                        answersWithQuestions[questionId] = {
                            ...questionMap[questionId],
                            answer: answer
                        };
                    }
                }
                
                return {
                    ...participant,
                    custom_answers: answersWithQuestions
                };
            } catch (error) {
                console.error(`Error processing participant ${participant.id}:`, error);
                return {
                    ...participant,
                    custom_answers: {} // Return empty if there's an error
                };
            }
        });

        return res.json({
            success: "Participants fetched successfully",
            participants: enrichedParticipants,
            questions: Object.values(questionMap), // Send questions separately for reference
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            error: error.message,
            details: "Failed to fetch participants" 
        });
    }
};

module.exports = getParticipants