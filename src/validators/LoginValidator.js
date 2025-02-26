class LoginValidator {

    /**
     * The validator rules
     * 
     * @returns {object}
     */
    rules() {
        return {
            username: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "ورود شماره همراه اجباری است"
                },
            },
            password: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "ورود رمز عبور اجباری است"
                },
            },
        }
    }
}

module.exports = LoginValidator;