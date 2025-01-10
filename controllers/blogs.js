const blogsRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const Blog = require("../models/blog");
const User = require("../models/user");

blogsRouter.get("/", async (request, response) => {
    const blogs = await Blog.find({}).populate("user", {
        username: 1,
        name: 1,
    });
    response.json(blogs);
});

blogsRouter.get("/:id", async (request, response, next) => {
    const blog = await Blog.findById(request.params.id);

    if (blog) {
        response.json(blog);
    } else {
        response.status(404).end();
    }
});

blogsRouter.post("/", async (request, response) => {
    const body = request.body;

    const user = request.user;

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user._id,
    });
    console.log("blog", blog);

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
    try {
        const user = request.user;

        // verificar si el blog existe
        const blog = await Blog.findById(request.params.id);
        if (!blog) {
            return response.status(404).json({ error: "blog not found" });
        }

        // verificar si el usuario es el propietario del blog
        if (blog.user.toString() === user._id.toString()) {
            await Blog.findByIdAndDelete(request.params.id);
            return response.status(204).end();
        } else {
            return response.status(401).json({
                error: "unauthorized: only the creator can delete this blog",
            });
        }
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return response.status(401).json({ error: "token invalid" });
        }

        return response.status(500).json({ error: "internal server error" });
    }
});

blogsRouter.put("/:id", async (request, response) => {
    const body = request.body;

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(
            request.params.id,
            { likes: body.likes || 0 },
            { new: true, runValidators: true }
        );

        if (updatedBlog) {
            response.json(updatedBlog);
        } else {
            response.status(404).end();
        }
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
});

module.exports = blogsRouter;
