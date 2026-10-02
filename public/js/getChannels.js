const meetingList = document.getElementById("meetingList")
const TotalMeetings = document.getElementById("total-meetings")
fetch(`/allChannels`, {
    method:"GET"
}).then(res =>res.json())
.then(data =>{
    if(data){
        if(data.success){
            console.log(data.chanbels)
            const meetingsListData = data.channels
            if(meetingsListData.length > 0){
                TotalMeetings.innerText  = meetingsListData.length
            for(let i=0; i<meetingsListData.length; i++){
            const meetings = meetingsListData[i]

                meetingList.innerHTML +=`
                <tr>
                <td>${meetings.title}</td>
                <td>${meetings.channel_secret}</td>
                <td>${meetings.host}</td>
                <td>${meetings.view}</td>
                <td>
                <a href=https://posters.asfischolar.com/posterlist/${meetings.channel_secret} target=_blank>View Posters</a>
                </td>
                 </tr>`
            } 
        }else[ 
            meetingList.innerHTML = "No Meeting Availabe"
        ]
        }else{
            alert(data.error)
        }
    }else{
        console.log("could not get data")
    }
})