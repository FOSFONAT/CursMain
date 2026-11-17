namespace MyKeep.Api.Models;

public sealed class NoteEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public required string Color { get; set; }
    public bool Favorite { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public UserEntity User { get; set; } = null!;
}
