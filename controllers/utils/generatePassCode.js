const generatePassCode = async () =>{
    try{
         let part1 = Math.floor(1000 + Math.random() * 9000);  // Generates a 4-digit number
        let part2 = Math.floor(1000 + Math.random() * 9000);  // Generates another 4-digit number
        const uniqueCode = `GPC_${part1}_${part2}`;
        return uniqueCode
    }catch(error){
        console.log(error)
        return null
    }
}


module.exports = generatePassCode