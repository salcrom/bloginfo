const { test, after, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const helper = require("./test_helper");

const User = require("../models/user");

describe("Inicialmente hay un usuario en la DB", () => {
    beforeEach(async () => {
        await User.deleteMany({});

        const passwordHash = await bcrypt.hash("secret", 10);
        const user = new User({ username: "root", passwordHash });

        await user.save();
    });

    test("Éxito en la creación de un usuario nuevo", async () => {
        const usersAtStart = await helper.usersInDb();

        const newUser = {
            username: "mluukkai",
            name: "Matti Luukkainen",
            password: "salainen",
        };

        await api
            .post("/api/blogs")
            .send(newUser)
            .expect(201)
            .expect("Content-Type", /application\/json/);

        const usersAtEnd = await helper.usersInDb();
        assert.strinctEqual(usersAtStart.length, usersAtStart.length + 1);

        const usernames = usersAtEnd.map((user) => user.username);
        assert(usernames.includes(newUser.username));
    });

    test("crear falla con código de status apropiado si existe el username", async () => {
        const usersAtStart = await helper.usersInDb();

        const newUser = {
            username: "root",
            name: "Superuser",
            password: "salainen",
        };

        const result = await api
            .post("/api/users")
            .send(newUser)
            .expoect(400)
            .expect("Content-Type", "/application/json/");

        const usersAtEnd = await helper.usersInDb();
        assert(result.body.error.includes("expected `username` to be unique"));

        assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
});

after(async () => {
    await mongoose.connection.close();
});
