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

  private static readonly ALLOWED_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'gif',
    'mp4', 'webm', 'mov',
    'mp3', 'ogg', 'wav', 'm4a',
    'pdf', 'doc', 'docx', 'txt'
  ]);

  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/x-m4a',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]);

  private validateFileType(fileName: string, contentType: string): string {
    const rawExt = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!rawExt || !StorageController.ALLOWED_EXTENSIONS.has(rawExt)) {
      throw new Error(`Disallowed file extension: .${rawExt || 'unknown'}. Allowed extensions: images, videos, audio, PDF, and documents.`);
    }

    const normMime = (contentType || '').toLowerCase().split(';')[0].trim();
    if (!normMime || !StorageController.ALLOWED_MIME_TYPES.has(normMime)) {
      throw new Error(`Disallowed MIME type: ${normMime}. Only verified media and document MIME types are permitted.`);
    }

    return rawExt;
  }

  async getPresignedUploadUrl(fileName: string, contentType: string, uploaderId?: string, purpose: string = 'GENERAL') {
    const fileExtension = this.validateFileType(fileName, contentType);
    const safeOriginalName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
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
          fileName: safeOriginalName,
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
    const directUploadUrl = `/api/media/upload-direct?fileName=${encodeURIComponent(safeOriginalName)}&purpose=${encodeURIComponent(purpose)}`;

    try {
      await prisma.storageAsset.create({
        data: {
          fileKey,
          fileName: safeOriginalName,
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
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('Payload exceeds maximum allowable file size of 100MB.');
    }

    const fileExtension = this.validateFileType(fileName, contentType);
    const safeOriginalName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
    const fileKey = `${uuidv4()}.${fileExtension}`;
    const targetPath = path.join(this.uploadsDir, fileKey);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/uploads/${fileKey}`;

    try {
      await prisma.storageAsset.create({
        data: {
          fileKey,
          fileName: safeOriginalName,
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

    if (!safeFilename || safeFilename.includes('..') || !fs.existsSync(filePath)) {
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

