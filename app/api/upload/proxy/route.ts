
import { getS3Client } from "@/lib/S3Client";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate Environment Variables
        const missingVars = [];
        if (!env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES) missingVars.push("NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES");
        if (!process.env.AWS_REGION && !env.AWS_REGION) missingVars.push("AWS_REGION");
        if (!process.env.AWS_ACCESS_KEY_ID && !env.AWS_ACCESS_KEY_ID) missingVars.push("AWS_ACCESS_KEY_ID");
        if (!process.env.AWS_SECRET_ACCESS_KEY && !env.AWS_SECRET_ACCESS_KEY) missingVars.push("AWS_SECRET_ACCESS_KEY");

        if (missingVars.length > 0) {
            console.error("Missing S3 Configuration:", missingVars.join(", "));
            return NextResponse.json(
                { error: `Server Configuration Error: Missing ${missingVars.join(", ")}` },
                { status: 500 }
            );
        }

        // Author: Sanket - Debug logging to verify region
        console.log("S3 Upload - Using Region:", env.AWS_REGION);
        console.log("S3 Upload - Bucket:", env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES);

        const formData = await request.formData() as any;
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type (Generic proxy allows all, or restrict if needed)
        // if (!file.type.startsWith("image/")) {
        //     return NextResponse.json({ error: "Only images are allowed via this proxy" }, { status: 400 });
        // }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const uniqueKey = `${uuidv4()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: uniqueKey,
            Body: buffer,
            ContentType: file.type,
        });

        const S3 = getS3Client();
        await S3.send(command).catch((s3Error) => {
            console.error("S3 Send Error:", {
                name: s3Error.name,
                message: s3Error.message,
                code: s3Error.code,
                requestId: s3Error.$metadata?.requestId
            });
            throw s3Error;
        });

        // Author: Sanket - Use unified URL construction from helper
        const url = constructS3Url(uniqueKey);

        return NextResponse.json({
            key: uniqueKey,
            url: url
        });

    } catch (error: any) {
        console.error("Proxy Upload Error:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json(
            { error: `Upload failed: ${error.message}` },
            { status: 500 }
        );
    }
}
