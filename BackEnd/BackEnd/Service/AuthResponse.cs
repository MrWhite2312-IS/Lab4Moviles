namespace BackEnd.Service
{
    public record AuthResponseDto(
         string Token,
         string Id,
         string Username,
         string Email,
         string FirstName,
         string LastName,
        
         string? ProfilePhotoUrl,
         bool ProfilePhotoLocked,

         string MemberSince,

         string AuthProvider

     );

    public record LoginRequestDto(string Identifier, string Password);
    public record GoogleLoginRequestDto(string IdToken, string? PhotoUrl = null);
    public record RegisterPendingDto(Guid UserId, string Email, DateTime ExpiresAt);
    public record RegisterRequestDto(
        string Username,
        string Email,
        string FirstName,
        string LastName,
        string Password
    );
}

