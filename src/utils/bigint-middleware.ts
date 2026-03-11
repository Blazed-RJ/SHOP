// Helper to safely serialize BigInts to JSON without throwing Next.js errors
export const serializeData = <T>(data: T): T => {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  };
  
// Helper to convert paise (BigInt from DB) to human readable rupees (e.g. 15050 -> 150.50)
export const formatPaiseToRupees = (paise: number | bigint): string => {
    const amount = typeof paise === 'bigint' ? Number(paise) : paise;
    return (amount / 100).toFixed(2);
};
