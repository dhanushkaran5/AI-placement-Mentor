import { authenticateToken } from './auth.js';

export const authMiddleware = authenticateToken;
export { authenticateToken };
export default authenticateToken;
