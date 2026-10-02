
    const formatDateTime = (isoString) => {
  // Create date object and convert to Lagos timezone
  const date = new Date(isoString);
  
  // Options for date formatting
  const options = {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  // Format the date
  const formattedDate = date.toLocaleString('en-US', options);
  
  // Split the formatted string to rearrange parts
  const [datePart, timePart, ampm] = formattedDate.split(/, | /);
  
  // Return in desired format: "Month Day, Year Hour:Minute AM/PM"
  return `${datePart} ${timePart} ${ampm}`;
};



module.exports = formatDateTime