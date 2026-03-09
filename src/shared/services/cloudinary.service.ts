import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
}

export class CloudinaryService {
  /**
   * Upload image from buffer
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'hallmate/profile-pictures',
    options: {
      transformation?: any;
      public_id?: string;
    } = {},
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: options.transformation || [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
          ...(options.public_id && { public_id: options.public_id }),
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              resourceType: result.resource_type,
            });
          }
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload image from file path
   */
  async uploadImageFromPath(
    filePath: string,
    folder: string = 'hallmate/profile-pictures',
    options: {
      transformation?: any;
      public_id?: string;
    } = {},
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: options.transformation || [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      ...(options.public_id && { public_id: options.public_id }),
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    };
  }

  /**
   * Delete image by public ID
   */
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  }

  /**
   * Upload document (PDF, DOCX, etc.)
   */
  async uploadDocument(
    buffer: Buffer,
    folder: string = 'hallmate/documents',
    options: {
      public_id?: string;
    } = {},
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          ...(options.public_id && { public_id: options.public_id }),
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: 0,
              height: 0,
              format: result.format,
              resourceType: result.resource_type,
            });
          }
        },
      );

      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options.width || 500,
          height: options.height || 500,
          crop: options.crop || 'limit',
          quality: options.quality || 'auto',
          fetch_format: options.format || 'auto',
        },
      ],
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit',
      };
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Only JPG, JPEG, PNG, and WebP images are allowed',
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
