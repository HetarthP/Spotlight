import type { Config } from "tailwindcss";

export default {
	darkMode: "class",
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--tw-border))',
				input: 'hsl(var(--tw-input))',
				ring: 'hsl(var(--tw-ring))',
				background: 'hsl(var(--tw-background))',
				foreground: 'hsl(var(--tw-foreground))',
				primary: {
					DEFAULT: 'hsl(var(--tw-primary))',
					foreground: 'hsl(var(--tw-primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--tw-secondary))',
					foreground: 'hsl(var(--tw-secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--tw-destructive))',
					foreground: 'hsl(var(--tw-destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--tw-muted))',
					foreground: 'hsl(var(--tw-muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--tw-accent))',
					foreground: 'hsl(var(--tw-accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--tw-popover))',
					foreground: 'hsl(var(--tw-popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--tw-card))',
					foreground: 'hsl(var(--tw-card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--tw-sidebar-background))',
					foreground: 'hsl(var(--tw-sidebar-foreground))',
					primary: 'hsl(var(--tw-sidebar-primary))',
					'primary-foreground': 'hsl(var(--tw-sidebar-primary-foreground))',
					accent: 'hsl(var(--tw-sidebar-accent))',
					'accent-foreground': 'hsl(var(--tw-sidebar-accent-foreground))',
					border: 'hsl(var(--tw-sidebar-border))',
					ring: 'hsl(var(--tw-sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--tw-radius)',
				md: 'calc(var(--tw-radius) - 2px)',
				sm: 'calc(var(--tw-radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'slide-in-right': {
					from: { transform: 'translateX(100%)' },
					to: { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(100%)' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'fade-in': 'fade-in 0.3s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
