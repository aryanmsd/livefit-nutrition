const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://livefit_admin:wPRKiT5XdX38jIIq@livefit-cluster.6uyk3hp.mongodb.net/livefit")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));