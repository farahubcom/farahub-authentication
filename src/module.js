const { Module } = require('@farahub/framework/foundation');
const models = require('./models');
const schemas = require('./schemas');
const controllers = require('./controllers');
const sockets = require('./sockets');
const listeners = require('./listeners');

const passport = require('passport');
const passportLocal = require('passport-local')
const passportJWT = require("passport-jwt");
const passportAnonymous = require('passport-anonymous');

const LocalStrategy = passportLocal.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const AnonymousStrategy = passportAnonymous.Strategy;


class AuthenticationModule extends Module {

    /**
     * The module name
     * 
     * @var string
     */
    name = 'Authentication';

    /**
     * The module version
     * 
     * @var string
     */
    version = '1.0.0';

    /**
     * The module base path
     * 
     * @var string
     */
    basePath = '';

    /**
     * Register the module
     * 
     * @return void
     */
    register() {
        this.registerModels(models);
        this.registerSchemas(schemas);
        this.registerListeners(listeners);
        this.registerControllers(controllers);
    }

    /**
     * Boot the module
     * 
     * @return void
     */
    boot() {
        this.registerSockets(sockets);

        const User = this.app.connection.model('User');
        const Membership = this.app.connection.model('Membership');

        /**
         * Configure passport local strategy
         */
        passport.use(
            'local',
            new LocalStrategy(
                {
                    passReqToCallback: true
                },
                async (req, username, password, done) => {
                    try {

                        const user = await User.findOne({
                            $or: [
                                { email: username },
                                { phone: username },
                                { username }
                            ]
                        });

                        // const membership = user ? await Membership.findOne({
                        //     user: user._id,
                        //     workspace: req.workspace._id
                        // }) : undefined;

                        if (
                            !user
                            // || !membership
                        ) {
                            return done(null, false, { result: 0, message: 'کاربری با این مشخصات وجود ندارد' });
                        }

                        // const validate = await user.isValidMembershipPassword(membership, password);
                        const validate = await user.isValidPassword(password);

                        if (!validate) {
                            return done(null, false, { result: 1, message: 'رمز عبور اشتباه است' });
                        }

                        return done(null, user, { result: 2, message: 'Logged in successfully' });
                    } catch (error) {
                        throw error;
                    }
                }
            )
        );

        /**
         * Configure passport local strategy via sms
         */
        passport.use(
            'local-sms',
            new LocalStrategy(
                {
                    passReqToCallback: true
                },
                async (req, username, password, done) => {
                    try {
                        const user = await User.findOne({ phone: username });

                        if (!user) {
                            return done(null, false, { result: 0, message: 'User not found' });
                        }

                        const validate = await user.isValidToken(password);

                        if (!validate) {
                            return done(null, false, { result: 1, message: 'Invalid code' });
                        }

                        return done(null, user, { result: 2, message: 'Logged in successfully' });
                    } catch (error) {
                        throw error;
                    }
                }
            )
        );

        /**
         * Configure passport jwt strategy
         */
        passport.use(
            new JWTStrategy(
                {
                    secretOrKey: 'TOP_SECRET',
                    jwtFromRequest: ExtractJWT.fromExtractors([
                        ExtractJWT.fromUrlQueryParameter('auth-token'),
                        ExtractJWT.fromAuthHeaderAsBearerToken()
                    ]),
                },
                async (token, done) => {
                    try {
                        const user = await User.findOne({ _id: token.user.id });
                        return done(null, user);
                    } catch (error) {
                        return done('error', error);
                    }
                }
            )
        );

        /**
         * Configure passport anonymous strategy
         */
        passport.use(new AnonymousStrategy());

        /**
         * Config user serialization
         */
        passport.serializeUser(function (user, cb) {
            process.nextTick(function () {
                cb(null, user);
            });
        });

        /**
         * Config user deserialization
         */
        passport.deserializeUser(function (user, cb) {
            process.nextTick(function () {
                return cb(null, user);
            });
        });

        //
    }
}

module.exports = AuthenticationModule;