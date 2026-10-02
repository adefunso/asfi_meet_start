const { config } = require("dotenv");
const meetingExists = require("./asfi_meet_v9/meetingExists");
const dbPromise = require("../routes/dbPromise.config");
const formatDateTime = require("./utils/formatTime");
const jwt = require("jsonwebtoken")

const joinPage = async (req, res) => {
    try {
        const meetingId = req.params.meeting;
        const meetingRoom = process.env.MEET;
        const postersRoom = 'https://posters.asfischolar.com'; // Consider moving to config
        const guestMode = req.query.guest



        // Check if meeting exists
        const meetingData = await meetingExists(meetingId);
        if (!meetingData?.channel) {
            return res.render("404", { message: "Meeting does not exist" });
        }


        const getCustomQuestions = await dbPromise.query("SELECT * FROM pre_reg_questions WHERE meeting_id = ?", [meetingData.id])
        const questions = getCustomQuestions[0]
        // Determine user permissions
        const isGroupOwner = meetingData.isGroupOwner == req.user.id || req.user.acct_type === "administrator";

        const [registrationCheck] = await dbPromise.query(
            "SELECT * FROM pre_registration WHERE meetingId = ? AND userId = ?",
            [meetingData.id, req.user.id]
        );
        // Check if request is guest mode 
        const hasRegistered = registrationCheck.length > 0;

        if (guestMode) {
            // check if guest is confirmed 
            if (req.cookies.gst) {
                const decoded = jwt.verify(req.cookies.gst, process.env.JWT_SECRET);

                const userExists = await dbPromise.query("SELECT * FROM meeting_guests WHERE id = ?", [decoded.id])
                if (userExists[0].length > 0) {
                    if (meetingData.hasStarted == "true" || meetingData.hasStarted == true || meetingData.hasStarted == "test") {
                        return res.render("joinBrute", {
                            meetingId,
                            postersRoom,
                            meetingRoom,
                            isActive: true,
                            isOwner: isGroupOwner
                        });
                    } else {
                        return res.render("waiting-page", {
                            meetingId,
                            postersRoom,
                            meetingRoom,
                            isOwner: isGroupOwner,
                            meetingData,
                            isActive: true,
                        });
                    }
                } else {
                    return res.redirect(`/join/${meetingId}?byPass=true`)
                }
            } else {
                return res.render("guest-login", {
                    meetingId, meetingData,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    isActive: true,
                    csrfToken: req.csrfToken()
                })
            }
        }


        const formattedTime = formatDateTime(meetingData.time);
        // Handle private meeting access

        if (meetingData.privateMeeting == "yes" && !isGroupOwner && meetingData.preRegistration === "no") {
            return res.render("404", {
                message: "This meeting is private. You need to be the owner or be added to the participant list."
            });
        }

        let byPass = "false"
        if (req.query.byPass == 'true' || req.query.byPass == true) {
            byPass = "true"
        }


        // Handle pre-registration cases
        if (meetingData.preRegistration === "yes") {
            if (!isGroupOwner && !hasRegistered) {
                return res.render("pre-registration", {
                    meetingId,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    isActive: true,
                    meetingData,
                    questions,
                    byPass
                });
            }
            const pre = req.query.pre
            if (isGroupOwner && (pre && (pre == 'true' || pre == true)) && (meetingData.hasStarted === "false" || meetingData.hasStarted == 'test')) {
                return res.render("admin-waitingPage", {
                    meetingId,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    meetingData,
                    isActive: true,
                    meetingTime: formattedTime
                });
            }
       if(meetingData.hasStarted == "test" && isGroupOwner && !pre){
            return res.render("joinBrute", {
                meetingId,
                postersRoom,
                meetingRoom,
                isActive: true,
                isOwner: isGroupOwner
            });
        }
            if (!isGroupOwner && hasRegistered && (meetingData.hasStarted === "false" || meetingData.hasStarted === "test")) {
                return res.render("waiting-page", {
                    meetingId,
                    postersRoom,
                    meetingRoom,
                    isOwner: isGroupOwner,
                    meetingData,
                    isActive: true,
                });
            }
        }
        // Handle meeting start conditions
        if ((meetingData.hasStarted === "true" || meetingData.hasStarted === true) &&
            (isGroupOwner || (hasRegistered && !isGroupOwner && meetingData.preRegistration === "yes"))) {
            return res.render("joinBrute", {
                meetingId,
                postersRoom,
                meetingRoom,
                isActive: true,
                isOwner: isGroupOwner
            });
        }

        

        if (meetingData.preRegistration === "no" && meetingData.privateMeeting === "no") {
            return res.render("joinBrute", {
                meetingId,
                postersRoom,
                meetingRoom,
                isActive: true,
                isOwner: isGroupOwner
            });
        }

        // Default case (shouldn't normally reach here)
        return res.render("404", { message: "Unable to determine meeting access" });

    } catch (error) {
        console.error("Error in joinPage:", error);
        return res.status(500).render("404", {
            message: "An unexpected error occurred",
            error: process.env.NODE_ENV === "development" ? error.message : null
        });
    }
};

module.exports = joinPage;