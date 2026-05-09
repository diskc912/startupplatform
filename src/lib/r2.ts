/**
 * Singleton R2 S3 client.
 * Cloudflare R2 is S3-compatible. We point the endpoint at the R2 URL
 * and disable checksum validation (R2 does not support it).
 * This module is server-only — never imported by client components.
 */
import { S3Client } from '@aws-sdk/client-s3'

if (
  !process.env.R2_ENDPOINT ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY
) {
  throw new Error(
    'Missing Cloudflare R2 environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)'
  )
}

export const r2Client = new S3Client({
  region: 'auto', // R2 requires 'auto'
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  // Cloudflare R2 does not support checksum trailers — disable them
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  forcePathStyle: true,
})

/** The R2 bucket name — set via R2_ENDPOINT (derived) or hardcode here */
export const R2_BUCKET =
  process.env.R2_BUCKET_NAME ?? 'founder-ideas'
