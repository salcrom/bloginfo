let fp = require("lodash/fp");

const dummy = (blogs) => {
    return Array.isArray(blogs) ? 1 : "";
};

const totalLikes = (blogs) => {
    if (!Array.isArray(blogs) || blogs.length === 0) {
        return 0;
    }

    const reducer = (sum, blog) => {
        return sum + blog.likes;
    };

    return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
    if (!Array.isArray(blogs) || blogs.length === 0) {
        return "No hay favoritos";
    }

    const result = blogs.map(({ title, author, likes }) => ({
        title,
        author,
        likes,
    }));

    const maxLikes = Math.max(...result.map((blog) => blog.likes));

    return result.find((blog) => blog.likes === maxLikes);
};

const mostBlogs = (blogs) => {
    if (!Array.isArray(blogs) || blogs.length === 0) {
        return "No hay blogs";
    }

    // Agrupar por autor y contar blogs
    const authorCounts = fp.flow([
        fp.groupBy("author"),
        fp.map((group) => ({
            author: group[0].author,
            blogs: group.length,
        })),
        fp.maxBy("blogs"),
    ])(blogs);

    return authorCounts;
};

const mostLikes = (blogs) => {
    if (!Array.isArray(blogs) || blogs.length === 0) {
        return "No hay blogs";
    }

    // Agrupar por autor y contar likes
    const authorCounts = fp.flow([
        fp.groupBy("author"),
        fp.map((group) => ({
            author: group[0].author,
            likes: fp.sumBy("likes")(group),
        })),
        fp.maxBy("likes"),
    ])(blogs);

    console.log("authorCounts:", authorCounts);
    return authorCounts;
};

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes,
};
