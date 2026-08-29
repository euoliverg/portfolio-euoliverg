import {
  SITE_ORIGIN,
  assertAllowedOrigin,
  createPendingReview,
  handleApiError,
  jsonResponse,
  listPublishedReviews,
  saveReview,
  validateSubmission
} from './_lib/reviews.js';

const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

export default {
  async fetch(request) {
    try {
      if (request.method === 'GET') {
        const reviews = await listPublishedReviews();
        return jsonResponse({ success: true, reviews }, 200, {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        });
      }

      if (request.method !== 'POST') return jsonResponse({ success: false, message: 'Method not allowed.' }, 405, noStoreHeaders);

      assertAllowedOrigin(request);
      const body = await request.json().catch(() => null);
      if (!body) return jsonResponse({ success: false, message: 'Invalid request.' }, 400, noStoreHeaders);

      const submission = validateSubmission(body);
      const { record, moderationToken } = createPendingReview(submission);
      await saveReview(record);

      const moderationUrl = `${SITE_ORIGIN}/moderate?review=${encodeURIComponent(record.id)}&token=${encodeURIComponent(moderationToken)}`;
      return jsonResponse({
        success: true,
        reviewId: record.id,
        moderationUrl
      }, 201, noStoreHeaders);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
