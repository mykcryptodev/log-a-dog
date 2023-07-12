import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";

import { authOptions } from "~/server/api/auth/[...nextauth]";

const f = createUploadthing();
  
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({image: { maxFileSize: "4MB" }})
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, res }) => {
      // make sure that the user is authenticated
      const session = await getServerSession(req, res, authOptions); 
      // If you throw, the user will not be able to upload
      if (!session?.user) throw new Error("Unauthorized");
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.address };
    })
    .onUploadComplete(({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
 
      console.log("file url", file.url);
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;