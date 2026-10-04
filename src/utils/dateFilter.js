// Filter helper: today, week, month, year, all
const getDateRange = (filter) => {
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (filter) {
    case 'today': return { start, end };
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return { start: d, end };
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: d, end };
    }
    case 'year': {
      const d = new Date(now.getFullYear(), 0, 1);
      return { start: d, end };
    }
    default: return null;
  }
};

module.exports = { getDateRange };