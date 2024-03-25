import { z } from "zod";
import { env } from "~/env";
import { createAuth, type VerifyLoginPayloadParams } from 'thirdweb/auth';
import { createThirdwebClient } from "thirdweb";
import { issueUserToken } from "@coinbase/waas-server-auth";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

const apiKeyName = env.COINBASE_API_KEY;
const privateKey = env.COINBASE_PRIVATE_KEY;

const client = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});

const auth = createAuth({
  client,
  domain: env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
});

export const authRouter = createTRPCRouter({
  receivePayload: publicProcedure
    .input(z.object({
      address: z.string() 
    }))
    .query(async ({ input }) => {
      console.log({ input });
      return await auth.generatePayload({ 
        address: input.address,
      });
    }),
  receiveToken: publicProcedure
    .input(z.object({
      payload: z.object({
        signature: z.string(),
        loginPayload: z.string(),
      })
    }))
    .query(async ({ input }) => {   
      const params = input.payload as unknown as VerifyLoginPayloadParams;
      const verifiedPayload = await auth.verifyPayload(params);
    
      if (!verifiedPayload.valid) {        
        throw new Error("Invalid payload");
      }
    
      const jwt = await auth.generateJWT({
        payload: verifiedPayload.payload
      });

      const token = await issueUserToken({ apiKeyName, privateKey, userID: jwt });  
      
      console.log({ jwt, token })

      return {
        jwt,
        token
      }
    })
});

