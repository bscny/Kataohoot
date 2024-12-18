const TestService = require("@/db_services/testFunction/testServices.js");

async function Testing(req, res) {
    const result = await TestService.GetTest();

    res.send(result);
}

module.exports = {
    Testing,
};