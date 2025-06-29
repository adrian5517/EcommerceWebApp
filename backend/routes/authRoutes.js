import express from "express"
import { logout, signin, signup , refreshToken } from "../controllers/authController.js";

const router = express.Router();

router.post('/signup' , signup)
router.post('/signin', signin)
router.post('/logout', logout)
router.post('/refresh-token', refreshToken)



export default router