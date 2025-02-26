const Login = require("../events/Login");
const SendNotification = require("./SendNotfication");


module.exports = new Map([
    [
        Login, [
            SendNotification,
        ]
    ]
]);