using BackEnd.Data;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BackEnd.Service;

public class AuthService(AppDbContext db, IConfiguration config)
{
    private static readonly TimeSpan VerificationValidity = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    public async Task<(AuthResponseDto? response, string? error)> RegisterAsync(
        RegisterRequestDto dto, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower(), ct))
            return (null, "El correo ya está registrado.");

        if (await db.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower(), ct))
            return (null, "El nombre de usuario ya está en uso.");

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = dto.Username.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return (BuildResponse(user), null);
    }

    public async Task<AuthResponseDto?> LoginAsync(
        string identifier, string password, CancellationToken ct = default)
    {
        var lower = identifier.Trim().ToLower();
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == lower || u.Username.ToLower() == lower, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        return BuildResponse(user);
    }

    private AuthResponseDto BuildResponse(User user)
    {
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
        var jwt = config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddDays(int.Parse(jwt["ExpirationDays"] ?? "7"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("username",                    user.Username),
            new Claim("firstName",                   user.FirstName),
            new Claim("lastName",                    user.LastName),
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
