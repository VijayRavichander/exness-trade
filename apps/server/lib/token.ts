import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const TOKEN_EXPRIES_IN = "5m"
const COOKIE_EXPIRES_IN = "7d";

export const generateLinkToken = (email: string) => {
    return jwt.sign({email}, JWT_SECRET, {expiresIn: TOKEN_EXPRIES_IN});
}

export const generateCookieToken = (email: string) => {
    return jwt.sign({email}, JWT_SECRET, {expiresIn: COOKIE_EXPIRES_IN});
}

export const verifyToken = (token: string) => {
    try {
        const verifiedToken = jwt.verify(token, JWT_SECRET);
        return verifiedToken;
    }catch(error){
        return null;
    }
}

