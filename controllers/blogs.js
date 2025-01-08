const blogsRouter = require("express").Router();
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

    if (!body.title) {
        return response.status(400).json({
            error: "title missing",
        });
    }

    const user = await User.findById(body.userId);

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user.id,
    });

    const savedBlog = await blog.save();
    user.notes = user.notes.concat(savedNote._id);
    await user.save();

    response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id);
    response.status(204).end();
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
