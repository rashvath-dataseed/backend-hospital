const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",

    host: "localhost",

    database: "hospital_db",

    password: "Hospital@123",

    port: 5432,
});

pool.connect((err) => {
    if (err) {
        console.log("Database connection error:", err);
    } else {
        console.log("PostgreSQL Connected");
    }
});

module.exports = pool;