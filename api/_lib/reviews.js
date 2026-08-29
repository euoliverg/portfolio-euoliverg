import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';

export const SITE_ORIGIN = 'https://euoliverg.online';
const REVIEW_PREFIX = 'client-reviews/';
const PUBLISHED_PREFIX = 'published-reviews/';
const REVIEW_ID_PATTERN = /^[0-9a-f-]{36}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

export class ReviewError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ReviewError';
    this.status = status;
  }
}

export const jsonResponse = (body, status = 200, headers = {}) => Response.json(body, {
  status,
  headers: {
    'X-Content-Type-Options': 'nosniff',
    ...headers
  }
});

export const requireStorage = () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ReviewError('Review storage is not configured yet.', 503);
  }
};

export const assertAllowedOrigin = (request) => {
  const origin = request.headers.get('origin');
  const allowedLocalOrigin = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin ?? '');
  if (origin !== SITE_ORIGIN && !allowedLocalOrigin) {
    throw new ReviewError('This request did not come from the portfolio.', 403);
  }
};

const cleanText = (value, maximumLength) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maximumLength);

export const validateSubmission = (input) => {
  if (input.botcheck) throw new ReviewError('Submission rejected.', 400);

  const name = cleanText(input.name, 80);
  const company = cleanText(input.company, 100);
  const email = cleanText(input.email, 120).toLowerCase();
  const review = cleanText(input.review, 1200);
  const rating = Number(String(input.rating ?? '').match(/[1-5]/)?.[0]);

  if (name.length < 2) throw new ReviewError('Please enter your name.');
  if (company.length < 2) throw new ReviewError('Please enter your company.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ReviewError('Please enter a valid email.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ReviewError('Please choose a rating.');
  if (review.length < 20) throw new ReviewError('Please write at least 20 characters.');

  return { name, company, email, rating, review };
};

export const createPendingReview = (submission) => {
  const id = randomUUID();
  const moderationToken = randomBytes(32).toString('hex');
  const now = new Date().toISOString();

  return {
    moderationToken,
    record: {
      id,
      ...submission,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      moderationTokenHash: hashToken(moderationToken)
    }
  };
};

export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');

export const validReviewCredentials = (review, token) => {
  if (!review || !TOKEN_PATTERN.test(token ?? '') || !TOKEN_PATTERN.test(review.moderationTokenHash ?? '')) return false;
  const supplied = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(review.moderationTokenHash, 'hex');
  return supplied.length === stored.length && timingSafeEqual(supplied, stored);
};

const reviewPath = (id) => {
  if (!REVIEW_ID_PATTERN.test(id ?? '')) throw new ReviewError('Invalid review identifier.', 400);
  return `${REVIEW_PREFIX}${id}.json`;
};

const publishedPath = (id) => `${PUBLISHED_PREFIX}${id}.json`;

const putJson = (pathname, value) => put(pathname, JSON.stringify(value), {
  access: 'private',
  contentType: 'application/json',
  allowOverwrite: true,
  cacheControlMaxAge: 60
});

const readJson = async (pathname) => {
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).json();
};

export const saveReview = async (review) => {
  requireStorage();
  await putJson(reviewPath(review.id), review);
};

export const getReview = async (id) => {
  requireStorage();
  try {
    return await readJson(reviewPath(id));
  } catch (error) {
    if (error?.name === 'BlobNotFoundError') return null;
    throw error;
  }
};

export const publicReview = (review) => ({
  id: review.id,
  name: review.name,
  company: review.company,
  rating: review.rating,
  review: review.review,
  approvedAt: review.approvedAt
});

export const publishReview = async (review) => {
  requireStorage();
  await putJson(publishedPath(review.id), publicReview(review));
};

export const unpublishReview = async (id) => {
  requireStorage();
  await del(publishedPath(id));
};

export const listPublishedReviews = async () => {
  requireStorage();
  const blobs = [];
  let cursor;

  do {
    const page = await list({ prefix: PUBLISHED_PREFIX, limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const reviews = await Promise.all(blobs.map(async (blob) => {
    try {
      return await readJson(blob.pathname);
    } catch {
      return null;
    }
  }));

  return reviews
    .filter(Boolean)
    .sort((left, right) => String(right.approvedAt).localeCompare(String(left.approvedAt)));
};

export const moderationView = (review) => ({
  id: review.id,
  name: review.name,
  company: review.company,
  email: review.email,
  rating: review.rating,
  review: review.review,
  status: review.status,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt
});

export const handleApiError = (error) => {
  if (error instanceof ReviewError) return jsonResponse({ success: false, message: error.message }, error.status);
  console.error('Review API error:', error);
  return jsonResponse({ success: false, message: 'The review service is temporarily unavailable.' }, 500);
};
