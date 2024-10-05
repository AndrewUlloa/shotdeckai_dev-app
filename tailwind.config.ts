import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'button': '17px',
      },
      boxShadow: {
        'button-outer': 'inset 0 0px 1.5px rgba(0,0,0,0.35)',
        'button-inner': 'inset 0 -0.2px 1px rgba(0,0,0,0.25)',
        'button-main': '0 5px 15px rgba(0,0,0,0.25), inset 0 -2px 10px #9e9eaa',
        'button-text': '0 -0.5px #3d3d3d, 0 0.05px 1px rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'button-outer': 'linear-gradient(to bottom, black, black 50%, #96969640 100%)',
        'button-inner': 'linear-gradient(to bottom, white, #3c3c3c 50%, #edbfe5)',
        'button-main': 'linear-gradient(to bottom, #c2c2c2, #9e9eaa)',
        'button-text': 'linear-gradient(to right, #c2c2c2, gray)',
      },
      padding: {
        'button-text': '6.5px 10px',
      },
      fontSize: {
        'button': '16px',
      },
      fontWeight: {
        'button': '600',
      },
      lineHeight: {
        'button': '19px',
      },
    },
    fontFamily: {
      'inter': ['Inter', 'sans-serif'],
    }
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
      const newUtilities = {
        '.border-gradient': {
          'position': 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0',
            padding: '1px', // Adjust this value to change border thickness
            borderRadius: 'inherit',
            background: 'linear-gradient(162deg, rgba(255,255,255,0.5) 0%, rgba(54,54,54,0.05) 50%, rgba(153,153,153,0.5) 100%)',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0) 100%',
            '-webkit-mask-composite': 'xor',
            'mask-composite': 'exclude',
            'pointer-events': 'none',
          },
        },
        '.border-gradient-lg': {
          'position': 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0',
            padding: '1px', // Adjust this value to change border thickness
            borderRadius: 'inherit',
            background: 'linear-gradient(105deg, rgba(255,255,255,0.5) 0%, rgba(54,54,54,0.05) 50%, rgba(153,153,153,0.5) 100%) ',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'xor',
            'mask-composite': 'exclude',
            'pointer-events': 'none',
          },
        },
        '.frame-bg-effects-blur-light': {
          'background-filter': 'blur(10px)',
          'box-shadow': '0px 5px 15px 0px #00000025',
        },
        '.frame-bg-effects-blur-inner': {
          'box-shadow': 'rgba(158, 158, 170, 0.25)  inset',
        },
        '.bg-fixed': {
          'background-attachment': 'fixed',
        },
        '.body-shadow': {
          'box-shadow': 'inset 5px 5px 60px 0px #171D0020',
        }
      };
      addUtilities(newUtilities);
    }
  ],
};
export default config;