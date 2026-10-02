const { config } = require("dotenv")
config()

const loggedIn = async (req,res, next) =>{
    if(req.cookies.posterUser){
        await fetch(`${process.env.ASFISCHOLAR_ENDPOINT}/external/api/validateLogin`,{
            method:"POST",
            body:JSON.stringify({token:req.cookies.posterUser}),
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
                return res.render("signin", {meetingId:"", recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
            }

        })
    }else{
        return res.render("signin", {meetingId:"", recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
    }
}


module.exports = loggedIn