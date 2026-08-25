const permissions = {
  admin: [
    "blog.create",
    "blog.read",
    "blog.update",
    "blog.delete",
    "blog.publish",

    "category.create",
    "category.read",
    "category.update",
    "category.delete",

    "user.create",
    "user.read",
    "user.update",
    "user.delete",

    "seo.update",
  ],

  editor: [
    "blog.create",
    "blog.read",
    "blog.update",

    "category.read",

    "seo.update",
  ],
};

module.exports = permissions;
