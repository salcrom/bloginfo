const { test, after, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const helper = require("./test_helper");

const Blog = require("../models/blog");

describe("cuando inicialmente hay algunas notas guardadas", () => {
    beforeEach(async () => {
        await Blog.deleteMany({});

        for (let blog of helper.initialBlogs) {
            let blogObject = new Blog(blog);
            await blogObject.save();
        }
    });

    test("los blogs son retornados como JSON", async () => {
        await api
            .get("/api/blogs")
            .expect(200)
            .expect("Content-Type", /application\/json/);
    });

    test("todos los blogs son retornados", async () => {
        const response = await api.get("/api/blogs");

        assert.strictEqual(response.body.length, helper.initialBlogs.length);
    });

    test("un título específico está incluido en los blogs retornados", async () => {
        const response = await api.get("/api/blogs");

        const titles = response.body.map((e) => e.title);
        assert(titles.includes("React patterns"));
    });

    describe("viendo un blog específico", () => {
        test("verificar que la propiedad de identificador único se llama id", async () => {
            const response = await api.get("/api/blogs");
            const blog = response.body[0];

            // Verifica que exista la propiedad 'id'
            assert(blog.id);
            // Verifia que NO exista la propiedad '_id'
            assert(!blog._id);
        });
        test("ver un blog específico con status 200 y en JSON", async () => {
            const blogsAtStart = await helper.blogsInDb();

            const blogToView = blogsAtStart[0];

            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect("Content-Type", /application\/json/);

            assert.deepStrictEqual(resultBlog.body, blogToView);
        });

        test("Un blog válido puede ser añadido", async () => {
            const newBlog = {
                title: "async/await simplifies making async calls",
                author: "Helsinki University",
                url: "https://helsinkiuniversity.com/",
                likes: 7,
            };

            const postResponse = await api
                .post("/api/blogs")
                .send(newBlog)
                .expect(201)
                .expect("Content-Type", /application\/json/);

            // verificar que el blog se agregó correctamente
            const getResponse = await api.get("/api/blogs");
            assert.strictEqual(
                getResponse.body.length,
                helper.initialBlogs.length + 1
            );

            const titles = getResponse.body.map((r) => r.title);
            assert(titles.includes(newBlog.title));

            //Verificar el contenido del blog agregado
            const addedBlog = postResponse.body;
            assert.strictEqual(addedBlog.title, newBlog.title);
            assert.strictEqual(addedBlog.author, newBlog.author);
            assert.strictEqual(addedBlog.url, newBlog.url);
            assert.strictEqual(addedBlog.likes, newBlog.likes);
        });

        test("verficar que si la propiedad likes falta en la solicitud, tendrá valor 0", async () => {
            const newBlog = {
                title: "likes = 0",
                author: "Helsinki University",
                url: "https://helsinkiuniversity.com/",
            };

            await api.post("/api/blogs").send(newBlog).expect(201);

            const blogsAtEnd = await helper.blogsInDb();

            assert.strictEqual(blogsAtEnd[blogsAtEnd.length - 1].likes, 0);
        });

        test("blog sin propiedad title o url, obtiene respuesta del backend, estado 400 Bad Request", async () => {
            const newBlog = {
                author: "Helsinki University",
                url: "https://helsinkiuniversity.com/",
                likes: 7,
            };

            const newBlog2 = {
                title: "Property without title or url",
                author: "Helsinki University",
                likes: 7,
            };

            await api.post("/api/blogs").send(newBlog).expect(400);
            await api.post("/api/blogs").send(newBlog2).expect(400);

            const blogsAtEnd = await helper.blogsInDb();

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
        });
    });

    describe("borrado de una nota", () => {
        test("exito con status 204 si el id es válido", async () => {
            const blogsAtStart = await helper.blogsInDb();
            const blogToDelete = blogsAtStart[0];

            await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

            const blogsAtEnd = await helper.blogsInDb();

            assert.strictEqual(
                blogsAtEnd.length,
                helper.initialBlogs.length - 1
            );

            const titles = blogsAtEnd.map((r) => r.title);
            assert(!titles.includes(blogToDelete.title));
        });
    });

    describe("actualiado de una nota", () => {
        test("éxito actualización de una nota", async () => {
            const blogsAtStart = await helper.blogsInDb();
            const blogToUpdate = blogsAtStart[0];

            const updatedLikes = {
                likes: blogToUpdate.likes + 1,
            };

            const response = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send(updatedLikes)
                .expect(200)
                .expect("Content-Type", /application\/json/);

            assert.strictEqual(response.body.likes, updatedLikes.likes);
        });
    });
});

after(async () => {
    await mongoose.connection.close();
});
