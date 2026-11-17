using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using MyKeep.Api.Data;

namespace MyKeep.Api.Services;

public sealed class ExpiredNotesCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<ExpiredNotesCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CleanupInterval);
        await DeleteExpiredNotesAsync(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await DeleteExpiredNotesAsync(stoppingToken);
        }
    }

    private async Task DeleteExpiredNotesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var now = DateTimeOffset.UtcNow;
            var deletedCount = await db.Notes
                .Where(note => note.ExpiresAt.HasValue && note.ExpiresAt.Value <= now)
                .ExecuteDeleteAsync(cancellationToken);

            if (deletedCount > 0)
            {
                logger.LogInformation("Deleted {Count} expired note(s).", deletedCount);
            }
        }
        catch (SqlException exception)
        {
            logger.LogError(exception, "Could not delete expired notes; cleanup will retry.");
        }
    }
}
