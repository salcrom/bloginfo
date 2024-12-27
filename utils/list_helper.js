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

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
};
