import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB
    },
});

export const uploadImageFromBuffer = (buffer: Buffer, options?: any) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'chatly/avatars',
                resource_type: 'image',
                transformation: [{ width: 200, height: 200, crop: 'fill' }],
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            },
        );

        uploadStream.end(buffer);
    });
};

export const uploadMessageImageFromBuffer = (buffer: Buffer, options?: any) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'chatly/messages',
                resource_type: 'image',
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            },
        );

        uploadStream.end(buffer);
    });
};

