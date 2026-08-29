import { del } from '@vercel/blob';
import moderateReview from '../api/moderate-review.js';
import reviewDetails from '../api/review.js';
import reviews from '../api/reviews.js';

const origin = 'http://127.0.0.1:4175';
let reviewId;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const requestJson = (url, method, body, requestOrigin = origin) => new Request(url, {
  method,
  headers: {
    Origin: requestOrigin,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  body: body ? JSON.stringify(body) : undefined
});

try {
  const blockedResponse = await reviews.fetch(requestJson(`${origin}/api/reviews`, 'POST', {
    name: 'Blocked test',
    company: 'Blocked test',
    email: 'test@example.com',
    rating: '5 / 5',
    review: 'This request must be blocked before it reaches storage.'
  }, 'https://untrusted.example'));
  assert(blockedResponse.status === 403, 'An untrusted origin was not blocked.');

  const submissionResponse = await reviews.fetch(requestJson(`${origin}/api/reviews`, 'POST', {
    name: 'Review flow test',
    company: 'Noryx Digital LLC',
    email: 'test@example.com',
    rating: '5 / 5',
    review: 'Automated integration test. This review must never be published permanently.'
  }));
  const submission = await submissionResponse.json();
  assert(submissionResponse.status === 201 && submission.success, `Submission failed: ${submission.message}`);

  reviewId = submission.reviewId;
  const moderationUrl = new URL(submission.moderationUrl);
  const token = moderationUrl.searchParams.get('token');

  const invalidDetailsResponse = await reviewDetails.fetch(new Request(
    `${origin}/api/review?review=${encodeURIComponent(reviewId)}&token=${'0'.repeat(64)}`
  ));
  assert(invalidDetailsResponse.status === 401, 'An invalid moderation token was not blocked.');

  const detailsResponse = await reviewDetails.fetch(new Request(
    `${origin}/api/review?review=${encodeURIComponent(reviewId)}&token=${encodeURIComponent(token)}`
  ));
  const details = await detailsResponse.json();
  assert(detailsResponse.ok && details.review.status === 'pending', 'Pending review could not be loaded.');

  const approveResponse = await moderateReview.fetch(requestJson(`${origin}/api/moderate-review`, 'POST', {
    review: reviewId,
    token,
    action: 'approve'
  }));
  const approved = await approveResponse.json();
  assert(approveResponse.ok && approved.status === 'approved', 'Review could not be approved.');

  const publicResponse = await reviews.fetch(new Request(`${origin}/api/reviews`));
  const publicResult = await publicResponse.json();
  const publishedReview = publicResult.reviews.find((review) => review.id === reviewId);
  assert(publishedReview, 'Approved review was not published.');
  assert(!('email' in publishedReview) && !('moderationTokenHash' in publishedReview), 'Private fields leaked publicly.');

  const rejectResponse = await moderateReview.fetch(requestJson(`${origin}/api/moderate-review`, 'POST', {
    review: reviewId,
    token,
    action: 'reject'
  }));
  const rejected = await rejectResponse.json();
  assert(rejectResponse.ok && rejected.status === 'rejected', 'Review could not be rejected.');

  const finalPublicResponse = await reviews.fetch(new Request(`${origin}/api/reviews`));
  const finalPublicResult = await finalPublicResponse.json();
  assert(!finalPublicResult.reviews.some((review) => review.id === reviewId), 'Rejected review remained public.');

  console.log('Review flow passed: submit → approve → publish → reject → unpublish.');
} finally {
  if (reviewId) {
    await del([`client-reviews/${reviewId}.json`, `published-reviews/${reviewId}.json`]);
  }
}
