const dbPromise = require("../../../routes/dbPromise.config");
const sendEmail = require("../../emails/sendEmail");
const { DateTime } = require("luxon");

const processDailyReminders = async (req, res) => {
  // 1. Acquire distributed lock
  const lockKey = `reminder-lock-${DateTime.now().toFormat('yyyy-MM-dd-HH')}`;
  let lockAcquired = false;

  try {
    // Try to acquire lock
    const [lockResult] = await dbPromise.query(
      'SELECT GET_LOCK(?, 300) as locked', [lockKey] // 5 minute timeout
    );
    lockAcquired = lockResult[0].locked === 1;

    if (!lockAcquired) {
      console.log('Another instance is already processing reminders');
      return;
    }

    // 2. Optimized meeting query with time window
    const now = DateTime.now();
    const twentyFourHoursLater = now.plus({ hours: 24 }).toISO();
    
    const [meetings] = await dbPromise.query(`
      SELECT * FROM channels 
      WHERE hasStarted = 'false'
      AND time BETWEEN ? AND ?
      ORDER BY time ASC
    `, [now.toISO(), twentyFourHoursLater]);

    if (meetings.length === 0) {
      await logSystemEvent('No upcoming meetings found');
      return;
    }

    // 3. Process meetings with error handling per meeting
    for (const meeting of meetings) {
      try {
        const meetingTime = DateTime.fromISO(meeting.time);
        const timeDiffHours = meetingTime.diff(now, 'hours').hours;

        if (timeDiffHours > 24) continue;

        const notificationType = timeDiffHours <= 1 ? "1-hour" : "24-hour";
        let notificationCount = 0;

        // Process participants with retries
        const [participants] = await dbPromise.query(
          "SELECT * FROM pre_registration WHERE meetingId = ?",
          [meeting.id]
        );

        for (const participant of participants) {
          await withRetry(() => 
            sendNotificationEmail(participant, meeting, notificationType, false),
            3, 5000
          );
          notificationCount++;
        }

        // Process guests with retries
        const [guests] = await dbPromise.query(
          "SELECT * FROM meeting_guests WHERE meeting_id = ? AND status = 'confirmed'",
          [meeting.id]
        );

        for (const guest of guests) {
          await withRetry(() => 
            sendNotificationEmail(guest, meeting, notificationType, true),
            3, 5000
          );
          notificationCount++;
        }

        // Log successful processing
        await logNotificationBatch(
          meeting.id,
          notificationType,
          notificationCount,
          participants.length,
          guests.length
        );

      } catch (meetingError) {
        console.error(`Error processing meeting ${meeting.id}:`, meetingError);
        await logSystemEvent(
          `Meeting processing failed: ${meeting.id}`,
          meetingError.stack
        );
      }
    }

    await logSystemEvent('Reminder processing completed successfully');
    
  } catch (error) {
    console.error("System error in processDailyReminders:", error);
    await sendErrorAlert(error);
    
  } finally {
    // Release lock if acquired
    if (lockAcquired) {
      await dbPromise.query('SELECT RELEASE_LOCK(?)', [lockKey]);
    }
  }
};

// Enhanced email sending with tracking
async function sendNotificationEmail(recipient, meeting, notificationType, isGuest) {
  const timeText = notificationType === "1-hour" ? 
    "starting in 1 hour" : 
    "starting tomorrow";

  const trackingId = `notif-${DateTime.now().toFormat('yyyyMMddHHmmss')}-${Math.random().toString(36).substr(2, 8)}`;
  const joinLink = `${process.env.CURRENT_DOMAIN}/join/${meeting.channel}?${
    isGuest ? 'guest=true&' : ''
  }track=${trackingId}&byPass=true`;

  try {
    const emailResult = await sendEmail(
      recipient.email_address || recipient.email,
      `Reminder: ${meeting.title} ${timeText}`,
      buildEmailTemplate(recipient, meeting, timeText, joinLink)
    );

    await logNotification(
      trackingId,
      recipient.email_address || recipient.email,
      meeting.id,
      notificationType,
      isGuest ? 'guest' : 'participant',
      'sent'
    );

    console.log(`Notification sent to ${recipient.email_address || recipient.email}`);
    return emailResult;

  } catch (error) {
    await logNotification(
      trackingId,
      recipient.email_address || recipient.email,
      meeting.id,
      notificationType,
      isGuest ? 'guest' : 'participant',
      'failed',
      error.message
    );
    throw error;
  }
}

// Helper function with retry logic
async function withRetry(fn, maxAttempts = 3, delayMs = 5000) {
  let attempts = 0;
  let lastError;

  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// Email template generator
function buildEmailTemplate(recipient, meeting, timeText, joinLink) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
        <img src="https://res.cloudinary.com/dvm0bs013/image/upload/v1748442398/logo_inverted_r61aue.png" 
             alt="ASFI Logo" style="height: 50px;">
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #4a4a4a;">Dear ${recipient.first_name || recipient.full_name},</h2>
        
        <p>This is a friendly reminder about the upcoming event:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6c63ff;">${meeting.title}</h3>
          <p style="margin-bottom: 5px;">
            <strong>Time:</strong> ${DateTime.fromISO(meeting.time).toFormat("LLLL dd, yyyy - hh:mm a")}
          </p>
          <p style="margin-bottom: 5px;">
            <strong>Location:</strong> Online Event
          </p>
        </div>
        
        <p>The event will be ${timeText}. Please join using the button below:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${joinLink}" 
             style="background-color: #6c63ff; color: white; padding: 12px 25px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Join Meeting
          </a>
        </div>
        
        <p>For the best experience, we recommend:</p>
        <ul>
          <li>Joining 5 minutes early to test your connection</li>
          <li>Using Chrome or Firefox browser</li>
          <li>Ensuring you have a stable internet connection</li>
        </ul>
        
        <p>If you have any questions, please contact our support team at 
           <a href="mailto:support@asfi.org">support@asfi.org</a>.</p>
        
        <p>Best regards,<br>The ASFI Team</p>
      </div>
      
      <div style="text-align: center; padding: 15px; font-size: 12px; color: #999; border-top: 1px solid #eee;">
        <p>ASFI - African Science Frontiers Initiatives</p>
        <p>
          <a href="${process.env.CURRENT_DOMAIN}" style="color: #6c63ff;">Visit our website</a> | 
          <a href="mailto:contact@asfi.org" style="color: #6c63ff;">Contact us</a>
        </p>
      </div>
    </div>
  `;
}

// Database logging functions
async function logNotification(trackingId, email, meetingId, notificationType, recipientType, status, error = null) {
  await dbPromise.query(`
    INSERT INTO notification_logs 
    (tracking_id, email, meeting_id, notification_type, recipient_type, status, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [trackingId, email, meetingId, notificationType, recipientType, status, error]);
}

async function logNotificationBatch(meetingId, notificationType, sentCount, participantCount, guestCount) {
  await dbPromise.query(`
    INSERT INTO notification_batches 
    (meeting_id, notification_type, emails_sent, participant_count, guest_count, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `, [meetingId, notificationType, sentCount, participantCount, guestCount]);
}

async function logSystemEvent(message, details = null) {
  await dbPromise.query(`
    INSERT INTO system_events 
    (event_type, message, details, created_at)
    VALUES ('reminder_system', ?, ?, NOW())
  `, [message, details]);
}

async function sendErrorAlert(error) {
  await logSystemEvent('System error occurred', error.stack);
  await sendEmail(
    process.env.ADMIN_EMAIL || 'bensonmichaelowen@gmail.com',
    'ASFI Reminder System Error',
    `<h3>Reminder System Error</h3>
     <p>Time: ${DateTime.now().toISO()}</p>
     <pre>${error.stack}</pre>
     <p>Please check the system logs for details.</p>`
  );
}

module.exports = processDailyReminders;