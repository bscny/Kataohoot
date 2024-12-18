const db = require('@/database.js');

// read services
async function GetTest() {
    const records = await db.query(`select *
                                      from User`);

    return records[0];
}

// delete services

// create services


// update services

module.exports = {
    GetTest,
};