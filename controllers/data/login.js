const login = async (req,res) =>{
    try{
    const {user, pass} = req.body
    const turnstileToken = req.body.turnstile_token || req.body.recaptcha || req.body["cf-turnstile-response"] || req.body["g-recaptcha-response"] || ""

    if(!turnstileToken){
        return res.json({status:"error", error:"Please complete the Turnstile verification."})
    }

    function getClientIP(req) {
        let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

        // Clean IPv6 localhost
        if (ip === "::1") ip = "127.0.0.1";

        return ip;
    }

async function response() {
        return  await fetch(`${process.env.ASFISCHOLAR_ENDPOINT}/api/login`, {
        method:"POST",
        body:JSON.stringify({
            user:user,
            pass:pass,
            turnstile_token: turnstileToken,
            remoteIp: getClientIP(req)
        }),
        headers:{
            "Content-type": "application/json"
        }
    }).then(res=>res.json())
    .then(data =>{
        return data
    })
}
    const responseData = await response()
    const cookieOptions = {
        expiresIn: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true
    } 
    if(responseData.success){
        res.cookie("posterUser", responseData.userToken, cookieOptions)
        res.json({status: "success", success: "User Logged in",})
    }else{
        return res.json({status:"error", error:responseData.error})
    }
}catch(error){
    console.log(error)
    return res.json({status:"error", error:error.message})
}
}

module.exports = login
