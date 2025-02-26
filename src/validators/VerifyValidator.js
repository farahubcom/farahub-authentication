const persianJs = require("persianjs");

class VerifyValidator {

    /**
     * The validator rules
     * 
     * @returns {object}
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
                        return value ? persianJs(value).persianNumber().toString() : '';
                    }
                },
                matches: {
                    bail: true,
                    options: /(09)[0-9]{9}/i,
                    errorMessage: "فرمت شماره همراه اشتباه است"
                },
            },
        }
    }
}

module.exports = VerifyValidator;