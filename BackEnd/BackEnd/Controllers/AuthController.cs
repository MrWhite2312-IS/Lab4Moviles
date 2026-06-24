using BackEnd.Service;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(
        RegisterRequestDto dto, CancellationToken ct)
    {
        var (response, error) = await auth.RegisterAsync(dto, ct);
        if (error is not null) return Conflict(new { message = error });
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequestDto dto, CancellationToken ct)
    {
        var response = await auth.LoginAsync(dto.Identifier, dto.Password, ct);
        if (response is null) return Unauthorized(new { message = "Credenciales incorrectas." });
        return Ok(response);
    }
}
