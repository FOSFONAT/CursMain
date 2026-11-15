using Microsoft.AspNetCore.Identity;
using MyKeep.Api.Models;

namespace MyKeep.Api.Services;

public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<UserEntity> _hasher = new();

    public string Hash(UserEntity user, string password) =>
        _hasher.HashPassword(user, password);

    public bool Verify(UserEntity user, string password) =>
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password)
        != PasswordVerificationResult.Failed;
}
