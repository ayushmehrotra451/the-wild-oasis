import { formatDistance, parseISO, differenceInDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
//import { differenceInDays } from "date-fns/esm";

// We want to make this function work for both Date objects and strings (which come from Supabase)
export const subtractDates = (dateStr1, dateStr2) =>
  differenceInDays(parseISO(String(dateStr1)), parseISO(String(dateStr2)));

export const formatDistanceFromNow = (dateStr) =>
  formatDistance(parseISO(dateStr), new Date(), {
    addSuffix: true,
  })
    .replace("about ", "")
    .replace("in", "In");

// Supabase needs an ISO date string. However, that string will be different on every render because the MS or SEC have changed, which isn't good. So we use this trick to remove any time
export const getToday = function (options = {}) {
  const tz = "Asia/Kolkata";
  if (options?.end) {
    return formatInTimeZone(new Date(), tz, "yyyy-MM-dd 23:59:59");
  }
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd 00:00:00");
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(
    value
  );
