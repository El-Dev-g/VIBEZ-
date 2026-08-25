import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

export class StorageController {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async getPresignedUploadUrl(fileName: string, contentType: string, uploaderId?: string, purpose: string = 'GENERAL') {
    const fileExtension = fileName.split('.').pop();
    const fileKey = `${uuidv4()}.${fileExtension}`;
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileKey}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    // URL valid for 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    // Save to database
    await prisma.storageAsset.create({
      data: {
        fileKey,
        fileName,
        contentType,
        publicUrl,
        uploaderId,
        purpose,
        size: 0 // Will be updated later if we had a callback, or estimated
      }
    });

    return {
      uploadUrl,
      fileKey,
      publicUrl
    };
  }
}
