const { test, after, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const config = require("../utils/config");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../app");
const api = supertest(app);

const helper = require("./test_helper");

const Blog = require("../models/blog");
const User = require("../models/user");

describe("cuando inicialmente hay algunas notas guardadas", () => {
    let token;
    let user;

    beforeEach(async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(config.MONGODB_URI);
            }

            await Blog.deleteMany({});
            await User.deleteMany({});

            // Crear usuario de prueba
            const passwordHash = await bcrypt.hash("testpass", 10);
            const newUser = new User({
                username: "testuser",
                name: "Test User",
                passwordHash,
            });
            user = await newUser.save();

            // Generar token
            token = jwt.sign(
                { username: user.username, id: user._id.toString() },
                process.env.SECRET
            );

            // console.log("Usuario creado: ", user._id.toString());
            // console.log("Token generado: ", token);

            // Crear los blogs iniciales
            const blogObjects = helper.initialBlogs.map((blog) => ({
                ...blog,
                user: user._id,
            }));

            await Promise.all(blogObjects.map((blog) => new Blog(blog).save()));
        } catch (error) {
            console.error("Error en beforeEach:", error);
            throw error;
        }
    });

    test("los blogs son retornados como JSON", async () => {
        // console.log("Token usado: ", token);

        const response = await api
            .get("/api/blogs")
            .set("Authorization", `Bearer ${token}`)
            .expect(200)
            .expect("Content-Type", /application\/json/);

        // console.log("Response status: ", response.status);
        // console.log("Response body: ", response.body);

        assert(
            Array.isArray(response.body),
            "La respuesta debería ser un array"
        );
        assert(response.body.length > 0, "La respuesta debería contener blogs");
    });

    test("todos los blogs son retornados", async () => {
        const response = await api
            .get("/api/blogs")
            .set("Authorization", `Bearer ${token}`);

        // console.log("Response status: ", response.status);
        // console.log("Response body: ", response.body);

        assert.strictEqual(response.body.length, helper.initialBlogs.length);

        const titles = response.body.map((blog) => blog.title).sort();
        const expectedTitle = helper.initialBlogs
            .map((blog) => blog.title)
            .sort();
        assert.deepStrictEqual(titles, expectedTitle);
    });

    test("un título específico está incluido en los blogs retornados", async () => {
        const response = await api
            .get("/api/blogs")
            .set("Authorization", `Bearer ${token}`);

        // console.log("Response status: ", response.status);
        // console.log("Response body: ", response.body);

        assert(
            Array.isArray(response.body),
            "response.body debería ser un array"
        );
        const titles = response.body.map((blog) => blog.title);
        assert(titles.includes("React patterns"));
    });

    describe("viendo un blog específico", () => {
        test("verificar que la propiedad de identificador único se llama id", async () => {
            const response = await api
                .get("/api/blogs")
                .set("Authorization", `Bearer ${token}`);

            assert(
                Array.isArray(response.body) && response.body.length > 0,
                "response.body debería ser un array no vacío"
            );
            const blog = response.body[0];

            // Verifica que exista la propiedad 'id'
            assert(blog.id, "blog debería tener una propiedad id");
            // Verifia que NO exista la propiedad '_id'
            assert(!blog._id, "blog no debería tener una propiedad _id");
        });

        test("ver un blog específico con status 200 y en JSON", async () => {
            const blogsAtStart = await helper.blogsInDb();
            const blogToView = blogsAtStart[0];

            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200)
                .expect("Content-Type", /application\/json/);

            // convertir el ObjetoId a string para la comparación
            const blogToCompare = {
                ...blogToView,
                user: {
                    username: user.username,
                    name: user.name,
                    id: user._id.toString(),
                },
            };

            assert.deepStrictEqual(resultBlog.body, blogToCompare);
        });

        test("Un blog válido puede ser añadido", async () => {
            const newBlog = {
                title: "async/await simplifies making async calls",
                author: "Helsinki University",
                url: "https://helsinkiuniversity.com/",
                likes: 7,
            };

            const blogsAtStart = await helper.blogsInDb();
            // console.log("Token usado: ", token);
            // console.log("Usuario actual: ", user);
            // console.log("Blog a crear", newBlog);

            try {
                const response = await api
                    .post("/api/blogs")
                    .set("Authorization", `Bearer ${token}`)
                    .send(newBlog)
                    .expect(201)
                    .expect("Content-Type", /application\/json/);

                // console.log("Respuesta del servidor:", response.body);
                // console.log("Estado de la respuesta: ", response.status);

                // verificar que el blog se agregó correctamente
                const blogsAtEnd = await helper.blogsInDb();
                assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1);

                //Verificar el contenido del blog agregado
                const addedBlog = response.body;
                assert.strictEqual(addedBlog.title, newBlog.title);
                assert.strictEqual(addedBlog.author, newBlog.author);
                assert.strictEqual(addedBlog.url, newBlog.url);
                assert.strictEqual(addedBlog.likes, newBlog.likes);
                // Verificar que el usuario está asignado correctamente
                assert(
                    addedBlog.user,
                    "El blog debe tener un usuario asignado"
                );
            } catch (error) {
                console.error("Error en el test:", error);
                console.error("Respuesta del servidor:", error.response?.body);
                throw error;
            }
        });

        test("verficar que si la propiedad likes falta en la solicitud, tendrá valor 0", async () => {
            const newBlog = {
                title: "likes = 0",
                author: "Helsinki University",
                url: "https://helsinkiuniversity.com/",
            };

            await api
                .post("/api/blogs")
                .set("Authorization", `Bearer ${token}`)
                .send(newBlog)
                .expect(201);

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

            await api
                .post("/api/blogs")
                .set("Authorization", `Bearer ${token}`)
                .send(newBlog)
                .expect(400);
            await api
                .post("/api/blogs")
                .set("Authorization", `Bearer ${token}`)
                .send(newBlog2)
                .expect(400);

            const blogsAtEnd = await helper.blogsInDb();

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
        });
    });

    describe("borrado de una nota", () => {
        test("exito con status 204 si el id es válido", async () => {
            const blogsAtStart = await helper.blogsInDb();
            const blogToDelete = blogsAtStart[0];

            await api
                .delete(`/api/blogs/${blogToDelete.id}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(204);

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
                .set("Authorization", `Bearer ${token}`)
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
