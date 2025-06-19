const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SALT_ROUNDS, JWT_SECRET } = process.env; 

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        if (!SALT_ROUNDS || isNaN(parseInt(SALT_ROUNDS))) {
            console.warn("UPOZORENJE: SALT_ROUNDS nije definisan ili je nevalidan u .env fajlu. Koristi se podrazumevana vrednost 10.");
            this.saltRounds = 10; 
        } else {
            this.saltRounds = parseInt(SALT_ROUNDS);
        }
    }

    async registerUser(email, password) {
        const existingUser = await this.userRepository.findUserByEmail(email);
        if (existingUser) {
            return null;
        }
        const passwordHash = await bcrypt.hash(password, this.saltRounds);
        const userId = await this.userRepository.createUser(email, passwordHash);
        return userId;
    }

    async loginUser(email, password) {
        const user = await this.userRepository.findUserByEmail(email);
        if (!user) {
            return null; 
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            const userPayload = { id: user.id, email: user.email };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });
            return { user: userPayload, token: token };
        } else {
            return null;
        }
    }

    async getUserByEmail(email) {
        return await this.userRepository.findUserByEmail(email);
    }
}
module.exports = UserService;