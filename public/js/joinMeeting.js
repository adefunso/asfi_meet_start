const joinRoom = document.getElementById("joinRoom")
const RoomID = document.getElementById("roomID")

joinRoom.addEventListener("submit", function(e){
    e.preventDefault()
    window.location.href = `/v3/${RoomID.value}`
}) 