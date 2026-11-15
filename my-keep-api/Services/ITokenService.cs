using MyKeep.Api.Contracts;
using MyKeep.Api.Models;

namespace MyKeep.Api.Services;

public interface ITokenService
{
    string CreateAccessToken(UserEntity user);
    UserResponse ToUserResponse(UserEntity user);
}
