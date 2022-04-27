const mongoose=require('mongoose')

const categorySchema=new mongoose.Schema({
    category:{
        type:String,
        uppercase:true,
        required:true,
        trim:true,
        unique:true,
    },
    authId:{
        type:mongoose.Schema.Types.ObjectId
    }
})

const category=mongoose.model('category',categorySchema)
module.exports=category