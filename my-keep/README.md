# My Keep frontend

Next.js frontend for My Keep account registration and login.

## Run

1. Start the API at `http://localhost:5062`.
2. From this directory, install dependencies and start Next.js:

   ```powershell
   npm ci
   npm run dev
   ```

3. Open `http://localhost:3000/login` or `http://localhost:3000/register`.

The API URL defaults to `http://localhost:5062`. To use another address, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`. Configure the API's `Cors:AllowedOrigins` to include the frontend origin.
