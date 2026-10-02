const createMeetingForm = document.getElementById("createMeeting")
const hostLink = document.getElementById("hostLink")
const attendeeLink = document.getElementById("attendeeLink")
const createContainer = document.getElementById("create-container")
const startContainer = document.getElementById("start-container")

createMeetingForm.addEventListener("submit", function(e) {
    e.preventDefault()
    const formData = {
        roomName: roomName.value
    }
    fetch(`/createMeeting`, {
        method:"POST",
        body: JSON.stringify(formData),
        headers: { 
            "Content-type" : "application/JSON"
        }
    }).then(res =>res.json())
    .then(data =>{
        if(data.error){
            alert(data.error)
        }else{
            const hostURL = data.host 
            const attendeeURL = data.attendee 
            const currentDomain = window.location.origin 

            createContainer.style.display = "none";
            startContainer.style.display = "block";

            // URL TEMPLATE FORMAT 
            // const url = `${currentDomain}/${hostURL} `
            hostLink.value = `${currentDomain}/v3/${hostURL}`
            attendeeLink.value = `${currentDomain}/v3/${attendeeURL}`
        }
    })
})


const meetingLink = document.getElementById("meetingLink")

meetingLink.addEventListener("submit", function(e){
    e.preventDefault()
    window.location.href = `${hostLink.value}`
})