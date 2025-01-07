const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 3,
    },
    name: {
        type: String,
        required: true,
        minLength: 3,
    },
    passwordHash: {
        type: String,
        required: true,
        minLength: 8,
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog",
        },
    ],
});

userSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        // el passwordHash no se mostrará
        delete returnedObject.passwordHash;
    },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
