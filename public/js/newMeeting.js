
        const messageContainer = document.getElementById('messageContainer');
        function addMeeting() {
            const name = document.getElementById('meetingName').value;
            const meetingTime = document.getElementById('meetingTime').value;

            if (!name) {
                iziToast.error({
                    title: 'Error',
                    message: 'Please enter a meeting name.',
                    color: 'red',
                    position: 'topCenter',
                    timeout: 3000
                })
                return;
            }
            if (!meetingTime) {
                iziToast.error({
                    title: 'Error',
                    message: 'Please select a meeting time.',
                    color: 'red',
                    position: 'topCenter',
                    timeout: 3000
                })
                return;
            }

            const formattedTime = new Date(meetingTime).toISOString(); // Send in UTC format
            const displayTime = new Date(meetingTime).toLocaleString(); // Display in user's timezone
            const isPrivate = document.querySelector('input[name="isPrivate"]:checked').value;
            const preRegistration = document.getElementById('preRegistration').checked ? 'yes' : 'no';

                    // Save button functionality
            const content = quill.getContents();
            const html = quill.root.innerHTML;
            const text = quill.getText();
            
            // console.log('Delta:', content);
            // console.log('HTML:', html);
            // console.log('Plain text:', text);
            

            const meetingData = {
                title: name,
                time: formattedTime,
                isPrivate: isPrivate,
                description: html ? html : text,
                preRegistration: preRegistration
            };
            

            fetch('/createMeeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(meetingData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    iziToast.success({
                        title: 'Success',
                        message: 'Meeting created successfully.',
                        color: 'green',
                        position: 'topCenter',
                        timeout: 3000
                    })

                    const meetingList = document.getElementById('meetingList');
                    const meetingItem = document.createElement('div');
                    meetingItem.classList.add('meeting-item');
                    let participants = ``
                    if(preRegistration === "yes"){
                        participants = ` <a href="/participants/${data.channel}" ><button class="button" >Participants</button></a>`
                    }

                    meetingItem.innerHTML = `
                        <p><strong>${name}</strong> <span> ${displayTime}</span></p>
                        <div class="meetingsControlsContainer">
                            <a href="/join/${data.channel}?pre=true" target="_blank"><button class="button" >Start Meeting</button></a>
                            <button class="button" onclick="copyLink('https://asfischolar.net/join/${data.channel}')">Copy Link</button>
                        <button class="button" onclick="addToCalendar('${name}', '${formattedTime}')">Add to Calendar</button>
                           ${participants}

                        <button  onclick="deleteMeeting('${data.meetingId}')" class="deleteMeeting"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgb(201, 40, 40)"><path d="M5.755 20.283 4 8h16l-1.755 12.283A2 2 0 0 1 16.265 22h-8.53a2 2 0 0 1-1.98-1.717zM21 4h-5V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v1H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2z"/></svg></button>
                        </div>
                        
                    `;

                    meetingList.prepend(meetingItem);
                    document.getElementById('meetingName').value = '';
                    document.getElementById('meetingTime').value = '';
                    // quill.resetContents();
                    // preRegistration.checked = false;
                    // preRegistration.click()
                } else {
                    iziToast.error({
                        title: 'Error',
                        message: data.error,
                        color: 'red',
                        position: 'topCenter',
                        timeout: 3000
                    })
                    console.error('Error creating meeting:', data.error);
                }
            })
            .catch(error => {
                iziToast.error({
                    title: 'Error',
                    message: 'An error occurred while creating the meeting. Please try again.',
                    color: 'red',
                    position: 'topCenter',
                    timeout: 3000
                })
                console.error('Error:', error);
            });
        }
        function copyLink(text) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    
    document.body.appendChild(textarea);
    
   
    textarea.select();
    
   
    document.execCommand('copy');
    

    document.body.removeChild(textarea);
    iziToast.success({
        message: 'Link copied to clipboard!',
        color: 'green',
        position: 'topCenter',
        timeout: 3000
    })
//     messageContainer.innerText = 'Link copied to clipboard!';
//     messageContainer.style.display = 'block';

// setTimeout(() => {
//     messageContainer.innerText = '';
// }, 2000);  // 3000 milliseconds = 3 seconds
}


        function addToCalendar(title, date) {
            const formattedDate = date.replace(/-|:|\.\d{3}/g, ""); // Format for Google Calendar
            const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formattedDate}/${formattedDate}`;
            window.open(calendarLink, '_blank');
        }
        function deleteMeeting(meeting){
            fetch('/deleteMeeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Id:meeting})
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    iziToast.success({
                        title: 'Success',
                        message: 'Meeting deleted successfully.',
                        color: 'green',
                        position: 'topCenter',
                        timeout: 3000
                    })
                    const meetingItem = document.querySelector(`.meeting-item:has(button[onclick*="${meeting}"])`);
                    if (meetingItem) {
                        meetingItem.remove();
                    }
                } else {
                    iziToast.error({
                        title: 'Error',
                        message: data.error,
                        color: 'red',
                        position: 'topCenter',
                        timeout: 3000
                    })
                    console.error('Error deleting meeting:', data.error);
                }
            })
            .catch(error => {
                iziToast.error({
                    title: 'Error',
                    message: 'An error occurred while deleting the meeting. Please try again.',
                    color: 'red',
                    position: 'topCenter',
                    timeout: 3000
                })
                console.error('Error:', error);
            });
        }
