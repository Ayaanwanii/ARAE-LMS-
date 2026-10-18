export interface FontDefinition {
    label: string;
    value: string; // The font-family name
    type: 'standard' | 'google';
    category: 'sans' | 'serif' | 'script' | 'display';
    googleFontName?: string; // For loading CSS
    ttfUrl?: string; // For PDF generation
}

export const CERTIFICATE_FONTS: FontDefinition[] = [
    // Standard Fonts (Built-in to jsPDF)
    {
        label: 'Helvetica',
        value: 'Helvetica',
        type: 'standard',
        category: 'sans'
    },
    {
        label: 'Times New Roman',
        value: 'Times',
        type: 'standard',
        category: 'serif'
    },
    {
        label: 'Courier',
        value: 'Courier',
        type: 'standard',
        category: 'display'
    },

    // Google Script Fonts (Best for certificates)
    {
        label: 'Great Vibes',
        value: 'Great Vibes',
        type: 'google',
        category: 'script',
        googleFontName: 'Great+Vibes',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf'
    },
    {
        label: 'Alex Brush',
        value: 'Alex Brush',
        type: 'google',
        category: 'script',
        googleFontName: 'Alex+Brush',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/alexbrush/AlexBrush-Regular.ttf'
    },
    {
        label: 'Dancing Script',
        value: 'Dancing Script',
        type: 'google',
        category: 'script',
        googleFontName: 'Dancing+Script',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/DancingScript-VariableFont_wght.ttf'
    },
    {
        label: 'Pinyon Script',
        value: 'Pinyon Script',
        type: 'google',
        category: 'script',
        googleFontName: 'Pinyon+Script',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf'
    },

    // Google Serif/Display
    {
        label: 'Playfair Display',
        value: 'Playfair Display',
        type: 'google',
        category: 'serif',
        googleFontName: 'Playfair+Display',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-VariableFont_wght.ttf'
    },
    {
        label: 'Merriweather',
        value: 'Merriweather',
        type: 'google',
        category: 'serif',
        googleFontName: 'Merriweather',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/merriweather/Merriweather-Regular.ttf'
    },

    // Google Sans
    {
        label: 'Roboto',
        value: 'Roboto',
        type: 'google',
        category: 'sans',
        googleFontName: 'Roboto',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Regular.ttf'
    },
    {
        label: 'Montserrat',
        value: 'Montserrat',
        type: 'google',
        category: 'sans',
        googleFontName: 'Montserrat',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-VariableFont_wght.ttf'
    },
    {
        label: 'Oswald',
        value: 'Oswald',
        type: 'google',
        category: 'sans',
        googleFontName: 'Oswald',
        ttfUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald-VariableFont_wght.ttf'
    }
];
