# My Keep frontend

Next.js frontend for My Keep account registration, login, and notes.

## Run

1. Start the API at `http://localhost:5062`.
2. From this directory, install dependencies and start Next.js:

   ```powershell
   npm ci
   npm run dev
   ```

3. Open `http://localhost:3000`. The notes page requires an account; login and registration are available at `/login` and `/register`.

The notes page supports creating, editing, searching, filtering, and deleting notes, including timed expiration. The API URL defaults to `http://localhost:5062`. To use another address, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`. Configure the API's `Cors:AllowedOrigins` to include the frontend origin.
