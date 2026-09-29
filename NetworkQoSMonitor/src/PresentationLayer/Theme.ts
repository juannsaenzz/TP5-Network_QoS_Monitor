export const Colors = {
  primary: '#FF9900', // Naranja principal (Botones, íconos)
  primaryLight: '#FFC266', 
  primaryDark: '#C2780A',
  secondary: '#FFD233', // Amarillo de acento
  background: '#F9F9F9', // Blanco/Gris muy claro para el fondo principal
  surface: '#FFFFFF', // Blanco puro para las tarjetas (Cards)
  textDark: '#333333',
  textMuted: '#888888',
  drawerBackground: '#FF9900', // El menú lateral tiene fondo naranja/amarillo sólido
  drawerText: '#FFFFFF',
  
  // Colores extra del prompt
  accent1: '#FFAD33',
  accent2: '#8A590F',
  accent3: '#FFD699',
  accent4: '#FFC700',
  accent5: '#C2990A',
};

// Como Poppins requiere enlazar la fuente, definimos un helper.
// Si la fuente no está enlazada aún, caerá en la de sistema.
export const Typography = {
  fontFamily: 'Poppins-Regular',
  fontFamilyBold: 'Poppins-Bold',
  fontFamilyMedium: 'Poppins-Medium',
};
