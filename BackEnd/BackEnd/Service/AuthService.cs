using BackEnd.Data;
using BackEnd.Models;
using Microsoft.CodeAnalysis.Scripting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BackEnd.Service
{
  
    public class AuthService
    {
    private static readonly TimeSpan VerificationValidity = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
    private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<AuthResponseDto?> LoginAsync(string identifier, string password, CancellationToken ct = default)
        {
            var lower = identifier.Trim().ToLower();
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == lower || u.Username.ToLower() == lower, ct);

            if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            return BuildResponse(user);
        }

        private AuthResponseDto BuildResponse(User user)
        {
            var avatar = $"{(user.FirstName.Length > 0 ? user.FirstName[0] : '?')}" +
                         $"{(user.LastName.Length > 0 ? user.LastName[0] : '?')}".ToUpper();

           

            var memberSince = user.CreatedAt.ToString(
                "MMMM yyyy",
                new System.Globalization.CultureInfo("es-CR"));

            return new AuthResponseDto(
                Token: GenerateJwt(user),
                Id: user.UserId.ToString(),
                Username: user.Username,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                ProfilePhotoUrl: user.ProfilePhotoUrl,
                ProfilePhotoLocked: user.ProfilePhotoLocked,
                MemberSince: memberSince
            );
        }
        private string GenerateJwt(User user)
        {
            var jwtSection = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry = DateTime.UtcNow.AddDays(int.Parse(jwtSection["ExpiryDays"] ?? "30"));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("username",                    user.Username),
                
            };

            var token = new JwtSecurityToken(
                issuer: jwtSection["Issuer"],
                audience: jwtSection["Audience"],
                claims: claims,
                expires: expiry,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
