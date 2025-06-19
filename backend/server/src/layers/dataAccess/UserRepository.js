class UserRepository {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    async findUserByEmail(email) {
        try {
            const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            console.error('Error in findUserByEmail:', error);
            throw error;
        }
    }

    async createUser(email, passwordHash) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                [email, passwordHash]
            );
            return result.insertId; 
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }
}
module.exports = UserRepository;