class Login {

    /**
     * Authentiacated user
     */
    user;

    /**
     * Create event instance
     */
    constructor(user) {
        this.user = user;
    }
}

module.exports = Login;