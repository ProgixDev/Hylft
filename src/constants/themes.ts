export interface Theme {
  primary: {
    main: string;
    light: string;
  };
  background: {
    dark: string;
    darker: string;
    accent: string;
    purple: string;
  };
  foreground: {
    white: string;
    gray: string;
  };
  logo: any; // Image require() source
}

export const maleTheme: Theme = {
  primary: {
    main: "#004BFF",
    light: "#3370F8",
  },
  background: {
    dark: "#FFFFFF",
    darker: "#F2F3F5",
    accent: "#E8EAF0",
    purple: "#B652C7",
  },
  foreground: {
    white: "#0B0D0E",
    gray: "#5F6368",
  },
  logo: require("../../assets/images/Logo.png"),
};

export const femaleTheme: Theme = {
  primary: {
    main: "#F91B66",
    light: "#FA4D85",
  },
  background: {
    dark: "#FFFFFF",
    darker: "#F2F3F5",
    accent: "#E8EAF0",
    purple: "#B652C7",
  },
  foreground: {
    white: "#0B0D0E",
    gray: "#5F6368",
  },
  logo: require("../../assets/images/LogoBlue.png"),
};

export const themes = {
  male: maleTheme,
  female: femaleTheme,
} as const;

export type ThemeType = keyof typeof themes;
