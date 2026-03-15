import { useSettings } from "./useSettings";
import { CURRENCIES } from "@/lib/constants";

export function useCurrency() {
  const { settings, setSetting } = useSettings();

  const currencyCode = settings.currency || "INR";
  const conversionRate = parseFloat(settings.conversionRate || "1");
  const currencyInfo = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currencyInfo?.symbol || "₹";
  const isBaseCurrency = currencyCode === "INR";

  /**
   * Convert an amount from INR (base) to the selected currency.
   * If the selected currency is INR, returns the amount as-is.
   */
  function convert(amountInINR: number): number {
    if (isBaseCurrency) return amountInINR;
    return Math.round((amountInINR * conversionRate) * 100) / 100;
  }

  /**
   * Format an amount in the selected currency.
   * Converts from INR base and adds the currency symbol.
   */
  function format(amountInINR: number): string {
    const converted = convert(amountInINR);
    // Use Indian-style grouping for INR, standard for others
    if (currencyCode === "INR") {
      return `${symbol}${converted.toLocaleString("en-IN")}`;
    }
    return `${symbol}${converted.toLocaleString()}`;
  }

  /**
   * Update the conversion rate (how much 1 INR = in target currency)
   */
  async function setConversionRate(rate: string) {
    return setSetting("conversionRate", rate);
  }

  /**
   * Update the selected currency
   */
  async function setCurrency(code: string) {
    await setSetting("currency", code);
    // Reset conversion rate to 1 if switching to INR
    if (code === "INR") {
      await setSetting("conversionRate", "1");
    }
  }

  return {
    currencyCode,
    symbol,
    conversionRate,
    isBaseCurrency,
    convert,
    format,
    setCurrency,
    setConversionRate,
  };
}
