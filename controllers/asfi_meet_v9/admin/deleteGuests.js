const dbPromise = require("../../../routes/dbPromise.config");

const deleteGuests =  async (req, res) => {
    try {
        
        const { id } = req.params;
        
        await dbPromise.query(
            "DELETE FROM meeting_guests WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete guest" });
    }
};



module.exports = deleteGuests