# Reverse Image Search Service

This service checks whether uploaded dog photos already exist on the web. It uses
Google Vision's **Web Detection** API to perform a reverse image search.

## How It Works

1. When a dog event is created via the `/api/webhook/dog-events` endpoint the
   webhook now triggers `reverseImageSearch(imageUri)`.
2. The image URI is normalised (IPFS URIs are converted to an IPFS gateway URL)
   and sent to Google Vision.
3. Any matching images returned are stored on the `DogEvent` record via the new
   fields `reverseImageMatches` and `reverseImageCheckedAt`.

If matches are found it likely means the image already exists on the web and was
not freshly taken.

## Updating the Database

After pulling the latest code run the usual Prisma commands:

```bash
npx prisma generate
npx prisma db push
```

This will add the new columns to your database.
