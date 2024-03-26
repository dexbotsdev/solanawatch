export const shorten = (str: string): string => {
    if (str.length < 10) return str;
    return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
  };

  export const s11 = (str: string): string => {
    if (str.length < 11) return str;
    return `${str.slice(0, 11)}`;
  };

  export const s8 = (str: string): string => {
    if (str.length < 8) return str;
    return `${str.slice(0, 8)}`;
  };
  