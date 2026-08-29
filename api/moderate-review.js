import {
  assertAllowedOrigin,
  getReview,
  handleApiError,
  jsonResponse,
  publishReview,
  saveReview,
  unpublishReview,
  validReviewCredentials
} from './_lib/reviews.js';

export default {
  async fetch(request) {
    try {
      if (request.method !== 'POST') return jsonResponse({ success: false, message: 'Method not allowed.' }, 405);
      assertAllowedOrigin(request);

      const body = await request.json().catch(() => null);
      const action = body?.action;
      if (!['approve', 'reject'].includes(action)) {
        return jsonResponse({ success: false, message: 'Choose approve or reject.' }, 400);
      }

      const review = await getReview(body.review);
      if (!validReviewCredentials(review, body.token)) {
        return jsonResponse({ success: false, message: 'This moderation link is invalid or expired.' }, 401);
      }

      const now = new Date().toISOString();
      const updatedReview = {
        ...review,
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: now,
        moderatedAt: now,
        approvedAt: action === 'approve' ? now : null
      };

      await saveReview(updatedReview);
      if (action === 'approve') await publishReview(updatedReview);
      else await unpublishReview(updatedReview.id);

      return jsonResponse({
        success: true,
        status: updatedReview.status,
        message: action === 'approve'
          ? 'Review approved and published.'
          : 'Review rejected and kept private.'
      }, 200, { 'Cache-Control': 'private, no-store' });
    } catch (error) {
      return handleApiError(error);
    }
  }
};
