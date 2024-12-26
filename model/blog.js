const mongoose = require("mongoose");
require("dotenv").config();

mongoose.set("strictQuery", false);

const mongoUrl = process.env.MONGODB_URI;

mongoose
    .connect(mongoUrl)
    .then(() => {
        console.log("connected to MongoDB");
    })
    .catch((error) => {
        console.log("error connecting to MongoDB: ", error.message);
    });

const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number,
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
