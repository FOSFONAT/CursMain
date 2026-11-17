using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyKeep.Api.Contracts;
using MyKeep.Api.Data;
using MyKeep.Api.Models;

namespace MyKeep.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notes")]
public sealed class NotesController(AppDbContext db) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [ProducesResponseType<NoteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteResponse>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var now = DateTimeOffset.UtcNow;
        var note = await db.Notes.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == id &&
                item.UserId == userId &&
                (item.ExpiresAt == null || item.ExpiresAt > now),
            cancellationToken);
        return note is null ? NotFound() : Ok(ToResponse(note));
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<NoteResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NoteResponse>>> List(
        [FromQuery] string? search,
        [FromQuery] bool? favorite,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var now = DateTimeOffset.UtcNow;
        var query = db.Notes.AsNoTracking().Where(note =>
            note.UserId == userId &&
            (note.ExpiresAt == null || note.ExpiresAt > now));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(note =>
                note.Title.Contains(term) || note.Content.Contains(term));
        }

        if (favorite.HasValue)
        {
            query = query.Where(note => note.Favorite == favorite.Value);
        }

        var notes = await query
            .OrderByDescending(note => note.UpdatedAt)
            .Select(note => ToResponse(note))
            .ToListAsync(cancellationToken);
        return Ok(notes);
    }

    [HttpPost]
    [ProducesResponseType<NoteResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<NoteResponse>> Create(
        SaveNoteRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var now = DateTimeOffset.UtcNow;
        if (request.ExpiresAt is { } expiresAt && expiresAt <= now)
        {
            return BadRequest(ExpirationMustBeFuture());
        }

        var note = new NoteEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            Color = request.Color,
            Favorite = request.Favorite,
            CreatedAt = now,
            UpdatedAt = now,
            ExpiresAt = request.ExpiresAt?.ToUniversalTime()
        };
        db.Notes.Add(note);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = note.Id }, ToResponse(note));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<NoteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteResponse>> Update(
        Guid id,
        SaveNoteRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        if (request.ExpiresAt is { } expiresAt && expiresAt <= DateTimeOffset.UtcNow)
        {
            return BadRequest(ExpirationMustBeFuture());
        }

        var now = DateTimeOffset.UtcNow;
        var note = await db.Notes.SingleOrDefaultAsync(
            item => item.Id == id &&
                item.UserId == userId &&
                (item.ExpiresAt == null || item.ExpiresAt > now),
            cancellationToken);
        if (note is null)
        {
            return NotFound();
        }

        note.Title = request.Title.Trim();
        note.Content = request.Content.Trim();
        note.Color = request.Color;
        note.Favorite = request.Favorite;
        note.UpdatedAt = now;
        note.ExpiresAt = request.ExpiresAt?.ToUniversalTime();
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return NotFound();
        }

        return Ok(ToResponse(note));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var note = await db.Notes.SingleOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);
        if (note is null)
        {
            return NotFound();
        }

        db.Notes.Remove(note);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return NotFound();
        }
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static NoteResponse ToResponse(NoteEntity note) =>
        new(
            note.Id,
            note.UserId,
            note.Title,
            note.Content,
            note.Color,
            note.Favorite,
            note.CreatedAt,
            note.UpdatedAt,
            note.ExpiresAt);

    private static ValidationProblemDetails ExpirationMustBeFuture() =>
        new(new Dictionary<string, string[]>
        {
            ["expiresAt"] = ["Дата видалення має бути в майбутньому."]
        })
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Некоректний таймер нотатки."
        };
}
