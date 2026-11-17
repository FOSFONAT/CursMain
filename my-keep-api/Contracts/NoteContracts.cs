using System.ComponentModel.DataAnnotations;

namespace MyKeep.Api.Contracts;

public sealed class SaveNoteRequest
{
    [Required, StringLength(120, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    [Required, StringLength(10000)]
    public string Content { get; init; } = string.Empty;

    [Required, RegularExpression("^(lilac|yellow|green|peach|blue|pink)$")]
    public string Color { get; init; } = string.Empty;

    public bool Favorite { get; init; }

    public DateTimeOffset? ExpiresAt { get; init; }
}

public sealed record NoteResponse(
    Guid Id,
    Guid UserId,
    string Title,
    string Content,
    string Color,
    bool Favorite,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? ExpiresAt);
