import bcrypt from 'bcrypt';

export class PasswordService {
    private static saltRounds = 10;
    
    static async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }
    
    static async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}