# My Keep API

ASP.NET Core 10 Web API for account registration and login. It uses SQL Server via EF Core and JWT bearer authentication.

## Requirements

- .NET 10 SDK
- SQL Server reachable at `localhost:1433`

## Configure local secrets

Run these commands from `D:\WebCur\MainCurs\my-keep-api`. Keep the SQL password and signing key out of source control:

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=MyKeepDb;User Id=sa;Password=YOUR_SQL_PASSWORD;Encrypt=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:SigningKey" "REPLACE_WITH_AT_LEAST_32_RANDOM_UTF8_BYTES"
```

Migrations create the `MyKeepDb` database and its `Users` table when the API starts.

## Run

```powershell
dotnet run --launch-profile http
```

The API listens at `http://localhost:5062`. Development OpenAPI JSON is available at `/openapi/v1.json`.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create an account; returns `{ user, accessToken }` |
| `POST` | `/api/auth/login` | No | Sign in; returns `{ user, accessToken }` |
| `GET` | `/api/auth/me` | Bearer | Get the authenticated user |
| `POST` | `/api/auth/logout` | Bearer | End the client session |

Send the access token in `Authorization: Bearer <accessToken>`. Logout is stateless: the client must discard its access token; the token expires after 60 minutes. Passwords are stored as ASP.NET Identity password hashes, never as plain text.

Example requests are in `MyKeep.Api.http`.
