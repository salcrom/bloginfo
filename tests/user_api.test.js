const { test, after, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const helper = require("./test_helper");

const User = require("../models/user");
const Blog = require("../models/blog");

describe("Inicialmente hay un usuario en la DB", () => {
    let token;

    beforeEach(async () => {
        await User.deleteMany({});
        await Blog.deleteMany({});

        // Verificar que está vacía
        const emptyUsers = await User.find({});
        console.log("Usuarios después de deleteMany:", emptyUsers.length);

        // Crear usuario de prueba
        const passwordHash = await bcrypt.hash("testpass", 10);
        const user = new User({
            username: "root",
            name: "Test User",
            passwordHash,
        });
        console.log("usuario en BD: ", user);

        const savedUser = await user.save();

        // Verificar que sollo hay un usuario
        const usersAfterSave = await User.find({});
        console.log("Usuarios después de save: ", usersAfterSave.length);

        // Generar token
        token = jwt.sign(
            { username: user.username, id: savedUser._id },
            process.env.SECRET
        );

        // Crear blogs iniciales
        for (let blog of helper.initialBlogs) {
            let blogObject = new Blog({
                ...blog,
                user: savedUser._id,
            });
            await blogObject.save();
        }
    });

    test("Éxito en la creación de un usuario nuevo", async () => {
        const usersAtStart = await helper.usersInDb();
        // console.log("Usuarios al inicio del test:", usersAtStart.length);

        const newUser = {
            username: "mluukkai",
            name: "Matti Luukkainen",
            password: "salainen",
        };

        await api
            .post("/api/users")
            .send(newUser)
            .expect(201)
            .expect("Content-Type", /application\/json/);

        const usersAtEnd = await helper.usersInDb();
        // console.log("Usuarios al final del test: ", usersAtEnd.length);

        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

        const usernames = usersAtEnd.map((user) => user.username);
        // console.log("usernames: ", usernames);
        // console.log("newUser.username: ", newUser.username);
        assert(usernames.includes(newUser.username));
        // console.log(
        //     "assert(usernames.includes(newUser.username)):",
        //     assert(usernames.includes(newUser.username))
        // );
    });

    test("crear falla con código de status apropiado si existe el username", async () => {
        const usersAtStart = await helper.usersInDb();

        const newUser = {
            username: "root",
            name: "Superuser",
            password: "salainen",
        };
        // console.log("Nuevo usuario: ", newUser);

        const result = await api
            .post("/api/users")
            .send(newUser)
            .expect(400)
            .expect("Content-Type", /application\/json/);

        // console.log("result-error: ", result.error);
        // console.log("result-body: ", result.body);
        // console.log("result-body-error: ", result.body.error);

        const usersAtEnd = await helper.usersInDb();
        // console.log("usersAtEnd", usersAtEnd);
        assert(result.body.error.includes("expected `username` to be unique"));

        assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
});

after(async () => {
    await mongoose.connection.close();
});
