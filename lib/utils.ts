export const formatCurrency = (value?: string | number) => {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRideTime = (minutes?: number) => {
  if (minutes == null || Number.isNaN(minutes)) return "N/A";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
};

export const getShortAddress = (address?: string) => {
  if (!address) return "Unknown location";

  return address.split(",").slice(0, 2).join(",").trim();
};

export const getCoordinate = (value?: string | number) => {
  const coordinate =
    typeof value === "number" ? value : Number.parseFloat(value ?? "");

  return Number.isFinite(coordinate) ? coordinate : null;
};
