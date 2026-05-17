export const yen = (value: number) =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export const todayDateTimeLocal = () => {
  const next = new Date();
  next.setHours(next.getHours() + 2, 0, 0, 0);
  return new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
