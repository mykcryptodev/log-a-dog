export const formatAbbreviatedFiat = (amount: number) => {
  if (amount < 1000) {
    return amount.toFixed(2);
  } else if (amount < 1000000) {
    return (amount / 1000).toFixed(2) + "K";
  } else if (amount < 1000000000) {
    return (amount / 1000000).toFixed(2) + "M";
  } else {
    return (amount / 1000000000).toFixed(2) + "B";
  }
};