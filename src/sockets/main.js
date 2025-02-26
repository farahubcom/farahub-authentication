const { Socket } = require('@farahub/framework/foundation');
const { Doc } = require('@farahub/framework/facades');


class MainSocket extends Socket {

    /**
     * The socket name
     * 
     * @var string
     */
    name = 'Main';

    /**
     * The socket events
     * 
     * @var array
     */
    events = [
        { name: 'login', handler: 'login' },
        { name: 'logout', handler: 'logout' },
        { event: 'disconnect', handler: 'logout' },
    ];

    /**
     * Get list or user workspaces
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    login(socket) {
        return async function ({ user }) {
            const User = this.app.connection.model('User');

            const userDocument = await Doc.resolve(user, User);

            userDocument.isOnline = true;
            await userDocument.save();

            socket.join("user:".concat(user.id));

            socket.userId = user.id;
        }
    }

    /**
     * Dispatch when user logged out
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    logout(socket) {
        return async function () {
            if (socket.userId) {
                const User = this.app.connection.model('User');

                const user = await Doc.resolve(socket.userId, User);

                user.isOnline = false;
                user.lastSeen = new Date();
                await user.save();
            }
        }
    }
}

module.exports = MainSocket;