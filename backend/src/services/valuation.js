const { valuations, cards } = require('../store');

function getValuation(cardId) {
  const record = valuations[cardId];
  if (!record) {
    return null;
  }
  const card = cards.find((item) => item.id === cardId) || null;
  const history = record.history || [];
  if (history.length === 0) {
    return {
      card,
      history: [],
      average: null,
      lowest: null,
      highest: null,
      change30d: null,
    };
  }
  const latest = history[history.length - 1];
  const earliest = history[0];
  const change30d = earliest.average
    ? Number((((latest.average - earliest.average) / earliest.average) * 100).toFixed(2))
    : null;
  return {
    card,
    history,
    average: latest.average,
    lowest: latest.lowest,
    highest: latest.highest,
    change30d,
  };
}

module.exports = {
  getValuation,
};
