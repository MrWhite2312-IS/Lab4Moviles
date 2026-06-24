# Lab4Moviles

App móvil (Expo / React Native) con backend en ASP.NET Core 8 y PostgreSQL.
Incluye autenticación con correo/contraseña y **login nativo con Google**.

Esta guía explica cómo ejecutar el proyecto en **Ubuntu** con un **emulador Android nativo**.

---

## Arquitectura

| Carpeta | Qué es | Stack |
|---|---|---|
| `BackEnd/BackEnd` | API REST | ASP.NET Core 8, EF Core, PostgreSQL, JWT |
| `FrontEnd` | App móvil | Expo (React Native), Expo Router |
| `DatabaseScripts` | Scripts SQL | PostgreSQL |

---

## 1. Prerrequisitos (Ubuntu)

### .NET 8 SDK
```bash
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
dotnet --version   # debe mostrar 8.x
```

### Node.js 20+ y npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### PostgreSQL
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### JDK 17 (requerido por Gradle/Android)
```bash
sudo apt-get install -y temurin-17-jdk || sudo apt-get install -y openjdk-17-jdk
java -version   # debe mostrar 17.x
```

Define `JAVA_HOME` (ajusta la ruta a la que tengas instalada):
```bash
echo 'export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))' >> ~/.bashrc
source ~/.bashrc
echo $JAVA_HOME
```

### Android Studio + SDK + emulador
1. Descarga Android Studio desde https://developer.android.com/studio e instálalo.
2. Ábrelo y deja que instale el **Android SDK** (API 34 recomendado).
3. Agrega las variables de entorno del SDK:
   ```bash
   echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
   echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
   source ~/.bashrc
   ```
4. Crea un emulador: **Android Studio → Device Manager → Create Device** (ej. Pixel 6, API 34).
   - Importante: usa una imagen **con Google Play / Google APIs** para que funcione el login de Google.

---

## 2. Base de datos

Crea la base y el usuario (ajusta la contraseña si quieres):
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE "Lab4Moviles";
ALTER USER postgres WITH PASSWORD '2312';
SQL
```

Crea la tabla y aplica la migración de `auth_provider`:
```bash
sudo -u postgres psql -d Lab4Moviles -f DatabaseScripts/User.sql
sudo -u postgres psql -d Lab4Moviles -f DatabaseScripts/AddAuthProvider.sql
```

> `User.sql` crea la tabla `users` ya con la columna `auth_provider`.
> `AddAuthProvider.sql` es idempotente (`IF NOT EXISTS`); úsalo si la tabla ya existía sin esa columna.

---

## 3. Backend (ASP.NET Core)

### Configuración
Revisa `BackEnd/BackEnd/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=Lab4Moviles;Username=postgres;Password=2312"
  },
  "Google": {
    "ClientId": "183353685292-jgi9ibl5rjjbdj5aefmk85gf3gpgjs7o.apps.googleusercontent.com"
  },
  "Jwt": {
    "Key": "...",
    "Issuer": "BackEnd",
    "Audience": "FrontEnd",
    "ExpirationDays": "7"
  }
}
```
- `DefaultConnection`: debe coincidir con la contraseña que pusiste en PostgreSQL.
- `Google:ClientId`: es el **Web Client ID** (el SDK nativo emite el idToken con ese `aud`).

### Ejecutar
```bash
cd BackEnd/BackEnd
dotnet restore
dotnet run
```
El backend queda escuchando en **`http://0.0.0.0:5203`** (perfil `http`).
Swagger: http://localhost:5203/swagger

> Déjalo corriendo en una terminal aparte.

---

## 4. Frontend (Expo / Android nativo)

### Instalar dependencias
```bash
cd FrontEnd
npm install
```

### Apuntar la app al backend
En `FrontEnd/src/constants/api.ts`, para el **emulador Android** usa `10.0.2.2`
(es el alias del `localhost` de tu laptop visto desde el emulador):

```ts
const BASE_HOST = '10.0.2.2';
export const API_URL = `http://${BASE_HOST}:5203/api`;
```

### Generar el proyecto nativo y ejecutar
Con el **emulador ya abierto** (desde Android Studio o `emulator -avd <nombre>`):

```bash
npx expo prebuild --platform android   # genera la carpeta android/
npx expo run:android                   # compila, instala y abre la app
```

`run:android` levanta Metro automáticamente. Si necesitas levantarlo aparte:
```bash
npx expo start --dev-client
```

---

## 5. Configurar Google Sign-In (¡importante en una máquina nueva!)

El login de Google valida tu app por **package name + huella SHA-1** del certificado que firma el APK.
Al correr `prebuild` en Ubuntu se genera un **nuevo `debug.keystore`** con un **SHA-1 distinto** al de otra máquina,
así que hay que registrar ese SHA-1 en Google Cloud Console.

### Obtener el SHA-1 de ESTA laptop
```bash
cd FrontEnd/android/app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

### Registrarlo en Google Cloud Console
1. Ve a https://console.cloud.google.com → **APIs & Services → Credentials**.
2. Abre el **OAuth Client ID de tipo Android** del proyecto (o crea uno):
   - **Package name:** `com.lab4moviles.app`
   - **SHA-1:** el que obtuviste arriba
   - En **Configuración avanzada**, habilita **"Custom URI scheme"** si aparece.
3. Guarda y espera unos minutos a que propague.

> El **Web Client ID** (el de `appsettings.json` y `login.tsx`) no cambia entre máquinas; solo el SHA-1 del Android client depende del keystore local.

Client IDs usados en el proyecto:
- **Web:** `183353685292-jgi9ibl5rjjbdj5aefmk85gf3gpgjs7o.apps.googleusercontent.com`
- **Android:** `183353685292-86s2e9k3p4elg6be9ps8j5ishq5oepta.apps.googleusercontent.com`

---

## 6. Resumen de comandos (día a día)

```bash
# Terminal 1 — Backend
cd BackEnd/BackEnd && dotnet run

# Terminal 2 — App (con el emulador abierto)
cd FrontEnd && npx expo run:android
```

---

## Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `Network request failed` al hacer login | El backend no está corriendo, o `API_URL` no usa `10.0.2.2`. Verifica que `dotnet run` esté activo. |
| `DEVELOPER_ERROR` en Google Sign-In | El SHA-1 registrado no coincide con el `debug.keystore` local. Repite el paso 5. |
| `Gradle requires JVM 17` | `JAVA_HOME` apunta a otra versión de Java. Revisa el paso 1 (JDK 17). |
| `SDK location not found` | Falta `ANDROID_HOME` o `FrontEnd/android/local.properties`. Define `ANDROID_HOME` (paso 1). |
| La foto de perfil de Google no aparece | La cuenta de Google no expone foto vía la API (`photo: null`). No es un error; se muestran las iniciales. |
| Cambios de JS no se reflejan | Recarga Metro: presiona `r` en su terminal. |
| Cambié `app.json` o un plugin nativo | Vuelve a correr `npx expo prebuild` y `npx expo run:android`. |
