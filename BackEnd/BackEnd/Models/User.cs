using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("username")]
    [MaxLength(50)]
    public required string Username { get; set; }

    [Column("email")]
    [MaxLength(150)]
    public required string Email { get; set; }

    [Column("password_hash")]
    [MaxLength(255)]
    public required string PasswordHash { get; set; }

    [Column("first_name")]
    [MaxLength(100)]
    public required string FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public required string LastName { get; set; }

    [Column("auth_provider")]
    [MaxLength(20)]
    public string AuthProvider { get; set; } = "local";

    [Column("profile_photo_url")]
    public string? ProfilePhotoUrl { get; set; }

    [Column("profile_photo_locked")]
    public bool ProfilePhotoLocked { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
