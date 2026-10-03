import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

export class StorageController {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private uploadsDir: string;

  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (e) {
        console.error('Could not create uploads directory:', e);
      }
    }
    
    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  async getPresignedUploadUrl(fileName: string, contentType: string, uploaderId?: string, purpose: string = 'GENERAL') {
    const fileExtension = fileName.split('.').pop() || 'mp4';
    const fileKey = `${uuidv4()}.${fileExtension}`;
    
    if (this.s3Client && this.bucketName && process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN) {
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
          size: 0
        }
      });

      return {
        uploadUrl,
        fileKey,
        publicUrl
      };
    }

    // Local file fallback when S3 / Cloudflare R2 is unconfigured
    const localPublicUrl = `/uploads/${fileKey}`;
    const directUploadUrl = `/api/media/upload-direct?fileName=${encodeURIComponent(fileName)}&purpose=${encodeURIComponent(purpose)}`;

    try {
      await prisma.storageAsset.create({
        data: {
          fileKey,
          fileName,
          contentType,
          publicUrl: localPublicUrl,
          uploaderId,
          purpose,
          size: 0
        }
      });
    } catch (e) {
      console.warn('Could not record storage asset in DB:', e);
    }

    return {
      uploadUrl: directUploadUrl,
      fileKey,
      publicUrl: localPublicUrl
    };
  }

  async saveLocalFile(fileName: string, contentType: string, buffer: Buffer, uploaderId?: string, purpose: string = 'STATUS') {
    const fileExtension = fileName.split('.').pop() || 'mp4';
    const fileKey = `${uuidv4()}.${fileExtension}`;
    const targetPath = path.join(this.uploadsDir, fileKey);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/uploads/${fileKey}`;

    try {
      await prisma.storageAsset.create({
        data: {
          fileKey,
          fileName,
          contentType,
          publicUrl,
          uploaderId,
          purpose,
          size: buffer.length
        }
      });
    } catch (e) {
      console.warn('Could not save storage asset record:', e);
    }

    return {
      fileKey,
      publicUrl
    };
  }

  streamLocalVideo(req: Request, res: Response, filename: string) {
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = ext === '.mp4' ? 'video/mp4' :
                        ext === '.webm' ? 'video/webm' :
                        ext === '.mov' ? 'video/quicktime' : 'application/octet-stream';

    if (range) {
      // Parse Range header (e.g. "bytes=0-1000")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

