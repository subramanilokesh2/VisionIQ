const mongoose = require("mongoose");
const Employee = require("./Employee");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ZinnovPlatform")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Only allowed users
const users = [
  { mail_id: "vineet@zinnov.com", employee_id: "397" },
  { mail_id: "vishnu@draup.com", employee_id: "DBS0216" },
  { mail_id: "subramani.lokesh@zinnov.com", employee_id: "3267" },
  { mail_id: "chitra.s@zinnov.com", employee_id: "3292" },
  { mail_id: "dhinakaran.p@zinnov.com", employee_id: "2458" },
  { mail_id: "gopinath.d@zinnov.com", employee_id: "3294" },
  { mail_id: "hemamalini.v@zinnov.com", employee_id: "2459" },
  { mail_id: "janani.b@zinnov.com", employee_id: "3250" },
  { mail_id: "kiruthiga.a@zinnov.com", employee_id: "3295" },
  { mail_id: "kishore.mohandas@zinnov.com", employee_id: "2460" },
  { mail_id: "tamilselvan.s@zinnov.com", employee_id: "2383" },
  { mail_id: "akash.m@zinnov.com", employee_id: "contract_1" },
  { mail_id: "balachandru.s@zinnov.com", employee_id: "contract-2" },
  { mail_id: "ramya.n@zinnov.com", employee_id: "contract_3" },
  { mail_id: "sangeetha.n@zinnov.com", employee_id: "contract-4" },
  { mail_id: "shalini.k@zinnov.com", employee_id: "contract_5" },
  { mail_id: "srikanth.m@zinnov.com", employee_id: "contract_6" }
];

// Seed function
async function seed() {
  await Employee.deleteMany({});
  await Employee.insertMany(users);
  console.log("✅ Users Seeded Successfully");
  mongoose.disconnect();
}

seed();
