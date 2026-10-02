
        // Check meeting status
        const updateStatus = (isStarted) => {
            // const isStarted = '<%= meetingData.hasStarted %>';
            if(isStarted == "true"){
            document.getElementById('statusText').textContent = isStarted ? 'Started' : 'Not Started';
            const startButton = document.getElementById('startMeetingBtn')
            startButton.disabled = isStarted ? true : false;
            startButton.classList.toggle('opacity-50', isStarted);
            startButton.classList.toggle('cursor-not-allowed', isStarted);
            startButton.textContent = isStarted ? 'Meeting in Progress' : 'Start Meeting Now';
        }
        };
        
        // Start meeting now
        document.getElementById('startMeetingBtn').addEventListener('click', () => {
          
            fetch(`/meetings/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ meetingId: '<%= meetingData.id %>' }),
            }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    iziToast.success({
                        message:'Meeting started successfully!', 
                        position: 'topRight',
                        timeout: 3000,
                    });
                    
            updateStatus("true");

                } else {
                    iziToast.error({
                        message: 'Failed to start meeting: ' + data.message,
                        position: 'topRight',
                        timeout: 3000,
                    });
                }
            }).catch(err => {
                console.error('Error:', err);
               iziToast.error( {
                message:'An error occurred while starting the meeting.',
                    position: 'topRight',
                    timeout: 3000,
                });
            });
    
        });
        
        // Reset to scheduled time
        document.getElementById('resetMeetingBtn').addEventListener('click', () => {
     fetch(`/meetings/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ meetingId: '<%= meetingData.id %>' }),
            }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    iziToast.success({
                        message:'Rest To Scheduled time!', 
                        position: 'topRight',
                        timeout: 3000,
                    });
                    
            updateStatus("false");

                } else {
                    iziToast.error({
                        message: 'Failed to reset meeting: ' + data.message,
                        position: 'topRight',
                        timeout: 3000,
                    });
                }
            }).catch(err => {
                console.error('Error:', err);
               iziToast.error( {
                message:'An error occurred while resetting the meeting.',
                    position: 'topRight',
                    timeout: 3000,
                });
            });
         
        });
        
        updateStatus('<%=meetingData.hasStarted %>');
