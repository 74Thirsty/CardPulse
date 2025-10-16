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

function getTrendingValuations({ limit = 5, window = 7 } = {}) {
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
  const normalizedWindow = Number.isFinite(window) && window > 0 ? Math.floor(window) : 7;

  const entries = Object.entries(valuations)
    .map(([cardId, record]) => {
      const history = record.history || [];
      if (history.length < 2) {
        return null;
      }
      const latest = history[history.length - 1];
      const baselineIndex = Math.max(history.length - normalizedWindow - 1, 0);
      const baseline = history[baselineIndex];
      if (!baseline || !baseline.average || baseline.average === 0) {
        return null;
      }

      const changeValue = latest.average - baseline.average;
      const changePercent = Number(((changeValue / baseline.average) * 100).toFixed(2));
      const card = cards.find((item) => item.id === cardId) || null;

      return {
        cardId,
        card,
        average: latest.average,
        changeValue: Number(changeValue.toFixed(2)),
        changePercent,
        window: normalizedWindow,
        sparkline: history.slice(Math.max(history.length - normalizedWindow - 1, 0)).map((point) => ({
          date: point.date,
          average: point.average,
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, normalizedLimit);

  return entries;
}

module.exports = {
  getValuation,
  getTrendingValuations,
};
