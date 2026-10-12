# Publicar DentistApp como demo

En GitHub, la publicación es automática al integrar en `main` (workflow `pages.yml`). Esta guía cubre además hosting estático manual.

Esta versión usa exclusivamente datos ficticios y `localStorage`. Cada visitante ve y modifica su propia copia local de la demo. No hay cuentas ni datos compartidos. El selector ofrece vistas distintas de Recepción, Dentista y Admin, pero no autentica ni protege los datos. Cualquier visitante puede elegir las tres.

## Opción sencilla: Cloudflare Pages Direct Upload

1. Inicia sesión en Cloudflare y abre **Workers & Pages → Create application → Get started → Drag and drop your files**.
2. Elige un nombre como `dentistapp-demo` y sube `dentistapp-demo-static.zip`, el archivo que acompaña al proyecto. El ZIP debe contener `index.html` en la raíz.
3. Publica el sitio. Cloudflare entrega una dirección `*.pages.dev` que puedes enviar al cliente.
4. Abre el enlace desde otro dispositivo y comprueba Inicio, Agenda, Pacientes y Ficha clínica.
5. Para futuras actualizaciones, sube un ZIP nuevo como otra implementación del mismo proyecto.

El archivo estático también sirve en cualquier hosting de HTML/CSS/JS. Netlify Drop acepta la carpeta `out` descomprimida.

## Regenerar el ZIP estático

Con Node.js 20.9+ y npm:

```bash
npm ci
npm run build:static
```

El sitio publicable queda en `out/`. Comprime **el contenido de `out/`**, de modo que `index.html` esté en la raíz del ZIP. Para volver a ejecutar `npm run start` como servidor Next.js local, corre antes `npm run build`.

## Antes de enviar el enlace

- Usa solo datos ficticios. No ingreses nombres, teléfonos, RUT ni historias clínicas reales.
- Comprueba el enlace público y el aviso **PROTOTIPO** desde un navegador sin sesión previa.
- `noindex` reduce la indexación por buscadores, pero **no restringe el acceso**: cualquiera que tenga el enlace puede abrirlo. El `robots.txt` incluido solo tiene efecto si el sitio está en la raíz de su dominio (en GitHub Pages de proyecto, como `usuario.github.io/dentistapp-demo/`, los buscadores no lo leen).
- Si el cliente necesita acceso privado, configura protección en la plataforma de hosting antes de compartirlo.
- Cambia el nombre y dominio de la demo cuando definas la marca comercial.

Esta publicación sirve para mostrar experiencia y flujos. La puesta en producción clínica requiere autenticación, permisos, base de datos con restricciones de agenda, privacidad de salud, consentimiento, auditoría y backups.
