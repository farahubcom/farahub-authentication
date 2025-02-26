const { Controller } = require('@farahub/framework/foundation');
const random = require('lodash/random');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pick = require('lodash/pick');
const addSeconds = require('date-fns/addSeconds');
const { Validator, Injection, Lang } = require('@farahub/framework/facades');
const VerifyValidator = require('../validators/VerifyValidator');
const SendCodeValidator = require('../validators/SendCodeValidator');
const LoginValidator = require('../validators/LoginValidator');
const RegisterValidator = require('../validators/RegisterValidator');
const { hash } = require('bcrypt');
const SmsHandler = require('../../sms/facades/SmsHandler');


class MainController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Main';

    /**
     * The controller base path
     * 
     * @var string
     */
    basePath = '/auth';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        { type: 'api', method: 'post', path: '/verify', handler: 'verify' },
        { type: 'api', method: 'post', path: '/sendCode', handler: 'sendCode' },
        { type: 'api', method: 'post', path: '/login/:strategy?', handler: 'login' },
        { type: 'web', method: 'post', path: '/login/:strategy?', handler: 'login' },
        { type: 'web', method: 'post', path: '/register', handler: 'register' },
        { type: 'web', method: 'post', path: '/logout', handler: 'logout' },
    ];

    /**
     * Generate code & sms token for user
     * 
     * @param User user
     */
    async _sentCodeViaSms(user) {

        // generate random code
        const code = random(10000, 99999);

        // create token
        const AuthToken = this.app.connection.model('AuthToken');
        await AuthToken.createFromValue(code, {
            user,
            type: "sms",
            validTill: addSeconds(new Date(), 120)
        });

        // log the code in dev
        if (this.app.dev) {
            console.log('Sms verification code ', { phone: user.phone, code })
        }

        // send code via sms
        if (!this.app.dev) {
            const handler = SmsHandler.make();
            await handler.sendMessage(code, [user.phone], {
                'pattern': '8mg0fwx43vbwuro',
                'params': { "code": code }
            });
        }
    }

    /**
     * Check if user already exists and has password
     * 
     * @return void
     */
    verify() {
        return [
            Validator.validate(new VerifyValidator()),
            async function (req, res) {

                const { phone } = req.body;

                const User = this.app.connection.model('User');

                let user = await User.findOne({ phone }, '+password');
                if (!user) {
                    return res.json({
                        ok: true,
                        result: 0,
                        message: 'کاربری با این مشخصات وجود ندارد.'
                    })
                }

                if (!user.password) {

                    await this._sentCodeViaSms(user);

                    return res.json({
                        ok: true,
                        result: 1,
                        message: 'User has no password',
                    });
                }


                return res.json({
                    ok: true,
                    result: 2,
                    message: 'User exist and has password'
                });
            }
        ]
    }

    /**
     * Send code via sms to the user
     * 
     * @return void 
     */
    sendCode() {
        return [
            Validator.validate(new SendCodeValidator()),
            async function (req, res) {

                const { phone } = req.body;

                const User = this.app.connection.model('User');

                let user = await User.findOne({ phone });
                if (!user) {
                    return res.json({
                        ok: false,
                        message: 'کاربری با این مشخصات وجود ندارد.'
                    })
                }

                await this._sentCodeViaSms(user);

                // return response
                return res.json({ ok: true });
            }
        ]
    }

    /**
     * Login user using username & password
     * 
     * @return void
     */
    login() {
        return [
            Injection.register(this.module, 'main.login'),
            Validator.validate(new LoginValidator()),
            async function (req, res, next) {
                const { strategy } = req.params;

                const self = this;

                const session = Boolean(req.accepts('html'));

                const handler = strategy && ['sms'].includes(strategy) ? 'local-'.concat(strategy) : 'local';
                passport.authenticate(
                    handler,
                    async (err, user, info) => {
                        try {
                            if (err || !user) {
                                if (req.accepts('html')) {
                                    req.flash('errors', [info.message])
                                    return res.redirect(req.headers.referer)
                                }
                                return res.json({ ok: false, ...info });
                            }

                            req.login(user, { session },
                                async (error) => {
                                    if (error) {
                                        if (req.accepts('html')) {
                                            req.flash('errors', ['مشکلی پیش آمده است'])
                                            return res.redirect(req.headers.referer)
                                        }
                                        return next();
                                    };

                                    if (req.accepts('html')) {
                                        const { returnTo } = req.query;
                                        return res.redirect(returnTo || '/');
                                    }

                                    const queryInjections = await req.inject('populate');

                                    const User = self.app.connection.model('User');
                                    let userObject = await User.findById(user.id)
                                        .populate([
                                            ...queryInjections
                                        ])
                                        .lean({ virtuals: true });


                                    const injectedParams = await req.inject('params', { user });

                                    const token = jwt.sign({ user: pick(user, ['id', 'phone']) }, 'TOP_SECRET');

                                    userObject = Lang.translate(userObject);

                                    return res.json({
                                        ok: true,
                                        token,
                                        user: userObject,
                                        ...(injectedParams && Object.assign({},
                                            ...injectedParams
                                        ))
                                    });
                                }
                            );
                        } catch (error) {
                            return next(error);
                        }
                    }
                )(req, res, next);
            }
        ]
    }

    /**
     * Register user using username & password
     * 
     * @return void
     */
    register() {
        return [
            Injection.register(this.module, 'main.register', { core: true }),
            Validator.validate(new RegisterValidator(this.app)),
            async function (req, res, next) {

                const { password } = req.body;

                const User = this.app.connection.model('User');
                let user = await User.findOne({ phone: req.body.phone });

                if (!user) {
                    user = await User.createNew(req.body, { inject: req.inject });
                }

                const isMember = await req.workspace.hasMember(user);
                if (isMember) {
                    req.flash('errors', ['این شماره قبلا ثبت شده است.'])
                    return res.redirect(req.headers.referer)
                }

                const hashedPassword = await hash(password, 10);

                await req.workspace.addMember(user, undefined, {
                    password: hashedPassword,
                    tabBarPins: [],
                    options: {
                        showWalkthrough: false
                    }
                });

                await user.setCurrentWorkspace(req.workspace);

                req.login(user, function (err) {
                    if (err) { return next(err); }
                    const { returnTo } = req.query;
                    return res.redirect(returnTo || '/');
                });
            }
        ]
    }

    /**
     * Logout user
     * 
     * @return void
     */
    logout() {
        return [
            Injection.register(this.module, 'main.logout'),
            async function (req, res, next) {
                req.logout(function (err) {
                    if (err) { return next(err); }
                    res.redirect('/');
                });
            }
        ]
    }
}

module.exports = MainController;