import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    chatid: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country:{
        type:String,
        required:true
    },
   

}, {
    timestamps: true
})

export default mongoose.model("User", UserSchema)