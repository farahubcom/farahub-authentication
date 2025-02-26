const isPast = require('date-fns/isPast');
const pick = require('lodash/pick');
const { Doc } = require('@farahub/framework/facades');
const bcrypt = require('bcrypt');


class AuthToken {

    /**
     * Encryption salt amount
     * 
     * @var Number
     * @private
     */
    static encryptionSaltAmount = 10;

    /**
     * Create a new token
     * 
     * @param {Object} data
     * @return {AuthToken} created token
     */
    static async createNew(data) {
        try {
            const AuthToken = this.model('AuthToken');
            const User = this.model('User');

            const token = new AuthToken();

            // assign user
            const user = await Doc.resolve(data.user, User);
            token.user = user.id;

            // assign other fields
            Object.keys(
                pick(data, [
                    'type',
                    'token',
                    'issuedAt',
                    'validTill',
                ])
            ).forEach(key => {
                token[key] = data[key];
            });

            // save token
            await token.save();

            // return created token
            return token;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create auth token of specific type for the user
     * 
     * @param {string} value The token value
     * @param {{ user: User, type: string, validTill: Date }}
     * @param {Date} validTill Token valid date
     * 
     * @returns {string} Created token   
     */
    static async createFromValue(value, { user, type, validTill }) {
        try {

            const tokenValue = await bcrypt.hash(String(value), this.encryptionSaltAmount);

            const token = await this.createNew({
                user: user.id,
                type,
                token: tokenValue,
                validTill,
                issuedAt: new Date()
            });

            return token;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Determine is token has expired
     * 
     * @return bool
     */
    get isExpired() {

        if (!this.validTill)
            return false;

        return isPast(this.validTill);
    }

    //
}

module.exports = AuthToken;