// flatten-color-palette.d.ts

declare module 'tailwindcss/lib/util/flattenColorPalette' {
    /**
     * Flattens a nested color palette object into a flat object with dot-notation keys
     * @param colors - The color palette object to flatten
     * @returns A flattened object with color values
     */
    function flattenColorPalette(colors: Record<string, string | Record<string, string>>): Record<string, string>;
    
    export default flattenColorPalette;
  }