const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    author: {
        type: String,
        default: "",
    },
    url: {
        type: String,
        required: [true, "URL is required"],
    },
    likes: {
        type: Number,
        deafult: 0,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
});

blogSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        // if (returnedObject.user && returnedObject.user._id) {
        //     returnedObject.user = {
        //         username: returnedObject.user.user.username,
        //         name: returnedObject.user.name,
        //         id: returnedObject.user._id.toString(),
        //     };
        // }
    },
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
