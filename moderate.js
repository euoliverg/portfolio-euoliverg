const message = document.querySelector('[data-moderation-message]');
const reviewCard = document.querySelector('[data-moderation-review]');
const statusMessage = document.querySelector('[data-moderation-status]');
const actionButtons = document.querySelectorAll('[data-moderate]');
const query = new URLSearchParams(window.location.search);
const reviewId = query.get('review');
const token = query.get('token');

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

const setStatus = (text, state = 'success') => {
  if (!statusMessage) return;
  statusMessage.hidden = false;
  statusMessage.textContent = text;
  statusMessage.classList.toggle('is-error', state === 'error');
};

const setBusy = (busy) => actionButtons.forEach((button) => { button.disabled = busy; });

const loadReview = async () => {
  if (!reviewId || !token) throw new Error('This moderation link is incomplete.');

  const response = await fetch(`/api/review?review=${encodeURIComponent(reviewId)}&token=${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.message || 'The review could not be loaded.');

  const review = result.review;
  setText('[data-review-name]', review.name);
  setText('[data-review-company]', review.company);
  setText('[data-review-rating]', `${'★'.repeat(review.rating)} ${review.rating} / 5`);
  setText('[data-review-copy]', `“${review.review}”`);
  setText('[data-review-status]', review.status);

  const email = document.querySelector('[data-review-email]');
  if (email) {
    email.textContent = review.email;
    email.href = `mailto:${review.email}`;
  }

  if (message) message.textContent = 'Verify the client details, then approve or reject the review.';
  if (reviewCard) reviewCard.hidden = false;
};

actionButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const action = button.dataset.moderate;
    setBusy(true);
    setStatus(action === 'approve' ? 'Publishing review…' : 'Rejecting review…');

    try {
      const response = await fetch('/api/moderate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ review: reviewId, token, action })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'The action could not be completed.');

      setText('[data-review-status]', result.status);
      setStatus(result.message);
    } catch (error) {
      setStatus(error.message || 'The action could not be completed.', 'error');
    } finally {
      setBusy(false);
    }
  });
});

loadReview().catch((error) => {
  if (message) message.textContent = error.message || 'The review could not be loaded.';
});
