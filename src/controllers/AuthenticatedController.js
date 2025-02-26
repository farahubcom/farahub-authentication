const { Controller } = require('@farahub/framework/foundation');
const { Auth, Validator, Injection, Lang } = require('@farahub/framework/facades');
const ChangePasswordValidator = require('../validators/ChangePasswordValidator');


class AuthenticatedController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Authenticated';

    /**
     * The controller base path
     * 
     * @var string
     */
    basePath = '/self';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'api',
            method: 'get',
            path: '/',
            handler: 'getSelf',
        },
        {
            type: 'api',
            method: 'post',
            path: '/password',
            handler: 'changePassword',
        },
        {
            type: 'api',
            method: 'post',
            path: '/password/verify',
            handler: 'verifyPassword',
        },
    ];


    /**
     * Get authenticated user
     * 
     * @return void
     */
    getSelf() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'main.getSelf'),
            async function (req, res) {

                const User = this.app.connection.model('User');

                const injectedPopulations = await req.inject('populate');

                let user = await User.findById(req.user.id)
                    .select('-__v')
                    .populate([
                        ...injectedPopulations
                    ])
                    .lean({ virtuals: true });

                if (!user) {
                    return res.status(401).json({
                        ok: false,
                        message: 'User not found'
                    });
                }

                const injectedParams = await req.inject('params', { user: req.user });

                //

                user = Lang.translate(user);

                return res.json({
                    ok: true,
                    user,
                    ...(Object.assign({},
                        ...injectedParams
                    ))
                });
            }
        ]
    }

    /**
     * Change user password
     * 
     * @return void
     */
    changePassword() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'main.changePassword'),
            Validator.validate(new ChangePasswordValidator()),
            async function (req, res, next) {
                try {

                    const { password } = req.body;

                    await req.user.changePassword(password);

                    // return response
                    return res.json({ ok: true });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Check if authenticated user has defined password
     * 
     * @return void
     */
    verifyPassword() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'main.verifyPassword'),
            async function (req, res, next) {
                try {

                    // get authenticated user
                    const User = this.app.connection.model('User');
                    const user = await User.findById(req.user.id, '+password');

                    // return response
                    return res.json({ ok: true, defined: Boolean(user.password) });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }
}

module.exports = AuthenticatedController;