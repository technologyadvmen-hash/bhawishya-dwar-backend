import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CLOUDFRONT = process.env.CLOUDFRONT_DOMAIN;

export const uploadToS3 = async (buffer, mimetype, folder = "palm-images") => {
  const BUCKET = process.env.AWS_BUCKET_NAME;
  if (!BUCKET) throw new Error("AWS_BUCKET_NAME is not configured");
  const ext = mimetype.split("/")[1] || "jpg";
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = CLOUDFRONT ? `${CLOUDFRONT}/${key}` : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
};

export const deleteFromS3 = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
};

export const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};
