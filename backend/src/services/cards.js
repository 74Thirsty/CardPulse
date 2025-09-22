const crypto = require('crypto');
const { cards, valuations } = require('../store');

function searchCards(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return cards.slice(0, 10);
  }
  return cards.filter((card) => {
    const haystack = [
      card.name,
      card.game,
      card.edition,
      card.variant,
      card.setNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function identifyCard({ imageText, hints = [] }) {
  if (imageText || (hints && hints.length > 0)) {
    const tokens = [];
    if (imageText) {
      tokens.push(...imageText.split(/\s+/g));
    }
    if (Array.isArray(hints)) {
      hints.forEach((hint) => tokens.push(String(hint)));
    }
    const normalized = tokens.map((token) => token.toLowerCase());
    const matches = cards
      .map((card) => {
        const score = scoreCard(card, normalized);
        return { card, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    if (matches.length > 0) {
      const [{ card }] = matches;
      return buildIdentification(card);
    }
  }
  // fallback: random popular card to showcase flow
  const card = cards[Math.floor(Math.random() * cards.length)];
  return buildIdentification(card);
}

function scoreCard(card, tokens) {
  const haystack = [
    card.name,
    card.game,
    card.edition,
    card.variant,
    card.setNumber,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let score = 0;
  tokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += token.length;
    }
  });
  return score;
}

function getCardById(cardId) {
  return cards.find((card) => card.id === cardId) || null;
}

function buildIdentification(card) {
  const valuation = valuations[card.id];
  const priceSnapshot = valuation ? valuation.history[valuation.history.length - 1] : null;
  return {
    matchId: crypto.randomUUID(),
    cardId: card.id,
    name: card.name,
    game: card.game,
    edition: card.edition,
    variant: card.variant,
    year: card.year,
    setNumber: card.setNumber,
    imageUrl: card.imageUrl,
    estimatedValue: priceSnapshot
      ? {
          average: priceSnapshot.average,
          lowest: priceSnapshot.lowest,
          highest: priceSnapshot.highest,
        }
      : null,
  };
}

module.exports = {
  searchCards,
  identifyCard,
  getCardById,
};
