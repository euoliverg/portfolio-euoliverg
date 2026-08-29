import {
  getReview,
  handleApiError,
  jsonResponse,
  moderationView,
  validReviewCredentials
} from './_lib/reviews.js';

export default {
  async fetch(request) {
    try {
      if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Method not allowed.' }, 405);

      const url = new URL(request.url);
      const id = url.searchParams.get('review');
      const token = url.searchParams.get('token');
      const review = await getReview(id);

      if (!validReviewCredentials(review, token)) {
        return jsonResponse({ success: false, message: 'This moderation link is invalid or expired.' }, 401, {
          'Cache-Control': 'private, no-store'
        });
      }

      return jsonResponse({ success: true, review: moderationView(review) }, 200, {
        'Cache-Control': 'private, no-store'
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
};
