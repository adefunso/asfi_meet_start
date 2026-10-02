const mostratedList = document.getElementById("most-ratedList")
const mostviewedList = document.getElementById("most-viewedList")
const mostlikedList = document.getElementById("most-likedList")
const mostdislikedList = document.getElementById("most-dislikedList")
const TotalPosters = document.getElementById("total-posters")

const AllLikedItems = []
const AllDisLikedItems = []
const AllRatedItems = []
const AllViewedITems = []

async function GetPosterDetails(posterId){
    return fetch(`/posterDetails/${posterId}`,{
        method:"GET"
    }).then(res =>res.json())
    .then(data =>{
        if(data.error){
            return null
        }else{
            return data.poster
        }
    })
}
function getTotalPosters(){
    fetch(`/getTotalPosters`, {
        method:"POST"
    }).then(res => res.json())
    .then(data =>{
        
        if(data.success){
            TotalPosters.innerText = new Number(data.totalPosters).toLocaleString()
        }else{
            TotalPosters.innerText = 0
        }
    })
}
getTotalPosters()
fetch(`/mostRated`, {
    method:"GET"
}).then(res =>res.json())
.then(async data =>{
    if(data){
        if(data.success){
            const mostratedData = data.ratedList
            if(mostratedData.length > 0){
            for(let i=0; i<mostratedData.length; i++){
            const ratings = mostratedData[i]
            const posterId  = ratings.posterId
            const totalRatings = ratings.total_ratings

            const posterDetails = await GetPosterDetails(posterId)
            let posterTitle =''
            let posterOwner = ''

            if(posterDetails.length > 0){
        
            posterTitle = posterDetails[0].poster_deck_title
            posterOwner = posterDetails[0].poster_deck_owner
            }


                mostratedList.innerHTML +=`
                <tr>
                <td>${posterTitle}</td>
                <td>${posterOwner}</td>
                <td>${totalRatings}</td>
                <td>
                <a href=https://posters.asfischolar.com/event/poster/${posterId} target=_blank>View Poster</a>
                </td>
                 </tr>`
                 AllRatedItems.push({
                    title: posterTitle,
                    presenter: posterOwner ,
                    count: totalRatings
                 })
                
            } 
        }else[ 
            mostratedList.innerHTML = "No Rating Availabe"
        ]
        }else{
            alert(data.error)
        }
    }else{
        console.log("could not get data")
    }
})


fetch(`/mostViewed`, {
    method:"GET"
}).then(res =>res.json())
.then(async data =>{
    if(data){
        if(data.success){
            const mostviewedData = data.viewedList
            if(mostviewedData.length > 0){
            for(let i=0; i<mostviewedData.length; i++){
            const views = mostviewedData[i]
            const posterId  = views.poster_id
            const totalViews = views.total_views

            const posterDetails = await GetPosterDetails(posterId)
        
            let posterTitle =''
            let posterOwner = ''

            if(posterDetails.length > 0){
        
            posterTitle = posterDetails[0].poster_deck_title
            posterOwner = posterDetails[0].poster_deck_owner
            }

                mostviewedList.innerHTML +=`
                <tr>
                <td>${posterTitle}</td>
                <td>${posterOwner}</td>
                <td>${totalViews}</td>
                <td>
                <a href=https://posters.asfischolar.com/event/poster/${posterId} target=_blank>View Poster</a>
                </td>
                 </tr>`
            } 
        }else[ 
            mostviewedList.innerHTML = "No Rating Availabe"
        ]
        }else{
            alert(data.error)
        }
    }else{
        console.log("could not get data")
    }
})



fetch(`/mostLiked`, {
    method:"GET"
}).then(res =>res.json())
.then(async data =>{
    if(data){
        if(data.success){
            const mostlikedData = data.likedList
            if(mostlikedData.length > 0){
            for(let i=0; i<mostlikedData.length; i++){
            const likes = mostlikedData[i]
            const posterId  = likes.poster_id
            const totalLikes = likes.total_likes

            const posterDetails = await GetPosterDetails(posterId)
            let posterTitle =''
            let posterOwner = ''

            if(posterDetails.length > 0){
        
            posterTitle = posterDetails[0].poster_deck_title
            posterOwner = posterDetails[0].poster_deck_owner
            }


            mostlikedList.innerHTML +=`
                <tr>
                <td>${posterTitle}</td>
                <td>${posterOwner}</td>
                <td>${totalLikes}</td>
                <td>
                <a href=https://posters.asfischolar.com/event/poster/${posterId} target=_blank>View Poster</a>
                </td>
                 </tr>`
            } 
        }else[ 
            mostlikedList.innerHTML = "No Likes Availabe"
        ]
        }else{
            alert(data.error)
        }
    }else{
        console.log("could not get data")
    }
})

fetch(`/mostDisliked`, {
    method:"GET"
}).then(res =>res.json())
.then(async data =>{
    if(data){
        if(data.success){
            const mostdislikedData = data.dislikedList
            if(mostdislikedData.length > 0){
            for(let i=0; i<mostdislikedData.length; i++){
            const dislikes = mostdislikedData[i]
            const posterId  = dislikes.poster_id
            const totalDislikes = dislikes.total_dislikes

            const posterDetails = await GetPosterDetails(posterId)
            let posterTitle =''
            let posterOwner = ''

            if(posterDetails.length > 0){
        
            posterTitle = posterDetails[0].poster_deck_title
            posterOwner = posterDetails[0].poster_deck_owner
            }


            mostdislikedList.innerHTML +=`
                <tr>
                <td>${posterTitle}</td>
                <td>${posterOwner}</td>
                <td>${totalDislikes}</td>
                <td>
                <a href=https://posters.asfischolar.com/event/poster/${posterId} target=_blank>View Poster</a>
                </td>
                 </tr>`
            } 
        }else[ 
            mostdislikedList.innerHTML = "No Dislikes Availabe"
        ]
        }else{
            alert(data.error)
        }
    }else{
        console.log("could not get data")
    }
})