# Doctores Pro

Landing en español para la propuesta de Jorge Álvarez a cirujanos plásticos en Santa Cruz. HTML, CSS y JavaScript sin dependencias externas.

## Local

```sh
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Requiere Node.js 18 o posterior. Alternativa: usar cualquier servidor estático.

## Verificar y construir

```sh
npm run check
npm run build
```

Publicar `dist/` en un hosting estático. No requiere servidor ni base de datos. Este repositorio no configura despliegue automático.

## Configuración previa antes de campañas

Editar `config.js`:
- `whatsappNumber`: actualmente `59175013150`, tomado del número compartido para publicaciones. Confirmar que es el número deseado.
- `videoUrl`: vacío hasta tener la VSL final. Usar URL HTTPS directa a MP4 o `assets/vsl.mp4`. El reproductor no acepta una página de YouTube como fuente.
- `videoPoster`: imagen opcional.
- `preventForwardSeeking`: impide avances sobre lo ya visto en la interfaz propia. No es DRM ni protección absoluta; el archivo puede abrirse fuera del reproductor.

La página sin video muestra un mensaje honesto y permite explorar la propuesta. Los controles permiten reproducir, pausar y cambiar el sonido sin barra de avance. No hay autoplay. Para videos grandes se recomienda alojamiento de medios; no subirlos a Git sin revisar límites.

## Contenido

- Garantía limitada a honorarios de gestión publicitaria en las condiciones mostradas; no promete cirugías.
- Agenda mostrada es ilustrativa: esta landing no implementa el CRM del consultorio.
- Atención de pacientes a cargo del doctor o secretaria. Jorge y su equipo coordinan las reuniones comerciales por WhatsApp.
- Un cupo disponible: actualizar cuando se ocupe.
- No contiene testimonios, cifras de rendimiento ni portafolio inventados.
- No se incluyen cookies, analítica ni píxeles. Añadir una implementación y aviso de privacidad adecuados antes de habilitarlos.
- Revisar condiciones comerciales y alcance final de licencias/agenda antes del lanzamiento.
