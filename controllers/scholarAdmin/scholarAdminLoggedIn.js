const ScholarAdmin = async (req,res, next) =>{
    const userCookie = req.params.user 
    
    const cookieOptions = {
        expiresIn: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true
    } 
    if(userCookie){
        res.cookie("posterUser", userCookie, cookieOptions)
    }else{
        return res.render("signin", {meetingId:""})
    }

    if(req.cookies.posterUser){
        await fetch(`${process.env.ASFISCHOLAR_ENDPOINT}/external/api/validateLogin`,{
            method:"POST",
            body:JSON.stringify({token:userCookie}),
            headers:{
                "Content-type": "application/json"
            }
        }).then(res =>res.json())
        .then(data =>{
            if(data.userInfo){
                req.user = data.userInfo
                next()
            }else{
                console.log(data.error)
                return res.render("signin", {meetingId:""})
            }

        })
    }else{
        return res.render("signin", {meetingId:""})
    }
}


module.exports = ScholarAdmin