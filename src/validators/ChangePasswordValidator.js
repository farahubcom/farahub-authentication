class ChangePasswordValidator {

    /**
     * The validator rules
     * 
     * @returns {object}
     */
    rules() {
        return {
            password: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "رمز عبور اجباری می‌باشد"
                },
            },
            password_confirmation: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "تکرار رمز عبور اجباری می‌باشد"
                },
                custom: {
                    options: (value, { req, location, path }) => {
                        if (value !== req.body.password) {
                            throw new Error('رمز عبور یکسان نمی‌باشد.');
                        }
                        return true;
                    },
                },
            },
        }
    }
}

module.exports = ChangePasswordValidator;