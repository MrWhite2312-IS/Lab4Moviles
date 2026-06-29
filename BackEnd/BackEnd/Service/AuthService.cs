using BackEnd.Data;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

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
            AuthProvider = "local",
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

    public async Task<(AuthResponseDto? response, string? error)> GoogleLoginAsync(
        string idToken, string? photoUrl = null, CancellationToken ct = default)
    {
       
        using var http = new HttpClient();
        var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";
        var res = await http.GetAsync(url, ct);
        if (!res.IsSuccessStatusCode)
            return (null, "Token de Google inválido.");

        var json = await res.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var expectedAudience = config["Google:ClientId"]!;
        var aud = root.GetProperty("aud").GetString() ?? "";
        if (aud != expectedAudience)
            return (null, "Token de Google no corresponde a esta aplicación.");

        var email = root.GetProperty("email").GetString()!.Trim().ToLower();
        var firstName = root.TryGetProperty("given_name", out var fn) ? fn.GetString() ?? "Google" : "Google";
        var lastName = root.TryGetProperty("family_name", out var ln) ? ln.GetString() ?? "User" : "User";

        var tokenPicture = root.TryGetProperty("picture", out var pic) ? pic.GetString() : null;
        var picture = tokenPicture ?? photoUrl;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            // Auto-register Google user
            var baseUsername = email.Split('@')[0];
            var username = baseUsername;
            var suffix = 1;
            while (await db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower(), ct))
                username = $"{baseUsername}{suffix++}";

            user = new User
            {
                UserId = Guid.NewGuid(),
                Username = username,
                Email = email,
                PasswordHash = "",   // Google users have no password
                FirstName = firstName,
                LastName = lastName,
                AuthProvider = "google",
                ProfilePhotoUrl = picture,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }
        else if (!user.ProfilePhotoLocked && picture is not null && user.ProfilePhotoUrl != picture)
        {
            // Cuenta existente: refresca la foto con la de Google (las cuentas
            // regulares no tienen foto, así que no se pisa nada propio).
            user.ProfilePhotoUrl = picture;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return (BuildResponse(user), null);
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
            MemberSince: memberSince,
            AuthProvider: user.AuthProvider
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
