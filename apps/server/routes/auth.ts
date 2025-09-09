import express, { type Request, type Response } from "express";
import { db } from "@repo/db";
import { sendResendEmail } from "../lib/utils";
import { generateCookieToken, verifyToken } from "../lib/token";
import { CLIENT_URL, REDIS_EVENTS_TODO_STREAM } from "../lib/config";
import { v4 as uuidv4 } from "uuid";
import { redisService } from "../lib/redis";

const router = express.Router();

// Sign in route
router.post("/signin", async (req: Request, res: Response) => {
  const { email, name } = req.body;

  const exisitingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!exisitingUser) {
    return res.status(400).json({
      message: "User doesn't exisit with this email",
    });
  }

  const { data, error } = await sendResendEmail(email);

  if (error) {
    return res.status(400).json({ error: "Something went wrong" });
  }

  res.status(200).json({ message: "success", redirect: true });
});

// Sign up route
router.post("/signup", async (req: Request, res: Response) => {
  const { email, name } = req.body;

  const exisitingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (exisitingUser) {
    return res.status(400).json({
      message: "User already exist with this email. Please Log In",
    });
  }
  const { data, error } = await sendResendEmail(email);

  if (error) {
    return res.status(400).json({ error: "Something went wrong" });
  }

  res.status(200).json({ message: "Please check your email for login link" });
});

// Sign in post (email link verification) route
router.get("/signin/post", async (req: Request, res: Response) => {


    const payload = {
        'email': "vijaypreetham1@gmail.com",
        'type': "addUser"
    }

    const eningeResponse = await redisService.addToStream(REDIS_EVENTS_TODO_STREAM, payload);

    res.status(200).json({
        "message": eningeResponse
    })
    



//   const { token } = req.query;

//   if (!token) {
//     return res.status(401).json({
//       message: "Token Missing",
//     });
//   }

//   const decoded_token = verifyToken(token as string);

//   if (!decoded_token) {
//     return res.status(401).json({
//       message: "Wrong Credentials",
//     });
//   }

//   if (
//     typeof decoded_token === "object" &&
//     decoded_token !== null &&
//     "email" in decoded_token
//   ) {
//     const { email } = decoded_token;

//     const cookieToken = generateCookieToken(email);

//     await db.user.upsert({
//       where: {
//         email: email,
//       },
//       update: {},
//       create: {
//         email: email,
//       },
//     });


//     const user_payload = {
//       email,

//     };

//     await redisService.addToStream(REDIS_EVENTS_TODO_STREAM, user_payload);

//     // Set the cookie and redirect to dashboard
//     res.cookie("authToken", cookieToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
//       sameSite: "lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
//     });

//     return res.redirect(`${CLIENT_URL}/dashboard`);
//   } else {
//     return res.status(401).json({
//       message: "Invalid token format",
//     });
//   }
});

export default router;
