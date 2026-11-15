using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MyKeep.Api.Contracts;
using MyKeep.Api.Models;

namespace MyKeep.Api.Services;

public sealed class TokenService(IConfiguration configuration) : ITokenService
{
    public string CreateAccessToken(UserEntity user)
    {
        var jwt = configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwt["SigningKey"]
                ?? throw new InvalidOperationException("JWT signing key is not configured.")));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var lifetimeMinutes = configuration.GetValue<int?>("Jwt:AccessTokenMinutes") ?? 60;
        if (lifetimeMinutes <= 0)
        {
            throw new InvalidOperationException("JWT access-token lifetime must be greater than zero.");
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(lifetimeMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"] ?? "MyKeep.Api",
            audience: jwt["Audience"] ?? "MyKeep.Web",
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public UserResponse ToUserResponse(UserEntity user) =>
        new(user.Id, user.Name, user.Email);
}
