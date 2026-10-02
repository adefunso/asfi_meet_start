
        // Add to calendar 
            function addToCalendar(title, date) {
            const formattedDate = date.replace(/-|:|\.\d{3}/g, ""); // Format for Google Calendar
            const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formattedDate}/${formattedDate}`;
            window.open(calendarLink, '_blank');
        }