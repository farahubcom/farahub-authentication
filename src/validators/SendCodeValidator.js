const persianjs = require("persianjs");

class SendCodeValidator {

    /**
     * The validator rules
     * 
     * @returns {Object}
     */
    rules() {
        return {
            phone: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    bail: true,
                    errorMessage: "ورود شماره همراه اجباری است"
                },
                customSanitizer: {
                    options: (value, { req }) => {
                        return value ? persianjs(value).persianNumber().toString() : '';
                    }
                },
                matches: {
                    bail: true,
                    options: /(09)[0-9]{9}/i,
                    errorMessage: "فرمت شماره همراه اشتباه است"
                },
                errorMessage: "ورود شماره همراه اجباری است",
            },
        }
    }
}

module.exports = SendCodeValidator;