const bcrypt = require('bcrypt');
const pick = require('lodash/pick');

class User {

    /**
     * Create a new user
     * 
     * @param {{ phone: string, email: string, username: string }}
     * @param {{ inject: func }}
     * 
     * @return {User} - Created user
     */
    static async createNew(data, { inject } = {}) {
        try {
            const User = this.model('User');

            const user = new User();

            // assign rest of fields
            Object.keys(
                pick(data, [
                    'phone',
                    'email',
                    'username'
                ])
            ).forEach(key => {
                user[key] = data[key];
            });

            // inject preSave hook
            inject && await inject('preSave', { user, data })

            // save user
            await user.save();

            // inject postSave hook
            inject && await inject('postSave', { user, data })

            // return created user
            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if a value is equal to the latest issued token
     * 
     * @param {string} value The value to compare
     * 
     * @returns {bool} Comparison result
     */
    async isValidToken(code) {
        const AuthToken = this.model('AuthToken');
        const token = await AuthToken.findOne({ user: this.id }).sort("-issuedAt");

        if (token.isExpired) {
            return false;
        }

        const isValid = await bcrypt.compare(code, token.token);

        if (isValid) {
            await AuthToken.deleteOne({ _id: token.id });
        }

        return isValid;
    }

    /**
     * Check if a password is equal to user pass
     * 
     * @param {string} password The password to check
     * 
     * @returns {bool} Comparison result
     */
    async isValidPassword(password) {
        const User = this.model('User');
        const user = await User.findById(this.id, '+password');
        return user.password ? await bcrypt.compare(password, user.password) : false;
    }

    /**
     * Check if password is equal to user membership password
     * 
     * @param {Membership} membership user membership
     * @param {string} password The password
     * 
     * @returns {bool} Comparison result
     */
    async isValidMembershipPassword(membership, password) {
        const Membership = this.model('Membership');
        const membershipDocWithPassword = await Membership.findById(membership._id, '+password');
        return membershipDocWithPassword.password ? await bcrypt.compare(password, membershipDocWithPassword.password) : false;
    }

    /**
     * Change user password
     * 
     * @param {string} password Password to change
     * 
     * @returns {void}
     */
    async changePassword(password) {
        this.password = await bcrypt.hash(String(password), 10);
        await this.save();
    }

    //
}

module.exports = User;