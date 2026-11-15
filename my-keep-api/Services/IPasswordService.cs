using MyKeep.Api.Models;

namespace MyKeep.Api.Services;

public interface IPasswordService
{
    string Hash(UserEntity user, string password);
    bool Verify(UserEntity user, string password);
}
