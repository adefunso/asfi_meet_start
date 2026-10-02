const { config } = require("dotenv")


const NoLogInNeeded = async (req,res, next) =>{

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
                return res.render("signin", {meetingId:req.params.meetingId, recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
            }

        })
    }else if(req.query.byPass == true || req.query.byPass == "true" || req.query.byPass == 1){
                function getClientIP(req) {
            let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        
            // Clean IPv6 localhost
            if (ip === '::1') ip = '127.0.0.1';
          
            return ip;
          }
          
          const ip = getClientIP(req)

        req.user = {
            id: ip,
            acct_type:"scholar_account"
        }
        next()
    }else if((req.query.byPass == true || req.query.byPass == "true" || req.query.byPass == 1) && (req.query.guest == true || req.query.guest == 'true' || req.query.guest == 1 )){
                function getClientIP(req) {
            let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        
            // Clean IPv6 localhost
            if (ip === '::1') ip = '127.0.0.1';
          
            return ip;
          }
          
          const ip = getClientIP(req)

        req.user = {
            id: ip,
            acct_type:"scholar_account"
        }
        next()
    }else if(req.query.guest == true || req.query.guest == 'true' || req.query.guest == 1 ){
          function getClientIP(req) {
            let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        
            // Clean IPv6 localhost
            if (ip === '::1') ip = '127.0.0.1';
          
            return ip;
          }
          
          const ip = getClientIP(req)

        req.user = {
            id: ip,
            acct_type:"scholar_account"
        }
        next()
    }else{
        return res.render("signin", {meetingId:req.params.meeting, recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY || "" })
    }
}


module.exports = NoLogInNeeded