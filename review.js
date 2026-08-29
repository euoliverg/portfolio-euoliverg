const reviewForm = document.querySelector('[data-review-form]');
const reviewStatus = document.querySelector('[data-review-status]');
const reviewSubmit = reviewForm?.querySelector('.review-submit');
const reviewSubmitLabel = reviewSubmit?.innerHTML ?? '';

const showStatus = (message, state) => {
  if (!reviewStatus) return;
  reviewStatus.hidden = false;
  reviewStatus.textContent = message;
  reviewStatus.classList.toggle('is-error', state === 'error');
};

reviewForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (reviewSubmit?.disabled) return;

  const payload = Object.fromEntries(new FormData(reviewForm).entries());
  payload.subject = `New ${payload.rating || ''} client review — ${payload.company || 'Unknown company'}`;

  if (reviewSubmit) {
    reviewSubmit.disabled = true;
    reviewSubmit.textContent = 'Sending…';
  }
  showStatus('Sending your review…');

  try {
    const storageResponse = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const storageResult = await storageResponse.json().catch(() => ({}));
    if (!storageResponse.ok || !storageResult.success) {
      throw new Error(storageResult.message || 'The review could not be saved.');
    }

    const notificationPayload = {
      ...payload,
      review_status: 'Pending moderation',
      review_id: storageResult.reviewId,
      'APPROVE OR REJECT': storageResult.moderationUrl,
      subject: `Review awaiting approval — ${payload.company || 'Unknown company'}`
    };

    const response = await fetch(reviewForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(notificationPayload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    reviewForm.reset();
    showStatus('Thank you. Your review was received and is awaiting approval.');
  } catch (error) {
    console.error('Review submission failed:', error);
    showStatus('The review could not be sent. Please try again or contact me by email.', 'error');
  } finally {
    if (reviewSubmit) {
      reviewSubmit.disabled = false;
      reviewSubmit.innerHTML = reviewSubmitLabel;
    }
  }
});
