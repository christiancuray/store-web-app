const Sequelize = require("sequelize");
const { Op } = require("sequelize");

// connect to the database
// const sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "Cv75rieDxWkg", {
//   host: "ep-empty-shape-a5lkblz0.us-east-2.aws.neon.tech",
//   dialect: "postgres",
//   port: 5432,
//   dialectOptions: {
//     ssl: { rejectUnauthorized: false },
//   },
//   query: { raw: true },
// });
const sequelize = new Sequelize(
  process.env.DATABASE_NAME || "SenecaDB",
  process.env.DATABASE_USER || "SenecaDB_owner",
  process.env.DATABASE_PASSWORD || "Cv75rieDxWkg",
  {
    host:
      process.env.DATABASE_HOST ||
      "ep-empty-shape-a5lkblz0.us-east-2.aws.neon.tech",
    dialect: "postgres",
    port: process.env.DATABASE_PORT || 5432,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    query: { raw: true },
  }
);

const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  itemDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

// create a relationship between Item and Category
Item.belongsTo(Category, { foreignKey: "category" });
Category.hasMany(Item, { foreignKey: "category" });

// function that reads the data from the items.json and categories.json files
let initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Initialized the database successfully.");
      })
      .catch((err) => {
        reject("Unable to sync the database");
      });
  });
};

// function that returns all items
let getAllItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that returns all items taht have published set to true
let getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true } })
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that returns all categories
let getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((categories) => {
        resolve(categories);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that let the user add item to the items collection
let addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    // set the blank values into null values
    for (const val in itemData) {
      if (itemData[val] === "") {
        itemData[val] = null;
      }
    }

    itemData.itemDate = new Date();

    Item.create({
      title: itemData.title,
      body: itemData.body,
      itemDate: itemData.itemDate,
      featureImage: itemData.featureImage,
      published: itemData.published,
      price: itemData.price,
      category: itemData.category,
    })
      .then(() => {
        resolve("Item added successfully");
      })
      .catch((err) => {
        reject("Unable to create item");
      });
  });
};

// function that returns items that belong to the provided category
let getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category: category } })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        }
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that returns items that have a date greater than or equal to the provided date
let getItemsByMinDate = (minDate) => {
  return new Promise((resolve, reject) => {
    const { Op } = Sequelize;

    Item.findAll({
      where: {
        itemDate: {
          [Op.gte]: new Date(minDate),
        },
      },
    })
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that returns item that have the provided id
let getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { id: id } })
      .then((items) => {
        resolve(items[0]);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that returns items that belong to the provided category and have published set to true
let getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category: category, published: true } })
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        reject("No result returned");
      });
  });
};

// function that add category to the categories collection
let addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    for (const val in categoryData) {
      if (categoryData[val] === "") {
        categoryData[val] = null;
      }
    }

    Category.create({ category: categoryData.category })
      .then(() => {
        resolve("Category added successfully");
      })
      .catch((err) => {
        reject("Unable to create category");
      });
  });
};

// function that delete Category based on the provided id in the parameter
let deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({ where: { id: id } })
      .then(() => {
        resolve("Category deleted successfully");
      })
      .catch((err) => {
        reject("Unable to delete category");
      });
  });
};

// function that delete Item based on the provided id in the parameter
let deleteItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id: id } })
      .then(() => {
        resolve("Item deleted successfully");
      })
      .catch((err) => {
        reject("Unable to delete item");
      });
  });
};

// export the functions to be used in the server.js
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deleteItemById,
};
