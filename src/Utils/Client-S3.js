import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "*********",
    secretAccessKey: "**********",
  },
});

export default client;
