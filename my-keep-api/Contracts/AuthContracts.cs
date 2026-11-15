using System.ComponentModel.DataAnnotations;

namespace MyKeep.Api.Contracts;

public sealed class RegisterRequest
{
    [Required, StringLength(60, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 1)]
    public string Password { get; init; } = string.Empty;
}

public sealed record UserResponse(Guid Id, string Name, string Email);

public sealed record AuthResponse(UserResponse User, string AccessToken);
