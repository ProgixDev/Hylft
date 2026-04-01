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

export const darkTheme: Theme = {
  primary: {
    main: "#D4A44C",
    light: "#E0B86E",
  },
  background: {
    dark: "#0B0D0E",
    darker: "#151719",
    accent: "#1E2124",
    purple: "#B652C7",
  },
  foreground: {
    white: "#F0E6D3",
    gray: "#8A7E6E",
  },
  logo: require("../../assets/images/Logo.png"),
};

export const femaleTheme: Theme = {
  primary: {
    main: "#C48A6A",
    light: "#D4A48A",
  },
  background: {
    dark: "#FFF8F3",
    darker: "#FFEEE4",
    accent: "#F5D6C8",
    purple: "#E040A0",
  },
  foreground: {
    white: "#3D2B1F",
    gray: "#8B7265",
  },
  logo: require("../../assets/images/LogoBlue.png"),
};

export const themes = {
  male: maleTheme,
  dark: darkTheme,
  female: femaleTheme,
} as const;

export type ThemeType = keyof typeof themes;
