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

    "subcategory.create",
    "subcategory.read",
    "subcategory.update",
    "subcategory.delete",

    "user.create",
    "user.read",
    "user.update",
    "user.delete",

        "seo.update",
        "admin.dashboard",
    ],

    editor: [
    "blog.create",
    "blog.read",
    "blog.update",

    
    "category.read",

    "subcategory.create",
    "subcategory.read",
    "subcategory.update",

    "seo.update",
    "editor.dashboard",
  ],
};

module.exports = permissions;
