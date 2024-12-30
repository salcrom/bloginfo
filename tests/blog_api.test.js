const { test, after, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const Blog = require("../models/blog");
const mongoose = require("mongoose");
const supertest = require("supertest");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);

// const initialBlogs = [
//     {
//         _id: "5a422a851b54a676234d17f7",
//         title: "React patterns",
//         author: "Michael Chan",
//         url: "https://reactpatterns.com/",
//         likes: 7,
//         __v: 0,
//     },
//     {
//         _id: "5a422aa71b54a676234d17f8",
//         title: "Go To Statement Considered Harmful",
//         author: "Edsger W. Dijkstra",
//         url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
//         likes: 5,
//         __v: 0,
//     },
// ];

beforeEach(async () => {
    await Blog.deleteMany({});

    for (let blog of helper.initialBlogs) {
        let blogObject = new Blog(blog);
        await blogObject.save();
    }
});

describe("blog_api", () => {
    console.log("entered test");
    test("blogs are returned as json", async () => {
        await api
            .get("/api/blogs")
            .expect(200)
            .expect("Content-Type", /application\/json/);
    });

    test("there are two blogs", async () => {
        const response = await api.get("/api/blogs");

        assert.strictEqual(response.body.length, helper.initialBlogs.length);
    });

    test("the title first blog is about React patterns", async () => {
        const response = await api.get("/api/blogs");

        const titles = response.body.map((e) => e.title);
        assert(titles.includes("React patterns"));
    });

    test("a valid blog can be added", async () => {
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

    test("blog without title is not added", async () => {
        const newBlog = {
            author: "Helsinki University",
            url: "https://helsinkiuniversity.com/",
            likes: 7,
        };

        await api.post("/api/blogs").send(newBlog).expect(400);

        const blogsAtEnd = await helper.blogsInDb();

        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
    });

    test("a specific blog can be viewed", async () => {
        const blogsAtStart = await helper.blogsInDb();

        const blogToView = blogsAtStart[0];

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect("Content-Type", /application\/json/);

        assert.deepStrictEqual(resultBlog.body, blogToView);
    });

    test("a blog can be deleted", async () => {
        const blogsAtStart = await helper.blogsInDb();
        const blogToDelete = blogsAtStart[0];

        await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

        const blogsAtEnd = await helper.blogsInDb();

        const titles = blogsAtEnd.map((r) => r.title);
        assert(!titles.includes(blogToDelete.title));

        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
    });
});

after(async () => {
    await mongoose.connection.close();
});
