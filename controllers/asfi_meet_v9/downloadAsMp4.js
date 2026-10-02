const axios = require('axios');

const downloadAsMp4 = async (req, res) => {
    try {
        const url = req.query.url;
        const filename = req.params.meetingId;
        if (!url) {
            return res.status(400).json({ success: false, message: 'Missing URL parameter' });
        }

        // Convert WebM URL to Cloudinary's MP4 transformation URL
        const mp4Url = url.replace('/upload/', '/upload/f_mp4/').replace('.webm', '.mp4');

        // Fetch the file from Cloudinary
        const response = await axios({
            url: mp4Url,
            method: 'GET',
            responseType: 'stream',
        });

        // Set the custom filename
        // const filename = `video_${Date.now()}.mp4`;

        // Set headers to force download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Stream the file directly to the response
        response.data.pipe(res);

    } catch (err) {
        console.error('Error in downloadAsMp4:', err);
        return res.status(500).json({ success: false, message: 'Error processing files' });
    }
};

module.exports = downloadAsMp4;
