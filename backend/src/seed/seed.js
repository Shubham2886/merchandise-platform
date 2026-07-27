require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const categoryData = [
  { name: "T-Shirts" },
  { name: "Hoodies" },
  { name: "Caps" },
  { name: "Mugs" },
  { name: "Bottles" },
  { name: "Tote Bags" },
  { name: "Stickers" },
];

const printTypes = ["Screen Printing", "DTF Printing", "Sublimation", "Embroidery", "UV Printing"];
const printLocations = ["Front", "Back", "Sleeve", "Chest Pocket"];

function buildProducts(categoryMap) {
  return [
    {
      name: "Classic Cotton T-Shirt",
      description: "100% combed cotton crew-neck t-shirt, perfect canvas for custom prints.",
      category: categoryMap["T-Shirts"],
      images: ["/uploads/sample-tshirt.jpg"],
      price: 399,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "White", "Navy", "Red"],
      stock: 150,
      sku: "TSHIRT-CLASSIC-001",
      printTypes: ["Screen Printing", "DTF Printing"],
      printLocations,
    },
    {
      name: "Fleece Pullover Hoodie",
      description: "Heavyweight fleece hoodie with kangaroo pocket, great for embroidered logos.",
      category: categoryMap["Hoodies"],
      images: ["/uploads/sample-hoodie.jpg"],
      price: 999,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Grey", "Maroon"],
      stock: 80,
      sku: "HOODIE-FLEECE-001",
      printTypes: ["Embroidery", "DTF Printing"],
      printLocations,
    },
    {
      name: "Structured Cotton Cap",
      description: "6-panel structured cap with adjustable strap, embroidery ready.",
      category: categoryMap["Caps"],
      images: ["/uploads/sample-cap.jpg"],
      price: 249,
      sizes: ["Free Size"],
      colors: ["Black", "White", "Khaki"],
      stock: 200,
      sku: "CAP-STRUCT-001",
      printTypes: ["Embroidery"],
      printLocations: ["Front"],
    },
    {
      name: "Ceramic Coffee Mug 350ml",
      description: "Glossy white ceramic mug, ideal for sublimation prints and photos.",
      category: categoryMap["Mugs"],
      images: ["/uploads/sample-mug.jpg"],
      price: 199,
      sizes: ["Standard"],
      colors: ["White"],
      stock: 300,
      sku: "MUG-CERAMIC-001",
      printTypes: ["Sublimation"],
      printLocations: ["Wraparound"],
    },
    {
      name: "Stainless Steel Water Bottle 750ml",
      description: "Double-wall insulated bottle, laser/UV print ready.",
      category: categoryMap["Bottles"],
      images: ["/uploads/sample-bottle.jpg"],
      price: 449,
      sizes: ["750ml"],
      colors: ["Silver", "Black", "Blue"],
      stock: 120,
      sku: "BOTTLE-STEEL-001",
      printTypes: ["UV Printing"],
      printLocations: ["Front"],
    },
    {
      name: "Canvas Tote Bag",
      description: "Heavy-duty canvas tote, great for screen-printed logos.",
      category: categoryMap["Tote Bags"],
      images: ["/uploads/sample-tote.jpg"],
      price: 299,
      sizes: ["Standard"],
      colors: ["Natural", "Black"],
      stock: 100,
      sku: "TOTE-CANVAS-001",
      printTypes: ["Screen Printing", "DTF Printing"],
      printLocations: ["Front", "Back"],
    },
    {
      name: "Die-Cut Vinyl Sticker Pack",
      description: "Waterproof vinyl stickers, custom die-cut to any shape.",
      category: categoryMap["Stickers"],
      images: ["/uploads/sample-sticker.jpg"],
      price: 99,
      sizes: ["3in", "5in"],
      colors: ["Full Color"],
      stock: 500,
      sku: "STICKER-VINYL-001",
      printTypes: ["UV Printing"],
      printLocations: ["N/A"],
    },
  ].map((p) => ({ ...p, printTypes: p.printTypes.filter((t) => printTypes.includes(t)) }));
}

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({})]);

  console.log("Seeding categories...");
  const categories = await Category.insertMany(
    categoryData.map((c) => ({ name: c.name, slug: slugify(c.name), description: `${c.name} for custom merchandise` }))
  );
  const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  console.log("Seeding products...");
  await Product.insertMany(buildProducts(categoryMap));

  console.log("Seeding users...");
  const admin = new User({
    name: "Admin User",
    email: "admin@merchstore.com",
    password: "Admin@123",
    role: "admin",
  });
  await admin.save();

  const customer = new User({
    name: "Demo Customer",
    email: "customer@merchstore.com",
    password: "Customer@123",
    role: "customer",
    phone: "9876543210",
    address: {
      line1: "221B Baker Street",
      city: "Nagpur",
      state: "Maharashtra",
      pincode: "440001",
      country: "India",
      phone: "9876543210",
    },
  });
  await customer.save();

  console.log("\nSeed complete.");
  console.log("Demo admin login:    admin@merchstore.com / Admin@123");
  console.log("Demo customer login: customer@merchstore.com / Customer@123");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
