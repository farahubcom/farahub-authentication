class RegisterValidator {

    /**
     * The application instance
     * 
     * @var Application
     */
    app;

    /**
     * Create validator instance
     * 
     * @param {Application} app
     * @constructor
     */
    constructor(app) {
        this.app = app;
    }

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
                    errorMessage: "ورود شماره همراه اجباری است"
                },
                // custom: {
                //     options: (value, { req }) => {
                //         const User = this.app.connection.model('User');

                //         return Doc.resolve(value, User).then(user => {
                //             if (user)
                //                 return Promise.reject(false);
                //             return Promise.resolve(true);
                //         })
                //     },
                //     errorMessage: 'کاربر با این شماره قبلا ثبت شده است',
                //     bail: true
                // },
            },
            password: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "ورود رمز عبور اجباری است"
                },
            },
            password_confirmation: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    errorMessage: "تکرار رمز عبور اجباری است"
                },
                custom: {
                    options: (value, { req }) => {
                        return value === req.body.password;
                    },
                    errorMessage: 'رمز عبور و تکرار رمز عبور مشابه نیستند'
                },
            },
        }
    }
}

module.exports = RegisterValidator;