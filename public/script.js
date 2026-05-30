document.getElementById('analyze').addEventListener('click', async () => {
  const text = document.getElementById('text').value.trim();
  if (!text) {
    alert('Please enter text to analyze');
    return;
  }

  const messageEl = document.getElementById('resultMessage');
  const resultSection = document.getElementById('result');
  messageEl.textContent = 'Analyzing...';
  resultSection.classList.remove('hidden');

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const err = await res.json();
      messageEl.textContent = 'Error: ' + (err.error || res.statusText);
      return;
    }

    const data = await res.json();

    const sentimentEl = document.getElementById('resultSentiment');
    const scoreEl = document.getElementById('resultScore');
    const confidenceEl = document.getElementById('resultConfidence');
    const summaryEl = document.getElementById('resultSummary');

    const hasOpenAIFormat = data.sentiment && data.score !== undefined && data.confidence !== undefined && data.summary;
    const hasLegacyFormat = data.score !== undefined && Array.isArray(data.positive) && Array.isArray(data.negative);

    if (hasOpenAIFormat) {
      messageEl.textContent = 'Analysis complete by GPT-4o-mini.';
      sentimentEl.textContent = data.sentiment.toUpperCase();
      sentimentEl.className = 'sentiment-badge sentiment-' + data.sentiment.toLowerCase();
      scoreEl.textContent = (data.score * 100).toFixed(1) + '%';
      confidenceEl.textContent = data.confidence + '%';
      summaryEl.textContent = data.summary;
    } else if (hasLegacyFormat) {
      const sentimentLabel = data.score > 0 ? 'positive' : data.score < 0 ? 'negative' : 'neutral';
      const confidenceValue = Math.min(100, Math.max(0, Math.abs(data.score) * 100));
      const summaryText = `Positive words: ${data.positive.join(', ') || 'none'}; negative words: ${data.negative.join(', ') || 'none'}.`;

      messageEl.textContent = 'Analysis complete using legacy sentiment response.';
      sentimentEl.textContent = sentimentLabel.toUpperCase();
      sentimentEl.className = 'sentiment-badge sentiment-' + sentimentLabel;
      scoreEl.textContent = (data.score * 100).toFixed(1) + '%';
      confidenceEl.textContent = confidenceValue + '%';
      summaryEl.textContent = summaryText;
    } else {
      messageEl.textContent = 'Error: Invalid response from server. Check console.';
      console.error('Invalid response structure:', data);
      return;
    }
  } catch (e) {
    messageEl.textContent = 'Request failed: ' + e.message;
  }
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('text').value = '';
  document.getElementById('result').classList.add('hidden');
  document.getElementById('resultMessage').textContent = '';
});