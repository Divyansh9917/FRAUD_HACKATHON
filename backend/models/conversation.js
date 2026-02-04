const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender:{ 
        type:String, 
        enum:['client','scammer'],
        required:true 
    },
    text:{type:String,required:true},
    timestamp:{type:Date,default:Date.now}
});

const ConversationSchema=new mongoose.Schema({
    sessionId:{ 
        type:String, 
        required:true, 
        unique:true 
    },
    history:[MessageSchema], 
    isScamDetected:{type:Boolean,default:false},
    extractedIntelligence:{
        upiIds:[String],
        bankAccounts:[String],
        phishingLinks:[String],
        scamType:String
    },
    status:{ 
        type:String, 
        enum:['active','completed','flagged'], 
        default:'active' 
    }
},{timestamps:true});

module.exports=mongoose.model('Conversation',ConversationSchema);