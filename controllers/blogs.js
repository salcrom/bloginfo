const blogsRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const Blog = require("../models/blog");
const User = require("../models/user");

blogsRouter.get("/", async (request, response) => {
    try {
        const blogs = await Blog.find({}).populate("user", {
            username: 1,
            name: 1,
        });
        response.status(200).json(blogs);
        // .json(blogs.maps((blog) => blog.toJSON()));
    } catch (error) {
        console.error("Error getting blogs", error);
        response.status(500).json({ error: error.message });
    }
});

blogsRouter.get("/:id", async (request, response) => {
    const blog = await Blog.findById(request.params.id).populate("user", {
        username: 1,
        name: 1,
    });

    if (blog) {
        response.json(blog);
    } else {
        response.status(404).end();
    }
});

blogsRouter.post("/", async (request, response) => {
    try {
        const body = request.body;
        const user = request.user;

        // console.log("Body recibido: ", body);
        // console.log("Usuario extraido en el controlador: ", user);

        if (!user || !user._id) {
            return response
                .status(401)
                .json({ error: "token missing or invalid" });
        }

        if (!body.title || !body.url) {
            return response.status(400).json({
                error: "title and url are required",
            });
        }

        const blog = new Blog({
            title: body.title,
            author: body.author || "",
            url: body.url,
            likes: body.likes || 0,
            user: user._id.toString(),
        });
        // console.log("Blog a guardar: ", blog.toJSON());

        const savedBlog = await blog.save();
        // console.log("Blog guardado: ", savedBlog);

        await savedBlog.populate("user", {
            username: 1,
            name: 1,
        });

        user.blogs = user.blogs.concat(savedBlog._id);
        await user.save();

        // console.log("Blog guardado con éxito: ", savedBlog.toJSON());

        response.status(201).json(savedBlog);
    } catch (error) {
        console.error("Error al crear blog: ", error);
        if (error.name === "ValidationError") {
            return response.status(400).json({
                error: error.message,
            });
        }
        if (error.name === "JsonWebTokenError") {
            return response.status(401).json({
                error: "token invalid",
            });
        }
        response.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
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
