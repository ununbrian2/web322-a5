const Sequelize = require("sequelize");
var sequelize = new Sequelize(
  "zipsuzsa",
  "zipsuzsa",
  "DtK646Aq-v-cuouL8DncC6bTe7EpW1hp",
  {
    host: "drona.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

function initialize() {
  return sequelize
    .sync()
    .then(() => console.log("Database synced"))
    .catch((err) => console.log("Error: " + err));
}

function getAllItems() {
  return Item.findAll();
}

function getItemsByCategory(category) {
  return Item.findAll({ where: { category: category } });
}

function getItemsByMinDate(minDateStr) {
  const { gte } = Sequelize.Op;
  return Item.findAll({
    where: {
      postDate: {
        [gte]: new Date(minDateStr),
      },
    },
  });
}

function getItemById(id) {
  return Item.findAll({ where: { id: id } });
}

function addItem(itemData) {
  itemData.published = itemData.published ? true : false;
  itemData.postDate = new Date();
  return Item.create(itemData);
}

function deleteItemById(id) {
  return Item.destroy({ where: { id: id } });
}

function getPublishedItems() {
  return Item.findAll({ where: { published: true } });
}

function getPublishedItemsByCategory(category) {
  return Item.findAll({ where: { category: category, published: true } });
}

function getAllCategories() {
  return Category.findAll();
}

function addCategory(categoryData) {
  return Category.create(categoryData);
}

function deleteCategoryById(id) {
  return Category.destroy({ where: { id: id } });
}

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getAllCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deleteItemById,
};
